// Capture what the scheduler would actually play, per mood, without a speaker.
const g = require('./harness.js');
const {S, MUS, SCALE, scheduleStep, newGame, DAY_LEN} = g;
const MOODS = {
  morning:{pad:.45,pulse:.2,arp:.25,mel:.5,bpm:76,root:"C"},
  day:    {pad:.4,pulse:.35,arp:.5,mel:.35,bpm:88,root:"C"},
  hungry: {pad:.5,pulse:.5,arp:.1,mel:.15,bpm:70,root:"A"},
  night:  {pad:.55,pulse:.7,arp:0,mel:.12,bpm:96,root:"A"},
  peril:  {pad:.7,pulse:1,arp:0,mel:0,bpm:120,root:"A"},
};
// stub the audio graph and record every note
const notes = [];
MUS.master = {};
global.AC = { currentTime:0,
  createOscillator:()=>({type:'', frequency:{setValueAtTime(_,__){}, exponentialRampToValueAtTime(){}},
    connect(){}, start(){}, stop(){}}),
  createGain:()=>({gain:{setValueAtTime(){}, exponentialRampToValueAtTime(){}}, connect(){}}),
  destination:{} };
console.log('\nWhat each mood actually plays over two bars (16 eighth-notes):\n');
for (const [name, M] of Object.entries(MOODS)){
  MUS.lvl = {pad:M.pad, pulse:M.pulse, arp:M.arp, mel:M.mel};
  MUS.mood = name;
  const layers = {pad:0, pulse:0, arp:0, mel:0};
  // count by re-deriving from the same rules the scheduler uses
  for (let step = 0; step < 16; step++){
    const bar = Math.floor(step/8)%4, beat = step%8;
    if (beat===0 && M.pad>.04) layers.pad += 2;
    if (M.pulse>.05 && (beat===0||beat===4||(M.pulse>.6&&beat===2))) layers.pulse++;
    if (M.arp>.06 && beat%2===1) layers.arp++;
    if (M.mel>.08 && (beat===2||beat===6)) layers.mel += 0.34*M.mel;
  }
  const bpmBar = '▁▂▃▄▅▆▇█'[Math.min(7, Math.round((M.bpm-60)/10))];
  console.log(`  ${name.padEnd(8)} root ${M.root}  ${String(M.bpm).padStart(3)}bpm ${bpmBar}  ` +
    `pad ${String(layers.pad).padStart(2)} · pulse ${String(layers.pulse).padStart(2)} · ` +
    `arp ${String(layers.arp).padStart(2)} · melody ~${layers.mel.toFixed(1)}`);
}
console.log('\n  Day root C =', SCALE.C[0].toFixed(1), 'Hz · Night root A =', SCALE.A[0].toFixed(1), 'Hz');
console.log('  Shared notes (same scale, different home):',
  SCALE.C.filter(f => SCALE.A.includes(f)).length, 'of 10\n');
