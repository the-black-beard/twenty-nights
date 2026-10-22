// Boot the real game file headless in Node, with just enough DOM to run.
// Usage: node tools/tests.js     (the browser pane caches; this never lies.)
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const js = src.match(/<script>([\s\S]*)<\/script>/)[1];

// Elements are memoised by id and carry a REAL class list + parent links, so UI
// state (is the build sheet open? which row holds the material chips?) is testable.
const nodes = {};
const el = (id) => {
  const cls = new Set();
  const node = {
    id: id || '', children: [], parentNode: null,
    classList:{
      add(...c){ c.forEach(x => cls.add(x)); },
      remove(...c){ c.forEach(x => cls.delete(x)); },
      contains(c){ return cls.has(c); },
      toggle(c, f){ const on = f === undefined ? !cls.has(c) : !!f;
                    if (on) cls.add(c); else cls.delete(c); return on; },
    },
    appendChild(n){ if (n.parentNode) n.parentNode.remove_(n);
                    n.parentNode = node; node.children.push(n); return n; },
    insertBefore(n){ return node.appendChild(n); },
    remove_(n){ const i = node.children.indexOf(n); if (i >= 0) node.children.splice(i, 1); },
    listeners:{},
    addEventListener(type,handler){(this.listeners[type] ||= []).push(handler);},
    click(){for(const handler of this.listeners.click||[])handler({preventDefault(){}});},
    setAttribute(){}, removeAttribute(){}, toggleAttribute(){},
    style:{}, dataset:{}, textContent:'', innerHTML:'', value:'', hasAttribute(){return false},
    getBoundingClientRect:()=>({left:0,top:0,width:640,height:640}),
    getContext:()=>new Proxy({}, {get:()=>()=>({addColorStop(){}})}),
    querySelectorAll:()=>[], querySelector:()=>el(), closest:()=>null, width:0, height:0,
  };
  return node;
};
const byId = (id) => nodes[id] || (nodes[id] = el(id));

global.window = { addEventListener(){}, matchMedia:()=>({matches:false,addEventListener(){}}),
  devicePixelRatio:1 };
global.document = { getElementById:byId, querySelectorAll:()=>[], querySelector:()=>el(),
  createElement:el, addEventListener(){}, documentElement:el(), body:el() };
global.localStorage = { _d:{}, getItem(k){return this._d[k]??null},
  setItem(k,v){this._d[k]=String(v)}, removeItem(k){delete this._d[k]} };
global.requestAnimationFrame = () => 0;
global.setInterval = () => 0;                 // don't let the music scheduler run
global.location = { search:'', hash:'' };
global.PointerEvent = global.MouseEvent = global.KeyboardEvent = global.Event = function(){};
global.performance = { now: () => 0 };

const EXPORTS = ['NetherTrial','dawn','S','grid','wreck','regrow2','wallHP','nodeHP','regrow','idx','N','breakBuilt',
  'restoreBuilt','tinkerList','nextCell','scanStep','computeField','sealsHeart','canPlace','G_WALL',
  'G_WRECK','G_SWALL','G_TOWER','G_SPIKE','G_MUD','G_GRASS','G_FIRE','isBuilt','isChewable',
  'updateMonsters','KINDS','PORTALS','HEART','dist','digDist','newGame','doTrade','STALLS','wakeGolem',
  'sleepGolem','updateGolem','GOLEM_HOME','walkable','pipCls','buildWave','waveSize','OPT','save','load',
  'fortSize','musicMood','MUS','SCALE','scheduleStep','snd','DAY_LEN','hungry',
  'WAVE','WEATHER','weather','isFoggy','isBlood','isStormy','baseWave','LANTERN','LSTAGES',
  'ALEX_CAMPS','lanternRing','lanternAdd','lanternClaim','G_LANTERN','emote','face','fortTier',
  'nightCount','restoreBuilt','VILLAGE_DAY','BRUTES','hitMonster','spikeCheck','updateTowers','G_DEEP','G_DWALL','DEEPS','bruteDist',
  'computeBruteField','bruteGoals','diggerChews','isWall2','WALL_HP','COSTS','canAfford','payFor',
  'updateHero','urgency','OPT_DEF','sfxVol','musVol','emote','FRONTS','hint',
  'LIGHT_FEAR','FIRE_LIGHT','FIRE_MAX','litAt','fireCount','fireIndex','G_FIRE','KINDS',
  'BAR','struck','hiss','ring','duck','HEART','VOWEL','voice','syllable','placeNest',
  'marketDay','offerFor','OFFERS','meatCount','G_TORCH','TORCH_LIGHT','LIGHT_COST',
  'lightMap','computeLight','PORTALS','sealsHeart','squabbles','updateMonsters',
  'nearFire','updateTowers','G_TABLE','TABLE','FIRE_MAX','fireCount',
  'FB','FB_BEST','FB_HARD','FB_AGAIN','fbOn','fbPick','fbText','fbRender','farthest',
  'confetti','winGame','PRESET_NAME','store','DAY_WORDS','NIGHT_WORDS','MOB_WORDS',
  'bragLines','bragText','bragWorth','PIP_EMOJI','bragName','setBragName',
  'isPhone','visibleMats','useMatSheet','matsOpen','openMats','closeMats','syncMats',
  'applyMatLayout','MAT_IDS','MAT_ICON','toggleMode','refreshHUD','G_TORCH','G_WALL'];
module.exports = new Function(js + '\n;return {' +
  EXPORTS.map(n => `${n}: typeof ${n} !== "undefined" ? ${n} : undefined`).join(',') + '};')();
