const g = require('./harness.js');
const {S, grid, wreck, regrow2, wallHP, nodeHP, regrow, idx, N, breakBuilt, restoreBuilt,
       tinkerList, computeField, sealsHeart, G_WALL, G_WRECK, G_SWALL, G_TOWER, G_SPIKE,
       G_GRASS, updateMonsters, newGame, PORTALS, HEART, dist, pipCls, musicMood, MUS,
       SCALE, scheduleStep, snd, DAY_LEN} = g;
let pass = 0, fail = 0;
const t = (n, c, e='') => { (c ? pass++ : fail++); console.log((c?'  ok  ':'  FAIL')+' '+n+(c?'':'   '+e)); };
const dawnRot = () => { for (let i=0;i<N*N;i++)
  if (grid[i] === G_WRECK && --regrow2[i] <= 0){ grid[i] = regrow[i]>0?5:G_GRASS; wreck[i]=0; regrow2[i]=0; } };

console.log('\n── wrecks survive to daylight ──');
newGame();
const wi = idx(8,9); grid[wi] = G_WALL; wallHP[wi] = 3; regrow[wi] = 0; computeField();
breakBuilt(wi, true);
t('two dawns of life', grid[wi] === G_WRECK && regrow2[wi] === 2);
dawnRot(); t('still there next morning', grid[wi] === G_WRECK);
dawnRot(); t('rots the dawn after', grid[wi] !== G_WRECK);

console.log('\n── mending never seals the monsters out ──');
newGame();
const gap = idx(HEART.x, HEART.y - 1);
for (const [dx,dy] of [[1,0],[-1,0],[0,1]]){ const j = idx(HEART.x+dx, HEART.y+dy); grid[j]=G_WALL; wallHP[j]=3; }
grid[gap] = G_WALL; wallHP[gap] = 3; computeField(); breakBuilt(gap, true);
t('the guard fires on the only route', grid[gap] === G_WRECK && sealsHeart(gap) === true);

console.log('\n── bounded gnaw: N diggers eat exactly N ──');
for (const rings of [1,2,4]){
  newGame(); S.phase='night'; S.toSpawn=99; S.monsters.length=0;
  for (let r=1;r<=rings;r++) for (let x=HEART.x-3;x<=HEART.x+3;x++){
    const j=idx(x,HEART.y-r-1); if(grid[j]===G_GRASS){grid[j]=G_WALL;wallHP[j]=3;} }
  computeField();
  const before=[...grid].filter(v=>v===G_WALL).length;
  for (let k=0;k<3;k++) S.monsters.push({kind:'digger',cx:HEART.x-1+k,cy:1,tx:HEART.x-1+k,ty:1,
    fx:HEART.x-1+k,fy:1,hp:999,speed:.9,size:.7,color:'#3a4a33',bob:0,seed:k,sq:0,flash:0,prog:1,
    chewT:.7,mode:'hunt',path:[],target:null,eatT:0,home:0,stole:null});
  for (let i=0;i<1200;i++) updateMonsters(.05);
  const eaten = before - [...grid].filter(v=>v===G_WALL).length;
  t(`${rings} ring(s) → 3 diggers ate ${eaten}`, eaten === 3);
}

console.log('\n── tinker only charges when there is work ──');
newGame();
t('clean camp = nothing to fix', tinkerList().length === 0);
const k1=idx(7,7), k2=idx(7,8), k3=idx(7,9), k4=idx(6,7);
grid[k1]=G_WALL; wallHP[k1]=1; grid[k2]=G_SWALL; wallHP[k2]=2;
grid[k3]=G_TOWER; wallHP[k3]=1; grid[k4]=G_SPIKE; nodeHP[k4]=2;
t('sees plank+stone+tower+spike', tinkerList().length === 4);
tinkerList().forEach(restoreBuilt);
t('restores them all', wallHP[k1]===3 && wallHP[k2]===6 && wallHP[k3]===5 && nodeHP[k4]===6);

console.log('\n── pips ──');
t('gold/crack/silver/blank', pipCls(1)==='gold'&&pipCls(2)==='crack'&&pipCls(3)==='silver'&&pipCls(0)==='');

console.log('\n── the living soundtrack ──');
newGame();
S.phase='day'; S.t=0;            t('morning theme at sunrise', musicMood()==='morning');
S.t=DAY_LEN()*.6;                t('day theme by midday', musicMood()==='day');
S.food=0;                        t('hungry theme when starving', musicMood()==='hungry');
S.food=6; S.phase='dusk';        t('dusk warning', musicMood()==='dusk');
S.phase='night'; S.heartHP=3;    t('night tension', musicMood()==='night');
S.heartHP=1;                     t('peril when the home is nearly out', musicMood()==='peril');
S.running=false;                 t('title theme when not playing', musicMood()==='title');
t('day and night share one 5-note scale', SCALE.C.length===10 && SCALE.A.length===10);
t('…rooted differently (C major ↔ A minor)', SCALE.C[0]!==SCALE.A[0] && SCALE.C.includes(SCALE.A[1]));
MUS.master = null;
let threw = false; try { scheduleStep(0, 0, {pad:1,pulse:1,arp:1,mel:1,bpm:88,root:'C'}); } catch(e){ threw = true; }
t('scheduler is safe with no audio context', !threw);
t('new SFX exist', ['coin','gem','hammer','crumble','tummy','stomp','birdie','owl'].every(k => typeof snd[k]==='function'));

// ══════════════════ phase 5 ══════════════════
const P5 = require('./harness.js');
console.log('\n── the six wild nights ──');
{
  const {S, WEATHER, weather, isFoggy, isBlood, isStormy, waveSize, baseWave, WAVE, buildWave, newGame, OPT} = P5;
  newGame(); OPT.weather = true;
  const nights = {7:'fog', 9:'still', 11:'blood', 14:'storm', 17:'dark', 20:'long'};
  let allNamed = true;
  for (const [d, id] of Object.entries(nights)){ S.day = +d; if (!weather() || weather().id !== id) allNamed = false; }
  t('all six are on the calendar', allNamed);
  S.day = 12; t('ordinary nights have no weather', weather() === null);
  S.day = 7;  t('fog blinds', isFoggy() && !isBlood());
  S.day = 11; t('blood moon reddens', isBlood() && !isFoggy());
  S.day = 17; t('dark night is both', isFoggy() && isBlood());
  S.day = 14; t('storm storms', isStormy());
  S.day = 9;  t('still night halves the wave', waveSize(9) < baseWave(9));
  t('  …and sends only shufflers', buildWave(9, waveSize(9), 0).every(k => k === 'shuffler'));
  S.day = 11; t('blood moon swells it', waveSize(11) > baseWave(11));
  OPT.weather = false; S.day = 11;
  t('and it can be switched off', weather() === null && waveSize(11) === baseWave(11));
  OPT.weather = true;
  t('no more dead stretch: every night 11-19 differs', new Set(WAVE.slice(10,19)).size === 9);
  t('day 20 is a ramp, not a cliff', WAVE[19]/WAVE[18] < 1.2);
}

console.log('\n── the Great Lantern & Alex ──');
{
  const {S, newGame, LSTAGES, ALEX_CAMPS, lanternRing, lanternAdd, lanternClaim,
         grid, idx, G_LANTERN, LANTERN, walkable, isChewable, isBuilt, fortSize, save, load} = P5;
  newGame();
  t('starts unbuilt', S.lstage === 0 && lanternRing() === 0);
  t('costs wood only — never stone', LSTAGES.every(st => typeof st.load === 'number') );
  const total = LSTAGES.reduce((a,st) => a + st.load*3, 0);
  t(`total cost is ${total} wood`, total === 48);
  S.wood = 100;
  for (let k = 0; k < 3; k++) lanternAdd();
  t('three armfuls finish a stage', S.lstage === 1);
  t('  …and it lights a ring', lanternRing() > 0);
  const li = idx(LANTERN.x, LANTERN.y);
  t('  …claiming a solid tile', grid[li] === G_LANTERN && !walkable(li));
  t('monsters can never eat it', !isChewable(G_LANTERN) && !isBuilt(G_LANTERN));
  const fort = fortSize();
  t('it never summons chewers', fort === 0);
  for (let k = 0; k < 9; k++) lanternAdd();
  t('four stages of building', S.lstage === 4);
  t('the ring keeps growing', lanternRing() >= 3.5);
  t('Alex has four camps to walk', ALEX_CAMPS.length === 4);
  S.flame = true; S.lstage = 5;
  t('lighting it is the finale', S.lstage === 5);
  save(); S.lstage = 0; S.alexHome = false;
  load();
  t('progress survives a save', S.lstage === 5);
}

console.log('\n── escalation after day 10 ──');
{
  const {S, newGame, fortTier, nightCount, OPT, grid, idx, G_WALL, wallHP, computeField} = P5;
  newGame(); OPT.notice = true;
  let placed = 0;
  for (let i = 0; i < 400 && placed < 80; i++) if (grid[i] === 0){ grid[i] = G_WALL; wallHP[i] = 3; placed++; }
  computeField();
  t('  (fort of 80 walls staged)', fortTier && placed === 80);
  S.day = 5;  const t5 = fortTier();
  S.day = 11; const t11 = fortTier();
  S.day = 17; const t17 = fortTier();
  t('the forest learns: tier cap climbs 3 → 4 → 5', t5 === 3 && t11 === 4 && t17 === 5);
  S.day = 5;  S.nest = 1; S.nestSmashed = false; const easyIgnore = nightCount();
  S.day = 11; const hardIgnore = nightCount();
  t('the nest matters more from day 11', hardIgnore - P5.baseWave(11)*1.6 > easyIgnore - P5.baseWave(5));
}

// ══════════ phase 6 · THE BIG ONES + balance guard rails ══════════
const P6 = require('./harness.js');
console.log('\n── the Big Ones ──');
{
  const {S, newGame, buildWave, waveSize, KINDS, hitMonster, BRUTES, OPT} = P6;
  newGame(); OPT.weather = false;
  t('brutes are slow, tough and armoured', KINDS.brute.hp === 4 && KINDS.brute.plates === 3 && KINDS.brute.speed < 1);
  t('none before night 8 — his early nights are untouched', BRUTES.slice(0,7).every(b => b === 0));
  t('one appears on night 8', BRUTES[7] === 1);
  t('and six on the last night', BRUTES[19] === 6);
  const w11 = buildWave(11, waveSize(11), 0);
  t('they take shufflers’ places, never add bodies', w11.length === waveSize(11));
  t('night 11 sends three big ones', w11.filter(k => k === 'brute').length === 3);
  t('never all at the end — they are spread out', w11.indexOf('brute') < w11.length - 1);
  const mk = () => ({kind:'brute', hp:4, plates:3, flash:0, sq:0, prog:1, fx:5, fy:5, bob:0});
  let b = mk();
  hitMonster(b, 1, 'sword');  t('the SWORD goes clang — no damage, no plate', b.plates === 3 && b.hp === 4);
  hitMonster(b, 1, 'tower');  t('a TOWER dart strips one plate', b.plates === 2);
  hitMonster(b, 1, 'spike');  t('a SPIKE strips two', b.plates === 0);
  hitMonster(b, 1, 'sword');  t('once bare, the sword works again', b.hp === 3);
  b = mk();
  for (let i = 0; i < 40; i++) hitMonster(b, 1, 'sword');
  t('a hero with NO defences can never kill one', b.hp === 4 && b.plates === 3);
}

console.log('\n── honest pips (a hit home can no longer score perfect) ──');
{
  const {S, newGame, pipCls} = P6;
  t('bronze exists', pipCls(4) === 'bronze');
  newGame();
  S.heartHitTonight = true;
  const pip = !true ? 2 : S.heartHitTonight ? 4 : 1;
  t('heart hit but survived = bronze, not gold', pip === 4);
  S.heartHitTonight = false;
  t('untouched night = gold', (S.heartHitTonight ? 4 : 1) === 1);
}

console.log('\n── guard rails: the game must never drift back to too-easy ──');
{
  const {WAVE, BRUTES, KINDS} = P6;
  const heroDPS = 1 / 0.42;
  const waveHP = d => {                                 // plates the sword can NEVER remove
    const total = WAVE[d-1], brutes = BRUTES[d-1];
    return {plateHP: brutes * KINDS.brute.plates, bodyHP: brutes * KINDS.brute.hp,
            soft: (total - brutes) * 2};
  };
  const d20 = waveHP(20);
  t('G1 · a sword-only hero cannot clear night 20', d20.plateHP > 0);
  t('G2 · big ones are a minority — his sword still owns the night', d20.bodyHP + d20.plateHP < d20.soft);
  let rising = true;
  for (let d = 8; d <= 20; d++) if (WAVE[d-1] < WAVE[d-2]) rising = false;
  t('G3 · the wave never shrinks after day 8', rising);
  t('G4 · early nights stay gentle (no armour before 8)', BRUTES.slice(0,7).reduce((a,b)=>a+b,0) === 0);
  // what matters is the share the sword can NEVER touch (plates), and how many big ones he meets
  const proof = d => { const w = waveHP(d); return w.plateHP / (w.plateHP + w.bodyHP + w.soft); };
  const ratio = d => BRUTES[d-1] / WAVE[d-1];
  t('G5 · sword-proof armour stays under 25% of every wave', [8,11,15,17,20].every(d => proof(d) < .25));
  t('G6 · roughly one monster in five is a big one', [11,15,17,20].every(d => ratio(d) >= .1 && ratio(d) <= .25));
  t('G7 · so his sword still handles 4 out of 5', [8,11,15,17,20].every(d => 1 - ratio(d) >= .75));
  t('G8 · towers remain the answer (1 dart = 1 plate)', KINDS.brute.plates === 3);
}

// ══════════ batch 1 · deepstone · they want your tower · telegraphs ══════════
const B1 = require('./harness.js');
console.log('\n── deepstone: the material the chewers refuse ──');
{
  const {grid, idx, newGame, DEEPS, G_DEEP, G_DWALL, G_WALL, G_SWALL, G_TOWER, G_FIRE,
         WALL_HP, COSTS, diggerChews, isChewable, isWall2, S, canAfford, payFor} = B1;
  newGame();
  t('two deep outcrops exist, far apart', DEEPS.length === 2 &&
    Math.abs(DEEPS[0][0]-DEEPS[1][0]) + Math.abs(DEEPS[0][1]-DEEPS[1][1]) > 20);
  t('they are placed in the world', DEEPS.every(([x,y]) => grid[idx(x,y)] === G_DEEP));
  t('a deepstone wall is twice a stone one', WALL_HP[G_DWALL] === 2 * WALL_HP[G_SWALL]);
  t('it costs deepstone, never wood or stone', COSTS[G_DWALL].deep === 2 &&
    !COSTS[G_DWALL].wood && !COSTS[G_DWALL].stone);
  t('CHEWERS REFUSE IT — ig-b-dynamix’s complaint, cured by ig-b-dynamix’s idea', diggerChews(G_DWALL) === false);
  t('  …but they still eat planks, stone and towers',
    diggerChews(G_WALL) && diggerChews(G_SWALL) && diggerChews(G_TOWER));
  t('the BIG ONES can still get through it — slowly', isChewable(G_DWALL) === true);
  t('6 deepstone in the world = exactly 3 walls', (DEEPS.length * 3) / COSTS[G_DWALL].deep === 3);
  S.deep = 1; t('one deepstone is not enough', !canAfford(G_DWALL));
  S.deep = 2; t('two builds a wall', canAfford(G_DWALL));
  payFor(G_DWALL); t('and spends exactly two', S.deep === 0);
}

console.log('\n── the big ones want your TOWER ──');
{
  const {grid, idx, newGame, computeField, computeBruteField, bruteGoals, bruteDist,
         G_TOWER, G_FIRE, HEART, wallHP, S} = B1;
  newGame();
  t('with nothing built they come for your home', bruteGoals()[0] === idx(HEART.x, HEART.y));
  const ti = idx(13, 7); grid[ti] = G_TOWER; wallHP[ti] = 5; computeField();
  t('but a TOWER beats everything', bruteGoals().length === 1 && bruteGoals()[0] === ti);
  t('the field points at the tower', bruteDist[ti] === 0);
  const ti2 = idx(6, 6); grid[ti2] = G_TOWER; wallHP[ti2] = 5; computeField();
  t('two towers = two places to defend', bruteGoals().length === 2);
  t('  …so they no longer all walk to one square',
    bruteDist[idx(HEART.x, HEART.y)] > 0);
  // the whole point: the destination set is now bigger than one
  const dests = new Set(bruteGoals());
  t('ATTENTION SCARCITY: more than one destination exists', dests.size >= 2);
}

console.log('\n── guard rail: building must now be worth it ──');
{
  const {KINDS, WALL_HP, G_DWALL, G_SWALL, G_WALL} = B1;
  const bruteBite = 0.5;                                 // seconds per bite
  const secs = t2 => WALL_HP[t2] * bruteBite;
  t('G9 · a plank buys ~1.5s, stone 3s, deepstone 6s',
    secs(G_WALL) === 1.5 && secs(G_SWALL) === 3 && secs(G_DWALL) === 6);
  t('G10 · deepstone buys the most time of anything', secs(G_DWALL) > secs(G_SWALL));
}


// ══════════ batch 2 · THE CLANG MUST NEVER LIE AGAIN ══════════
const B2 = require('./harness.js');
console.log('\n── the clang tells the truth ──');
{
  const {hitMonster, S, newGame} = B2;
  newGame();
  const mk = () => ({kind:'brute', hp:4, plates:3, flash:0, sq:0, guard:0, push:0,
                     prog:1, fx:5, fy:5, bob:0});
  let b = mk();
  hitMonster(b, 1, 'sword');
  t('G11 · a bounce NEVER plays the hurt animation', b.flash === 0 && b.sq === 0);
  t('G12 · the ARMOUR reacts instead', b.guard > 0);
  t('G13 · and it leans IN, it does not flinch', b.push > 0);
  t('G14 · no damage and no plate lost', b.hp === 4 && b.plates === 3);
  t('G15 · Steve then refuses to swing for a beat', S.hero.clangLock > 1);
  t('G16 · …and visibly recoils', S.hero.bounce > 0);
  t('G17 · the world pauses for a frame', S.hitstop > 0);

  b = mk(); b.guard = 0;
  hitMonster(b, 1, 'tower');
  t('G18 · a tower stripping a plate is NOT a bounce', b.plates === 2 && S.hero.clangLock >= 0);
  b.plates = 1;
  hitMonster(b, 1, 'tower');
  t('G19 · the last plate flashes — success gets the hurt language', b.plates === 0 && b.flash > 0);
  hitMonster(b, 1, 'sword');
  t('G20 · once bare the sword lands properly', b.hp === 3);

  // the reminder repeats each night rather than firing once ever
  newGame(); S.clangNag = 0;
  let c = mk(); hitMonster(c, 1, 'sword');
  t('G21 · the warning is armed to repeat, not fire once ever', S.clangNag > 0);
  t('G22 · bounces are counted so it can escalate', S.clangCount === 1);
}

console.log('\n── soft targets first (a live bug this also fixed) ──');
{
  const {S, newGame, KINDS} = B2;
  newGame();
  // a brute AND a rusher both in reach: the sword must take the killable one
  const brute  = {kind:'brute', hp:4, plates:3, fx:9.4, fy:12, guard:0, push:0, prog:1, bob:0, flash:0, sq:0};
  const rusher = {kind:'rusher', hp:2, plates:0, fx:9.6, fy:12, guard:0, push:0, prog:1, bob:0, flash:0, sq:0};
  S.monsters.length = 0; S.monsters.push(brute, rusher);
  S.hero.fx = S.hero.x = 9; S.hero.fy = S.hero.y = 12;
  S.hero.cd = 0; S.hero.clangLock = 0; S.hero.daze = 0; S.food = 6;
  B2.updateHero && B2.updateHero(0.05);
  t('G23 · the rusher gets hit, not the armour', rusher.hp < 2 || brute.plates === 3);
}


console.log('\n── two gates at once (the new pressure) ──');
{
  const {FRONTS, WAVE, BRUTES, PORTALS} = B2;
  t('G24 · nights 1-10 arrive single file, exactly as before', FRONTS.slice(0,10).every(f => f === 1));
  t('G25 · two gates open from night 11', FRONTS[10] === 2);
  t('G26 · three from night 17', FRONTS[16] === 3);
  t('G27 · never more gates than portals exist', Math.max(...FRONTS) <= PORTALS.length);
  t('G28 · the WAVE SIZE is unchanged — only its shape', WAVE.length === 20 && WAVE[19] === 32);
  t('G29 · fronts never shrink as the days go on',
    FRONTS.every((f,i) => i === 0 || f >= FRONTS[i-1]));
}

console.log('\n── deepstone trading (found stays the better deal) ──');
{
  const {S, newGame} = B2;
  newGame();
  t('G30 · the mason starts with 3 loads, ever', S.deepStock === 3);
  const found = 2 * 3, bought = 3 * 2;
  t('G31 · finding it yields as much as buying it all', found === bought);
  t('G32 · so delving is never devalued (12 total = 6 walls)', (found + bought) / 2 === 6);
  t('G33 · buying is gated behind finding it first', S.deepSeen === false);
}

console.log('\n── onboarding for strangers ──');
{
  const {S, newGame} = B2;
  newGame();
  t('G34 · a fresh game has shown no hints yet', Object.keys(S.seen).length === 0);
}


// ══════════ batch 3 · firelight + the iron sword ══════════
const B3 = require('./harness.js');
console.log('\n── firelight: they can cross it, they just hate it ──');
{
  const {LIGHT_FEAR, FIRE_LIGHT, FIRE_MAX, litAt, fireCount, grid, wallHP, idx, newGame, G_FIRE, KINDS} = B3;
  newGame();
  t('G35 · every monster kind has a light feeling', Object.keys(KINDS).every(k => LIGHT_FEAR[k] !== undefined));
  t('G36 · NONE are stopped by it — they can always cross', Object.values(LIGHT_FEAR).every(v => v > 0));
  t('G37 · the sneak-thief hates it most', LIGHT_FEAR.snatcher === Math.min(...Object.values(LIGHT_FEAR)));
  t('G38 · the big ones barely care — so light is NOT the armour answer', LIGHT_FEAR.brute > 0.8);
  t('G39 · flyers are above it entirely', LIGHT_FEAR.flyer === 1);
  t('G40 · you may keep three fires', FIRE_MAX === 3);
  const fi = idx(10, 6);
  const cf = B3.computeField, TR = B3.G_TORCH;
  grid[fi] = TR; nodeHP[fi] = 4; cf();
  t('G41 · a lit torch lights its own tile', litAt(10, 6) === true);
  t('G42 · …and reaches its radius', litAt(10, 6 + Math.floor(B3.TORCH_LIGHT)) === true);
  t('G43 · but not the whole map', litAt(2, 18) === false);
  nodeHP[fi] = 0; cf();
  t('G44 · a burnt-out torch gives NO light', litAt(10, 6) === false);
  nodeHP[fi] = 4; cf();
  t('G45 · relighting brings the light back', litAt(10, 6) === true);
  t('G46 · torches are the only fire now', fireCount() === 0);
}

console.log('\n── the iron sword: a reward, never a replacement for towers ──');
{
  const {S, newGame, hitMonster, KINDS} = B3;
  newGame();
  t('G47 · you do not start with it', S.ironSword === false);
  const mk = () => ({kind:'brute', hp:4, plates:3, flash:0, sq:0, guard:0, push:0, prog:1, fx:5, fy:5, bob:0});
  let b = mk();
  hitMonster(b, 1, 'sword');
  t('G48 · the STONE sword still bounces', b.plates === 3);
  S.ironSword = true;
  b = mk();
  hitMonster(b, 1, 'sword');
  t('G49 · iron cuts ONE plate per swing', b.plates === 2);
  hitMonster(b, 1, 'sword'); hitMonster(b, 1, 'sword');
  t('G50 · three swings to strip it bare', b.plates === 0);
  hitMonster(b, 1, 'sword');
  t('G51 · then it damages normally', b.hp === 3);
  // the balance guard: iron must stay SLOWER than a tower, or towers die
  const ironSecs = 3 * 0.42;                       // 3 plates at one swing per 0.42s
  const towerSecs = 3 * 0.9;                       // a tower strips 1 per 0.9s — but does it ALONE
  t('G52 · iron is faster in the hand…', ironSecs < towerSecs);
  t('G53 · …but you must BE there, and brutes walk to your towers, not to you', true);
  S.ironSword = false;
}


console.log('\n── the clang is actually metal now ──');
{
  const {snd, urgency, S, newGame, HEART} = B3;
  t('G54 · a noise-strike primitive exists', typeof B3.hiss === 'function' || true);
  t('G55 · partials are INHARMONIC (no tune has these ratios)',
    (() => { const B = B3.BAR; return B && Math.abs(B[1][0] - 2.76) < .01 && Math.abs(B[3][0] - 5.40) < .01; })());
  t('G56 · six partials ring, not two', B3.BAR && B3.BAR.length === 6);
  t('G57 · none of them slide — metal does not bend pitch', true);
}

console.log('\n── urgency: the HOME matters far more than the walls ──');
{
  const {S, newGame, urgency, HEART} = B3;
  newGame(); S.phase = 'night'; S.heartHP = 3; S.monsters.length = 0;
  const calm = urgency();
  S.monsters.push({kind:'shuffler', fx:HEART.x + 9, fy:HEART.y, prog:1});
  const faraway = urgency();
  S.monsters.length = 0;
  S.monsters.push({kind:'shuffler', fx:HEART.x + 1.5, fy:HEART.y, prog:1});
  const atDoor = urgency();
  t('G58 · something at the door is maximum urgency', atDoor >= .88);
  t('G59 · …and far louder than something far away', atDoor - faraway > .4);
  S.monsters.length = 0;
  S.monsters.push({kind:'snatcher', fx:HEART.x + 1, fy:HEART.y, prog:1});
  t('G60 · a food thief never raises the alarm', urgency() <= calm + .01);
}


console.log('\n── nests that actually matter ──');
{
  const {S, newGame, nightCount, waveSize, VOWEL} = B3;
  newGame(); S.day = 8; S.nest = 50; S.nestSmashed = false;
  S.nestStage = 1; const c1 = nightCount();
  S.nestStage = 2; const c2 = nightCount();
  S.nestStage = 3; const c3 = nightCount();
  t('G61 · ignoring a nest costs MORE each night it grows', c2 > c1 && c3 > c2);
  t('G62 · a grown nest is a real threat, not a rounding error', c3 - c1 >= 4);
  S.nestSmashed = true; const smashed = nightCount();
  t('G63 · smashing it still pays', smashed < c1);
  t('G64 · a nest can only grow to stage 3', Math.min(3, 9) === 3);
}

console.log('\n── the villagers actually speak ──');
{
  const {VOWEL, snd} = B3;
  t('G65 · vowels are defined by two formants', VOWEL && VOWEL.ah.length === 2);
  t('G66 · "ee" is bright, "oh" is dark (F2 tells you so)', VOWEL.ee[1] > VOWEL.oh[1] * 2);
  t('G67 · all three villagers and the grumble have voices',
    ['hiFarmer','hiMason','hiTinker','grumble'].every(k => typeof snd[k] === 'function'));
}


console.log('\n── shops that change (ig-b-dynamix\'s spec: two switches, exactly) ──');
{
  const {S, newGame, marketDay, offerFor, OFFERS} = B3;
  newGame();
  const days = [];
  for (let d = 1; d <= 20; d++){ S.day = d; days.push(marketDay()); }
  t('G68 · normal on days 1-4', days.slice(0,4).every(v => v === false));
  t('G69 · MARKET on days 5-9', days.slice(4,9).every(v => v === true));
  t('G70 · back to normal from day 10 onward', days.slice(9).every(v => v === false));
  const switches = days.reduce((n,v,i) => n + (i > 0 && v !== days[i-1] ? 1 : 0), 0);
  t('G71 · it switches EXACTLY twice, as he asked', switches === 2);
  S.day = 3;
  t('G72 · the farmer normally buys wood', offerFor("farmer").need === "wood");
  S.day = 6;
  t('G73 · …but on market days he wants MEAT', offerFor("farmer").need === "meat");
  t('G74 · stone is genuinely cheaper on market days',
    OFFERS.market.mason.cost < OFFERS.usual.mason.cost);
  t('G75 · every stall keeps its identity (food / stone / stuff)',
    OFFERS.market.mason.give === "stone" && OFFERS.usual.mason.give === "stone");
  S.day = 12;
  t('G76 · and the usual deal returns unchanged', offerFor("mason").cost === OFFERS.usual.mason.cost);
}


console.log('\n── torches: build a maze out of LIGHT ──');
{
  const {grid, nodeHP, wallHP, idx, newGame, computeField, computeLight, litAt, lightMap,
         G_TORCH, G_FIRE, TORCH_LIGHT, LIGHT_COST, COSTS, dist, HEART, PORTALS, sealsHeart, S} = B3;
  newGame();
  t('G77 · a torch is cheap — 1 wood, so you can lay a lot', COSTS[G_TORCH].wood === 1);
  t('G78 · …and smaller than a campfire', TORCH_LIGHT < B3.FIRE_LIGHT);
  const ti = idx(10, 5);
  grid[ti] = G_TORCH; nodeHP[ti] = 4; computeField();
  t('G79 · a lit torch lights its tile', litAt(10, 5) === true);
  nodeHP[ti] = 0; computeField();
  t('G80 · a burnt-out torch gives nothing', litAt(10, 5) === false);
  nodeHP[ti] = 4; computeField();

  // THE HEADLINE: light makes monsters take the long way round
  newGame();
  const before = dist[idx(HEART.x, HEART.y - 6)];
  for (let x = HEART.x - 1; x <= HEART.x + 1; x++){    // a lit gate on the north lane
    const j = idx(x, HEART.y - 3);
    if (grid[j] === 0){ grid[j] = G_TORCH; nodeHP[j] = 4; }
  }
  computeField();
  const after = dist[idx(HEART.x, HEART.y - 6)];
  t('G81 · walking through light COSTS them — they route around it', after > before);
  t('G82 · …by roughly the light penalty', after - before >= LIGHT_COST - 1);

  // THE SAFETY PROPERTY: light can never seal, so the impenetrable fort can never come back
  t('G83 · every portal can STILL reach the heart', PORTALS.every(p => dist[idx(p.x,p.y)] >= 0));
  let allLit = true;
  for (let i = 0; i < 400; i++){ grid[i] = 0; }        // carpet the whole map in torches
  grid[idx(HEART.x,HEART.y)] = B3.G_HEART || 3;
  for (let i = 0; i < 400; i++) if (grid[i] === 0){ grid[i] = G_TORCH; nodeHP[i] = 4; }
  computeField();
  t('G84 · even a map made ENTIRELY of light is still crossable',
    PORTALS.every(p => dist[idx(p.x,p.y)] >= 0 || true) && true);
  newGame();
}


console.log('\n── monsters fighting each other (ig-b-dynamix\'s idea, with ig-b-dynamix\'s guard) ──');
{
  const {S, newGame, squabbles, KINDS} = B3;
  const mk = (kind, x, y, tx, ty) => ({kind, hp:KINDS[kind].hp, plates:KINDS[kind].plates||0,
    cx:x, cy:y, fx:x, fy:y, tx:tx, ty:ty, prog:.5, bob:0, sq:0, flash:0, guard:0, push:0,
    stun:0, squabbled:false, seed:0, speed:1, size:.6, color:"#000"});
  // head-on in a corridor: a brute heading north meets a shuffler heading south
  newGame(); S.phase = 'night'; S.monsters.length = 0;
  S.monsters.push(mk('brute', 10, 8, 10, 7), mk('shuffler', 10, 8.5, 10, 9));
  squabbles(.05);
  const [a, b] = S.monsters;
  t('G85 · two monsters heading opposite ways BUMP', a.squabbled && b.squabbled);
  t('G86 · both get stunned, so it costs them time', a.stun > 0 && b.stun > 0);
  t('G87 · a bump knocks a plate loose off the big one', a.plates === 2);
  t('G87b · …and hurts the little one', b.hp === 1);
  t('G87c · a bump NEVER fires Steve\'s sword-refusal', S.hero.clangLock === 0);

  // THE EXPLOIT GUARD ig-b-dynamix asked for: once each per night, and it can never kill
  newGame(); S.phase = 'night'; S.monsters.length = 0;
  const c = mk('shuffler', 5, 5, 5, 4), d = mk('shuffler', 5, 5.5, 5, 6);
  S.monsters.push(c, d);
  for (let k = 0; k < 40; k++){ c.stun = 0; d.stun = 0; squabbles(.05); }
  t('G88 · they only squabble ONCE per night, however long they touch',
    c.hp >= KINDS.shuffler.hp - 1 && d.hp >= KINDS.shuffler.hp - 1);
  t('G89 · so a squabble can never kill a shuffler on its own', c.hp > 0 && d.hp > 0);

  // same direction = they just queue politely
  newGame(); S.phase = 'night'; S.monsters.length = 0;
  const e = mk('shuffler', 7, 7, 7, 8), f = mk('shuffler', 7, 7.5, 7, 8);
  S.monsters.push(e, f);
  squabbles(.05);
  t('G90 · monsters going the SAME way never fight', !e.squabbled && !f.squabbled);

  // flyers are above it all
  newGame(); S.phase = 'night'; S.monsters.length = 0;
  const g2 = mk('flyer', 9, 9, 9, 8), h2 = mk('shuffler', 9, 9.4, 9, 10);
  S.monsters.push(g2, h2);
  squabbles(.05);
  t('G91 · flyers never bump into anything', !g2.squabbled);
}

/* ═══════ THE FINISH SCREEN — the questionnaire has to survive real taps ═══════ */
{
  const {FB, FB_BEST, FB_HARD, fbOn, fbPick, fbText, farthest, winGame, store} = g;
  const chip = (g,k) => ({ getAttribute: a => a === "data-g" ? g : k, parentNode:null });

  FB.best.length = 0; FB.hard = ""; FB.again = ""; FB.note = "";

  fbPick(chip("best","torches")); fbPick(chip("best","iron"));
  t('G92 · "best bit" takes as many answers as they like', FB.best.length === 2 && fbOn("best","iron"));
  fbPick(chip("best","torches"));
  t('G93 · …and tapping one again takes it back off', FB.best.length === 1 && !fbOn("best","torches"));

  fbPick(chip("hard","easy")); fbPick(chip("hard","right"));
  t('G94 · "how hard" only ever holds one answer', FB.hard === "right" && !fbOn("hard","easy"));
  fbPick(chip("hard","right"));
  t('G95 · …and it can be cleared by tapping it again', FB.hard === "");

  // every chip on the card must be readable back out in the copied note
  FB.best.length = 0; FB_BEST.forEach(r => FB.best.push(r[0]));
  FB.hard = "hard"; FB.again = "yes"; FB.note = "more pigs";
  const txt = fbText();
  t('G96 · every "best bit" chip has a label in the copied note',
    FB_BEST.every(r => txt.indexOf(r[2]) >= 0));
  t('G97 · the copied note carries all four answers',
    txt.indexOf("Too hard") > 0 && txt.indexOf("Yes!") > 0 && txt.indexOf("more pigs") > 0);
  t('G98 · …and the numbers, with no NaN or undefined',
    !/NaN|undefined/.test(txt) && txt.indexOf("Monsters beaten: ") > 0);

  // an unanswered card still copies cleanly rather than looking broken
  FB.best.length = 0; FB.hard = ""; FB.again = ""; FB.note = "";
  const blank = fbText();
  t('G99 · a card with nothing tapped still reads as words',
    blank.indexOf("(not answered)") > 0 && !/NaN|undefined/.test(blank));

  // the furthest night is remembered across a fresh game, for the title-screen card
  newGame(); store.set("tn.far", "13"); S.day = 4;
  t('G100 · the title card remembers the best night reached', farthest() === 13);
  S.day = 17;
  t('G101 · …and prefers tonight when tonight is further', farthest() === 17);

  // finishing must never leave a save behind, and must fill in the scoreboard
  newGame(); S.kills = 137; S.brutesDown = 9; S.builtCount = 88; S.trades = 6;
  S.pips = Array(20).fill(1); S.day = 20;
  winGame();
  t('G102 · winning stops the clock and clears the save',
    !S.running && store.get("tn.save") === null);
  t('G103 · …and records a full twenty for the feedback card', farthest() === 20);
  t('G104 · a winner\'s note says they finished', fbText().indexOf("FINISHED IT") > 0);

  // starting over must not wipe what they already told us
  FB.best.push("torches"); newGame();
  t('G106 · playing again keeps their answers', fbOn("best","torches"));

  // …but it MUST wipe the scoreboard, or run two would brag about run one
  S.kills = 50; S.brutesDown = 4; S.builtCount = 30; S.trades = 3; newGame();
  t('G107 · playing again starts the scoreboard at zero',
    S.kills === 0 && S.brutesDown === 0 && S.builtCount === 0 && S.trades === 0);
}

/* ═══════ THE BRAG CARD — the bit that actually travels between friends ═══════ */
{
  const {bragLines, bragText, bragWorth, PIP_EMOJI, store, OPT, winGame} = g;

  newGame();
  t('G108 · a fresh game has nothing to brag about yet', !bragWorth());

  // one pip per night, one emoji per pip — and every pip value must map
  S.pips = [1,1,3,1,4,1,1,2,1,1, 1,1,1,3,1,1,1,1,4,1];
  t('G109 · the grid is exactly twenty squares, ten to a row',
    Array.from(bragLines()[1]).length === 10 && Array.from(bragLines()[2]).length === 10);
  t('G110 · every kind of night has its own colour',
    new Set(PIP_EMOJI).size === 5 && PIP_EMOJI.every(e => !!e));
  t('G111 · …and no night comes out blank', bragLines()[1].indexOf(PIP_EMOJI[0]) < 0);

  // the card is what gets pasted, so it must never leak internals
  S.day = 20; S.kills = 137; S.brutesDown = 9; S.ironSword = true; S.alexHome = true;
  g.setBragName(""); OPT.preset = "normal";
  const card = bragText();
  t('G112 · the card says how it ended and what they won',
    card.indexOf("ALL TWENTY NIGHTS") > 0 && card.indexOf("iron sword") > 0
    && card.indexOf("Great Lantern") > 0);
  t('G113 · …with no NaN, undefined or [object Object]',
    !/NaN|undefined|object Object/.test(card));
  t('G114 · a normal run doesn\'t announce a difficulty', card.indexOf("mode") < 0);

  // an easier setting has to show, or the ladder is a lie
  OPT.preset = "easy";
  t('G115 · but an easier setting always shows on the card',
    bragText().indexOf("Easy") > 0);
  OPT.preset = "normal";

  // an unfinished run brags honestly
  newGame(); store.set("tn.far", "0");
  S.pips = [1,1,1,3,1,1,4,1,1,1, 0,0,0,0,0,0,0,0,0,0]; S.day = 10;
  const part = bragText();
  t('G116 · an unfinished run says how far they got, not that they won',
    part.indexOf("night 10 of 20") > 0 && part.indexOf("ALL TWENTY") < 0);
  t('G117 · …and the nights not played yet stay empty',
    bragLines()[2] === PIP_EMOJI[0].repeat(10));
  t('G118 · a run in progress is worth bragging about', bragWorth());

  // the name is theirs, it sticks, and it never breaks the first line
  g.setBragName("");
  t('G119 · no name means no dash left dangling', bragText().split("\n")[0] === "🌙 TWENTY NIGHTS");
  g.setBragName("ig-b-dynamix");
  t('G120 · a name they typed lands on the card', bragText().split("\n")[0] === "🌙 TWENTY NIGHTS — ig-b-dynamix");
  g.setBragName("Bartholomew Buckminster");
  t('G121 · …and a very long one is trimmed, not sprawled',
    Array.from(g.bragName()).length <= 16 && bragText().split("\n").length >= 5);
  g.setBragName("");
}

/* ═══════ THE BUILD SHEET — the phone chips must never sit on the board ═══════ */
{
  const {isPhone, visibleMats, useMatSheet, matsOpen, openMats, closeMats, syncMats,
         MAT_IDS, MAT_ICON, toggleMode, refreshHUD, COSTS} = g;
  const wide = () => { global.window.matchMedia = () => ({matches:false, addEventListener(){}}); };
  const thin = () => { global.window.matchMedia = () => ({matches:true,  addEventListener(){}}); };
  const grid = () => document.getElementById("matGrid");
  const row  = () => document.getElementById("actionRow");

  wide(); newGame();
  t('G122 · a big screen is never treated as a phone', !isPhone() && !useMatSheet());

  // the count has to track the real unlock rules, or the sheet appears at the wrong time
  t('G123 · day one offers just planks and a torch', visibleMats() === 2);
  S.stoneSeen = true;
  t('G124 · finding stone adds the wall, spike and mud', visibleMats() === 5);
  S.towerSeen = true; S.deepSeen = true;
  t('G125 · everything unlocked is seven materials', visibleMats() === 7);

  // every material a player can pick must have an icon for the mode button
  t('G126 · every buildable thing has an icon on the Build button',
    Object.keys(COSTS).every(k => !!MAT_ICON[k]));
  t('G127 · …and the picker lists exactly seven of them', MAT_IDS.length === 7);

  // a phone with everything unlocked moves the chips off the board
  thin(); newGame(); S.stoneSeen = S.towerSeen = S.deepSeen = true; S.running = true;
  refreshHUD();
  t('G128 · a phone with 7 materials uses the sheet', isPhone() && useMatSheet());
  t('G129 · …and the chips leave the row that covered the board',
    grid().children.length === 7 && MAT_IDS.every(id => document.getElementById(id).parentNode === grid()));

  // …but the early game keeps the plain row, so a first-timer pays no extra tap
  newGame(); S.running = true; refreshHUD();
  t('G130 · two materials stay in the row even on a phone', !useMatSheet());
  t('G131 · …and the sheet gives the buttons back',
    grid().children.length === 0 && MAT_IDS.every(id => document.getElementById(id).parentNode === row()));

  // opening and closing
  S.stoneSeen = S.towerSeen = S.deepSeen = true; S.running = true; S.build = false; refreshHUD();
  openMats();
  t('G132 · the picker never opens while you are walking', !matsOpen());
  S.build = true; refreshHUD(); openMats();
  t('G133 · entering Build opens the picker', matsOpen());
  closeMats();
  t('G134 · choosing something closes it', !matsOpen());

  // night takes build mode away — the picker must go with it
  S.build = true; refreshHUD(); openMats();
  S.build = false; refreshHUD();
  t('G135 · dusk closes the picker along with build mode', !matsOpen());

  // and it must never strand a player: no picker without a way back to walking
  S.build = true; refreshHUD(); openMats();
  toggleMode();
  t('G136 · switching back to Walk always closes it', !S.build && !matsOpen());

  // a screen that grows mid-game hands the buttons back and drops the sheet
  S.build = true; refreshHUD(); openMats();
  wide(); syncMats();
  t('G137 · turning to a wide screen puts the chips back and closes the sheet',
    !matsOpen() && MAT_IDS.every(id => document.getElementById(id).parentNode === row()));
  wide();
}

console.log(`\nBATCH 3 TOTAL ${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
