  const contacts=new Map();
  let multiTouch=false,gesture=null,spring=null,panX=0,panY=0;
  function resetInput(){contacts.clear();multiTouch=false;gesture=null;spring=null;panX=0;panY=0;pointerId=null;lastPointer=null;}
  function updateCameraReturn(){
    if(!spring)return;
    const t=prefs.reducedMotion?1:Math.min(1,Math.max(0,(performance.now()-spring.time)/450));
    // Cubic Bézier (1/3, 1, 2/3, 1): a quick release that lands gently.
    const remaining=(1-t)**3;panX=spring.x*remaining;panY=spring.y*remaining;
    if(t===1){panX=0;panY=0;spring=null;}
  }
  function camera(){
    updateCameraReturn();
    const width=scene.width*TILE,height=scene.height*TILE;
    const overview=Math.min(SIZE/width,SIZE/height),multiplier=gesture?.zoom??(prefs.closeView?(prefs.zoom||2.2):1),zoom=overview*multiplier;
    const viewWidth=Math.min(width,SIZE/zoom),viewHeight=Math.min(height,SIZE/zoom);
    const hero=state?.hero||START;
    return {zoom,multiplier,x:Math.max(0,Math.min(width-viewWidth,(hero.x+.5)*TILE+panX-viewWidth/2)),
      y:Math.max(0,Math.min(height-viewHeight,(hero.y+.5)*TILE+panY-viewHeight/2)),
      offsetX:Math.max(0,(SIZE-width*zoom)/2),offsetY:Math.max(0,(SIZE-height*zoom)/2),width,height,viewWidth,viewHeight};
  }
  function cameraState(){const c=camera();return {...c,panX,panY,gesturing:multiTouch,returning:!!spring};}
  function threatIndicators(){
    if(!active||!state||!state.trial?.cues||state.status!=='playing'||state.awaitingReturn)return [];
    const found=[];
    for(const enemy of state.enemies){
      if(!enemy.released||enemy.wake>0||enemy.stun>0||Math.abs(enemy.x-state.hero.x)+Math.abs(enemy.y-state.hero.y)>7)continue;
      // The first reachable corridor step is the approach direction. A monster
      // just across a sealed wall does not reveal itself through that wall.
      let distance=0,previous=state.hero,first=null;
      const directX=enemy.x-state.hero.x,directY=enemy.y-state.hero.y;
      let straight=Math.abs(directX)<.001||Math.abs(directY)<.001;
      if(straight){const samples=Math.max(1,Math.ceil(Math.hypot(directX,directY)*4));for(let i=0;i<=samples;i++)if(!walkableCell(Math.round(state.hero.x+directX*i/samples),Math.round(state.hero.y+directY*i/samples),true)){straight=false;break;}}
      if(straight){distance=Math.hypot(directX,directY);first=enemy;}
      else{
        const path=route(state.hero,Math.round(enemy.x),Math.round(enemy.y),true);if(!path)continue;
        for(const cell of path){const p={x:cell%N,y:Math.floor(cell/N)};distance+=Math.hypot(p.x-previous.x,p.y-previous.y);if(!first&&Math.hypot(p.x-state.hero.x,p.y-state.hero.y)>.01)first=p;previous=p;}
        distance+=Math.hypot(enemy.x-previous.x,enemy.y-previous.y);
      }
      if(distance>7)continue;
      first=first||enemy;const dx=first.x-state.hero.x,dy=first.y-state.hero.y;
      if(Math.hypot(dx,dy)<.01)continue;
      found.push({enemy:enemy.id,distance,dx:Math.abs(dx)>=Math.abs(dy)?Math.sign(dx):0,dy:Math.abs(dy)>Math.abs(dx)?Math.sign(dy):0,rushing:enemy.kind==='runner'&&['windup','burst'].includes(enemy.phase)});
    }
    found.sort((a,b)=>a.distance-b.distance||a.enemy.localeCompare(b.enemy));
    const chosen=[];
    for(const cue of found)if(!chosen.some(c=>c.dx===cue.dx&&c.dy===cue.dy)){chosen.push(cue);if(chosen.length===2)break;}
    return chosen;
  }
  function drawThreatIndicators(c){
    const x=(state.hero.x+.5)*TILE*c.zoom-c.x*c.zoom+c.offsetX,y=(state.hero.y+.5)*TILE*c.zoom-c.y*c.zoom+c.offsetY;
    if(x<0||y<0||x>SIZE||y>SIZE)return;
    const radius=Math.max(22,Math.min(42,TILE*c.zoom*1.3));
    for(const cue of threatIndicators()){
      ctx.save();ctx.translate(x+cue.dx*radius,y+cue.dy*radius);ctx.rotate(Math.atan2(cue.dy,cue.dx));
      ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(-4,-6);ctx.lineTo(2,0);ctx.lineTo(-4,6);
      ctx.strokeStyle='#10131d';ctx.lineWidth=7;ctx.stroke();ctx.strokeStyle=cue.rushing?'#ff7287':'#ffd080';ctx.lineWidth=3;ctx.stroke();ctx.restore();
    }
  }
  function beginCameraGesture(){
    const pair=[...contacts.values()].slice(0,2);if(pair.length<2)return;
    const c=camera(),center={x:(pair[0].point.x+pair[1].point.x)/2,y:(pair[0].point.y+pair[1].point.y)/2};
    spring=null;
    gesture={zoom:c.multiplier,startZoom:c.multiplier,distance:Math.max(20,Math.hypot(pair[0].point.x-pair[1].point.x,pair[0].point.y-pair[1].point.y)),
      worldX:c.x+(center.x-c.offsetX)/c.zoom,worldY:c.y+(center.y-c.offsetY)/c.zoom};
  }
  function moveCameraGesture(){
    const pair=[...contacts.values()].slice(0,2);if(!gesture||pair.length<2)return;
    const center={x:(pair[0].point.x+pair[1].point.x)/2,y:(pair[0].point.y+pair[1].point.y)/2};
    const distance=Math.max(20,Math.hypot(pair[0].point.x-pair[1].point.x,pair[0].point.y-pair[1].point.y));
    gesture.zoom=Math.max(1,Math.min(3.2,gesture.startZoom*distance/gesture.distance));
    const c=camera(),limit=TILE*8;
    const x=gesture.worldX-(center.x-c.offsetX)/c.zoom,y=gesture.worldY-(center.y-c.offsetY)/c.zoom;
    panX=Math.max(-limit,Math.min(limit,x-(state.hero.x+.5)*TILE+c.viewWidth/2));
    panY=Math.max(-limit,Math.min(limit,y-(state.hero.y+.5)*TILE+c.viewHeight/2));
    if(c.viewWidth===c.width)panX=0;if(c.viewHeight===c.height)panY=0;
  }
  function endCameraGesture(){
    const zoom=gesture?.zoom;gesture=null;
    if(zoom!==undefined)setPreferences({zoom,closeView:zoom>1.01});
    if(prefs.reducedMotion){panX=0;panY=0;spring=null;}
    else spring={x:panX,y:panY,time:performance.now()};
  }
  function draw(){
    const c=camera();ctx.setTransform(DPR,0,0,DPR,0,0);ctx.clearRect(0,0,SIZE,SIZE);
    ctx.fillStyle='#10131d';ctx.fillRect(0,0,SIZE,SIZE);
    ctx.save();ctx.translate(c.offsetX,c.offsetY);ctx.scale(c.zoom,c.zoom);ctx.translate(-c.x,-c.y);
    drawNetherWorld(ctx,state,scene,prefs,{x:c.x,y:c.y,width:c.viewWidth,height:c.viewHeight});ctx.restore();
    drawThreatIndicators(c);
    if(state.paused&&!settingsOpen&&!state.awaitingReturn&&state.status==='playing'){
      ctx.fillStyle='rgba(8,18,25,.5)';ctx.fillRect(0,0,SIZE,SIZE);ctx.fillStyle='#f9edda';ctx.font='bold 26px system-ui';ctx.textAlign='center';ctx.fillText('Paused · take your time',SIZE/2,SIZE/2);ctx.textAlign='left';
    }
  }
  function screenPoint(event){
    const b=cv.getBoundingClientRect();
    return b.width&&b.height?{x:(event.clientX-b.left)*SIZE/b.width,y:(event.clientY-b.top)*SIZE/b.height}:null;
  }
  function pointCell(p){
    if(!p||p.x<0||p.y<0||p.x>=SIZE||p.y>=SIZE)return null;
    const c=camera(),x=(p.x-c.offsetX)/c.zoom+c.x,y=(p.y-c.offsetY)/c.zoom+c.y;
    return x>=0&&y>=0&&x<c.width&&y<c.height?{x:Math.floor(x/TILE),y:Math.floor(y/TILE)}:null;
  }
  function commitContact(contact){
    const cell=pointCell(contact.point);if(!cell)return;
    if(state.trial?.control==='swipe'){
      const dx=contact.point.x-contact.start.x,dy=contact.point.y-contact.start.y;
      if(Math.hypot(dx,dy)>=20)queueTurn(Math.abs(dx)>=Math.abs(dy)?Math.sign(dx):0,Math.abs(dy)>Math.abs(dx)?Math.sign(dy):0);
      else if(MATERIALS[state.map[idx(cell.x,cell.y)]])aim(cell.x,cell.y);
      else stopWalking();
    }else aim(cell.x,cell.y);
  }
  function pointer(kind,event){
    if(!active||!state||state.paused||state.status!=='playing'||topModal()){resetInput();return;}
    if(kind==='cancel'){resetInput();setPaused(true);return;}
    const point=screenPoint(event);if(!point)return;
    if(kind==='down'){
      if(event.button!==undefined&&event.button!==0)return;
      if(point.x<0||point.y<0||point.x>=SIZE||point.y>=SIZE)return;
      audioInit();event.preventDefault();
      const contact={point,start:point,touch:event.pointerType==='touch'};contacts.set(event.pointerId,contact);
      try{cv.setPointerCapture(event.pointerId);}catch(error){}
      if(contacts.size>1){multiTouch=true;if(contacts.size===2)beginCameraGesture();return;}
      // Touch commits only after release, so adding a second finger cannot
      // accidentally walk into a monster or start mining a wall.
      if(!contact.touch)commitContact(contact);
      return;
    }
    const contact=contacts.get(event.pointerId);if(!contact)return;
    event.preventDefault();contact.point=point;
    if(kind==='up'){
      if(!multiTouch&&contact.touch)commitContact(contact);
      contacts.delete(event.pointerId);
      if(!contacts.size){if(multiTouch)endCameraGesture();multiTouch=false;pointerId=null;lastPointer=null;}
      else if(multiTouch&&contacts.size>=2)beginCameraGesture();
    }else if(kind==='move'){
      if(multiTouch)moveCameraGesture();
      else if(!contact.touch)commitContact(contact);
    }
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
    if(event.key===' '){event.preventDefault();if(!event.repeat){audioInit();swingHammer();}return;}
    if(event.key==='Escape'||event.key==='p'||event.key==='P'){event.preventDefault();if(!event.repeat)setPaused(!state.paused);return;}
    const d={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],a:[-1,0],s:[0,1],d:[1,0]}[event.key];
    if(d){event.preventDefault();if(state.trial?.control==='swipe')queueTurn(d[0],d[1]);else aim(Math.round(state.hero.x)+d[0],Math.round(state.hero.y)+d[1]);}
  }
