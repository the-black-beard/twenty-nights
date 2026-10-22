  function camera(){
    const width=scene.width*TILE,height=scene.height*TILE;
    const overview=Math.min(SIZE/width,SIZE/height),zoom=overview*(prefs.closeView?2.2:1);
    const viewWidth=Math.min(width,SIZE/zoom),viewHeight=Math.min(height,SIZE/zoom);
    return {zoom,x:Math.max(0,Math.min(width-viewWidth,(state.hero.x+.5)*TILE-viewWidth/2)),
      y:Math.max(0,Math.min(height-viewHeight,(state.hero.y+.5)*TILE-viewHeight/2)),
      offsetX:Math.max(0,(SIZE-width*zoom)/2),offsetY:Math.max(0,(SIZE-height*zoom)/2),width,height,viewWidth,viewHeight};
  }
  function minimap(){
    const width=126,scale=width/scene.width,height=scene.height*scale;
    return {x:SIZE-width-14,y:14,width,height,scale};
  }
  function draw(){
    const c=camera();ctx.setTransform(DPR,0,0,DPR,0,0);ctx.clearRect(0,0,SIZE,SIZE);
    ctx.fillStyle='#10131d';ctx.fillRect(0,0,SIZE,SIZE);
    ctx.save();ctx.translate(c.offsetX,c.offsetY);ctx.scale(c.zoom,c.zoom);ctx.translate(-c.x,-c.y);
    drawNetherWorld(ctx,state,scene,prefs,{x:c.x,y:c.y,width:c.viewWidth,height:c.viewHeight});ctx.restore();
    if(prefs.closeView){
      const m=minimap(),colors={'#':'#4e6174',b:'#bd7860',c:'#bd90e8',d:'#b8cbd2',e:'#e66d83',v:'#281936','.':'#202934'};
      ctx.fillStyle='rgba(9,20,27,.96)';ctx.fillRect(m.x-5,m.y-5,m.width+10,m.height+10);
      for(let i=0;i<scene.width*scene.height;i++){ctx.fillStyle=colors[state.map[i]];ctx.fillRect(m.x+(i%scene.width)*m.scale,m.y+Math.floor(i/scene.width)*m.scale,m.scale,m.scale);}
      for(const [p,color] of [...state.enemies.filter(e=>e.released).map(e=>[e,'#ffb044']),[GOAL,'#84efb1'],...state.cores.filter(c=>!c.collected).map(c=>[c,'#cafff3']),[state.hero,'#6eafff']]){ctx.fillStyle=color;ctx.fillRect(m.x+(p.x+.5)*m.scale-2,m.y+(p.y+.5)*m.scale-2,4,4);}
      ctx.strokeStyle='#d6f4e6';ctx.lineWidth=1;ctx.strokeRect(m.x+c.x/TILE*m.scale,m.y+c.y/TILE*m.scale,c.viewWidth/TILE*m.scale,c.viewHeight/TILE*m.scale);
    }
    if(state.paused&&!settingsOpen&&!state.awaitingReturn&&state.status==='playing'){
      ctx.fillStyle='rgba(8,18,25,.5)';ctx.fillRect(0,0,SIZE,SIZE);ctx.fillStyle='#f9edda';ctx.font='bold 26px system-ui';ctx.textAlign='center';ctx.fillText('Paused · take your time',SIZE/2,SIZE/2);ctx.textAlign='left';
    }
  }
  function pointer(kind,event){
    if(topModal())return;
    if(kind==='down'){
      if(event.button!==undefined&&event.button!==0)return;
      audioInit();event.preventDefault();pointerId=event.pointerId;lastPointer=null;
      try{cv.setPointerCapture(pointerId);}catch(error){}
    }else if(event.pointerId!==pointerId)return;
    if(kind==='up'||kind==='cancel'){
      pointerId=null;lastPointer=null;if(kind==='cancel')setPaused(true);return;
    }
    const bounds=cv.getBoundingClientRect();if(!bounds.width||!bounds.height)return;
    const px=(event.clientX-bounds.left)*SIZE/bounds.width,py=(event.clientY-bounds.top)*SIZE/bounds.height;
    if(px<0||py<0||px>=SIZE||py>=SIZE)return;
    // The rectangular overview is a camera control, never a tiny walk target.
    const m=minimap();
    if(prefs.closeView&&px>=m.x-5&&px<=m.x+m.width+5&&py>=m.y-5&&py<=m.y+m.height+5){if(kind==='down')setPreferences({closeView:false});return;}
    if(lastPointer&&kind==='move'&&Math.hypot(event.clientX-lastPointer.x,event.clientY-lastPointer.y)<(event.pointerType==='touch'?9:4))return;
    const c=camera(),worldX=(px-c.offsetX)/c.zoom+c.x,worldY=(py-c.offsetY)/c.zoom+c.y;
    // Letterboxing belongs to the canvas, not the maze. Ignore taps in it.
    if(worldX<0||worldY<0||worldX>=c.width||worldY>=c.height)return;
    const x=Math.floor(worldX/TILE),y=Math.floor(worldY/TILE);
    if(lastPointer&&kind==='move'&&lastPointer.cell===idx(x,y))return;
    if(aim(x,y))lastPointer={x:event.clientX,y:event.clientY,cell:idx(x,y)};
  }
  function key(event){
    const modal=topModal();
    if(modal){
      if(event.key==='Escape'&&settingsOpen){event.preventDefault();closeSettings();return;}
      if(event.key==='Tab'){
        const focusable=[...$(modal).querySelectorAll('button,input,textarea,select,[tabindex="0"]')].filter(el=>!el.disabled&&el.offsetParent!==null);
        if(focusable.length){const first=focusable[0],last=focusable[focusable.length-1];
          if(event.shiftKey&&(document.activeElement===first||!$(modal).contains(document.activeElement))){event.preventDefault();last.focus();}
          else if(!event.shiftKey&&(document.activeElement===last||!$(modal).contains(document.activeElement))){event.preventDefault();first.focus();}}
      }
      return;
    }
    if(event.target?.closest?.('button,input,textarea,select,[contenteditable="true"]'))return;
    if(event.key===' '||event.key==='Escape'){event.preventDefault();setPaused(!state.paused);return;}
    const d={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],a:[-1,0],s:[0,1],d:[1,0]}[event.key];
    if(d){event.preventDefault();aim(Math.round(state.hero.x)+d[0],Math.round(state.hero.y)+d[1]);}
  }
