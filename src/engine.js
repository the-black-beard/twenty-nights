/* TN-D3-01: one real simulation shared by the browser, notes and test harness. */
const NetherTrial = (() => {
  /* NETHER_MAPS */
  const BUILD='TN-D3-01-2026-10-22-candidate-2';
  const SAVE_KEY='tn.d3.combined.v2',PREF_KEY='tn.d3.combined.preferences.v2';
  const HERO_SPEED=4.6,MINE_TIME=1.8;
  const MATERIALS={b:{tier:1,name:'copper brick'},c:{tier:2,name:'crystal stone'}};
  const PURSUERS=[
    {id:'goofy',name:'Goofy regular',description:'Quick feet, late turns. They sometimes choose the wrong way.'},
    {id:'runner',name:'Tracking rush',description:'A warning, a much faster chase, then time to catch your breath.'}
  ];
  const defaults={dodge:true,showRoute:true,closeView:false,highContrast:false,reducedMotion:!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches};
  let prefs={...defaults};
  try{const saved=JSON.parse(localStorage.getItem(PREF_KEY));for(const k of Object.keys(defaults))if(typeof saved?.[k]==='boolean')prefs[k]=saved[k];}catch(error){}
  let state=null,active=false,storageOK=true,scene=layout();
  const START=scene.start,GOAL=scene.goal;
  let replan=0,saveClock=0,pointerId=null,lastPointer=null;
  const view=()=>state?JSON.parse(JSON.stringify(state)):null;
  const preferences=()=>({...prefs});
  const options=()=>({layouts:[layout()],pursuers:PURSUERS.map(p=>({...p}))});
  const inRefuge=(x,y)=>x>=scene.refuge.x1-.5&&x<scene.refuge.x2+.5&&y>=scene.refuge.y1-.5&&y<scene.refuge.y2+.5;
  const walkableCell=(x,y,monster=false,voidTarget=null)=>Number.isInteger(x)&&Number.isInteger(y)&&inB(x,y)&&!(monster&&inRefuge(x,y))&&(state.map[idx(x,y)]==='.'||(!monster&&idx(x,y)===voidTarget&&state.map[idx(x,y)]==='v'));
  /* NETHER_ROUTE */
  function aim(x,y){
    if(!active||state.status!=='playing'||state.paused||state.awaitingReturn||state.recovery>0||!Number.isInteger(x)||!Number.isInteger(y)||!inB(x,y))return false;
    const cell=idx(x,y),tile=state.map[cell],material=MATERIALS[tile];
    if(material){
      if(state.upgrade<material.tier){state.message='Find pickaxe upgrade '+material.tier+' before opening '+material.name+'.';syncUI();return false;}
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
      if(!p){if(tile==='#'){state.message='Dark basalt stays solid. Look for walls marked 1 or 2.';syncUI();}return false;}
      state.mining=null;state.target={x,y};state.hero.path=p;
      if(tile==='v')state.message='Purple void costs a life. Tap safe ground to turn back.';
      if(x===GOAL.x&&y===GOAL.y&&!state.cores.every(c=>c.collected))state.message='The exit needs both cores. Bring them here on foot.';
    }
    syncUI();return true;
  }
  function move(entity,dt,speed){
    let left=dt*speed;
    while(entity.path.length&&left>0){
      const cell=entity.path[0],x=cell%N,y=Math.floor(cell/N),gap=Math.hypot(x-entity.x,y-entity.y);
      if(gap<=left){entity.x=x;entity.y=y;entity.path.shift();left-=gap;}
      else{entity.x+=(x-entity.x)/gap*left;entity.y+=(y-entity.y)/gap*left;left=0;}
    }
  }
  function lose(reason){
    if(state.status!=='playing'||state.awaitingReturn||state.recovery>0||inRefuge(state.hero.x,state.hero.y))return;
    state.losses.push({cause:reason,x:state.hero.x,y:state.hero.y,time:Math.round(state.elapsed*100)/100});
    state.lives--;state.returns++;state.lastLoss=reason;
    state.mining=null;state.target=null;state.hero.path=[];pointerId=null;
    if(state.lives===0){state.status='lost';state.message='Three lives used. Your notes can help shape the next adventure.';}
    else{
      state.hero.x=START.x;state.hero.y=START.y;state.recovery=.75;state.awaitingReturn=true;
      state.message=(reason==='void'?'A void fall.':'Caught.')+' Your maze, tool, cores and openings stay. The monsters stay too.';
    }
    persist();syncUI();
  }
  function resumeRecovery(){
    if(!active||!state.awaitingReturn||state.status!=='playing')return false;
    state.awaitingReturn=false;state.paused=false;
    state.message='Safe in the blue refuge. Watch the monsters, then choose one of its two exits.';
    persist();syncUI();return true;
  }
  function random(){state.rng=(Math.imul(state.rng,1664525)+1013904223)>>>0;return state.rng/4294967296;}
  function updatePursuers(dt,repath){
    const h=state.hero,target=inRefuge(h.x,h.y)?scene.refugeWait:{x:Math.round(h.x),y:Math.round(h.y)};
    for(const e of state.enemies){
      if(!e.released){
        if(!repath)continue;
        const p=route(e,scene.refugeWait.x,scene.refugeWait.y,true);
        if(p){e.path=p;e.released=true;e.wake=.85;state.events.push({type:'released',enemy:e.id,layer:e.layer,time:state.elapsed});state.message=e.name+' can reach your side now!';saveClock=1;snd.nope();}
      }
      if(!e.released)continue;
      if(e.wake>0){e.wake=Math.max(0,e.wake-dt);continue;}
      let speed=4.85;
      if(state.pursuer==='runner'){
        e.phaseTime-=dt;
        if(e.phaseTime<=0){
          const next={stalk:['windup',.7],windup:['burst',1.1],burst:['rest',1.3],rest:['stalk',2.4]}[e.phase];
          e.phase=next[0];e.phaseTime=next[1];
          if(e.phase==='burst')e.path=route(e,target.x,target.y,true)||[];
        }
        speed={stalk:3.7,windup:0,burst:8.2,rest:2.4}[e.phase];
        if(repath&&e.phase!=='windup')e.path=route(e,target.x,target.y,true)||[];
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
      if(!inRefuge(h.x,h.y)&&Math.hypot(h.x-e.x,h.y-e.y)<.55){lose('caught');return;}
      move(e,dt,speed);
      if(!inRefuge(h.x,h.y)&&Math.hypot(h.x-e.x,h.y-e.y)<.55){lose('caught');return;}
    }
  }
  function step(dt){
    if(!active||!state||state.status!=='playing'||state.paused||state.awaitingReturn||!Number.isFinite(dt)||dt<=0)return;
    dt=Math.min(.05,dt);state.elapsed+=dt;
    if(state.recovery>0){state.recovery=Math.max(0,state.recovery-dt);return;}
    replan-=dt;let repath=replan<=0;
    if(repath){replan=.12;if(state.target&&state.hero.path.length)state.hero.path=route(state.hero,state.target.x,state.target.y)||[];}
    move(state.hero,dt,HERO_SPEED);
    if(state.map[idx(Math.round(state.hero.x),Math.round(state.hero.y))]==='v'){lose('void');return;}
    for(const u of scene.upgrades)if(state.upgrade===u.tier-1&&Math.hypot(state.hero.x-u.x,state.hero.y-u.y)<.2){
      state.upgrade=u.tier;state.events.push({type:'upgrade',tier:u.tier,time:state.elapsed});state.message=u.label+' ready. Tap matching walls to open a permanent passage.';saveClock=1;snd.gem();
    }
    if(state.mining&&!state.hero.path.length){
      const cell=state.mining.cell,x=cell%N,y=Math.floor(cell/N);
      if(Math.hypot(x-state.hero.x,y-state.hero.y)<=1.01){
        state.mining.progress+=dt;
        if(state.mining.progress>=MINE_TIME){
          const tier=MATERIALS[state.map[cell]].tier;state.map[cell]='.';state.mining=null;state.breaches++;
          state.events.push({type:'breach',x,y,tier,time:state.elapsed});repath=true;
          state.message='A permanent passage. You and the monsters can both use it.';saveClock=1;snd.crumble();
        }
      }
    }
    updatePursuers(dt,repath);
    if(state.status!=='playing'||state.awaitingReturn)return;
    for(const c of state.cores)if(!c.collected&&Math.hypot(state.hero.x-c.x,state.hero.y-c.y)<.2){
      c.collected=true;state.events.push({type:'core',core:c.id,time:state.elapsed});saveClock=1;snd.gem();
      state.message=state.cores.every(v=>v.collected)?'Both cores collected! Walk to the green exit.':c.label+' collected. Keep it, even if you are caught.';
    }
    if(state.cores.every(c=>c.collected)&&Math.hypot(state.hero.x-GOAL.x,state.hero.y-GOAL.y)<.2){
      state.status='won';state.events.push({type:'escaped-on-foot',x:state.hero.x,y:state.hero.y,time:state.elapsed});
      state.message='Both cores carried out. You escaped on foot!';state.hero.path=[];state.target=null;saveClock=1;snd.gem();
    }
    saveClock+=dt;if(saveClock>=1){persist();saveClock=0;}syncUI();
  }
  function persist(){if(!state)return false;try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));storageOK=true;return true;}catch(error){storageOK=false;return false;}}
  function validAttempt(v){
    if(!v||v.version!==3||v.build!==BUILD||v.layout!==scene.id||!PURSUERS.some(p=>p.id===v.pursuer)||!['practice','woods'].includes(v.origin)
      ||!['playing','won','lost'].includes(v.status)||!Number.isInteger(v.lives)||v.lives<0||v.lives>3||![0,1,2].includes(v.upgrade)
      ||(v.status==='lost')!==(v.lives===0)||!Array.isArray(v.map)||v.map.length!==400)return false;
    if(v.map.some((t,i)=>t!==scene.map[i]&&!(MATERIALS[scene.map[i]]?.tier<=v.upgrade&&t==='.')))return false;
    const point=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=1&&p.x<=18&&p.y>=1&&p.y<=18;
    const path=p=>Array.isArray(p)&&p.length<=400&&p.every(i=>Number.isInteger(i)&&i>=0&&i<400&&(v.map[i]==='.'||v.target&&i===idx(v.target.x,v.target.y)&&v.map[i]==='v'));
    const body=p=>point(p)&&path(p.path)&&(v.map[idx(Math.round(p.x),Math.round(p.y))]==='.'||p===v.hero&&v.status==='lost'&&v.map[idx(Math.round(p.x),Math.round(p.y))]==='v');
    const pref=p=>p&&Object.keys(defaults).every(k=>typeof p[k]==='boolean');
    if(!body(v.hero)||!Array.isArray(v.enemies)||v.enemies.length!==scene.enemies.length||v.enemies.some((e,i)=>!body(e)||e.id!==scene.enemies[i].id||e.layer!==scene.enemies[i].layer||typeof e.released!=='boolean'||inRefuge(e.x,e.y)
      ||!['stalk','windup','burst','rest'].includes(e.phase)||!Number.isFinite(e.phaseTime)||e.phaseTime<0||e.phaseTime>2.4||!Number.isFinite(e.wake)||e.wake<0||e.wake>.85||!Number.isFinite(e.notice)||e.notice<0||e.notice>1||typeof e.wrongTurn!=='boolean'))return false;
    if(!Number.isFinite(v.recovery)||v.recovery<0||v.recovery>.75||!Number.isFinite(v.elapsed)||v.elapsed<0||!Number.isInteger(v.returns)||v.returns!==3-v.lives||typeof v.message!=='string'||typeof v.paused!=='boolean'||typeof v.awaitingReturn!=='boolean')return false;
    if(v.awaitingReturn&&(v.status!=='playing'||v.lives>=3||v.recovery<=0||v.hero.x!==START.x||v.hero.y!==START.y))return false;
    if(!Array.isArray(v.cores)||v.cores.length!==2||v.cores.some((c,i)=>c.id!==scene.cores[i].id||c.x!==scene.cores[i].x||c.y!==scene.cores[i].y||typeof c.collected!=='boolean'))return false;
    if(v.status==='won'&&(!v.cores.every(c=>c.collected)||Math.hypot(v.hero.x-GOAL.x,v.hero.y-GOAL.y)>=.2))return false;
    if(!Array.isArray(v.losses)||v.losses.length!==v.returns||v.losses.some(l=>!point(l)||!['caught','void'].includes(l.cause)||!Number.isFinite(l.time)))return false;
    if(!Number.isInteger(v.breaches)||v.breaches!==v.map.filter((t,i)=>t==='.'&&MATERIALS[scene.map[i]]).length)return false;
    if(!pref(v.preferences)||!pref(v.initialPreferences)||!Array.isArray(v.settingChanges)||!Array.isArray(v.events)||typeof v.attemptId!=='string'||typeof v.startedAt!=='string'||!Number.isInteger(v.rng)||v.rng<0||v.rng>4294967295)return false;
    if(v.target&&(!point(v.target)||!Number.isInteger(v.target.x)||!Number.isInteger(v.target.y)||!['.','v'].includes(v.map[idx(v.target.x,v.target.y)])))return false;
    if(v.mining&&(!Number.isInteger(v.mining.cell)||!MATERIALS[v.map[v.mining.cell]]||MATERIALS[v.map[v.mining.cell]].tier>v.upgrade||!Number.isFinite(v.mining.progress)||v.mining.progress<0||v.mining.progress>MINE_TIME))return false;
    return true;
  }
  function savedAttempt(){try{const saved=JSON.parse(localStorage.getItem(SAVE_KEY));return validAttempt(saved)?saved:null;}catch(error){return null;}}
  function resume(){const saved=savedAttempt();if(!saved)return false;state=saved;prefs={...state.preferences};state.paused=true;active=true;S.running=false;replan=0;pointerId=null;syncUI();return true;}
  function leave(){persist();active=false;S.running=false;pointerId=null;syncUI();}
  function replay(){return start(state?state.origin:'practice',state?{pursuer:state.pursuer}:{});}
  function setPaused(value){if(!active||!state)return;state.paused=!!value;pointerId=null;persist();syncUI();}
  function setPreferences(changes){
    const changed={};for(const k of Object.keys(defaults))if(typeof changes?.[k]==='boolean'&&prefs[k]!==changes[k]){changed[k]={from:prefs[k],to:changes[k]};prefs[k]=changes[k];}
    if(active&&state){state.preferences={...prefs};if(Object.keys(changed).length)state.settingChanges.push({time:state.elapsed,changed});persist();}
    try{localStorage.setItem(PREF_KEY,JSON.stringify(prefs));}catch(error){}syncUI();return preferences();
  }
  function notesFor(attempt,feedback={},recordedAs=null){
    return JSON.stringify({game:'Twenty Nights — Combined Nether trial',version:3,build:BUILD,
      question:'Did opening the deeper wall make the chase exciting, or did it feel unfair?',
      trialDefaults:{layers:2,monsters:2,cores:2,lives:3,tool:'reusable tiers',heroSpeed:HERO_SPEED,mineSeconds:MINE_TIME,goofy:{speed:4.85,noticeSeconds:1,wrongTurnChance:.30},runner:{stalk:3.7,warningSeconds:.7,burst:8.2,burstSeconds:1.1,recovery:2.4,recoverySeconds:1.3}},
      comparison:'Same authored map, goals and roster. Chase package changes; this is not a pure speed comparison.',
      attempt:attempt?{id:attempt.attemptId,startedAt:attempt.startedAt,layout:attempt.layout,pursuer:attempt.pursuer,status:attempt.status,
        recordedAs:recordedAs||(attempt.status==='won'?'escaped-on-foot':attempt.status==='lost'?'three-lives-used':'in-progress'),
        lives:attempt.lives,upgrade:attempt.upgrade,cores:attempt.cores,breaches:attempt.breaches,losses:attempt.losses,events:attempt.events,
        openings:attempt.map.flatMap((tile,i)=>tile==='.'&&MATERIALS[scene.map[i]]?[{x:i%20,y:Math.floor(i/20),tier:MATERIALS[scene.map[i]].tier}]:[]),
        elapsed:Math.round(attempt.elapsed),initialPreferences:attempt.initialPreferences,preferences:attempt.preferences,settingChanges:attempt.settingChanges}:null,feedback},null,2);
  }
  function exportNotes(feedback={}){return notesFor(state,feedback);}
  function exportSavedNotes(feedback={}){
    const saved=savedAttempt();
    return saved?notesFor(saved,feedback,saved.status==='playing'?'stopped-for-comparison':null):null;
  }
  function start(origin='practice',selection={}){
    const pursuer=PURSUERS.some(p=>p.id===selection.pursuer)?selection.pursuer:'goofy';
    state={version:3,build:BUILD,attemptId:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9),startedAt:new Date().toISOString(),origin,status:'playing',layout:scene.id,pursuer,lives:3,upgrade:0,map:scene.map.slice(),preferences:{...prefs},initialPreferences:{...prefs},settingChanges:[],events:[],rng:20261022,
      hero:{...START,path:[]},enemies:scene.enemies.map(e=>({...e,path:[],released:false,wake:0,phase:'stalk',phaseTime:2.4,notice:0,wrongTurn:false})),
      cores:scene.cores.map(c=>({...c,collected:false})),breaches:0,losses:[],mining:null,target:null,paused:false,recovery:0,awaitingReturn:false,elapsed:0,returns:0,
      message:'Find pickaxe 1 in the outer loop. Choose your own opening through the copper wall.'};
    active=true;S.running=false;replan=0;saveClock=0;pointerId=null;persist();syncUI();return view();
  }
  function enterFromWoods(){const day=S.day;S.day=20;save();S.day=day;store.set('tn.woods-complete',store.get('tn.save'));return start('woods');}
  const hasSaved=()=>!!savedAttempt();
  /* NETHER_UI */
  /* NETHER_DRAW */
  /* NETHER_INPUT */
  return {start,enterFromWoods,view,aim,step,persist,resume,leave,replay,setPaused,draw,pointer,key,bindUI,isActive:()=>active,options,preferences,setPreferences,resumeRecovery,exportNotes,exportSavedNotes,prepareWoods};
})();
