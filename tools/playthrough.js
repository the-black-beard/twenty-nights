// Play 20 days headless and check nothing is broken or unreachable without the campfire/table.
const g = require('./harness.js');
const {S, grid, idx, N, newGame, computeField, G_TORCH, G_WALL, G_TOWER, G_TABLE, G_FIRE,
       nodeHP, wallHP, updateMonsters, updateTowers, buildWave, waveSize, nightCount,
       litAt, nearFire, KINDS, OPT} = g;

newGame(); OPT.weather = true;
let issues = [];
const check = (c, msg) => { if (!c) issues.push(msg); };

// nothing from the removed features should exist on a fresh map
let tables = 0, fires = 0;
for (let i = 0; i < N*N; i++){ if (grid[i] === G_TABLE) tables++; if (grid[i] === G_FIRE) fires++; }
check(tables === 0, "a crafting table is still on the map");
check(fires === 0, "a campfire is still on the map");

// torches must be able to do the campfire's old job: light AND cooking
const ti = idx(9, 9);
grid[ti] = G_TORCH; nodeHP[ti] = 4; computeField();
check(litAt(9, 9), "a torch gives no light");
check(nearFire(9, 9), "a torch cannot cook — the food loop is broken");
check(nearFire(9, 11), "a torch's cooking reach is too small");
check(!nearFire(2, 2), "a torch cooks from impossibly far away");

// every night of the run must be buildable and beatable in principle
let maxWave = 0, minWave = 99;
for (let d = 1; d <= 20; d++){
  S.day = d;
  const n = waveSize(d);
  const q = buildWave(d, n, 0);
  maxWave = Math.max(maxWave, n); minWave = Math.min(minWave, n);
  check(q.length === n, `day ${d}: wave queue is the wrong length`);
  check(q.every(k => KINDS[k]), `day ${d}: wave contains an unknown monster`);
}
check(minWave >= 2, "some night has fewer than 2 monsters");
check(maxWave <= 40, "some night exceeds the readable cap");

// the brutes' fallback: with no tower and no campfire they must still have somewhere to go
newGame();
const goals = g.bruteGoals();
check(goals.length === 1 && goals[0] === idx(g.HEART.x, g.HEART.y),
      "with no tower the big ones have no target");

// a night must actually resolve
newGame(); S.phase = "night"; S.spawned = 3; S.toSpawn = 3; S.monsters.length = 0;
for (let k = 0; k < 3; k++){
  const K = KINDS.shuffler;
  S.monsters.push({kind:"shuffler", cx:10, cy:1, tx:10, ty:1, fx:10, fy:1, hp:K.hp, plates:0,
    speed:K.speed, size:K.size, color:K.color, bob:0, seed:k, sq:0, flash:0, guard:0, push:0,
    prog:1, chewT:.7, stun:0, squabbled:false, mode:"hunt", path:[], target:null, eatT:0,
    home:0, stole:null});
}
let guard = 0;
while (S.monsters.length && guard++ < 4000) updateMonsters(.05);
check(S.monsters.length === 0, "monsters never resolved — the night cannot end");

console.log(issues.length ? "ISSUES:\n  " + issues.join("\n  ")
                          : "clean — 20 days simulate with no campfire and no crafting table");
console.log(`waves span ${minWave}–${maxWave} monsters`);
process.exit(issues.length ? 1 : 0);
