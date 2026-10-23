// This reward exists only in the Storm Hammer copy's isolated woods save.
function stormWoodsAttack(){
  if(!S.stormHammer||!S.running||S.hero.cd>0||S.hero.daze>0)return false;
  const h=S.hero,targets=S.monsters.filter(m=>Math.hypot(m.fx-h.fx,m.fy-h.fy)<=3.2)
    .sort((a,b)=>Math.hypot(a.fx-h.fx,a.fy-h.fy)-Math.hypot(b.fx-h.fx,b.fy-h.fy));
  const first=targets[0];if(!first)return false;
  h.cd=.9;h.lunge=1;h.lx=first.fx-h.fx;h.ly=first.fy-h.fy;
  // The charged reward chains to at most three nearby targets in the woods.
  let previous={fx:h.fx,fy:h.fy};
  for(const m of targets.slice(0,3)){
    S.tracers.push({x1:previous.fx+.5,y1:previous.fy+.5,x2:m.fx+.5,y2:m.fy+.5,life:.24,lightning:true});
    if(m.plates>0)m.plates=Math.max(0,m.plates-2);
    hitMonster(m,3,'lightning');previous=m;
  }
  snd.gem();return true;
}
function drawStormWoodsHammer(){
  if(!S.stormHammer)return;
  ctx.save();ctx.translate(14,-3);ctx.rotate(-.25-S.hero.lunge*.5);
  ctx.fillStyle='#142135';ctx.fillRect(-3,-1,6,20);ctx.fillStyle='#bb8c50';ctx.fillRect(-1,0,2,17);
  ctx.fillStyle='#7291ad';ctx.fillRect(-11,-12,22,12);ctx.strokeStyle='#d1f7ff';ctx.lineWidth=2;ctx.strokeRect(-11,-12,22,12);
  ctx.strokeStyle='#a7f6ff';ctx.beginPath();ctx.moveTo(2,-11);ctx.lineTo(-3,-6);ctx.lineTo(2,-6);ctx.lineTo(-2,-1);ctx.stroke();ctx.restore();
}
