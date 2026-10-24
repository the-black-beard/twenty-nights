  let settingsOpen=false,settingsWasPaused=false,focusBack=null,lastModal=null;
  let comparisonPair='controls',comparisonSide='a',selectedHistoryId=null,historySignature='',feedbackDirty=false,savedFeedbackDirty=false;
  const PAIR_UI={
    controls:{question:'Which movement feels best during a chase?',impact:'Changes: steering and turn timing',try:'Try a sharp turn when a monster is close. Then try the other version.',a:'Tap route',b:'Buffered swipe',ad:'Tap a destination. Drag and release to choose another.',bd:'Swipe to keep moving. Queue your next turn early; tap the floor to stop.'},
    brains:{question:'Can you trick a fast monster without slowing it down?',impact:'Changes: how well a rush can follow you',try:'Wait for a rush, then turn a corner. The top speed is exactly the same.',a:'Follows your turns',b:'Commits to its rush',ad:'A fast monster keeps correcting its route during the burst.',bd:'It picks a route, commits, and can rush past your turn. Same silly face. Same speed.'},
    walls:{question:'Do quicker cracks make a better escape?',impact:'Changes: escape choices while mining',try:'Try opening a hole while chased. Any matching wall can still be broken.',a:'Make holes anywhere',b:'Quicker cracked spots',ad:'Every matching wall takes the same time to mine. Choose any way through.',bd:'Cracked wall spots open faster. Other matching walls still break normally.'},
    layers:{question:'How much fast-monster chaos feels right?',impact:'Changes: how many layers release rushers',try:'Reach the hammer, then try to carry it out. Which return chase feels fair?',a:'One fast layer',b:'Two fast layers',ad:'Only the crystal layer has fast monsters. The others have goofy regulars.',bd:'Crystal and iron have fast monsters. Copper and obsidian have goofy regulars.'},
    cues:{question:'Can a little warning help without spoiling the surprise?',impact:'Changes: nearby danger visibility',try:'Notice a close monster around a corner. Do the hints help you choose an escape?',a:'Trust your eyes',b:'Subtle danger hints',ad:'Watch the monsters and their faces. No extra danger arrows.',bd:'Small hints point toward nearby danger. Faraway monsters stay a surprise.'}
  };
  function comparisonArt(pair,side){
    const b=side==='b',wall='<path d="M12 21H92V43H124V65H148 M12 65H68V43H42" stroke="#55757b" stroke-width="10"/>',hero='<circle cx="24" cy="43" r="8" fill="#8de0ce"/><path d="M21 39l5 3-5 3" stroke="#16353a" stroke-width="2"/>';
    const ghost='<path d="M110 31q0-11 10-11t10 11v18l-5-4-5 4-5-4-5 4z" fill="#f3ac75"/><circle cx="116" cy="30" r="3" fill="#fff6de"/><circle cx="125" cy="30" r="3" fill="#fff6de"/><circle cx="117" cy="31" r="1.3" fill="#24383f"/><circle cx="124" cy="29" r="1.3" fill="#24383f"/>';
    let drawing;
    if(pair==='controls')drawing=wall+hero+'<path d="M36 43H54V19H110" fill="none" stroke="#8de0ce" stroke-width="3" stroke-dasharray="3 5"/>'+(b?'<path d="M70 56h25m-8-7 8 7-8 7" stroke="#f3ac75" stroke-width="4"/>':'<circle cx="116" cy="19" r="9" fill="none" stroke="#f3ac75" stroke-width="2"/><circle cx="116" cy="19" r="3" fill="#f3ac75"/>');
    if(pair==='brains')drawing=wall+hero+ghost+'<path d="'+(b?'M111 54H85':'M111 54H80V19H42')+'" fill="none" stroke="#f3ac75" stroke-width="3" stroke-dasharray="5 4"/>'+(b?'<path d="m130 15 7-7m-2 17h11" stroke="#f3ac75" stroke-width="2"/>':'');
    if(pair==='walls')drawing='<path d="M14 21h132v44H14z" fill="#885b45" stroke="#dc986f" stroke-width="2"/><path d="M14 43h132M42 21v22m51-22v22M68 43v22m52-22v22" stroke="#dc986f" stroke-width="2"/>'+(b?'<path d="m87 20-8 13 9 8-13 9 5 15" fill="none" stroke="#ffe5a1" stroke-width="4"/>':'<path d="M66 22h28v42H66z" fill="#172d33"/>')+'<path d="m32 68 22-30m-13 0q12-12 25-2" stroke="#b1e1d1" stroke-width="5" fill="none"/>';
    if(pair==='layers')drawing=[0,1,2,3].map((i)=>'<rect x="'+(12+i*14)+'" y="'+(5+i*8)+'" width="'+(136-i*28)+'" height="'+(76-i*16)+'" rx="4" fill="none" stroke="'+(['#dc986f','#bd90e8','#8cc9e5','#f0928e'][i])+'" stroke-width="3"/>').join('')+'<path d="m39 14-6 10h8l-6 10" fill="none" stroke="#ffe5a1" stroke-width="3"/>'+(b?'<path d="m54 27-6 10h8l-6 10" fill="none" stroke="#ffe5a1" stroke-width="3"/>':'');
    if(pair==='cues')drawing=wall+hero+ghost+(b?'<path d="m53 34 8 9-8 9m12-16 6 7-6 7" fill="none" stroke="#f3ac75" stroke-width="3"/>':'<path d="M58 43h22" stroke="#55757b" stroke-width="2" stroke-dasharray="2 5"/>');
    return '<svg viewBox="0 0 160 86" xmlns="http://www.w3.org/2000/svg" fill="none" stroke-linecap="round" stroke-linejoin="round">'+drawing+'</svg>';
  }
  function renderComparison(){
    const meta=PAIR_UI[comparisonPair];
    for(const pair of Object.keys(PAIR_UI))$('nPair'+pair[0].toUpperCase()+pair.slice(1)).setAttribute('aria-pressed',String(pair===comparisonPair));
    for(const side of ['a','b']){const upper=side.toUpperCase(),preset=options().presets?.find(p=>p.id===comparisonPair+'-'+side);
      put('nVariant'+upper+'Label',preset?.label||meta[side]);put('nVariant'+upper+'Description',meta[side+'d']);
      $('nVariant'+upper+'Art').innerHTML=comparisonArt(comparisonPair,side);
      $('nVariant'+upper).setAttribute('aria-pressed',String(side===comparisonSide));
      put('nVariant'+upper+'Tag',side==='b'&&['brains','cues'].includes(comparisonPair)?'Recommended to try':side==='a'?'Compare A':'Compare B');
    }
    put('nPairQuestion',meta.question);put('nPairImpact',meta.impact);put('nPairTry',meta.try);
    put('nStart','Play '+comparisonSide.toUpperCase()+' · '+(options().presets?.find(p=>p.id===comparisonPair+'-'+comparisonSide)?.label||meta[comparisonSide])+' ↗');
  }
  function saveFeedbackDraft(){
    if(active&&state&&feedbackDirty){recordFeedback({feeling:selected('nFeeling',''),note:$('nFeedbackNote').value});feedbackDirty=false;}
    if(!active&&selectedHistoryId&&savedFeedbackDirty){recordFeedback({note:$('nSavedMoment').value},selectedHistoryId);savedFeedbackDirty=false;}
  }
  function loadFeedbackDraft(){
    const feedback=state?.feedback||{};
    for(const [id,value] of [['nFeelFun','fun'],['nFeelTense','tense'],['nFeelUnfair','unfair']])$(id).checked=feedback.feeling===value;
    $('nFeedbackNote').value=feedback.note||'';feedbackDirty=false;
  }
  function syncHistory(){
    const runs=history(),signature=JSON.stringify(runs);
    if(!runs.some(run=>run.id===selectedHistoryId))selectedHistoryId=runs[0]?.id||null;
    if(signature!==historySignature){historySignature=signature;const select=$('nHistory');select.innerHTML='';
      for(const run of runs){const option=document.createElement('option');option.value=run.id;option.textContent=run.label+' · '+(run.status==='playing'?'In progress':run.status==='won'?'Escaped':'Caught')+' · '+Math.round(run.elapsed)+'s';select.appendChild(option);}
    }
    $('nHistory').value=selectedHistoryId||'';
    const saved=runs.find(run=>run.id===selectedHistoryId);
    $('nContinuePanel').classList.toggle('hidden',!saved);$('nResume').classList.toggle('hidden',!saved);
    if(saved){put('nSavedSummary',saved.label+' · '+saved.lives+' lives left · '+saved.cores+'/4 cores'+(saved.hammer?' · Hammer collected':''));put('nResume',saved.status==='playing'?'Continue adventure':'Review adventure');if(!savedFeedbackDirty&&document.activeElement!==$('nSavedMoment'))$('nSavedMoment').value=saved.feedback?.note||'';}
  }
  const put=(id,value)=>{if($(id).textContent!==value)$(id).textContent=value;};
  function topModal(){return settingsOpen?'nSettings':active&&state.awaitingReturn?'nReturn':active&&state.status!=='playing'?'nEnd':null;}
  function syncFocus(){
    const current=topModal();
    const setup=!active&&!$('title').classList.contains('hidden');
    for(const id of ['nHud','nHelp','stage','title','nSettings','nReturn','nEnd'])$(id).inert=!!current&&id!==current;
    for(const id of ['top','bottom','actionRow','stage'])$(id).inert=!!current||setup;
    if(current!==lastModal){
      lastModal=current;
      const target={nSettings:'nSettingsClose',nReturn:'nReturnContinue',nEnd:state?.status==='won'?'nReturnWoods':'nReplay'}[current];
      if(target)$(target).focus?.();
    }
  }
  function prepareWoods(){
    if(active)leave();
    $('title').classList.add('hidden');
    for(const id of ['top','bottom','actionRow','stage'])$(id).inert=false;
  }
  function syncUI(){
    document.body.classList.toggle('nether-active',active);
    document.body.classList.toggle('nHighContrast',prefs.highContrast);
    document.body.classList.toggle('nReducedMotion',prefs.reducedMotion);
    $('nHud').classList.toggle('hidden',!active);$('nHelp').classList.toggle('hidden',!active);
    $('nSettings').classList.toggle('hidden',!settingsOpen);
    $('nReturn').classList.toggle('hidden',!active||!state.awaitingReturn);
    $('nEnd').classList.toggle('hidden',!active||state.status==='playing');
    $('nMenu').classList.toggle('hidden',!active);
    put('nSound',muted?'Sound off':'Sound on');$('nSound').setAttribute('aria-pressed',String(!muted));
    for(const [id,key] of [['nDodge','dodge'],['nRoute','showRoute'],['nContrast','highContrast'],['nReducedMotion','reducedMotion']])$(id).checked=prefs[key];
    $('nCameraWhole').checked=!prefs.closeView;$('nCameraClose').checked=prefs.closeView;
    put('nSettingsStatus',active?'The chase is paused while this is open.':'Choose the controls and display you like. Every challenge keeps three lives.');
    if(!active){
      $('title').classList.remove('hidden');syncHistory();
      put('nTitleNote',storageOK?'Every new try starts fresh. Earlier adventures stay saved on this browser.':'Saving is unavailable here. Download your notes before closing this tab.');
      syncFocus();return;
    }
    $('title').classList.add('hidden');$('intro').classList.add('hidden');$('win').classList.add('hidden');$('opts').classList.add('hidden');
    const lit=state.cores.filter(b=>b.collected).length,e=state.enemies.find(e=>e.released&&e.phase==='burst')||state.enemies.find(e=>e.released&&e.phase==='windup')||state.enemies.find(e=>e.released)||state.enemies[0];
    put('nMode',(state.trial?.label||options().presets?.find(p=>p.id===state.trial?.preset)?.label||'Your mix')+' · '+PURSUERS.find(p=>p.id===state.pursuer).name+(state.origin==='woods'?' · After Night 20':''));
    put('nLives','♥'.repeat(state.lives)+'♡'.repeat(3-state.lives)+'  '+state.lives+'/3');$('nLives').setAttribute('aria-label',state.lives+' of 3 lives');
    const toolName=['','Copper','Crystal','Iron','Obsidian'][state.upgrade];
    put('nTool',toolName?toolName+' pickaxe':'Pickaxe needed');$('nTool').dataset.material=toolName.toLowerCase();
    put('nBeacons',lit===4&&state.hammer.collected?'4/4 · Portal ready':lit+'/4 cores');
    const h=state.hammer,face=h.faceY<0?'↑':h.faceY>0?'↓':h.faceX<0?'←':'→';
    const faceName=h.faceY<0?'up':h.faceY>0?'down':h.faceX<0?'left':'right';
    $('nHammer').disabled=!h.collected||h.cooldown>0||state.paused||state.awaitingReturn||state.status!=='playing';
    put('nHammer',h.cooldown>0?'Ready in '+h.cooldown.toFixed(1)+'s':'Swing '+face);
    $('nHammer').setAttribute('aria-label','Swing hammer '+faceName+(h.cooldown>0?', recharging':''));
    $('nHammer').dataset.ready=String(h.collected&&h.cooldown<=0);
    put('nHammerState',!h.collected?'Storm Hammer awaits at the centre':h.charged?'Lightning awakened!':'Storm Hammer · lightning asleep');
    put('nHammerHint',h.collected?'Facing '+faceName+' '+face+' · one monster per swing · lightning wakes at the portal.':'Claim it at the centre. Carry it out to awaken its lightning.');
    const refuge=state.refuge;
    put('nRefuge',refuge.inside&&refuge.remaining>0&&refuge.cooldown<=0?'Shield '+Math.ceil(refuge.remaining)+'s':refuge.inside&&refuge.remaining<=0?'Shield spent · leave refuge':refuge.cooldown>0?'Refuge recharge '+Math.ceil(refuge.cooldown)+'s':'Refuge ready · 8s');
    $('nRefuge').dataset.state=refuge.inside&&refuge.remaining>0&&refuge.cooldown<=0?'protected':refuge.inside&&refuge.remaining<=0?'spent':refuge.cooldown>0?'recharging':'ready';
    const released=state.enemies.filter(e=>e.released).length;
    const threat=!e.released?'All contained':e.wake>0?'Waking up':e.phase==='windup'?'Winding up!':e.phase==='burst'?'Rushing!':e.phase==='rest'?'Catching breath':'Hunting';
    put('nThreat',released+'/10 awake · '+(released&&state.elapsed%16>=12?'Patrolling · make an opening':state.pursuer==='goofy'&&released?'Goofy chase':threat));$('nThreat').dataset.state=!e.released?'contained':e.phase==='windup'?'warning':'hunting';
    const stages=[state.upgrade>=1,state.upgrade===4,lit===4&&state.hammer.collected,state.status==='won'];let first=true;
    ['nObjectiveTool','nObjectiveBreach','nObjectiveBeacons','nObjectiveExit'].forEach((id,i)=>{
      $(id).dataset.state=stages[i]?'done':first?'current':'waiting';if(!stages[i])first=false;
    });
    put('nMessage',state.paused&&!settingsOpen?'Paused. Resume when you are ready.':state.message);
    put('nPause',state.paused?'Resume':'Pause');put('nCameraToggle',prefs.closeView?'Map':'Close view');
    $('nCameraToggle').setAttribute('aria-pressed',String(prefs.closeView));
    $('nCameraToggle').setAttribute('aria-label',prefs.closeView?'Show the whole maze':'Return to close view');
    put('nControlHint',(state.trial?.control==='swipe'?'Swipe to turn · tap floor to stop':'Tap or drag to move')+' · tap matching wall to mine · two fingers: look / pinch: zoom');
    put('nStorage',storageOK?'Autosaved on this browser.':'Saving unavailable — keep this tab open.');$('nStorage').dataset.state=storageOK?'ok':'error';
    if(state.awaitingReturn){
      put('nReturnTitle',state.lastLoss==='void'?'A fall. Another chance.':'Caught. Still in the game.');
      put('nReturnLine',state.lastLoss==='void'?'Purple cracks mark the void. Your next route can go around it.':'Watch where the monsters wait. You have eight seconds of refuge protection after you continue.');
      put('nReturnLives','♥'.repeat(state.lives)+'♡'.repeat(3-state.lives)+' · '+state.lives+' lives left');
      put('nReturnKept',(toolName?toolName+' pickaxe':'Pickaxe still to find')+' · '+state.breaches+' openings · '+lit+'/4 cores'+(state.hammer.collected?' · Storm Hammer':''));
    }
    if(state.status!=='playing'){
      $('nEnd').dataset.outcome=state.status;
      $('nReturnWoods').classList.toggle('hidden',state.status!=='won');
      put('nEndTitle',state.status==='won'?'The storm is yours.':'Three lives. One more idea?');
      put('nEndLine',state.status==='won'?'You carried the hammer and four cores to the portal. Lightning has awakened. Take it into the woods!' :scene.hint);
      put('nEndStats',(state.trial?.label||'Your mix')+' · '+PURSUERS.find(p=>p.id===state.pursuer).name+' · '+state.lives+' lives left · '+state.breaches+' openings · '+Math.round(state.elapsed)+'s played');
    }
    syncFocus();
  }
  function chooseCamera(closeView){setPreferences({closeView,...(closeView&&prefs.zoom<=1.01?{zoom:2.2}:{})});}
  function openSettings(){focusBack=document.activeElement;settingsWasPaused=!!state?.paused;settingsOpen=true;if(active)setPaused(true);syncUI();}
  function closeSettings(){settingsOpen=false;if(active&&!state.awaitingReturn)setPaused(settingsWasPaused);syncUI();focusBack?.focus?.();}
  function selected(name,fallback){return document.querySelector('input[name="'+name+'"]:checked')?.value||fallback;}
  function resetFeedback(){for(const id of ['nFeelFun','nFeelTense','nFeelUnfair'])$(id).checked=false;$('nFeedbackNote').value='';$('nSavedMoment').value='';feedbackDirty=false;savedFeedbackDirty=false;put('nFeedbackStatus','Saved here. Nothing is sent.');put('nSavedExportStatus','Notes stay on this browser. Nothing is sent.');}
  function downloadNotes(json,attempt,statusId){
    const a=document.createElement('a'),url=URL.createObjectURL(new Blob([json],{type:'application/json'}));
    a.href=url;a.download=attempt?'nether-'+(attempt.pursuer||'comparison')+'-'+(attempt.attemptId||attempt.id)+'-notes.json':'nether-comparisons-notes.json';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);put(statusId,'Notes downloaded. Nothing was sent.');
  }
  function renderPreviews(){
    const canvas=$('nPreview-rectangular-descent-v1'),c=canvas.getContext('2d');if(!c)return;
    const s=layout(),scale=3,ox=(160-s.width*scale)/2,oy=(124-s.height*scale)/2;c.clearRect(0,0,160,124);
    for(let i=0;i<s.map.length;i++){c.fillStyle={'#':'#64747c',b:'#dc986f',c:'#bd90e8',d:'#8cc9e5',e:'#f0928e',v:'#b291dd','.':'#172d33'}[s.map[i]];c.fillRect(ox+(i%s.width)*scale,oy+Math.floor(i/s.width)*scale,scale,scale);}
    for(const [p,color] of [[s.start,'#2c7be5'],[s.goal,'#7eefac'],...s.upgrades.map(p=>[p,['','#dc986f','#bd90e8','#8cc9e5','#f0928e'][p.tier]]),...s.cores.map(p=>[p,'#cafff3']),...s.enemies.map(p=>[p,'#ffb949'])]){c.fillStyle=color;c.fillRect(ox+p.x*scale,oy+p.y*scale,3,3);}
  }
  function bindUI(){
    function launch(selection){saveFeedbackDraft();audioInit();closeIntro();resetFeedback();start('practice',selection);cv.focus?.();}
    $('nStart').addEventListener('click',()=>launch({preset:comparisonPair+'-'+comparisonSide}));
    for(const pair of Object.keys(PAIR_UI))$('nPair'+pair[0].toUpperCase()+pair.slice(1)).addEventListener('click',()=>{comparisonPair=pair;comparisonSide='a';renderComparison();});
    for(const side of ['a','b'])$('nVariant'+side.toUpperCase()).addEventListener('click',()=>{comparisonSide=side;renderComparison();});
    $('nCustomStart').addEventListener('click',()=>launch({control:$('nCustomControl').value,brain:$('nCustomBrain').value,pursuer:$('nCustomLayers').value,weakSpots:$('nCustomWalls').value==='weak',cues:$('nCustomCues').value==='on'}));
    $('nHistory').addEventListener('change',()=>{saveFeedbackDraft();selectedHistoryId=$('nHistory').value;syncHistory();});
    $('nSavedMoment').addEventListener('input',()=>{savedFeedbackDirty=true;saveFeedbackDraft();put('nSavedExportStatus',storageOK?'Note saved here. Nothing is sent.':'Saving unavailable. Download your notes.');});
    $('nFeedbackNote').addEventListener('input',()=>{feedbackDirty=true;saveFeedbackDraft();put('nFeedbackStatus',storageOK?'Note saved here. Nothing is sent.':'Saving unavailable. Download your notes.');});
    for(const id of ['nFeelFun','nFeelTense','nFeelUnfair'])$(id).addEventListener('change',()=>{feedbackDirty=true;saveFeedbackDraft();});
    $('nResume').addEventListener('click',()=>{saveFeedbackDraft();audioInit();closeIntro();if(resume(selectedHistoryId)){loadFeedbackDraft();cv.focus?.();}else put('nTitleNote','The saved adventure could not be loaded. Choose a fresh challenge.');});
    $('nHammer').addEventListener('click',()=>{audioInit();swingHammer();cv.focus?.();});
    $('nReturnWoods').addEventListener('click',()=>{audioInit();returnToWoods();});
    $('nPause').addEventListener('click',()=>setPaused(!state.paused));
    for(const id of ['nSettingsOpen','nSetupSettings'])$(id).addEventListener('click',openSettings);
    for(const id of ['nSettingsClose','nSettingsDone'])$(id).addEventListener('click',closeSettings);
    for(const id of ['nMenu','nEndMenu'])$(id).addEventListener('click',()=>{saveFeedbackDraft();selectedHistoryId=state?.attemptId||selectedHistoryId;settingsOpen=false;leave();$('nStart').focus?.();});
    $('nReplay').addEventListener('click',()=>{saveFeedbackDraft();resetFeedback();replay();cv.focus?.();});
    $('nReturnContinue').addEventListener('click',()=>{resumeRecovery();cv.focus?.();});
    $('nCameraToggle').addEventListener('click',()=>chooseCamera(!prefs.closeView));
    $('nSound').addEventListener('click',()=>{muted=!muted;store.set('tn.mute',muted?'1':'0');audioInit();syncUI();});
    for(const [id,key] of [['nDodge','dodge'],['nRoute','showRoute'],['nContrast','highContrast'],['nReducedMotion','reducedMotion']])$(id).addEventListener('change',()=>setPreferences({[key]:$(id).checked}));
    for(const id of ['nCameraWhole','nCameraClose'])$(id).addEventListener('change',()=>chooseCamera($('nCameraClose').checked));
    $('nFeedback').addEventListener('submit',event=>event.preventDefault());
    $('nSavedDownloadNotes').addEventListener('click',()=>{
      saveFeedbackDraft();const saved=history().find(run=>run.id===selectedHistoryId),json=exportSavedNotes({},selectedHistoryId);
      if(!saved||!json){put('nSavedExportStatus','The saved adventure could not be read. Its data was left untouched.');return;}
      downloadNotes(json,saved,'nSavedExportStatus');
    });
    $('nHistoryDownload').addEventListener('click',()=>{saveFeedbackDraft();downloadNotes(exportHistory(),null,'nSavedExportStatus');});
    $('nDownloadNotes').addEventListener('click',()=>{
      saveFeedbackDraft();const json=exportNotes({feeling:selected('nFeeling',''),note:$('nFeedbackNote').value});
      downloadNotes(json,state,'nFeedbackStatus');
    });
    window.addEventListener('blur',()=>{if(active)setPaused(true);});
    document.addEventListener('visibilitychange',()=>{if(active&&document.hidden)setPaused(true);});
    window.addEventListener('pagehide',()=>{saveFeedbackDraft();if(active)persist();});
    document.addEventListener('keydown',event=>{if(settingsOpen&&!active)key(event);});
    cv.setAttribute('tabindex','0');renderPreviews();renderComparison();syncUI();
  }
