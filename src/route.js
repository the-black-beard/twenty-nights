  function route(entity,tx,ty,monster=false) {
    const end=idx(tx,ty), targetVoid=!monster && state.map[end]==='v' ? end : null;
    if(!walkableCell(tx,ty,monster,targetVoid)) return null;
    const anchors=[];
    for(const x of new Set([Math.floor(entity.x),Math.ceil(entity.x)]))
      for(const y of new Set([Math.floor(entity.y),Math.ceil(entity.y)]))
        if(walkableCell(x,y,monster,targetVoid) && (Math.abs(x-entity.x)<.001 || Math.abs(y-entity.y)<.001)) anchors.push({x,y});
    let best=null, bestCost=Infinity;
    for(const anchor of anchors){
      const from=new Int16Array(N*N).fill(-1), cost=new Float64Array(N*N).fill(Infinity), done=new Uint8Array(N*N);
      const root=idx(anchor.x,anchor.y);cost[root]=Math.hypot(anchor.x-entity.x,anchor.y-entity.y);
      for(let count=0;count<N*N;count++){
        let current=-1,low=Infinity;
        for(let i=0;i<N*N;i++)if(!done[i] && cost[i]<low){low=cost[i];current=i;}
        if(current<0)break;
        if(current===end)break;
        done[current]=1;const x=current%N,y=Math.floor(current/N);
        for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
          const nx=x+dx,ny=y+dy;if(!walkableCell(nx,ny,monster,targetVoid))continue;
          const j=idx(nx,ny);let extra=0;
          if(!monster && prefs.dodge){
            for(const enemy of state.enemies.filter(e=>e.released)){
            const gap=Math.hypot(nx-enemy.x,ny-enemy.y);
            extra+=gap<1 ? 10 : gap<2 ? 3 : 0;
            }
          }
          const next=cost[current]+1+extra;
          if(next<cost[j]){cost[j]=next;from[j]=current;}
        }
      }
      if(cost[end]>=bestCost)continue;
      const path=[];let p=end;
      while(p!==root){path.unshift(p);p=from[p];if(p<0)break;}
      if(p<0)continue;
      if(Math.hypot(anchor.x-entity.x,anchor.y-entity.y)>.001)path.unshift(root);
      best=path;bestCost=cost[end];
    }
    return best;
  }

