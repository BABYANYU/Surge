const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync(require('path').join(__dirname,'../scripts/latency-panel.js'),'utf8');
let count=0;
function check(label,fn){fn();console.log('PASS',label);count++;}
function run(options={}){
 let done=[],tests=0,timer,cleared=false,logs=[];let store={...options.store};let writes=[];
 const c={$argument:'Proxy',$persistentStore:{read:k=>store[k]||'',write:(v,k)=>{store[k]=v;writes.push([k,v]);return true;}},$done:x=>done.push(x),setTimeout:fn=>{timer=fn;return 1;},clearTimeout:()=>cleared=true,console};
 c.$httpAPI=(method,path,body,cb)=>{
  if(path==='/v1/policy_groups'){
   if(options.hang)return;
   return cb(options.group||{Proxy:[{name:'A'},{name:'B'},{name:'A'},{name:'disabled',enabled:false},{name:'nested',isGroup:true}]});
  }
  assert.equal(method,'POST');assert.equal(body.url,'https://cp.cloudflare.com/generate_204');assert.deepEqual(Array.from(body.policy_names),['A','B']);
  const i=tests++;logs.push(body);
  const a=(options.a||[9999,100,101,102,103,104])[i],b=(options.b||[9999,200,200,200,200,200])[i];
  cb({A:typeof a==='number'?{'round-one-total':a}:{error:'timeout'},B:typeof b==='number'?{'round-one-total':b}:{error:'timeout'}});
 };
 vm.runInNewContext(source,c,{timeout:1000});
 return {done,tests,store,writes,cleared,timer};
}
check('one discarded warm-up and five formal rounds',()=>{let r=run();assert.equal(r.tests,6);assert.equal(r.done.length,1);assert(r.done[0].content.includes('102 ms · 1 ms A'));assert(!r.done[0].content.includes('9999'));assert.equal(r.done[0].title,'HTTPS');assert(r.cleared);assert.equal(r.store['latency-panel-lock:Proxy'],'');});
check('zero/failed samples excluded and count disclosed',()=>{let r=run({a:[9999,0,null,102,104,106]});assert(r.done[0].content.includes('成功 3/5 轮'));assert(r.done[0].content.includes('104 ms'));});
check('large valid samples retained and disclosed',()=>{let r=run({a:[99,100,101,102,103,1200]});assert(r.done[0].content.includes('102 ms · 1 ms A'));assert(r.done[0].content.includes('最高 1200 ms'));});
check('all failures shown, not slow scores',()=>{let r=run({a:[null,null,null,null,null,null]});assert(r.done[0].content.includes('失败 A'));assert(r.done[0].content.includes('成功 0/5 轮'));});
check('busy run does not launch more network requests',()=>{let lock=Date.now()+':existing';let r=run({store:{'latency-panel-lock:Proxy':lock}});assert.equal(r.tests,0);assert.equal(r.done.length,1);assert.equal(r.store['latency-panel-lock:Proxy'],lock);});
check('stale lock expires',()=>assert.equal(run({store:{'latency-panel-lock:Proxy':(Date.now()-80000)+':old'}}).tests,6));
check('unknown group fails once and releases lock',()=>{let r=run({group:{}});assert.equal(r.done.length,1);assert.equal(r.tests,0);assert.equal(r.store['latency-panel-lock:Proxy'],'');});
check('deadline terminates missing callback',()=>{let r=run({hang:true});r.timer();assert.equal(r.done.length,1);assert(r.done[0].content.includes('超时'));assert.equal(r.store['latency-panel-lock:Proxy'],'');});
const mod=fs.readFileSync(require('path').join(__dirname,'../Latency.sgmodule'),'utf8');
check('module name, paths and click-only settings unchanged',()=>{assert(mod.startsWith('#!name=HTTPS\n'));assert(mod.includes('update-interval=-1'));assert(mod.includes('script-path=https://raw.githubusercontent.com/BABYANYU/Surge/main/scripts/latency-panel.js,'));assert(!mod.includes('?v='));});
console.log(count,'test groups passed; no network used');
