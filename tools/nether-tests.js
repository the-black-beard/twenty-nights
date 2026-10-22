'use strict';
// Acceptance seam: the real game's public NetherTrial API and browser save store.
// No synthetic hero/enemy positions; progress is driven by aim() and step().
const assert = require('node:assert/strict');
const test = require('node:test');
const HARNESS = process.env.TN_GAME_HARNESS || require('node:path').join(__dirname, 'harness.js');
const g = require(HARNESS);
const n = g.NetherTrial;
const TICK = .05;

function layoutFor(id) {
  const layout = n.options().layouts.find(candidate => candidate.id === id);
  assert.ok(layout, `named layout ${id} must be available`);
  return layout;
}
function advanceUntil(done, message, seconds = 30) {
  for (let i = 0; i < seconds / TICK; i++) {
    const state = n.view();
    if (done(state)) return state;
    assert.equal(state.status, 'playing', message + ': attempt ended first');
    assert.equal(!!state.awaitingReturn, false, message + ': another action is required after a loss');
    n.step(TICK);
  }
  assert.fail(message + ': bounded simulation did not reach the expected outcome');
}
function collectUpgrade(layout) {
  assert.equal(n.aim(layout.upgrade.x, layout.upgrade.y), true, 'upgrade must be reachable before mining');
  return advanceUntil(state => state.upgrade === 1, 'collect reachable upgrade');
}
function walkTo(point, message = 'reach requested ground tile') {
  assert.equal(n.aim(point.x, point.y), true, message + ': ground must be reachable');
  return advanceUntil(state => Math.hypot(state.hero.x - point.x, state.hero.y - point.y) < .02, message);
}
function mine(point) {
  const width = Math.sqrt(n.view().map.length), cell = point.y * width + point.x;
  assert.equal(n.aim(point.x, point.y), true, 'choose an ordinary reachable wall');
  return advanceUntil(state => state.map[cell] === '.', 'complete the chosen shared opening');
}
function lightBeacon(point) {
  assert.equal(n.aim(point.x, point.y), true, 'the beacon must have a reachable route');
  return advanceUntil(state => state.beacons.some(beacon => beacon.x === point.x && beacon.y === point.y && beacon.lit), 'stand long enough to light a beacon');
}
function exposePursuer(layout) {
  collectUpgrade(layout);
  const state = n.view(), width = Math.sqrt(state.map.length);
  const walls = state.map.flatMap((tile, i) => tile === 'b' ? [i] : []);
  walls.sort((a, b) => Math.hypot(a % width - state.hero.x, Math.floor(a / width) - state.hero.y)
                    - Math.hypot(b % width - state.hero.x, Math.floor(b / width) - state.hero.y));
  const chosen = walls.find(cell => n.aim(cell % width, Math.floor(cell / width)));
  assert.notEqual(chosen, undefined, 'at least one ordinary brick must have a reachable mining side');
  advanceUntil(current => current.map[chosen] === '.', 'make a permanent breach');
  return advanceUntil(current => current.enemy.released, 'opening connects and releases the real pursuer');
}

test('a selected maze and pursuer survive Save/Continue and replay uses the same choices', () => {
  assert.equal(typeof n.options, 'function', 'the player must be able to choose a named maze and pursuer');
  const catalogue = n.options();
  assert.ok(catalogue.layouts.length >= 2, 'there must be playable maze alternatives');
  assert.ok(catalogue.pursuers.length >= 2, 'there must be contrasting pursuer alternatives');
  const chosen = { layout: catalogue.layouts[1].id, pursuer: catalogue.pursuers[1].id };
  n.start('practice', chosen);
  const started = n.view();
  assert.equal(started.layout, chosen.layout);
  assert.equal(started.pursuer, chosen.pursuer);
  assert.equal(started.version, 2);
  assert.equal(n.persist(), true);
  n.leave();
  assert.equal(n.resume(), true);
  assert.equal(n.view().layout, chosen.layout);
  assert.equal(n.view().pursuer, chosen.pursuer);
  n.replay();
  assert.equal(n.view().layout, chosen.layout);
  assert.equal(n.view().pursuer, chosen.pursuer);
  assert.equal(n.view().lives, 3);
  assert.equal(n.view().upgrade, 0);
});

test('a catch waits for an explicit safe return and preserves the earned chase state through Continue', () => {
  const layout = layoutFor('ember');
  n.start('practice', { layout: layout.id, pursuer: 'hunter' });
  exposePursuer(layout);
  const caught = advanceUntil(state => state.awaitingReturn === true, 'stationary hero is caught by released hunter');
  assert.equal(caught.lives, 2);
  assert.equal(caught.upgrade, 1);
  assert.equal(caught.enemy.released, true);
  assert.deepEqual([caught.hero.x, caught.hero.y], [layout.start.x, layout.start.y]);
  for (let i = 0; i < 300; i++) n.step(TICK);
  const waiting = n.view();
  assert.deepEqual(waiting.enemy, caught.enemy, 'enemy cannot move while the player reads recovery');
  assert.deepEqual(waiting.hero, caught.hero);
  assert.equal(waiting.lives, 2);
  assert.equal(n.persist(), true);
  n.leave();
  assert.equal(n.resume(), true);
  const continued = n.view();
  assert.equal(continued.awaitingReturn, true);
  assert.equal(continued.lives, 2);
  assert.equal(continued.upgrade, 1);
  assert.deepEqual(continued.map, caught.map);
  assert.deepEqual(continued.enemy, caught.enemy);
  n.resumeRecovery();
  assert.equal(n.view().awaitingReturn, false);
  for (let i = 0; i < 60; i++) n.step(TICK);
  assert.equal(n.view().lives, 2, 'the refuge cannot immediately consume another life');
  assert.equal(n.view().enemy.released, true);
});

test('changing presentation and input preferences cannot refill a spent life or erase an opening', () => {
  const layout = layoutFor('ember');
  n.start('practice', { layout: layout.id, pursuer: 'hunter' });
  exposePursuer(layout);
  const before = advanceUntil(state => state.awaitingReturn === true, 'catch before settings changes');
  const changes = { dodge: false, showRoute: false, closeView: true, highContrast: true, reducedMotion: true };
  n.setPreferences(changes);
  const preferences = n.preferences();
  for (const [key, value] of Object.entries(changes)) assert.equal(preferences[key], value, key + ' preference must be selectable');
  const after = n.view();
  assert.equal(after.lives, before.lives);
  assert.equal(after.upgrade, before.upgrade);
  assert.equal(after.awaitingReturn, true);
  assert.deepEqual(after.map, before.map);
  assert.deepEqual(after.enemy, before.enemy);
});

test('structural ring corners cannot pretend to make a shared passage', () => {
  for (const layout of n.options().layouts) {
    n.start('practice', { layout: layout.id, pursuer: 'hunter' });
    collectUpgrade(layout);
    const before = n.view(), width = Math.sqrt(before.map.length);
    const brickCells = before.map.flatMap((tile, i) => tile === 'b' ? [i] : []);
    const xs = brickCells.map(i => i % width), ys = brickCells.map(i => Math.floor(i / width));
    for (const x of [Math.min(...xs), Math.max(...xs)]) for (const y of [Math.min(...ys), Math.max(...ys)]) {
      assert.equal(before.map[y * width + x], '#', `${layout.id}: a corner is visibly fixed rock`);
      assert.equal(n.aim(x, y), false, `${layout.id}: a structural corner cannot start mining`);
      assert.equal(n.view().mining, null);
      assert.equal(n.view().enemy.released, false, 'a rejected corner action cannot release a pursuer');
      assert.doesNotMatch(n.view().message, /now.*(?:follow|pursu)/i, 'do not announce an opening that did not happen');
    }
  }
});

test('new laboratory attempts do not overwrite or import older trial and original woods saves', () => {
  const oldKey = 'tn.d2.nether.v1', newKey = 'tn.d2.lab.v2';
  const oldTrial = '{"version":1,"origin":"practice","status":"playing","lives":1,"upgrade":0}';
  const woods = 'ORIGINAL_WOODS_SAVE_SENTINEL';
  global.localStorage.setItem(oldKey, oldTrial);
  global.localStorage.setItem('tn.save', woods);
  n.start('practice', { layout: 'ember', pursuer: 'hunter' });
  assert.equal(JSON.parse(global.localStorage.getItem(newKey)).version, 2);
  assert.equal(global.localStorage.getItem(oldKey), oldTrial);
  assert.equal(global.localStorage.getItem('tn.save'), woods);
  global.localStorage.removeItem(newKey);
  assert.equal(n.resume(), false, 'an old version is not a new lab attempt');
  assert.equal(global.localStorage.getItem(oldKey), oldTrial);
  assert.equal(global.localStorage.getItem('tn.save'), woods);
});

test('exported local play notes preserve the child wording and do not mutate or save the attempt', () => {
  n.start('practice', { layout: 'forge', pursuer: 'runner' });
  const before = n.view();
  const feedback = { exciting: 'I tricked it by the rocks!', unfair: 'That turn was tiny.', next: 'Try the other maze.' };
  const originalSet = global.localStorage.setItem;
  let writes = 0, notes;
  try {
    global.localStorage.setItem = function () { writes++; throw new Error('export must not write storage'); };
    notes = JSON.parse(n.exportNotes(feedback));
  } finally { global.localStorage.setItem = originalSet; }
  assert.equal(writes, 0);
  assert.deepEqual(notes.feedback, feedback);
  assert.equal(notes.attempt.layout, 'forge');
  assert.equal(notes.attempt.pursuer, 'runner');
  assert.equal(notes.attempt.lives, before.lives);
  assert.equal(notes.attempt.status, before.status);
  assert.deepEqual(n.view(), before, 'producing feedback cannot restart or change the chase');
});

test('touching the exit with zero or one beacon cannot win; both beacons unlock a real escape', () => {
  const layout = layoutFor('ember');
  n.setPreferences({ dodge: true });
  n.start('practice', { layout: layout.id, pursuer: 'hunter' });
  collectUpgrade(layout);
  mine(layout.suggestedBreaches[0]);
  walkTo({ x: layout.start.x, y: layout.start.y + 1 }, 'lure the pursuer toward the refuge');
  walkTo(layout.goal, 'physically reach the exit before lighting any beacon');
  assert.equal(n.view().beacons.filter(beacon => beacon.lit).length, 0);
  assert.equal(n.view().status, 'playing', 'an exit visit with zero beacons is not a win');
  // The stronger chase can cost a life. Exercise the real retained-progress
  // recovery instead of depending on the former slow Runner's exact timing.
  function reachWithReturns(point, done) {
    for(let tries=0;tries<3;tries++){
      if(n.view().awaitingReturn){
        n.resumeRecovery();
        advanceUntil(v=>Math.hypot(v.enemy.x-layout.refugeWait.x,v.enemy.y-layout.refugeWait.y)<.02,'wait safely before leaving refuge');
      }
      assert.equal(n.aim(point.x,point.y),true);
      advanceUntil(v=>done(v)||v.awaitingReturn,'reach objective or take retained return');
      if(done(n.view()))return;
    }
    assert.fail('objective must be reachable within the three-life budget');
  }
  reachWithReturns(layout.beacons[1],v=>v.beacons[1].lit);
  reachWithReturns(layout.goal,v=>Math.hypot(v.hero.x-layout.goal.x,v.hero.y-layout.goal.y)<.02);
  assert.equal(n.view().beacons.filter(beacon => beacon.lit).length, 1);
  assert.equal(n.view().status, 'playing', 'an exit visit with only one beacon is not a win');
  const spent=n.view().losses.length;
  const caught = advanceUntil(state => state.losses.length>spent, 'a lit beacon survives the next real catch');
  assert.equal(caught.beacons[1].lit, true);
  n.persist(); n.leave();
  assert.equal(n.resume(), true);
  assert.equal(n.view().beacons[1].lit, true, 'Continue retains earned beacon progress');

  // A separate unmodified attempt supplies the positive case, using player actions.
  n.start('practice', { layout: layout.id, pursuer: 'runner' });
  collectUpgrade(layout);
  mine(layout.suggestedBreaches[0]);
  reachWithReturns(layout.beacons[0],v=>v.beacons[0].lit);
  reachWithReturns(layout.beacons[1],v=>v.beacons[1].lit);
  assert.equal(n.view().beacons.every(beacon => beacon.lit), true);
  reachWithReturns(layout.goal,v=>v.status==='won');
  assert.ok(n.view().lives > 0);
});

test('the Runner stops for its declared wind-up before rushing and then resting', () => {
  const layout = layoutFor('ember');
  n.setPreferences({ dodge: true });
  n.start('practice', { layout: layout.id, pursuer: 'runner' });
  collectUpgrade(layout);
  mine(layout.suggestedBreaches[0]);
  assert.equal(n.aim(layout.start.x, layout.start.y), true, 'the player can lead the runner toward safe refuge');
  const warning = advanceUntil(state => state.enemy.phase === 'windup', 'runner declares a wind-up');
  const position = [warning.enemy.x, warning.enemy.y];
  for (let i = 0; i < 6; i++) n.step(TICK);
  assert.equal(n.view().enemy.phase, 'windup');
  assert.deepEqual([n.view().enemy.x, n.view().enemy.y], position, 'the warning must create a real movement opportunity');
  advanceUntil(state => state.enemy.phase === 'burst', 'wind-up is followed by its announced rush');
  advanceUntil(state => state.enemy.phase === 'rest', 'a rush is followed by a recovery period');
  assert.equal(n.view().lives, 3, 'following the refuge route survives the declared cycle');
});

test('exactly three real void falls end the attempt and Continue cannot revive the exhausted budget', () => {
  const layout = layoutFor('switchback'), width = Math.sqrt(layout.map.length);
  const voidCell = layout.map.findIndex(tile => tile === 'v');
  assert.ok(voidCell >= 0, 'the map includes its clearly marked void hazard');
  n.start('practice', { layout: layout.id, pursuer: 'runner' });
  for (const remaining of [2, 1, 0]) {
    assert.equal(n.aim(voidCell % width, Math.floor(voidCell / width)), true);
    const fall = advanceUntil(state => state.lives === remaining, 'one deliberate void entry costs one life');
    assert.equal(fall.losses.length, 3 - remaining);
    assert.equal(fall.losses.at(-1).cause, 'void');
    if (remaining) {
      assert.equal(fall.awaitingReturn, true);
      assert.equal(n.resumeRecovery(), true);
      advanceUntil(state => state.recovery === 0, 'leave the brief safe reset presentation');
    }
  }
  const terminal = n.view();
  assert.equal(terminal.status, 'lost');
  assert.equal(terminal.lives, 0);
  assert.equal(n.resumeRecovery(), false);
  assert.equal(n.aim(layout.upgrade.x, layout.upgrade.y), false);
  for (let i = 0; i < 100; i++) n.step(TICK);
  assert.deepEqual(n.view(), terminal, 'ended attempts cannot silently restart or move');
  n.persist(); n.leave();
  assert.equal(n.resume(), true);
  assert.equal(n.view().status, 'lost');
  assert.equal(n.view().lives, 0);
  assert.deepEqual(n.view().losses, terminal.losses);
  n.replay();
  assert.equal(n.view().layout, layout.id);
  assert.equal(n.view().pursuer, 'runner');
  assert.equal(n.view().lives, 3, 'only an explicit new attempt resets the budget');
  assert.equal(n.view().losses.length, 0);
});

test('corrupt or incompatible save input cannot replace the current earned attempt', () => {
  const layout = layoutFor('ember'), key = 'tn.d2.lab.v2';
  n.start('practice', { layout: layout.id, pursuer: 'hunter' });
  exposePursuer(layout);
  advanceUntil(state => state.awaitingReturn, 'spend a real life before attempting invalid Continue input');
  n.persist();
  const validSave = global.localStorage.getItem(key), before = n.view();
  const invalidSaves = ['{broken JSON'];
  for (const alter of [
    save => { save.version = 999; },
    save => { save.lives = -1; },
    save => { save.layout = 'missing-maze'; },
    save => { save.map[0] = '.'; },
    save => { save.status = 'won'; }
  ]) {
    const modified = JSON.parse(validSave);
    alter(modified);
    invalidSaves.push(JSON.stringify(modified));
  }
  for (const corrupted of invalidSaves) {
    global.localStorage.setItem(key, corrupted);
    assert.equal(n.resume(), false, 'invalid data must be rejected explicitly');
    assert.deepEqual(n.view(), before, 'failed Continue must preserve the current two-life attempt');
  }
  global.localStorage.setItem(key, validSave);
  assert.equal(n.resume(), true);
  assert.equal(n.view().lives, 2);
  assert.equal(n.view().upgrade, 1);
});

test('a changed movement target reverses mid-tile and completes the final fraction of the requested route', () => {
  const layout = layoutFor('ember');
  n.start('practice', { layout: layout.id, pursuer: 'hunter' });
  assert.equal(n.aim(layout.start.x, layout.start.y - 4), true);
  n.step(TICK);
  const departing = n.view().hero.y;
  assert.ok(departing < layout.start.y);
  assert.equal(n.aim(layout.start.x, layout.start.y), true);
  n.step(.025);
  assert.ok(n.view().hero.y > departing, 'a reversed aim must not finish the wrong-way tile first');
  advanceUntil(state => state.hero.y === layout.start.y, 'finish the retained fractional route');
  assert.equal(n.view().hero.x, layout.start.x);
  assert.equal(n.aim(layout.start.x, layout.start.y - 1), true);
  n.step(TICK);
  assert.equal(n.aim(layout.start.x, layout.start.y), true);
  advanceUntil(state => state.hero.y === layout.start.y, 'reach the exact requested tile even when its rounded cell has not changed');
  n.step(TICK);
  assert.deepEqual([n.view().hero.x, n.view().hero.y], [layout.start.x, layout.start.y], 'arrival stays at the requested destination');
});

test('the actual Night 20 dawn preserves woods completion and enters the lab without an ultimate ending', async () => {
  g.newGame();
  g.S.day = 20;
  g.S.phase = 'night';
  g.S.pips = Array(20).fill(1);
  g.S.wood = 37;
  const unrelated = 'REAL_GAME_SAVE_SENTINEL';
  global.localStorage.setItem('tn.save', unrelated);
  g.dawn(true, false);
  await new Promise(resolve => setTimeout(resolve, 2350));
  assert.equal(n.isActive(), true);
  assert.equal(n.view().origin, 'woods');
  assert.equal(n.view().status, 'playing');
  assert.equal(n.view().lives, 3);
  assert.equal(g.S.running, false, 'the woods simulation stops during the Nether attempt');
  const completed = JSON.parse(g.store.get('tn.woods-complete'));
  assert.equal(completed.day, 20);
  assert.equal(completed.wood, 37);
  assert.deepEqual(completed.pips, Array(20).fill(1));
  assert.equal(global.localStorage.getItem('tn.save'), unrelated);
  n.replay();
  assert.equal(g.store.get('tn.woods-complete'), JSON.stringify(completed), 'a Nether replay preserves the completed woods checkpoint');
});


test('blocked browser storage keeps local play available and reports save failure', () => {
  const original=global.localStorage.setItem;
  try {
    global.localStorage.setItem=()=>{throw new Error('blocked storage');};
    assert.doesNotThrow(()=>n.start('practice', {layout:'forge',pursuer:'runner'}));
    assert.equal(n.persist(),false);
    assert.equal(n.view().lives,3);
    assert.equal(n.view().layout,'forge');
    const before=n.view().hero.y;
    n.aim(2,14);n.step(.05);
    assert.ok(n.view().hero.y<before);
  } finally {global.localStorage.setItem=original;}
});
