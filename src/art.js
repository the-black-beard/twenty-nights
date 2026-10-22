/* World-only art: 32px cells, no camera/DOM/global game helpers or external art. */
function drawNetherWorld(ctx,state,scene,prefs={},viewport=null) {
  const T=32, cols=scene.width, rows=scene.height, hi=!!prefs.highContrast, time=prefs.reducedMotion?0:(state.elapsed||0);
  const wallColors={b:'#d28b5d',c:'#c29be9',d:'#b7d1d8',e:'#f18a9e'};
  const ink='#10131d', pale='#f6edda', gold='#ffe28b', teal='#91f3db';
  const rect=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
  const poly=(points,color,edge=null)=>{ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=color;ctx.fill();if(edge){ctx.strokeStyle=edge;ctx.lineWidth=2;ctx.stroke();}};
  const line=(points,color,width=2)=>{ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();};
  const ring=(x,y,r,color,width=2,start=0,end=Math.PI*2)=>{ctx.beginPath();ctx.arc(x,y,r,start,end);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();};
  const label=(value,x,y,color=pale,size=10)=>{ctx.font='bold '+size+'px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=3;ctx.strokeStyle=ink;ctx.strokeText(value,x,y);ctx.fillStyle=color;ctx.fillText(value,x,y);};
  const point=p=>({x:(p.x+.5)*T,y:(p.y+.5)*T});
  const refuge=scene.refuge, safe=(x,y)=>x>=refuge.x1&&x<=refuge.x2&&y>=refuge.y1&&y<=refuge.y2;
  ctx.save();ctx.lineJoin='round';ctx.lineCap='round';rect(0,0,cols*T,rows*T,'#201d29');
  const left=viewport?Math.max(0,Math.floor(viewport.x/T)):0, top=viewport?Math.max(0,Math.floor(viewport.y/T)):0;
  const right=viewport?Math.min(cols,Math.ceil((viewport.x+viewport.width)/T)):cols, bottom=viewport?Math.min(rows,Math.ceil((viewport.y+viewport.height)/T)):rows;
  for(let y=top;y<bottom;y++)for(let x=left;x<right;x++){
    const i=y*cols+x, tile=state.map[i], px=x*T, py=y*T, grain=(x*19+y*31)%17;
    rect(px,py,T,T,(x+y)%2?(hi?'#292b35':'#322a35'):(hi?'#23252e':'#2d2632'));
    rect(px+3,py+3,T-6,1,'rgba(185,155,161,.08)');
    rect(px+6+grain,py+20+(grain%5),4,1,'rgba(206,179,162,.12)');
    if(safe(x,y)){
      rect(px,py,T,T,(x+y)%2?'#205b65':'#1c505d');
      rect(px+5,py+5,22,1,'rgba(145,243,219,.12)');
    }
    if(tile==='#'){
      rect(px,py,T,T,ink);
      poly([[px+2,py+3],[px+26,py+1],[px+30,py+8],[px+28,py+29],[px+3,py+30]],hi?'#637b90':'#334252');
      poly([[px+3,py+3],[px+25,py+2],[px+28,py+7],[px+5,py+9]],hi?'#91aabd':'#566575');
      poly([[px+5,py+10],[px+28,py+8],[px+27,py+25],[px+6,py+28]],hi?'#4e657c':'#2c3748');
      line([[px+12,py+10],[px+10,py+18],[px+15,py+22]],'#202b3b',1);
      rect(px+6,py+28,21,2,'#1d2635');
    }else if(tile==='c'){
      rect(px,py,T,T,'#322239');rect(px+2,py+2,28,28,hi?'#a185d1':'#67528b');
      poly([[px+3,py+4],[px+15,py+2],[px+29,py+11],[px+26,py+28],[px+12,py+30],[px+3,py+21]],'#8b6bb2','#3c2d52');
      line([[px+5,py+7],[px+15,py+4],[px+26,py+12]],'#dbb7f6',2);label('2',px+16,py+17,'#fff0ff',10);
    }else if(tile==='b'){
      rect(px,py,T,T,'#3a2329');
      rect(px+1,py+2,30,13,hi?'#e78d62':'#a75845');
      rect(px+1,py+17,30,13,hi?'#ca6c50':'#87473f');
      rect(px+3,py+3,26,2,state.upgrade?'#ecad78':'#cb8763');
      rect(px+3,py+18,26,2,'#b97157');
      rect(px+15,py+2,2,13,'#4b2a2c');rect(px+7,py+17,2,13,'#47282c');
      rect(px+29,py+3,2,11,'#6c3933');rect(px+29,py+18,2,11,'#61342f');
      rect(px+12,py+10,9,12,'#482a2c');label('1',px+16,py+16,'#ffd59b',10);
    }else if(tile==='d'){
      rect(px,py,T,T,'#26333f');rect(px+2,py+2,28,28,hi?'#a9bdc5':'#70868f');
      rect(px+4,py+4,24,3,'#bed3db');rect(px+4,py+9,24,17,'#4d6470');
      for(const dx of [5,25])for(const dy of [5,26]){rect(px+dx-1,py+dy-1,3,3,'#d8e5e8');rect(px+dx,py+dy,1,1,'#31404c');}
      label('3',px+16,py+17,'#effaff',10);
    }else if(tile==='e'){
      rect(px,py,T,T,'#321d30');rect(px+2,py+2,28,28,hi?'#c96683':'#7d3c59');
      poly([[px+3,py+5],[px+15,py+2],[px+29,py+6],[px+25,py+27],[px+14,py+30],[px+4,py+24]],'#4d2945','#bb5b79');
      line([[px+6,py+8],[px+16,py+4],[px+26,py+8]],'#f196a8',2);
      line([[px+6,py+24],[px+15,py+28],[px+25,py+24]],'#bf657b',2);
      label('4',px+16,py+17,'#ffe2ed',10);
    }else if(tile==='v'){
      rect(px,py,T,T,'#100c1f');rect(px+4,py+5,24,25,'#191029');
      const edge=hi?'#d2a4ff':'#a273d1';
      line([[px+2,py+3],[px+12,py+8],[px+20,py+4],[px+30,py+10]],edge,2);
      line([[px+4,py+24],[px+12,py+19],[px+18,py+27],[px+30,py+23]],'#70429a',2);
      line([[px+13,py+10],[px+16,py+15],[px+12,py+20]],'#4a285e',1);
    }else if(wallColors[scene.map[i]]){
      rect(px+2,py+3,5,3,wallColors[scene.map[i]]);rect(px+24,py+24,5,4,wallColors[scene.map[i]]);
      rect(px+3,py+25,3,3,'#b27457');rect(px+25,py+4,4,3,'#b27457');
      line([[px+9,py+17],[px+13,py+19],[px+19,py+15]],'#58404a',1);
    }
  }
  // A clean boundary and two escape arrows teach the safe region without prose.
  const rx=refuge.x1*T, ry=refuge.y1*T, rw=(refuge.x2-refuge.x1+1)*T, rh=(refuge.y2-refuge.y1+1)*T;
  ctx.strokeStyle=teal;ctx.lineWidth=2;ctx.strokeRect(rx+2,ry+2,rw-4,rh-4);
  for(const [x,y] of [[rx+2,ry+2],[rx+rw-6,ry+2],[rx+2,ry+rh-6],[rx+rw-6,ry+rh-6]])rect(x,y,4,4,teal);
  label('SAFE',rx+rw/2,ry+rh-14,'#b6fff0',10);
  for(const exit of scene.recoveryExits){
    const p=point(exit), north=exit.y<refuge.y1;
    if(north)line([[p.x-5,p.y+3],[p.x,p.y-3],[p.x+5,p.y+3]],teal,2);
    else line([[p.x-3,p.y-5],[p.x+3,p.y],[p.x-3,p.y+5]],teal,2);
  }
  // This uses the real planned route, never a second simulation of it.
  if(prefs.showRoute&&state.hero.path.length){
    ctx.setLineDash([2,6]);const p=point(state.hero), path=[[p.x,p.y],...state.hero.path.map(i=>[(i%cols+.5)*T,(Math.floor(i/cols)+.5)*T])];
    line(path,'rgba(113,229,232,.6)',2);ctx.setLineDash([]);
  }
  if(prefs.showRoute&&state.target){const p=point(state.target);ring(p.x,p.y,8,'#b2ffff',2);rect(p.x-2,p.y-2,4,4,'#b2ffff');}
  const unlocked=state.cores.every(c=>c.collected);
  for(const core of state.cores){
    const p=point(core);
    if(core.collected){ring(p.x,p.y,9,'#607a72',1);line([[p.x-4,p.y],[p.x-1,p.y+3],[p.x+5,p.y-4]],'#91c8ad',2);continue;}
    ring(p.x,p.y,14,'rgba(157,255,217,.25)',2);
    poly([[p.x,p.y-14],[p.x+11,p.y],[p.x,p.y+14],[p.x-11,p.y]],'#baffde',ink);
    poly([[p.x,p.y-14],[p.x,p.y+14],[p.x+11,p.y]],'#53bbac');
    line([[p.x-5,p.y-3],[p.x,p.y-9],[p.x+3,p.y-5]],'#effff5',2);
    label(String(core.tier),p.x,p.y+1,'#f4fff8',8);
  }
  const gp=point(scene.goal);
  ctx.beginPath();ctx.ellipse(gp.x,gp.y+11,15,7,0,0,Math.PI*2);ctx.fillStyle=unlocked?'#174d45':'#242e35';ctx.fill();
  ctx.beginPath();ctx.ellipse(gp.x,gp.y,12,16,0,0,Math.PI*2);ctx.fillStyle=unlocked?'#113c34':'#202c32';ctx.fill();ctx.strokeStyle=unlocked?'#98ffd0':'#69867c';ctx.lineWidth=3;ctx.stroke();
  if(unlocked){ctx.beginPath();ctx.ellipse(gp.x,gp.y,7,11,0,0,Math.PI*2);ctx.strokeStyle='#3d9e7b';ctx.lineWidth=2;ctx.stroke();line([[gp.x-4,gp.y],[gp.x+3,gp.y],[gp.x,gp.y-4],[gp.x+4,gp.y],[gp.x,gp.y+4]],'#b8ffe0',2);}
  else{line([[gp.x-5,gp.y-2],[gp.x-5,gp.y-7],[gp.x+5,gp.y-7],[gp.x+5,gp.y-2]],'#bbcab6',2);rect(gp.x-7,gp.y-2,14,10,'#99a99b');rect(gp.x-1,gp.y+1,2,5,'#263a35');}
  label('EXIT',gp.x,gp.y+10,unlocked?'#b6ffdc':'#bac8bd',7);
  for(const upgrade of scene.upgrades){
    if(state.upgrade>=upgrade.tier)continue;
    const p=point(upgrade);ctx.beginPath();ctx.ellipse(p.x,p.y+9,17,8,0,0,Math.PI*2);ctx.fillStyle='rgba(237,186,76,.16)';ctx.fill();
    ring(p.x,p.y,14,'#8b7040',1);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(-.4);
    rect(-3,-2,6,20,ink);rect(-2,-2,4,18,'#bc7f47');
    poly([[-13,-8],[5,-11],[14,-4],[12,1],[4,-4],[-10,-2]],gold,ink);line([[-9,-7],[4,-8],[11,-4]],'#fff6c8',2);ctx.restore();
    const twinkle=prefs.reducedMotion?1:.7+Math.sin(time*2)*.3;
    line([[p.x+21,p.y-13],[p.x+21,p.y-7]],'rgba(255,231,156,'+twinkle+')',1);line([[p.x+18,p.y-10],[p.x+24,p.y-10]],gold,1);
    label(String(upgrade.tier),p.x+10,p.y+9,wallColors[['b','c','d','e'][upgrade.tier-1]],9);
  }
  if(state.mining){
    const m=state.mining, x=(m.cell%cols)*T,y=Math.floor(m.cell/cols)*T, amount=Math.max(0,Math.min(1,(m.progress||0)/1.8));
    ctx.strokeStyle=gold;ctx.lineWidth=2;ctx.strokeRect(x+1,y+1,30,30);
    if(amount>0){line([[x+17,y+5],[x+13,y+14],[x+20,y+18],[x+14,y+28]],'#f8d3a6',2);line([[x+13,y+14],[x+6,y+11]],'#f8d3a6',1);}
    rect(x+2,y+26,28,4,ink);rect(x+2,y+26,28*amount,4,gold);
  }
  function shadow(p,width=12){ctx.beginPath();ctx.ellipse(p.x,p.y+12,width,5,0,0,Math.PI*2);ctx.fillStyle='rgba(5,9,17,.5)';ctx.fill();}
  for(const [enemyIndex,enemy] of state.enemies.entries()){
  const ep=point(enemy), windup=enemy.phase==='windup', burst=enemy.phase==='burst', rest=enemy.phase==='rest';
  shadow(ep,14);
  if(windup||enemy.wake>0){ring(ep.x,ep.y,21,windup?'#ffdc82':'#e9b4dc',2);ring(ep.x,ep.y,25,'rgba(255,220,130,.3)',1);for(const dx of [-1,1])line([[ep.x+dx*27,ep.y-4],[ep.x+dx*31,ep.y],[ep.x+dx*27,ep.y+4]],'#ffdc82',2);}
  if(burst){const dx=state.hero.x-enemy.x,dy=state.hero.y-enemy.y,d=Math.max(.1,Math.hypot(dx,dy));for(let i=-1;i<=1;i++)line([[ep.x-dx/d*17-dy/d*i*5,ep.y-dy/d*17+dx/d*i*5],[ep.x-dx/d*26-dy/d*i*5,ep.y-dy/d*26+dx/d*i*5]],'#e49a78',2);}
  const body=enemy.released?['#efac45','#ef8b74','#bdd65b','#ed8bc5'][(enemy.layer-1)%4]:'#736174';
  poly([[ep.x-11,ep.y+10],[ep.x-14,ep.y-3],[ep.x-10,ep.y-13],[ep.x-4,ep.y-11],[ep.x+4,ep.y-12],[ep.x+12,ep.y-8],[ep.x+14,ep.y+7],[ep.x+9,ep.y+13]],body,ink);
  poly([[ep.x-10,ep.y-10],[ep.x-12,ep.y-20],[ep.x-3,ep.y-12]],rest?'#a48a82':'#d6afa0',ink);
  poly([[ep.x+5,ep.y-11],[ep.x+11,ep.y-19],[ep.x+12,ep.y-7]],rest?'#a48a82':'#d6afa0',ink);
  rect(ep.x-10,ep.y+10,7,5,'#3b263a');rect(ep.x+4,ep.y+10,7,5,'#3b263a');
  rect(ep.x-9,ep.y-6,18,8,'#302238');const eyes=burst?'#fff5d3':windup?'#ffe28b':rest?'#c19a96':'#ffbd99';
  if(state.pursuer==='goofy'){
    for(const sign of [-1,1]){ctx.beginPath();ctx.ellipse(ep.x+sign*5,ep.y-3,4,enemyIndex%2?5:4,0,0,Math.PI*2);ctx.fillStyle='#fff9e8';ctx.fill();rect(ep.x+sign*5+(enemy.wrongTurn?1:-1),ep.y-4,2,3,ink);}
    line([[ep.x-7,ep.y-10],[ep.x-2,ep.y-8]],ink,2);line([[ep.x+2,ep.y-8],[ep.x+7,ep.y-10]],ink,2);
    line([[ep.x-4,ep.y+5],[ep.x,ep.y+(enemyIndex%3===0?3:8)],[ep.x+5,ep.y+5]],ink,2);
    if(enemyIndex%3===2)rect(ep.x+1,ep.y+5,3,4,'#fff8de');
  }else{rect(ep.x-7,ep.y-4,5,rest?2:4,eyes);rect(ep.x+3,ep.y-4,5,rest?2:4,eyes);line([[ep.x-3,ep.y+6],[ep.x+3,ep.y+5]],'#ffd0b0',1);}
  label(!enemy.released?'Z':windup?'!':String(enemy.layer),ep.x,ep.y-26,windup?gold:pale,9);
  }
  const enemy=state.enemies.find(e=>e.released)||state.enemies[0];
  // Match the main game's Steve: bright-blue rounded body, brow, expressive eyes.
  const hp=point(state.hero);shadow(hp,11);
  hp.y+=Math.sin(time*2.2)*1.2;
  const hs=.68*T, radius=7, x=hp.x-hs/2, y=hp.y-hs/2;
  ctx.beginPath();ctx.moveTo(x+radius,y);
  ctx.arcTo(x+hs,y,x+hs,y+hs,radius);ctx.arcTo(x+hs,y+hs,x,y+hs,radius);
  ctx.arcTo(x,y+hs,x,y,radius);ctx.arcTo(x,y,x+hs,y,radius);ctx.closePath();
  ctx.fillStyle='#2c7be5';ctx.fill();
  if(hi){ctx.strokeStyle='#c6e4ff';ctx.lineWidth=1.5;ctx.stroke();}
  rect(x+3,y+4,hs-6,4.5,'rgba(0,0,0,.30)');
  const next=state.hero.path[0], look=next!==undefined?{x:next%cols,y:Math.floor(next/cols)}:(enemy||state.hero);
  const dx=look.x-state.hero.x,dy=look.y-state.hero.y,d=Math.hypot(dx,dy)||1;
  const gx=dx/d*1.5,gy=dy/d*1.25;
  if(!prefs.reducedMotion&&time%3.4<.11){
    for(const sign of [-1,1])line([[hp.x+sign*hs*.17-2.5,hp.y],[hp.x+sign*hs*.17+2.5,hp.y]],'#11131a',1.6);
  }else for(const sign of [-1,1]){
    const ex=hp.x+sign*hs*.17+gx,ey=hp.y+gy;
    ctx.beginPath();ctx.arc(ex,ey,2.5,0,Math.PI*2);ctx.fillStyle='#11131a';ctx.fill();
    ctx.beginPath();ctx.arc(ex-.8,ey-.9,.75,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,.85)';ctx.fill();
  }
  if(state.upgrade){rect(hp.x+10,hp.y-3,4,17,ink);rect(hp.x+11,hp.y-3,2,15,'#c08e50');poly([[hp.x+5,hp.y-7],[hp.x+14,hp.y-9],[hp.x+20,hp.y-4],[hp.x+18,hp.y],[hp.x+13,hp.y-4],[hp.x+6,hp.y-2]],wallColors[['b','c','d','e'][state.upgrade-1]]||gold,ink);}
  ctx.restore();
}

// Omit this footer when embedding the function in the game HTML.
if(typeof module!=='undefined')module.exports={drawNetherWorld};
