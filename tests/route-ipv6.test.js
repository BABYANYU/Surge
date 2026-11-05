const fs=require('fs'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync(require('path').join(__dirname,'../scripts/landing-ip-panel.js'),'utf8');

const IPV6='2602:fd6f:100:a::a';

async function run(opts={}){
 let out,calls=0,requests=[];
 const context={$done:p=>{out=p;calls++;},setTimeout,clearTimeout,
  $httpAPI:(m,p,b,cb)=>cb({requests:[{URL:'https://ipwho.is/?lang=zh-CN',remoteAddress:'[2001:db8::9] (Proxy)',policyName:'TestNode'}]}),
  $httpClient:{get:(o,cb)=>{
   requests.push(o.url);
   cb(null,{status:200},JSON.stringify({success:true,ip:IPV6,country_code:'JP',country:'Japan',region:'Tokyo',city:'Tokyo',connection:{isp:'DDPS Networks, LLC'}}));
  }}};
 vm.runInNewContext(code,context,{timeout:2000});
 for(let i=0;i<20&&!out;i++)await new Promise(r=>setImmediate(r));
 assert.equal(calls,1);
 assert(out.content.includes('落地 IP：'+IPV6));
 assert(!out.content.includes('风险'),'IPv6 不应输出风险行');
 assert(!out.content.includes('原生'),'IPv6 不应输出原生行');
 assert(!requests.some(u=>u.includes('scamalytics')),'IPv6 不应请求 Scamalytics');
 assert(!requests.some(u=>u.includes('my.ippure.com')),'IPv6 不应请求 IPPure');
 return out.content.split('\n').slice(-1)[0];
}

(async()=>{
 let n=0;
 for (let i=0;i<3;i++){const last=await run();assert.equal(last,'位置：日本 Tokyo');n++;}
 console.log('PASS',n,'IPv6 cases; no risk lookup, no live network');
})().catch(e=>{console.error(e);process.exitCode=1;});
