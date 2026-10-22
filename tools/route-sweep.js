const n=require('./harness').NetherTrial;
const step=(s)=>{for(let t=0;t<s;t+=.05)n.step(.05);};
function action(x,y,m=false){
 if(!n.aim(x,y))return 'blocked';
 for(let i=0;i<1200;i++){
  n.step(.05);const s=n.view();
  if(s.status!=='playing')return s.status;
  if(s.awaitingReturn)return 'caught';
  if(m?s.map[y*20+x]==='.':Math.hypot(s.hero.x-x,s.hero.y-y)<.1)return 'arrived';
 }
 return 'timeout';
}
function run(mode,inner,extra,returnExit){
 n.setPreferences({dodge:true});n.start('practice',{pursuer:mode});let log=[];
 const plan=[[2,2],[3,5,true],[5,5],[14,14],...extra,inner,[11,8],[17,2]];
 for(const a of plan){
  let result=action(...a);log.push([...a,result]);
  let attempts=0;
  while(result==='caught'&&n.view().lives>0&&attempts++<2){
   n.resumeRecovery();step(.8);action(...returnExit);result=action(...a);log.push(['retry',...a,result]);
  }
  if(['lost','blocked','timeout'].includes(result))break;
 }
 return {mode,inner,extra,returnExit,status:n.view().status,lives:n.view().lives,log};
}
if(require.main===module){
 let results=[];
 outer:for(const extra of [[],[[16,14,true]],[[14,16,true]],[[13,13]],[[4,14]],[[13,4]]])for(const inner of [[10,12,true],[12,11,true],[7,11,true],[7,8,true],[11,7,true],[12,8,true]]){
  const r=run('runner',inner,extra,[3,17]);results.push(r);
  if(r.status==='won'){console.log(JSON.stringify(r));break outer;}
 }
 console.log('tried',results.length,'wins',results.filter(r=>r.status==='won').length);
 require('fs').writeFileSync('/tmp/tn-d3-route-sweep.json',JSON.stringify(results,null,2));
}
module.exports={action,run,step};
