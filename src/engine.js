/* Rectangular descent: one real simulation shared by the browser, notes and test harness. */
const NetherTrial = (() => {
  const N=45, ROWS=37, CELL_COUNT=N*ROWS, TILE=32;
  const idx=(x,y)=>y*N+x, inB=(x,y)=>x>=0&&y>=0&&x<N&&y<ROWS;
  /* NETHER_MAPS */
  const BUILD='TN-D7-2026-10-24-maze-shapes-1';
  const SAVE_KEY='tn.d7.shapes.v1',PREF_KEY='tn.d7.shapes.preferences.v1',HISTORY_KEY='tn.d7.shapes.history.v1';
  const HERO_SPEED=4.6,MINE_TIME=1.8;
  const MATERIALS={b:{tier:1,name:'copper brick'},c:{tier:2,name:'crystal stone'},d:{tier:3,name:'iron block'},e:{tier:4,name:'obsidian slab'}};
  const PURSUERS=[
    {id:'middle',name:'Rush in the middle',description:'Normal outside, rush monsters in crystal and iron layers.'},
    {id:'one',name:'One middle rush layer',description:'Rush only in crystal. Normal in all other layers.'},
    {id:'three',name:'Three inner rush layers',description:'Normal outside; rush in crystal, iron and obsidian.'},
    {id:'deep',name:'Rush deeper down',description:'Normal outside, rush monsters in iron and obsidian layers.'},
    {id:'goofy',name:'Goofy regular',description:'Quick feet, late turns. They sometimes choose the wrong way.'},
    {id:'runner',name:'Tracking rush',description:'A warning, a much faster chase, then time to catch your breath.'}
  ];
  const SCENES=new Map(NETHER_LAYOUT_CATALOGUE.map(meta=>[meta.id,layout(meta.id)]));
  const TRIAL_DEFAULTS={layout:'rectangular-descent-v1',control:'tap',brain:'committed',weakSpots:false,cues:true,pursuer:'middle'};
  const LAB_PRESETS=[
    {id:'shape-current',pair:'paths',label:'Current loops',layout:'rectangular-descent-v1'},
    {id:'shape-islands',pair:'paths',label:'Loop islands',layout:'loop-islands-v1'},
    {id:'shape-snake',pair:'paths',label:'Snake race',layout:'snake-race-v1'},
    {id:'shape-steps',pair:'boundaries',label:'Stepped islands',layout:'stepped-islands-v1'},
    {id:'shape-castle',pair:'boundaries',label:'Castle islands',layout:'castle-islands-v1'},
    {id:'controls-a',pair:'controls',label:'Tap a destination',description:'Choose where to go; the hero follows a route.',control:'tap'},
    {id:'controls-b',pair:'controls',label:'Swipe the next turn',description:'Keep running. Queue a turn before the junction.',control:'swipe'},
    {id:'brains-a',pair:'brains',label:'Tracking rush',description:'Fast monsters keep updating their chase.',brain:'tracking'},
    {id:'brains-b',pair:'brains',label:'Committed rush',description:'Same fast burst. Trick them by turning after their warning.',brain:'committed'},
    {id:'walls-a',pair:'walls',label:'Free holes',description:'Every matching wall takes the same time.',weakSpots:false},
    {id:'walls-b',pair:'walls',label:'Cracked shortcuts',description:'Cracks open faster. All other matching walls still open.',weakSpots:true},
    {id:'layers-a',pair:'layers',label:'One middle rush layer',description:'Rush monsters only in crystal.',pursuer:'one'},
    {id:'layers-b',pair:'layers',label:'Two middle rush layers',description:'Rush monsters in crystal and iron.',pursuer:'middle'},
    {id:'cues-a',pair:'cues',label:'Surprise chase',description:'Watch the maze and listen; no nearby arrows.',cues:false},
    {id:'cues-b',pair:'cues',label:'Nearby approach cues',description:'A small hint for the two closest nearby approaches.',cues:true}
  ].map(p=>({...TRIAL_DEFAULTS,...p}));
  function trialSelection(selection){
    const preset=LAB_PRESETS.find(p=>p.id===selection.preset);
    const t={...TRIAL_DEFAULTS,...(preset||{}),...(!preset?selection:{})};
    return {layout:SCENES.has(t.layout)?t.layout:'rectangular-descent-v1',preset:preset?.id||'custom',label:preset?.label||'Your mix',control:t.control==='swipe'?'swipe':'tap',brain:t.brain==='tracking'?'tracking':'committed',weakSpots:!!t.weakSpots,cues:t.cues!==false,pursuer:PURSUERS.some(p=>p.id===t.pursuer)?t.pursuer:'middle'};
  }
  // Fixed optional shortcuts; every other matching material remains mineable.
  const isWeakSpot=cell=>!!state?.trial.weakSpots&&(scene.weakCells||scene.layers.flatMap(l=>[idx(19,l.y1),idx(25,l.y2)])).includes(cell)&&!!MATERIALS[state.map[cell]];
  const miningSeconds=cell=>isWeakSpot(cell)?.9:MINE_TIME;
  const defaults={dodge:false,showRoute:true,closeView:true,zoom:2.2,highContrast:false,reducedMotion:!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches};
  let prefs={...defaults};
  try{const saved=JSON.parse(localStorage.getItem(PREF_KEY));for(const k of Object.keys(defaults))if(k==='zoom'?Number.isFinite(saved?.[k])&&saved[k]>=1&&saved[k]<=3.2:typeof saved?.[k]==='boolean')prefs[k]=saved[k];}catch(error){}
  let state=null,active=false,storageOK=true,scene=SCENES.get('rectangular-descent-v1');
  const retainedAttempts=new Map(),pendingAttempts=new Set();
  let START=scene.start,GOAL=scene.goal;
  function activateScene(id){scene=SCENES.get(id);START=scene.start;GOAL=scene.goal;}
  let replan=0,saveClock=0,pointerId=null,lastPointer=null;
  const view=()=>state?JSON.parse(JSON.stringify(state)):null;
  const preferences=()=>({...prefs});
  const options=()=>({layouts:JSON.parse(JSON.stringify([...SCENES.values()])),pursuers:PURSUERS.map(p=>({...p})),presets:LAB_PRESETS.map(p=>({...p})),saveKey:SAVE_KEY});
  const inRefuge=(x,y)=>x>=scene.refuge.x1-.5&&x<scene.refuge.x2+.5&&y>=scene.refuge.y1-.5&&y<scene.refuge.y2+.5;
  const refugeActive=()=>!!state&&inRefuge(state.hero.x,state.hero.y)&&state.refuge.remaining>0&&state.refuge.cooldown<=0;
  const enemyKind=(mode,layer)=>mode==='runner'||mode==='middle'&&(layer===2||layer===3)||mode==='deep'&&layer>=3||mode==='one'&&layer===2||mode==='three'&&layer>=2?'runner':'goofy';
  const walkableCell=(x,y,monster=false,voidTarget=null)=>Number.isInteger(x)&&Number.isInteger(y)&&inB(x,y)&&(state.map[idx(x,y)]==='.'||(!monster&&idx(x,y)===voidTarget&&state.map[idx(x,y)]==='v'));
  /* NETHER_ROUTE */
  /* NETHER_AUDIO */
  function updateRefuge(dt){
    const r=state.refuge,inside=inRefuge(state.hero.x,state.hero.y);
    if(r.inside&&!inside){r.cooldown=15;r.remaining=0;state.events.push({type:'refuge-left',time:state.elapsed});}
    else if(r.cooldown>0){r.cooldown=Math.max(0,r.cooldown-dt);if(r.cooldown===0&&!inside)r.remaining=8;}
    if(!inside&&r.cooldown===0)r.remaining=8;
    if(inside&&r.cooldown===0&&r.remaining>0){r.remaining=Math.max(0,r.remaining-dt);if(r.remaining===0)state.message='Refuge shield spent. Leave it to recharge; monsters can catch you here now.';}
    r.inside=inside;
  }
  function faceHammer(dx,dy){
    if(!state||Math.hypot(dx,dy)<.01)return;
    state.hammer.faceX=Math.abs(dx)>=Math.abs(dy)?Math.sign(dx):0;
    state.hammer.faceY=Math.abs(dx)>=Math.abs(dy)?0:Math.sign(dy);
  }
  function swingHammer(direction=null){
    if(!active||!state||state.status!=='playing'||state.paused||state.awaitingReturn||state.recovery>0||!state.hammer.collected||state.hammer.cooldown>0)return false;
    if(direction&&Number.isFinite(direction.x)&&Number.isFinite(direction.y))faceHammer(direction.x,direction.y);
    const h=state.hero,hammer=state.hammer;
    hammer.cooldown=1.1;hammer.swing=.24;
    const candidates=state.enemies.filter(e=>{
      const dx=e.x-h.x,dy=e.y-h.y,d=Math.hypot(dx,dy);
      if(!e.released||d>1.35||dx*hammer.faceX+dy*hammer.faceY<=0||Math.abs(dx*hammer.faceY-dy*hammer.faceX)>.65)return false;
      for(let t=0;t<=1;t+=.1)if(!walkableCell(Math.round(h.x+dx*t),Math.round(h.y+dy*t)))return false;
      return true;
    }).sort((a,b)=>Math.hypot(a.x-h.x,a.y-h.y)-Math.hypot(b.x-h.x,b.y-h.y));
    const hit=candidates[0];if(hit){hit.stun=.85;hit.path=[];}
    state.events.push({type:'hammer-swing',enemy:hit?.id||null,faceX:hammer.faceX,faceY:hammer.faceY,time:state.elapsed});
    state.message=hit?'One monster stunned. The other side is still dangerous!':'Heavy swing. Lightning sleeps until you cross the exit.';
    snd.hammer();persist();syncUI();return true;
  }

  function aim(x,y){
    if(!active||state.status!=='playing'||state.paused||state.awaitingReturn||state.recovery>0||!Number.isInteger(x)||!Number.isInteger(y)||!inB(x,y))return false;
    faceHammer(x-state.hero.x,y-state.hero.y);
    const cell=idx(x,y),tile=state.map[cell],material=MATERIALS[tile];
    if(material){
      if(state.upgrade<material.tier){state.message='Find the '+scene.layers[material.tier-1].name+' pickaxe before opening '+material.name+'.';syncUI();return false;}
      if(inRefuge(state.hero.x,state.hero.y)){state.message='Step out of the blue refuge before mining.';syncUI();return false;}
      if(state.mining?.cell===cell)return true;
      let chosen=null;
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const p=route(state.hero,x+dx,y+dy);if(p&&(!chosen||p.length<chosen.length))chosen=p;
      }
      if(!chosen){state.message='Find a reachable side of that wall.';syncUI();return false;}
      state.mining={cell,progress:0};state.hero.path=chosen;state.target=null;
      state.message='Opening '+material.name+'. Monsters can use this passage too. Tap floor to cancel.';
    }else{
      const p=route(state.hero,x,y);
      if(!p){if(tile==='#'){state.message='Dark basalt stays solid. Look for coloured material walls.';syncUI();}return false;}
      state.mining=null;state.target={x,y};state.hero.path=p;
      if(tile==='v')state.message='Purple void costs a life. Tap safe ground to turn back.';
      if(x===GOAL.x&&y===GOAL.y&&!state.cores.every(c=>c.collected))state.message='The exit needs all four cores. Bring them here on foot.';
    }
    state.steering={dx:0,dy:0,queued:null};syncUI();return true;
  }
  function queueTurn(dx,dy){
    if(!active||!state||state.trial.control!=='swipe'||state.status!=='playing'||state.paused||state.awaitingReturn||state.recovery>0||!Number.isInteger(dx)||!Number.isInteger(dy)||Math.abs(dx)+Math.abs(dy)!==1)return false;
    const h=state.hero,steer=state.steering;
    if(h.path.length){const next=h.path[0],dx=next%N-h.x,dy=Math.floor(next/N)-h.y;
      steer.dx=Math.abs(dx)>.001?Math.sign(dx):0;steer.dy=Math.abs(dy)>.001?Math.sign(dy):0;h.path=[next];}
    state.mining=null;state.target=null;steer.queued={dx,dy};
    // Reverse along the current corridor; perpendicular turns wait for a centre.
    if(h.path.length&&dx===-steer.dx&&dy===-steer.dy){
      const x=dx<0?Math.floor(h.x):dx>0?Math.ceil(h.x):Math.round(h.x);
      const y=dy<0?Math.floor(h.y):dy>0?Math.ceil(h.y):Math.round(h.y);
      h.path=walkableCell(x,y)?[idx(x,y)]:[];steer.dx=dx;steer.dy=dy;steer.queued=null;
    }
    advanceSteering();return true;
  }
  function stopWalking(){
    if(!active||!state||state.status!=='playing'||state.paused||state.awaitingReturn)return false;
    const h=state.hero;state.steering={dx:0,dy:0,queued:null};state.target=null;state.mining=null;
    const x=Math.round(h.x),y=Math.round(h.y);h.path=Math.hypot(h.x-x,h.y-y)>.001?[idx(x,y)]:[];
    return true;
  }
  function advanceSteering(){
    const h=state.hero,s=state.steering;if(h.path.length)return;
    const x=Math.round(h.x),y=Math.round(h.y),q=s.queued;
    if(q&&walkableCell(x+q.dx,y+q.dy)){s.dx=q.dx;s.dy=q.dy;s.queued=null;}
    if((s.dx||s.dy)&&walkableCell(x+s.dx,y+s.dy))h.path=[idx(x+s.dx,y+s.dy)];
  }
  function move(entity,dt,speed){
    let left=dt*speed;
    while(entity.path.length&&left>0){
      const cell=entity.path[0],x=cell%N,y=Math.floor(cell/N),gap=Math.hypot(x-entity.x,y-entity.y);
      if(gap<=left){entity.x=x;entity.y=y;entity.path.shift();left-=gap;if(entity===state.hero&&state.trial.control==='swipe'&&!state.mining)advanceSteering();}
      else{entity.x+=(x-entity.x)/gap*left;entity.y+=(y-entity.y)/gap*left;left=0;}
    }
  }
  function lose(reason){
    if(state.status!=='playing'||state.awaitingReturn||state.recovery>0||refugeActive())return;
    state.losses.push({cause:reason,x:state.hero.x,y:state.hero.y,time:Math.round(state.elapsed*100)/100});
    stopNetherMusic();state.lives--;state.returns++;state.lastLoss=reason;
    state.mining=null;state.target=null;state.hero.path=[];state.steering={dx:0,dy:0,queued:null};resetInput();
    if(state.lives===0){state.status='lost';state.message='Three lives used. Your notes can help shape the next adventure.';}
    else{
      state.hero.x=START.x;state.hero.y=START.y;state.refuge={remaining:8,cooldown:0,inside:true};state.recovery=.75;state.awaitingReturn=true;
      state.message=(reason==='void'?'A void fall.':'Caught.')+' Your maze, tool, cores and openings stay. The monsters stay too.';
    }
    persist();syncUI();
  }
  function resumeRecovery(){
    if(!active||!state.awaitingReturn||state.status!=='playing')return false;
    state.awaitingReturn=false;state.paused=false;
    state.message='Eight seconds of refuge shield. Choose your route; leaving starts a fifteen-second recharge.';
    persist();syncUI();return true;
  }
  function random(){state.rng=(Math.imul(state.rng,1664525)+1013904223)>>>0;return state.rng/4294967296;}
  function updatePursuers(dt,repath){
    const h=state.hero;
    const patrol=scene.patrol||[{x:1,y:1},{x:43,y:1},{x:43,y:35},{x:1,y:19},{x:23,y:3},{x:41,y:18}];
    for(const e of state.enemies){
      if(!e.released){
        if(!repath)continue;
        const p=route(e,scene.refugeWait.x,scene.refugeWait.y,true);
        if(p){e.path=p;e.released=true;e.wake=.85;state.events.push({type:'released',enemy:e.id,layer:e.layer,time:state.elapsed});state.message=e.name+' can reach your side now!';saveClock=1;snd.nope();}
      }
      if(!e.released)continue;
      if(e.stun>0){e.stun=Math.max(0,e.stun-dt);continue;}
      if(e.wake>0){e.wake=Math.max(0,e.wake-dt);continue;}
      const order=scene.enemies.findIndex(v=>v.id===e.id);
      // Distinct targets stop the crowd becoming one identical train. Scatter
      // is periodic movement only: no timed monster releases or speed growth.
      const scattering=state.elapsed%16>=12||(e.role==='roamer'&&(state.elapsed+order*2)%14<4);
      let ahead=null;
      if(e.role==='flanker'){let x=Math.round(h.x),y=Math.round(h.y);for(let i=0;i<4;i++){const nx=x+state.hammer.faceX,ny=y+state.hammer.faceY;if(!walkableCell(nx,ny,true))break;x=nx;y=ny;}ahead=idx(x,y);}
      const target=refugeActive()||scattering?patrol[order%patrol.length]:ahead!==null?{x:ahead%N,y:Math.floor(ahead/N)}:{x:Math.round(h.x),y:Math.round(h.y)};
      let speed=4.85;
      if(e.kind==='runner'){
        e.phaseTime-=dt;
        if(e.phaseTime<=0){
          const next={stalk:['windup',.7],windup:['burst',1.1],burst:['rest',1.3],rest:['stalk',2.4]}[e.phase];
          e.phase=next[0];e.phaseTime=next[1];
          if(e.phase==='windup'&&state.trial.brain==='committed')e.path=(route(e,target.x,target.y,true)||[]).slice(0,9);
          if(e.phase==='burst'&&state.trial.brain==='tracking')e.path=route(e,target.x,target.y,true)||[];
        }
        speed={stalk:3.7,windup:0,burst:8.2,rest:2.4}[e.phase];
        if(repath&&e.phase!=='windup'&&(state.trial.brain==='tracking'||e.phase!=='burst'))e.path=route(e,target.x,target.y,true)||[];
      }else{
        e.notice-=dt;
        if(e.notice<=0){
          e.notice=1;e.wrongTurn=false;e.path=route(e,target.x,target.y,true)||[];
          const x=Math.round(e.x),y=Math.round(e.y);
          const neighbors=[[x+1,y],[x-1,y],[x,y+1],[x,y-1]].filter(([a,b])=>walkableCell(a,b,true)&&idx(a,b)!==e.path[0]);
          if(neighbors.length>=2&&random()<.30){
            const [a,b]=neighbors[Math.floor(random()*neighbors.length)];e.path=route(e,a,b,true)||[];e.wrongTurn=true;
          }
        }
      }
      if(!refugeActive()&&Math.hypot(h.x-e.x,h.y-e.y)<.55){lose('caught');return;}
      move(e,dt,speed);
      if(!refugeActive()&&Math.hypot(h.x-e.x,h.y-e.y)<.55){lose('caught');return;}
    }
  }
  function step(dt){
    if(!active||!state||state.status!=='playing'||state.paused||state.awaitingReturn||!Number.isFinite(dt)||dt<=0)return;
    dt=Math.min(.05,dt);state.elapsed+=dt;updateNetherMusic(dt);
    state.hammer.cooldown=Math.max(0,state.hammer.cooldown-dt);state.hammer.swing=Math.max(0,state.hammer.swing-dt);
    if(state.recovery>0){state.recovery=Math.max(0,state.recovery-dt);return;}
    replan-=dt;let repath=replan<=0;
    if(repath){
      replan=.12;
      if(state.trial.control==='tap'&&state.target&&state.hero.path.length)state.hero.path=route(state.hero,state.target.x,state.target.y)||[];
      if(state.mining&&state.hero.path.length){const end=state.hero.path[state.hero.path.length-1];state.hero.path=route(state.hero,end%N,Math.floor(end/N))||[];}
    }
    if(state.trial.control==='swipe'&&!state.mining)advanceSteering();
    if(state.hero.path.length){const next=state.hero.path[0];faceHammer(next%N-state.hero.x,Math.floor(next/N)-state.hero.y);}
    move(state.hero,dt,HERO_SPEED*(state.hammer.swing>0?.4:1));updateRefuge(dt);
    if(state.map[idx(Math.round(state.hero.x),Math.round(state.hero.y))]==='v'){lose('void');return;}
    for(const u of scene.upgrades)if(state.upgrade===u.tier-1&&Math.hypot(state.hero.x-u.x,state.hero.y-u.y)<.2){
      state.upgrade=u.tier;state.events.push({type:'upgrade',tier:u.tier,time:state.elapsed});state.message=u.label+' ready. Tap matching walls to open a permanent passage.';saveClock=1;snd.gem();
    }
    if(state.mining&&!state.hero.path.length){
      const cell=state.mining.cell,x=cell%N,y=Math.floor(cell/N);
      if(Math.hypot(x-state.hero.x,y-state.hero.y)<=1.01){
        state.mining.progress+=dt;
        if(state.mining.progress>=miningSeconds(cell)){
          const tier=MATERIALS[state.map[cell]].tier;state.map[cell]='.';state.mining=null;state.breaches++;
          state.events.push({type:'breach',x,y,tier,time:state.elapsed});repath=true;
          state.message='Wall cleared for good. A connected passage lets monsters through too.';saveClock=1;snd.crumble();
        }
      }
    }
    if(!state.hammer.collected&&Math.hypot(state.hero.x-scene.hammer.x,state.hero.y-scene.hammer.y)<.2){state.hammer.collected=true;state.events.push({type:'hammer-collected',time:state.elapsed});state.message='Storm Hammer found! Swing at one monster ahead. Its lightning awakens only at the exit.';saveClock=1;snd.gem();}
    updatePursuers(dt,repath);
    if(state.status!=='playing'||state.awaitingReturn)return;
    for(const c of state.cores)if(!c.collected&&Math.hypot(state.hero.x-c.x,state.hero.y-c.y)<.2){
      c.collected=true;state.events.push({type:'core',core:c.id,time:state.elapsed});saveClock=1;snd.gem();
      state.message=state.cores.every(v=>v.collected)?'All four cores collected! Walk to the green exit.':c.label+' collected. Keep it, even if you are caught.';
    }
    if(state.cores.every(c=>c.collected)&&state.hammer.collected&&Math.hypot(state.hero.x-GOAL.x,state.hero.y-GOAL.y)<.2){
      state.status='won';resetInput();state.hammer.charged=true;store.set('tn.storm-hammer','charged');stopNetherMusic();state.events.push({type:'escaped-on-foot',x:state.hero.x,y:state.hero.y,time:state.elapsed});
      state.message='The portal charges your Storm Hammer! Return to the woods and unleash its lightning.';state.hero.path=[];state.target=null;saveClock=1;snd.gem();
    }
    saveClock+=dt;if(saveClock>=1){persist();saveClock=0;}syncUI();
  }
  function storedHistoryIds(){try{const ids=JSON.parse(localStorage.getItem(HISTORY_KEY));return Array.isArray(ids)?ids.filter(id=>typeof id==='string'&&/^[a-z0-9-]+$/.test(id)):[];}catch(error){return [];}}
  function historyIds(){return [...new Set([...storedHistoryIds(),...retainedAttempts.keys()])];}
  function attemptById(id){try{const v=JSON.parse(retainedAttempts.get(id)||localStorage.getItem(HISTORY_KEY+'.'+id));return validAttempt(v)?v:null;}catch(error){return null;}}
  function saveAttempt(attempt){
    retainedAttempts.set(attempt.attemptId,JSON.stringify(attempt));pendingAttempts.add(attempt.attemptId);
    try{
      const ids=storedHistoryIds();
      // Flush runs retained during an earlier quota failure before claiming save success.
      for(const id of pendingAttempts){localStorage.setItem(HISTORY_KEY+'.'+id,retainedAttempts.get(id));if(!ids.includes(id))ids.push(id);}
      localStorage.setItem(HISTORY_KEY,JSON.stringify(ids));pendingAttempts.clear();storageOK=true;return true;
    }catch(error){storageOK=false;return false;}
  }
  function persist(){if(!state)return false;if(!saveAttempt(state))return false;try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));return true;}catch(error){storageOK=false;return false;}}
  function history(){return historyIds().reverse().map(attemptById).filter(Boolean).map(a=>({id:a.attemptId,label:a.trial.label,layout:a.layout,layoutName:SCENES.get(a.layout).name,status:a.status,lives:a.lives,elapsed:Math.round(a.elapsed),hammer:a.hammer.collected,cores:a.cores.filter(c=>c.collected).length,feedback:a.feedback||{}}));}
  function recordFeedback(feedback,id=null){
    const a=!id||id===state?.attemptId?state:attemptById(id);if(!a)return false;
    a.feedback={feeling:typeof feedback?.feeling==='string'?feedback.feeling:(a.feedback?.feeling||''),note:typeof feedback?.note==='string'?feedback.note:(a.feedback?.note||'')};
    return a===state?persist():saveAttempt(a);
  }
  function exportHistory(){if(state)persist();return JSON.stringify({game:'Twenty Nights — Maze Shapes',build:BUILD,attempts:historyIds().map(attemptById).filter(Boolean).map(a=>JSON.parse(notesFor(a,{},a.status==='playing'?'stopped-for-comparison':null)))},null,2);}
  function validAttempt(v){
    if(!v||!SCENES.has(v.layout))return false;
    const scene=SCENES.get(v.layout),START=scene.start,GOAL=scene.goal;
    if(!v||v.version!==7||v.build!==BUILD||v.layout!==scene.id||!PURSUERS.some(p=>p.id===v.pursuer)||!['practice','woods'].includes(v.origin)
      ||!['playing','won','lost'].includes(v.status)||!Number.isInteger(v.lives)||v.lives<0||v.lives>3||![0,1,2,3,4].includes(v.upgrade)
      ||(v.status==='lost')!==(v.lives===0)||!Array.isArray(v.map)||v.map.length!==CELL_COUNT)return false;
    if(v.map.some((t,i)=>t!==scene.map[i]&&!(MATERIALS[scene.map[i]]?.tier<=v.upgrade&&t==='.')))return false;
    const point=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=1&&p.x<=N-2&&p.y>=1&&p.y<=ROWS-2;
    const path=p=>Array.isArray(p)&&p.length<=CELL_COUNT&&p.every(i=>Number.isInteger(i)&&i>=0&&i<CELL_COUNT&&(v.map[i]==='.'||v.target&&i===idx(v.target.x,v.target.y)&&v.map[i]==='v'));
    const body=p=>point(p)&&path(p.path)&&(v.map[idx(Math.round(p.x),Math.round(p.y))]==='.'||p===v.hero&&v.status==='lost'&&v.map[idx(Math.round(p.x),Math.round(p.y))]==='v');
    const pref=p=>p&&Object.keys(defaults).every(k=>k==='zoom'?Number.isFinite(p[k])&&p[k]>=1&&p[k]<=3.2:typeof p[k]==='boolean');
    if(!v.trial||v.trial.layout!==v.layout||!['tap','swipe'].includes(v.trial.control)||!['tracking','committed'].includes(v.trial.brain)||typeof v.trial.weakSpots!=='boolean'||typeof v.trial.cues!=='boolean'||v.trial.pursuer!==v.pursuer||typeof v.trial.label!=='string'||typeof v.trial.preset!=='string')return false;
    const direction=d=>d&&Number.isInteger(d.dx)&&Number.isInteger(d.dy)&&Math.abs(d.dx)+Math.abs(d.dy)<=1;
    if(!direction(v.steering)||v.steering.queued&&!direction(v.steering.queued))return false;
    if(!body(v.hero)||!Array.isArray(v.enemies)||v.enemies.length!==scene.enemies.length||v.enemies.some((e,i)=>!body(e)||e.id!==scene.enemies[i].id||e.layer!==scene.enemies[i].layer||e.role!==scene.enemies[i].role||typeof e.released!=='boolean'||e.kind!==enemyKind(v.pursuer,e.layer)||!Number.isFinite(e.stun)||e.stun<0||e.stun>.85
      ||!['stalk','windup','burst','rest'].includes(e.phase)||!Number.isFinite(e.phaseTime)||e.phaseTime<0||e.phaseTime>2.4||!Number.isFinite(e.wake)||e.wake<0||e.wake>.85||!Number.isFinite(e.notice)||e.notice<0||e.notice>1||typeof e.wrongTurn!=='boolean'))return false;
    if(!v.hammer||typeof v.hammer.collected!=='boolean'||typeof v.hammer.charged!=='boolean'||v.hammer.charged!==(v.status==='won')||v.hammer.charged&&!v.hammer.collected||![v.hammer.cooldown,v.hammer.swing,v.hammer.faceX,v.hammer.faceY].every(Number.isFinite)||v.hammer.cooldown<0||v.hammer.cooldown>1.1||v.hammer.swing<0||v.hammer.swing>.24||Math.abs(v.hammer.faceX)+Math.abs(v.hammer.faceY)!==1||!Number.isInteger(v.hammer.faceX)||!Number.isInteger(v.hammer.faceY))return false;
    if(!v.refuge||![v.refuge.remaining,v.refuge.cooldown].every(Number.isFinite)||v.refuge.remaining<0||v.refuge.remaining>8||v.refuge.cooldown<0||v.refuge.cooldown>15||typeof v.refuge.inside!=='boolean')return false;
    if(!Number.isFinite(v.recovery)||v.recovery<0||v.recovery>.75||!Number.isFinite(v.elapsed)||v.elapsed<0||!Number.isInteger(v.returns)||v.returns!==3-v.lives||typeof v.message!=='string'||typeof v.paused!=='boolean'||typeof v.awaitingReturn!=='boolean')return false;
    if(v.awaitingReturn&&(v.status!=='playing'||v.lives>=3||v.recovery<=0||v.hero.x!==START.x||v.hero.y!==START.y))return false;
    if(!Array.isArray(v.cores)||v.cores.length!==scene.cores.length||v.cores.some((c,i)=>c.id!==scene.cores[i].id||c.x!==scene.cores[i].x||c.y!==scene.cores[i].y||typeof c.collected!=='boolean'))return false;
    if(v.status==='won'&&(!v.hammer.collected||!v.cores.every(c=>c.collected)||Math.hypot(v.hero.x-GOAL.x,v.hero.y-GOAL.y)>=.2))return false;
    if(!Array.isArray(v.losses)||v.losses.length!==v.returns||v.losses.some(l=>!point(l)||!['caught','void'].includes(l.cause)||!Number.isFinite(l.time)))return false;
    if(!Number.isInteger(v.breaches)||v.breaches!==v.map.filter((t,i)=>t==='.'&&MATERIALS[scene.map[i]]).length)return false;
    if(!pref(v.preferences)||!pref(v.initialPreferences)||!Array.isArray(v.settingChanges)||!Array.isArray(v.events)||typeof v.attemptId!=='string'||typeof v.startedAt!=='string'||!Number.isInteger(v.rng)||v.rng<0||v.rng>4294967295)return false;
    if(v.target&&(!point(v.target)||!Number.isInteger(v.target.x)||!Number.isInteger(v.target.y)||!['.','v'].includes(v.map[idx(v.target.x,v.target.y)])))return false;
    if(v.mining&&(!Number.isInteger(v.mining.cell)||!MATERIALS[v.map[v.mining.cell]]||MATERIALS[v.map[v.mining.cell]].tier>v.upgrade||!Number.isFinite(v.mining.progress)||v.mining.progress<0||v.mining.progress>MINE_TIME))return false;
    return true;
  }
  function savedAttempt(){try{const saved=JSON.parse(localStorage.getItem(SAVE_KEY));return validAttempt(saved)?saved:null;}catch(error){return null;}}
  function resume(id=null){const saved=id?attemptById(id):savedAttempt();if(id&&state)persist();if(!saved)return false;activateScene(saved.layout);state=saved;prefs={...state.preferences};state.paused=true;active=true;S.running=false;replan=0;resetInput();syncUI();return true;}
  function leave(){stopNetherMusic();persist();active=false;S.running=false;resetInput();syncUI();}
  function replay(){return start(state?state.origin:'practice',state?{...state.trial}:{});}
  function setPaused(value){if(!active||!state)return;state.paused=!!value;if(state.paused)stopNetherMusic();resetInput();persist();syncUI();}
  function setPreferences(changes){
    const changed={};for(const k of Object.keys(defaults))if((k==='zoom'?Number.isFinite(changes?.[k])&&changes[k]>=1&&changes[k]<=3.2:typeof changes?.[k]==='boolean')&&prefs[k]!==changes[k]){changed[k]={from:prefs[k],to:changes[k]};prefs[k]=changes[k];}
    if(active&&state){state.preferences={...prefs};if(Object.keys(changed).length)state.settingChanges.push({time:state.elapsed,changed});persist();}
    try{localStorage.setItem(PREF_KEY,JSON.stringify(prefs));}catch(error){}syncUI();return preferences();
  }
  function notesFor(attempt,feedback={},recordedAs=null){
    const attemptScene=SCENES.get(attempt?.layout)||scene;
    return JSON.stringify({game:'Twenty Nights — Maze Shapes',version:7,build:BUILD,
      question:'Which maze gives the most exciting chase and a fair escape? Do you prefer loops, winding routes, stepped walls or castle walls?',
      trialDefaults:{layers:4,monsters:10,cores:4,lives:3,tool:'colour-matched reusable materials',refuge:{shield:8,recharge:15},hammer:{lightning:'portal only',stun:.85,cooldown:1.1},heroSpeed:HERO_SPEED,mineSeconds:MINE_TIME,patrolCycle:{chaseSeconds:12,patrolSeconds:4},goofy:{speed:4.85,noticeSeconds:1,wrongTurnChance:.30},runner:{stalk:3.7,warningSeconds:.7,burst:8.2,burstSeconds:1.1,recovery:2.4,recoverySeconds:1.3}},
      comparison:'Shape presets share rules, roster and a rectangular 45 by 37 board. Geometry changes route lengths and decisions, so equal difficulty is not assumed. Custom settings and display changes are recorded.',
      attempt:attempt?{id:attempt.attemptId,startedAt:attempt.startedAt,layout:attempt.layout,layoutName:attemptScene.name,pursuer:attempt.pursuer,trial:attempt.trial,status:attempt.status,
        recordedAs:recordedAs||(attempt.status==='won'?'escaped-on-foot':attempt.status==='lost'?'three-lives-used':'in-progress'),
        lives:attempt.lives,upgrade:attempt.upgrade,hammer:attempt.hammer,refuge:attempt.refuge,monsterMix:attempt.enemies.map(e=>({id:e.id,layer:e.layer,kind:e.kind})),cores:attempt.cores,breaches:attempt.breaches,losses:attempt.losses,events:attempt.events,
        openings:attempt.map.flatMap((tile,i)=>tile==='.'&&MATERIALS[attemptScene.map[i]]?[{x:i%N,y:Math.floor(i/N),tier:MATERIALS[attemptScene.map[i]].tier}]:[]),
        elapsed:Math.round(attempt.elapsed),initialPreferences:attempt.initialPreferences,preferences:attempt.preferences,settingChanges:attempt.settingChanges}:null,feedback:{...attempt?.feedback,...feedback}},null,2);
  }
  function exportNotes(feedback={}){return notesFor(state,feedback);}
  function exportSavedNotes(feedback={},id=null){
    const saved=id?attemptById(id):savedAttempt();
    return saved?notesFor(saved,feedback,saved.status==='playing'?'stopped-for-comparison':null):null;
  }
  function start(origin='practice',selection={}){
    if(state)persist();const trial=trialSelection(selection),pursuer=trial.pursuer;activateScene(trial.layout);
    prefs.dodge=false;
    stopNetherMusic();
    state={version:7,build:BUILD,attemptId:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9),startedAt:new Date().toISOString(),origin,status:'playing',layout:scene.id,pursuer,trial,steering:{dx:0,dy:0,queued:null},feedback:{},lives:3,upgrade:0,map:scene.map.slice(),preferences:{...prefs},initialPreferences:{...prefs},settingChanges:[],events:[],rng:20261022,
      hammer:{collected:false,charged:false,cooldown:0,swing:0,faceX:0,faceY:-1},refuge:{remaining:8,cooldown:0,inside:true},
      hero:{...START,path:[]},enemies:scene.enemies.map((e,i)=>({...e,kind:enemyKind(pursuer,e.layer),stun:0,path:[],released:false,wake:0,phase:'stalk',phaseTime:.4+(i%5)*.5,notice:(i%5)*.2,wrongTurn:false})),
      cores:scene.cores.map(c=>({...c,collected:false})),breaches:0,losses:[],mining:null,target:null,paused:false,recovery:0,awaitingReturn:false,elapsed:0,returns:0,
      message:'Find the copper-coloured pickaxe in the outer loop. Choose your own opening through the copper wall.'};
    active=true;S.running=false;replan=0;saveClock=0;resetInput();persist();syncUI();return view();
  }
  function enterFromWoods(){const day=S.day;S.day=20;save();S.day=day;store.set('tn.woods-complete',store.get('tn.save'));return start('woods');}
  function returnToWoods(){
    if(!state||state.status!=='won'||!state.hammer.charged)return false;
    const fromWoods=state.origin==='woods';leave();
    if(fromWoods&&load())continueGame();else newGame();
    S.stormHammer=true;save();bark('STORM HAMMER CHARGED! Approach a monster to fire lightning.',5200);return true;
  }
  const hasSaved=()=>!!savedAttempt();
  /* NETHER_UI */
  /* NETHER_DRAW */
  /* NETHER_INPUT */
  return {cameraState,threatIndicators,history,recordFeedback,exportHistory,queueTurn,stopWalking,swingHammer,returnToWoods,musicState,start,enterFromWoods,view,aim,step,persist,resume,leave,replay,setPaused,draw,pointer,key,bindUI,isActive:()=>active,options,preferences,setPreferences,resumeRecovery,exportNotes,exportSavedNotes,prepareWoods};
})();
