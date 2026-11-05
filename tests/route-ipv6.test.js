const fs=require('fs'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync(require('path').join(__dirname,'../scripts/landing-ip-panel.js'),'utf8');

async function run6(html,opts={}){
 let out,calls=0,requests=[];const ip='2602:fd6f:100:a::a';
 const context={$done:p=>{out=p;calls++;},setTimeout,clearTimeout,
  $httpAPI:(m,p,b,cb)=>cb({requests:[{URL:'https://ipwho.is/?lang=zh-CN',remoteAddress:'[2001:db8::9] (Proxy)',policyName:'TestNode'}]}),
  $httpClient:{get:(o,cb)=>{
   requests.push(o);
   if(o.url.includes('scamalytics.com')){
    if(opts.error)return cb('network error');
    return cb(null,{status:opts.status||200},typeof html==='string'?html:'');
   }
   cb(null,{status:200},JSON.stringify({success:true,ip,country_code:'JP',country:'Japan',region:'Tokyo',city:'Tokyo',connection:{isp:'DDPS Networks, LLC'}}));
  }}};
 vm.runInNewContext(code,context,{timeout:1000});
 for(let i=0;i<10&&!out;i++)await new Promise(r=>setImmediate(r));
 assert.equal(calls,1);
 assert(out.content.includes('落地 IP：'+ip));
 assert.equal(requests.filter(o=>o.url.includes('my.ippure.com')).length,0,'IPv6 不应请求仅支持 IPv4 评分的接口');
 const hit=requests.find(o=>o.url.includes('scamalytics.com'));
 assert(hit,'应请求 Scamalytics');
 assert.equal(hit.url,'https://scamalytics.com/ip/'+ip);
 assert.equal(hit.policy,'TestNode');
 return out.content.split('\n').slice(-2);
}

(async()=>{
 let n=0;async function t(html,expected,opts){assert.deepEqual(await run6(html,opts),expected);n++;}
 await t('{"ip":"x","score":"0"}',['风险：0','原生：—']);
 await t('<div>Fraud Score: 42</div>',['风险：42','原生：—']);
 await t('{"score":"1000"}',['风险：100','原生：—']);
 await t('<html>no score</html>',['风险：未知','原生：—']);
 await t('',['风险：未知','原生：—'],{error:true});
 await t('{"score":"7"}',['风险：未知','原生：—'],{status:503});
 console.log('PASS',n,'IPv6 risk cases; no live network');
})().catch(e=>{console.error(e);process.exitCode=1;});
