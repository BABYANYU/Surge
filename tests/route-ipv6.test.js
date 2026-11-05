const fs=require('fs'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync(require('path').join(__dirname,'../scripts/landing-ip-panel.js'),'utf8');

const IPV6='2602:fd6f:100:a::a';

async function run(opts={}){
 let out,calls=0,requests=[];
 const context={$done:p=>{out=p;calls++;},setTimeout,clearTimeout,
  $httpAPI:(m,p,b,cb)=>cb({requests:[{URL:'https://ipwho.is/?lang=zh-CN',remoteAddress:'[2001:db8::9] (Proxy)',policyName:'TestNode'}]}),
  $httpClient:{get:(o,cb)=>{
   requests.push(o.url);
   const reply=(body,status=200)=>cb(opts.error&&o.url.includes('scamalytics')?'network error':null,{status},body);
   if(o.url.includes('scamalytics.com')) return reply(opts.page===undefined?'{"score":"0"}':opts.page);
   return reply(JSON.stringify({success:true,ip:IPV6,country_code:'JP',country:'Japan',region:'Tokyo',city:'Tokyo',connection:{isp:'DDPS Networks, LLC'}}));
  }}};
 vm.runInNewContext(code,context,{timeout:2000});
 for(let i=0;i<20&&!out;i++)await new Promise(r=>setImmediate(r));
 assert.equal(calls,1);
 assert(out.content.includes('落地 IP：'+IPV6));
 assert(!out.content.includes('原生'),'IPv6 不应输出原生行');
 assert(!requests.some(u=>u.includes('my.ippure.com')),'IPv6 不应请求仅支持 IPv4 的 IPPure');
 assert(!requests.some(u=>u.includes('rdap')),'IPv6 不应请求 RDAP');
 return {last:out.content.split('\n').slice(-2),requests};
}

(async()=>{
 let n=0;async function t(opts,expected,extra){const r=await run(Object.assign({},opts,extra||{}));assert.deepEqual(r.last,expected);n++;}
 await t({},['位置：日本 Tokyo','风险：0']);
 await t({page:'Fraud Score: 42'},['位置：日本 Tokyo','风险：42']);
 await t({page:'<html>no score</html>'},['位置：日本 Tokyo','风险：未知']);
 await t({},['位置：日本 Tokyo','风险：未知'],{error:true});
 console.log('PASS',n,'IPv6 cases; no live network');
})().catch(e=>{console.error(e);process.exitCode=1;});
