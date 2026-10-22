  function route(entity,tx,ty,monster=false) {
    if(!Number.isInteger(tx)||!Number.isInteger(ty)||!inB(tx,ty))return null;
    const count=N*ROWS,end=idx(tx,ty),targetVoid=!monster&&state.map[end]==='v'?end:null;
    if(!walkableCell(tx,ty,monster,targetVoid))return null;
    // A moving actor lies on an orthogonal edge. Either reachable endpoint can
    // be the first step; rounding would sometimes teleport it through a wall.
    const anchors=[];
    for(const x of new Set([Math.floor(entity.x),Math.ceil(entity.x)]))
      for(const y of new Set([Math.floor(entity.y),Math.ceil(entity.y)]))
        if(walkableCell(x,y,monster,targetVoid)&&(Math.abs(x-entity.x)<.001||Math.abs(y-entity.y)<.001))
          anchors.push({cell:idx(x,y),gap:Math.hypot(x-entity.x,y-entity.y)});
    if(!anchors.length)return null;
    const neighbors=(cell,visit)=>{
      const x=cell%N,y=Math.floor(cell/N);
      if(walkableCell(x+1,y,monster,targetVoid))visit(cell+1);
      if(walkableCell(x-1,y,monster,targetVoid))visit(cell-1);
      if(walkableCell(x,y+1,monster,targetVoid))visit(cell+N);
      if(walkableCell(x,y-1,monster,targetVoid))visit(cell-N);
    };
    if(monster){
      // One reverse breadth-first search serves both fractional anchors. Every
      // monster edge costs one, so there is no need to scan/sort the whole map.
      const next=new Int32Array(count).fill(-1),distance=new Int32Array(count).fill(-1),queue=new Int32Array(count);
      let head=0,tail=1;queue[0]=end;distance[end]=0;
      while(head<tail){const cell=queue[head++];neighbors(cell,j=>{if(distance[j]<0){distance[j]=distance[cell]+1;next[j]=cell;queue[tail++]=j;}});}
      let anchor=null,best=Infinity;
      for(const a of anchors)if(distance[a.cell]>=0&&distance[a.cell]+a.gap<best){anchor=a;best=distance[a.cell]+a.gap;}
      if(!anchor)return null;
      const path=[];let cell=anchor.cell;if(anchor.gap>.001)path.push(cell);
      while(cell!==end){cell=next[cell];path.push(cell);}
      return path;
    }
    // The player can prefer a longer escape route when monsters are nearby.
    // A binary heap makes that weighted search O(E log V), not O(V squared).
    const from=new Int32Array(count).fill(-1),cost=new Float64Array(count).fill(Infinity),risk=new Float64Array(count).fill(-1),heap=[];
    // A soft four-cell halo encourages an early turn into a bypass corridor.
    const threats=prefs.dodge?state.enemies.filter(e=>e.released):[];
    const push=(cell,value)=>{let at=heap.length;heap.push({cell,value});while(at){const parent=(at-1)>>1;if(heap[parent].value<=value)break;heap[at]=heap[parent];at=parent;}heap[at]={cell,value};};
    const pop=()=>{const first=heap[0],last=heap.pop();if(heap.length){let at=0;while(at*2+1<heap.length){let child=at*2+1;if(child+1<heap.length&&heap[child+1].value<heap[child].value)child++;if(heap[child].value>=last.value)break;heap[at]=heap[child];at=child;}heap[at]=last;}return first;};
    for(const a of anchors)if(a.gap<cost[a.cell]){cost[a.cell]=a.gap;from[a.cell]=-2;push(a.cell,a.gap);}
    while(heap.length){
      const current=pop();if(current.value!==cost[current.cell])continue;
      if(current.cell===end){
        const path=[];let cell=end;
        while(from[cell]!==-2){path.push(cell);cell=from[cell];}
        if(Math.hypot(cell%N-entity.x,Math.floor(cell/N)-entity.y)>.001)path.push(cell);
        return path.reverse();
      }
      neighbors(current.cell,j=>{
        if(risk[j]<0){risk[j]=0;for(const enemy of threats){const gap=Math.hypot(j%N-enemy.x,Math.floor(j/N)-enemy.y);risk[j]+=gap<1?14:gap<2?6:gap<3?2:gap<4?.5:0;}}
        const value=current.value+1+risk[j];if(value<cost[j]){cost[j]=value;from[j]=current.cell;push(j,value);}
      });
    }
    return null;
  }
