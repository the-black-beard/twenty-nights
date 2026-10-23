'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
// WebAudio is an external browser boundary. The score's public operations run
// against a small audio device double; no DOM, timer or real sound is needed.
function score(){
  const state={hero:{x:1,y:1},upgrade:4,status:'playing',paused:false,awaitingReturn:false,hammer:{collected:false}};
  const scene={layers:[{x1:4,y1:4,x2:40,y2:32},{x1:8,y1:8,x2:36,y2:28},{x1:12,y1:12,x2:32,y2:24},{x1:16,y1:16,x2:28,y2:20}]};
  const host={AC:null,muted:false,document:{hidden:false},active:true,prefs:{},volume:1};
  host.musVol=()=>host.volume;
  const api=new Function('host','state','scene',`with(host){${fs.readFileSync(path.join(__dirname,'../src/audio.js'),'utf8')}\nreturn {updateNetherMusic,stopNetherMusic,musicState};}`)(host,state,scene);
  return {api,host,state};
}
test('the score follows physical descent, not retained upgrades, without unlocking audio',()=>{
  const {api,host,state}=score();
  api.updateNetherMusic(.05);
  assert.equal(host.AC,null);assert.equal(api.musicState().playing,false);
  const outside=api.musicState();assert.equal(outside.depth,0);
  state.hero={x:5,y:5};api.updateNetherMusic(.05);const first=api.musicState();
  state.hero={x:13,y:13};api.updateNetherMusic(.05);const middle=api.musicState();
  state.hero={x:23,y:19};api.updateNetherMusic(.05);const centre=api.musicState();
  assert.deepEqual([first.depth,middle.depth,centre.depth],[1,3,4]);
  assert.ok(outside.bpm<first.bpm&&first.bpm<middle.bpm&&middle.bpm<centre.bpm);
  state.hero={x:1,y:1};api.updateNetherMusic(.05);assert.equal(api.musicState().depth,0);
});
function audioDevice(){
  const device={currentTime:0,sampleRate:8000,state:'running',destination:{},started:[],live:new Set(),gains:[]};
  const param=()=>({value:0,setValueAtTime(v){this.value=v;},exponentialRampToValueAtTime(v){this.value=v;},setTargetAtTime(v){this.value=v;},cancelScheduledValues(){}});
  const node=()=>({connect(){},disconnect(){}});
  const source=kind=>({...node(),kind,frequency:param(),start(at){this.at=at;device.started.push(this);device.live.add(this);},stop(at){this.end=at??device.currentTime;if(this.end<=device.currentTime){device.live.delete(this);this.onended?.();}}});
  device.createGain=()=>{const n={...node(),gain:param()};device.gains.push(n);return n;};
  device.createOscillator=()=>source('oscillator');device.createBufferSource=()=>source('noise');
  device.createBiquadFilter=()=>({...node(),frequency:param()});
  device.createBuffer=(_,length)=>({getChannelData:()=>new Float32Array(length)});
  device.advance=t=>{device.currentTime=t;for(const n of [...device.live])if(n.end<=t){device.live.delete(n);n.onended?.();}};
  return device;
}
test('a gesture-unlocked score is silent and clears its voices on pause, mute, return, end or hiding',()=>{
  for(const stop of [
    ({state})=>state.paused=true,({host})=>host.muted=true,({state})=>state.awaitingReturn=true,
    ({state})=>state.status='won',({state})=>state.status='lost',({host})=>host.document.hidden=true,
    ({host})=>host.active=false,({host})=>host.prefs.music=false,({host})=>host.volume=0,
    ({host})=>host.AC.state='suspended'
  ]){
    const fixture=score(),device=audioDevice();fixture.host.AC=device;
    fixture.api.updateNetherMusic(.05);
    assert.equal(fixture.api.musicState().playing,true);assert.ok(device.live.size>0);
    assert.ok(device.gains[0].gain.value>0&&device.gains[0].gain.value<=.24);
    stop(fixture);fixture.api.updateNetherMusic(.05);
    assert.equal(fixture.api.musicState().playing,false);assert.equal(device.live.size,0);
    assert.equal(device.gains[0].gain.value,0);
  }
});
test('resuming after a long frame never queues old beats and leaving cancels future notes',()=>{
  const {api,host,state}=score(),device=audioDevice();host.AC=device;
  api.updateNetherMusic(.05);device.advance(600);const before=device.started.length;
  state.hero={x:23,y:19};state.hammer.collected=true;api.updateNetherMusic(.05);
  const fresh=device.started.slice(before);
  assert.ok(fresh.length>0&&fresh.length<12);assert.ok(fresh.every(n=>n.at>=600&&n.at<=600.1));
  assert.equal(api.musicState().escape,true);assert.equal(api.musicState().bpm,136);
  api.stopNetherMusic();assert.equal(device.live.size,0);assert.equal(api.musicState().playing,false);
});
test('regular playback releases finished nodes instead of accumulating an adventure of audio',()=>{
  const {api,host,state}=score(),device=audioDevice();host.AC=device;state.hero={x:23,y:19};
  for(let frame=0;frame<1200;frame++){
    device.advance(frame*.05);api.updateNetherMusic(.05);
    assert.ok(device.live.size<30,`only the current short musical phrase should be alive: ${device.live.size}`);
  }
  assert.ok(device.started.some(n=>n.kind==='noise'),'the beat includes snare/hi-hat percussion');
  api.stopNetherMusic();assert.equal(device.live.size,0);
});
