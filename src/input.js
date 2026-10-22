  function camera(){
    const zoom=prefs.closeView?1.75:1,size=SIZE/zoom;
    return {zoom,x:Math.max(0,Math.min(SIZE-size,(state.hero.x+.5)*TILE-size/2)),y:Math.max(0,Math.min(SIZE-size,(state.hero.y+.5)*TILE-size/2))};
  }
  function draw(){
    const c=camera();ctx.setTransform(DPR,0,0,DPR,0,0);ctx.clearRect(0,0,SIZE,SIZE);
    ctx.save();ctx.scale(c.zoom,c.zoom);ctx.translate(-c.x,-c.y);drawNetherWorld(ctx,state,scene,prefs);ctx.restore();
    if(prefs.closeView){
      const ox=SIZE-116,oy=12,scale=5;ctx.fillStyle='rgba(9,20,27,.93)';ctx.fillRect(ox-5,oy-5,110,110);
      for(let i=0;i<400;i++){ctx.fillStyle={'#':'#607283',b:'#bd7860',c:'#bd90e8',v:'#ac7ad1','.':'#263941'}[state.map[i]];ctx.fillRect(ox+(i%20)*scale,oy+Math.floor(i/20)*scale,scale-1,scale-1);}
      for(const [p,color] of [[state.hero,'#c0fff1'],...state.enemies.map(e=>[e,'#ff9d93']),[GOAL,'#84efb1'],...state.cores.filter(c=>!c.collected).map(c=>[c,'#cafff3'])]){ctx.fillStyle=color;ctx.fillRect(ox+p.x*scale,oy+p.y*scale,5,5);}
      ctx.strokeStyle='#d6f4e6';ctx.lineWidth=1;ctx.strokeRect(ox+c.x/TILE*scale,oy+c.y/TILE*scale,SIZE/c.zoom/TILE*scale,SIZE/c.zoom/TILE*scale);
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
    // The overview is an explicit camera control, not a tiny accidental walk target.
    if(prefs.closeView&&px>=SIZE-121&&py<122){if(kind==='down')setPreferences({closeView:false});return;}
    if(lastPointer&&kind==='move'&&Math.hypot(event.clientX-lastPointer.x,event.clientY-lastPointer.y)<(event.pointerType==='touch'?9:4))return;
    const c=camera(),x=Math.floor((px/c.zoom+c.x)/TILE),y=Math.floor((py/c.zoom+c.y)/TILE);
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
