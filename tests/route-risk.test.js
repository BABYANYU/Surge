const fs=require('fs'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync(require('path').join(__dirname,'../scripts/landing-ip-panel.js'),'utf8');
async function run(risk,opts={}){
 let out,calls=0,requests=[];const ip='198.51.100.8';
 const context={$done:p=>{out=p;calls++;},setTimeout,clearTimeout,$httpAPI:(m,p,b,cb)=>cb({requests:[{URL:'https://ipwho.is/?lang=zh-CN',remoteAddress:'203.0.113.9 (Proxy)',policyName:'TestNode'}]}),$httpClient:{get:(o,cb)=>{
 requests.push(o);
 if(o.url.includes('my.ippure.com')){
  if(opts.error)return cb('network error');
  return cb(null,{status:opts.status||200},typeof risk==='string'?risk:JSON.stringify(risk));
 }
 cb(null,{status:200},JSON.stringify({success:true,ip:o.url.includes('203.0.113.9')?'203.0.113.9':ip,country_code:'HK',country:'Hong Kong',connection:{isp:'Example ISP',org:'Example Org'}}));
 }}};
 vm.runInNewContext(code,context,{timeout:1000});
 for(let i=0;i<10&&!out;i++)await new Promise(r=>setImmediate(r));
 assert.equal(calls,1);assert(out.content.includes('入口\n203.0.113.9'));assert(out.content.includes('落地\n'+ip));
 assert.equal(requests.filter(o=>o.url.includes('my.ippure.com')).length,1);
 assert.equal(requests.find(o=>o.url.includes('my.ippure.com')).policy,'TestNode');
 return out.content.split('\n').slice(-1);
}
(async()=>{
 let n=0;async function t(data,expected,opts){assert.deepEqual(await run(data,opts),expected);n++;}
 await t({ip:'198.51.100.8',fraudScore:27.8,isBroadcast:false},['风险 28 · 原生 是']);
 await t({ip:'198.51.100.8',fraudScore:0,isBroadcast:true},['风险 0 · 原生 否']);
 await t({ip:'198.51.100.8',fraudScore:null},['风险 未知 · 原生 未知']);
 await t({ip:'198.51.100.8',fraudScore:'48'},['风险 48 · 原生 未知']);
 await t({ip:'198.51.100.8',fraudScore:999,isBroadcast:false},['风险 100 · 原生 是']);
 await t({ip:'198.51.100.99',fraudScore:1,isBroadcast:false},['风险 未知 · 原生 未知']);
 await t('{',['风险 未知 · 原生 未知']);
 await t({},['风险 未知 · 原生 未知'],{error:true});
 await t({},['风险 未知 · 原生 未知'],{status:429});
 console.log('PASS',n,'Route integration cases; no live credentials/network');
})().catch(e=>{console.error(e);process.exitCode=1;});
