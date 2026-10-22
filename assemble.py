from pathlib import Path
import re
r=Path(__file__).parent;s=r/'src';base=(r/'baseline/index.html').read_text()
a=base.index('const NetherTrial = (() => {');b=base.index('/* ═══════════════ 13 · GAME LOOP',a)
engine=(s/'engine.js').read_text()
for marker,file in [('MAPS','layout.js'),('ROUTE','route.js'),('UI','ui.js'),('DRAW','art.js'),('INPUT','input.js')]:
 text=(s/file).read_text().split('// Omit this footer')[0]
 engine=engine.replace('  /* NETHER_'+marker+' */',text)
result=base[:a]+engine+'\n\n'+base[b:]
result=result.replace('tn.d2lab.','tn.d3trial2.').replace('<title>Twenty Nights','<title>Two-Layer Trial · Twenty Nights')
markup=(s/'ui.html').read_text();parts={};matches=list(re.finditer(r'<!-- NETHER FRAGMENT: ([A-Z]+).*?-->',markup,re.S))
for i,m in enumerate(matches):parts[m.group(1)]=markup[m.end():matches[i+1].start() if i+1<len(matches) else len(markup)].strip()
for id,key,end in [('nHud','HUD','</header>'),('nHelp','GUIDANCE','</section>'),('title','TITLE','</section>'),('nSettings','SETTINGS','</section>'),('nReturn','RETURN','</section>'),('nEnd','END','</section>')]:
 m=re.search(r'<(?:header|section)[^>]*id="'+id+r'"[^>]*>',result);a=m.start();b=result.index(end,a)+len(end);result=result[:a]+parts[key]+result[b:]
result=result.replace('</style>','\n.nCombinedMap{display:flex;gap:20px;align-items:center}.nCombinedMap .nMapPreview{width:200px;flex:none}.nCombinedMap h2{font-size:20px;margin:0 0 8px}.nCombinedMap p{margin:6px 0;line-height:1.5}@media(max-width:600px){.nCombinedMap{display:block}.nCombinedMap .nMapPreview{display:none}}\n</style>',1)
assert '/* NETHER_' not in result
(r/'index.html').write_text(result)
print('Assembled TN-D3-01 independently; D2 unchanged.')
