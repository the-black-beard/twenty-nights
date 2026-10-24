'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const n=require('./harness').NetherTrial,$=id=>document.getElementById(id);
const launch=(pair,side)=>{$('nPair'+pair).click();$('nVariant'+side).click();$('nStart').click();const s=n.view();n.leave();return s;};

test('the three pathway cards launch the map pictured, with matching HUD identity',()=>{
 for(const [side,layout] of [['A','rectangular-descent-v1'],['B','loop-islands-v1'],['C','snake-race-v1']]){
  const s=launch('Paths',side);assert.equal(s.layout,layout);
  assert.ok($('nMode').textContent.includes(n.options().layouts.find(l=>l.id===layout).name));
 }
});
test('boundary cards reuse the island baseline and expose stepped and castle alternatives',()=>{
 for(const [side,layout] of [['A','loop-islands-v1'],['B','stepped-islands-v1'],['C','castle-islands-v1']]){
  const s=launch('Boundaries',side);assert.equal(s.layout,layout);
  assert.ok($('nVariant'+side+'Art').innerHTML.includes('data-layout="'+layout+'"'));
 }
});
test('each preview uses the complete playable dimensions and actual terrain',()=>{
 $('nPairPaths').click();
 for(const [side,id] of [['A','rectangular-descent-v1'],['B','loop-islands-v1'],['C','snake-race-v1']]){
  const l=n.options().layouts.find(x=>x.id===id),svg=$('nVariant'+side+'Art').innerHTML;
  assert.ok(svg.includes('viewBox="0 0 '+l.width+' '+l.height+'"'));
  assert.ok(svg.includes('data-map-cells="'+l.map.length+'"'));
  const floor=l.map.findIndex(t=>t==='.');assert.ok(svg.includes('M'+floor%l.width+' '+Math.floor(floor/l.width)+'h1v1h-1z'));
 }
 assert.notEqual($('nVariantAArt').innerHTML,$('nVariantBArt').innerHTML);
});
test('a custom chase keeps the chosen map and recorded movement settings',()=>{
 $('nCustomLayout').value='castle-islands-v1';$('nCustomControl').value='swipe';$('nCustomBrain').value='committed';$('nCustomLayers').value='one';$('nCustomWalls').value='free';$('nCustomCues').value='on';$('nCustomStart').click();
 const s=n.view();assert.equal(s.layout,'castle-islands-v1');assert.equal(s.trial.control,'swipe');assert.equal(s.pursuer,'one');n.leave();
});
