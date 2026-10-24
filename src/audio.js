/* A D-minor descent: a steady tablet-speaker beat acquires shadows and
   syncopation as the hero physically enters each physical maze layer. */
  const netherScore={context:null,master:null,noise:null,voices:new Set(),playing:false,next:0,step:0,bpm:80};
  function netherMusicStage(){
    const h=state?.hero;
    const depth=h?(scene.depth?.[idx(Math.round(h.x),Math.round(h.y))]??scene.layers.filter(l=>h.x>l.x1&&h.x<l.x2&&h.y>l.y1&&h.y<l.y2).length):0;
    const escape=!!state?.hammer?.collected;
    return {depth,bpm:80+depth*12+(escape?8:0),escape};
  }
  function musicState(){return {...netherMusicStage(),playing:netherScore.playing};}
  function stopNetherMusic(){
    if(netherScore.master){
      const t=netherScore.context.currentTime;
      netherScore.master.gain.cancelScheduledValues(t);
      netherScore.master.gain.setValueAtTime(0,t);
    }
    for(const voice of netherScore.voices){
      try{voice.source.stop();}catch(error){}
      for(const node of voice.nodes)try{node.disconnect();}catch(error){}
    }
    netherScore.voices.clear();netherScore.playing=false;netherScore.next=0;netherScore.step=0;
  }
  function netherVoice(source,nodes,when,duration){
    const voice={source,nodes:[source,...nodes]};
    netherScore.voices.add(voice);
    source.onended=()=>{
      netherScore.voices.delete(voice);
      for(const node of voice.nodes)try{node.disconnect();}catch(error){}
    };
    source.start(when);source.stop(when+duration+.015);
  }
  function netherTone(when,freq,duration,type,volume,to=null){
    const o=AC.createOscillator(),g=AC.createGain();
    o.type=type;o.frequency.setValueAtTime(freq,when);
    if(to)o.frequency.exponentialRampToValueAtTime(to,when+duration);
    g.gain.setValueAtTime(.0001,when);
    g.gain.exponentialRampToValueAtTime(volume,when+Math.min(.018,duration*.2));
    g.gain.exponentialRampToValueAtTime(.0001,when+duration);
    o.connect(g);g.connect(netherScore.master);netherVoice(o,[g],when,duration);
  }
  function netherDrum(when,duration,frequency,volume){
    const source=AC.createBufferSource(),filter=AC.createBiquadFilter(),g=AC.createGain();
    source.buffer=netherScore.noise;filter.type='highpass';filter.frequency.value=frequency;
    g.gain.setValueAtTime(.0001,when);g.gain.exponentialRampToValueAtTime(volume,when+.004);
    g.gain.exponentialRampToValueAtTime(.0001,when+duration);
    source.connect(filter);filter.connect(g);g.connect(netherScore.master);
    netherVoice(source,[filter,g],when,duration);
  }
  function netherBeat(when,step,stage){
    const beat=step%8,bar=Math.floor(step/8)%4,d=stage.depth,root=146.832;
    // Kick and snare keep the beat recognisable even on a small iPad speaker.
    if(beat===0||beat===4||(d>=3&&beat===7)){
      netherTone(when,135,.18,'sine',.34,45);
      netherTone(when,230,.09,'triangle',.10,90);
    }
    if(beat===2||beat===6){
      netherDrum(when,.10,850,.12);netherTone(when,190,.07,'triangle',.065,125);
    }
    if((beat%2===1&&d>=1)||d>=3)netherDrum(when,.035,5500,.023+(beat%2)*.012);
    if(beat===0||beat===4){
      const bass=root/2*(bar===3?Math.pow(2,7/12):1);
      netherTone(when,bass,.24,'triangle',.11);netherTone(when,bass*2,.18,'sine',.045);
    }
    // A restrained minor motif grows denser; the same theme survives each layer.
    const motif=[0,7,3,10,0,7,1,3];
    if(beat===1||beat===5||(d>=2&&beat%2===1)){
      const semitone=motif[(step+bar)%motif.length];
      netherTone(when,root*Math.pow(2,semitone/12),.36,'sine',.07);
      if(d>=2)netherTone(when,root*2*Math.pow(2,semitone/12),.16,'triangle',.022);
    }
    if(beat===0){
      netherTone(when,root,.9,'sine',.045);
      netherTone(when,root*Math.pow(2,3/12),.9,'sine',.025);
      if(d>=3)netherTone(when,root*Math.pow(2,(bar%2?6:1)/12),.7,'sine',.018);
    }
    if(stage.escape&&beat===7)netherTone(when,root*4,.12,'triangle',.025,root*3);
  }
  function updateNetherMusic(dt){
    const stage=netherMusicStage();
    const volume=typeof musVol==='function'?Math.max(0,Math.min(1,musVol())):1;
    const allowed=active&&state?.status==='playing'&&!state.paused&&!state.awaitingReturn
      &&!document.hidden&&!muted&&prefs.music!==false&&volume>0&&AC&&AC.state==='running';
    if(!allowed){if(netherScore.playing||netherScore.voices.size)stopNetherMusic();return;}
    try{
      if(netherScore.context!==AC){
        stopNetherMusic();netherScore.context=AC;
        netherScore.master=AC.createGain();netherScore.master.gain.value=0;
        netherScore.master.connect(AC.destination);
        netherScore.noise=AC.createBuffer(1,Math.ceil(AC.sampleRate*.2),AC.sampleRate);
        const samples=netherScore.noise.getChannelData(0);
        // Separate deterministic noise must not consume the gameplay RNG.
        let seed=7391;for(let i=0;i<samples.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;samples[i]=seed/2147483648-1;}
      }
      const now=AC.currentTime;
      if(!netherScore.playing){netherScore.next=now+.025;netherScore.step=0;netherScore.bpm=stage.bpm;netherScore.playing=true;}
      netherScore.bpm+=(stage.bpm-netherScore.bpm)*Math.min(1,Math.max(0,Number.isFinite(dt)?dt:0)*2);
      netherScore.master.gain.setTargetAtTime(.24*volume,now,.08);
      // A resumed/backgrounded frame starts from now; never replay a backlog.
      if(netherScore.next<now-.10)netherScore.next=now+.025;
      let count=0;
      while(netherScore.next<now+.10&&count++<4){
        netherBeat(netherScore.next,netherScore.step,stage);
        netherScore.next+=30/netherScore.bpm;netherScore.step=(netherScore.step+1)%32;
      }
    }catch(error){stopNetherMusic();}
  }
