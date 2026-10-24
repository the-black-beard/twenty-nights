from pathlib import Path
import re
r=Path(__file__).parent;s=r/'src';base=(r/'baseline/index.html').read_text()
a=base.index('const NetherTrial = (() => {');b=base.index('/* ═══════════════ 13 · GAME LOOP',a)
engine=(s/'engine.js').read_text()
for marker,file in [('MAPS','layout.js'),('ROUTE','route.js'),('UI','ui.js'),('DRAW','art.js'),('INPUT','input.js'),('AUDIO','audio.js')]:
 text=(s/file).read_text().split('// Omit this footer')[0]
 engine=engine.replace('  /* NETHER_'+marker+' */',text)
result=base[:a]+engine+'\n\n'+base[b:]
result=result.replace('tn.d2lab.','tn.mazeshapes1.').replace('<title>Twenty Nights','<title>Maze Shapes · Twenty Nights')
markup=(s/'ui.html').read_text();parts={};matches=list(re.finditer(r'<!-- NETHER FRAGMENT: ([A-Z]+).*?-->',markup,re.S))
for i,m in enumerate(matches):parts[m.group(1)]=markup[m.end():matches[i+1].start() if i+1<len(matches) else len(markup)].strip()
for id,key,end in [('nHud','HUD','</header>'),('nHelp','GUIDANCE','</section>'),('title','TITLE','</section>'),('nSettings','SETTINGS','</section>'),('nReturn','RETURN','</section>'),('nEnd','END','</section>')]:
 m=re.search(r'<(?:header|section)[^>]*id="'+id+r'"[^>]*>',result);a=m.start();b=result.index(end,a)+len(end);result=result[:a]+parts[key]+result[b:]
result=result.replace('</style>',(s/'ui.css').read_text()+'\n'+'\n.nCombinedMap{display:flex;gap:20px;align-items:center}.nCombinedMap .nMapPreview{width:200px;flex:none}.nCombinedMap h2{font-size:20px;margin:0 0 8px}.nCombinedMap p{margin:6px 0;line-height:1.5}@media(max-width:600px){.nCombinedMap{display:block}.nCombinedMap .nMapPreview{display:none}}\n</style>',1)

# Explicit, asserted seams in the frozen woods baseline; no baseline mutation.
def patch_once(old,new):
    global result
    assert result.count(old)==1, f'Woods hook mismatch: {old[:50]}'
    result=result.replace(old,new,1)
patch_once('function musicTick(){', "function musicTick(){\n  if(document.hidden||NetherTrial.isActive()){if(AC&&MUS.master){MUS.master.gain.cancelScheduledValues(AC.currentTime);MUS.master.gain.setValueAtTime(0,AC.currentTime);MUS.next=AC.currentTime+.1;}return;}")
patch_once('function updateHero(dt){', (s/'woods-hammer.js').read_text()+'\nfunction updateHero(dt){')
patch_once('if (h.cd <= 0){\n    // SOFT TARGETS FIRST', 'if (h.cd <= 0 && !stormWoodsAttack()){\n    // SOFT TARGETS FIRST')
patch_once('ironSword:S.ironSword,', 'ironSword:S.ironSword, stormHammer:!!S.stormHammer,')
patch_once('S.ironSword = !!d.ironSword;', 'S.ironSword = !!d.ironSword; S.stormHammer=!!d.stormHammer;')
patch_once('S.ironSword = false; S.ironBarked', 'S.stormHammer=false; S.ironSword = false; S.ironBarked')
patch_once('const my = hs*.22;', 'drawStormWoodsHammer();\n    const my = hs*.22;')
patch_once('ctx.strokeStyle = PAL.dart; ctx.globalAlpha = Math.max(0, tr.life*7);', 'ctx.strokeStyle = tr.lightning ? "#a7f6ff" : PAL.dart; ctx.globalAlpha = Math.min(1, Math.max(0, tr.life*7));')
patch_once('ctx.moveTo(tr.x1*TILE, tr.y1*TILE); ctx.lineTo(tr.x2*TILE, tr.y2*TILE); ctx.stroke();', 'ctx.moveTo(tr.x1*TILE,tr.y1*TILE); if(tr.lightning){const mx=(tr.x1+tr.x2)*TILE/2,my=(tr.y1+tr.y2)*TILE/2;ctx.lineTo(mx+4,my-4);ctx.lineTo(mx-4,my+4);} ctx.lineTo(tr.x2*TILE,tr.y2*TILE);ctx.stroke();')

assert '/* NETHER_' not in result
(r/'index.html').write_text(result)
print('Assembled Maze Shapes independently; preserved games unchanged.')
