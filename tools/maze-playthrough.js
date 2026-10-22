/* Action-driven candidate audition. No injected movement, upgrades or wins. */
const {NetherTrial:n}=require('./harness');
const step=s=>{for(let t=0;t<s;t+=.05)n.step(.05)};
function action(x,y,mine=false){
 if(!n.aim(x,y))return 'blocked';
 for(let i=0;i<3000;i++){
  n.step(.05);const s=n.view();
  if(s.status!=='playing')return s.status;
  if(s.awaitingReturn)return 'caught';
  if(mine?s.map[y*45+x]==='.':Math.hypot(s.hero.x-x,s.hero.y-y)<.15)return 'arrived';
 }
 return 'timeout';
}
function run(mode,plan){
 n.setPreferences({dodge:true});n.start('practice',{pursuer:mode});const log=[];
 for(const a of plan){
  let result=action(...a);log.push({action:a,result,lives:n.view().lives,time:Math.round(n.view().elapsed)});
  while(result==='caught'&&n.view().lives>0){n.resumeRecovery();step(.8);action(4,35);result=action(...a);log.push({retry:a,result,lives:n.view().lives,time:Math.round(n.view().elapsed)});}
  if(['lost','blocked','timeout'].includes(result))break;
 }
 const s=n.view();return {mode,status:s.status,lives:s.lives,upgrade:s.upgrade,cores:s.cores.filter(c=>c.collected).length,awake:s.enemies.filter(e=>e.released).length,elapsed:Math.round(s.elapsed),log};
}
const plan=[[3,3],[4,29,true],[5,29],[40,29,true],[37,7],[36,11,true],[35,11],[8,25,true],[11,25],[12,21,true],[13,21],[32,21,true],[29,21],[28,19,true],[16,17,true],[23,19],[43,1]];
if(require.main===module)for(const mode of ['goofy','runner'])console.log(JSON.stringify(run(mode,plan)));
module.exports={action,run,step,plan};
