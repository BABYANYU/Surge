const fs=require('fs'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync(require('path').join(__dirname,'../scripts/landing-ip-panel.js'),'utf8');

const IPV6='2602:fd6f:100:a::a';
const RDAP=JSON.stringify({handle:'NET6-2602-FD6F-100-1',entities:[{handle:'DNL-50',vcardArray:['vcard',[['version',{},'text','4.0'],['fn',{},'text','DDPS Networks, LLC']]]}]});

async function run(opts={}){
 let out,calls=0,requests=[];
 const context={$done:p=>{out=p;calls++;},setTimeout,clearTimeout,
  $httpAPI:(m,p,b,cb)=>cb({requests:[{URL:'https://ipwho.is/?lang=zh-CN',remoteAddress:'[2001:db8::9] (Proxy)',policyName:'TestNode'}]}),
  $httpClient:{get:(o,cb)=>{
   requests.push(o.url);
   const reply=(body,status=200)=>cb(opts.error&&o.url.includes('scamalytics')?'network error':null,{status},body);
   if(o.url.includes('my.ippure.com')) return reply(opts.info===undefined?JSON.stringify({ip:IPV6,asOrganization:'DDPS Networks, LLC'}):opts.info);
   if(o.url.includes('rdap.org')) return reply(opts.rdap===undefined?RDAP:opts.rdap);
   if(o.url.includes('scamalytics.com')) return reply(opts.page===undefined?'{"score":"0"}':opts.page);
   return reply(JSON.stringify({success:true,ip:IPV6,country_code:'JP',country:'Japan',region:'Tokyo',city:'Tokyo',connection:{isp:'DDPS Networks, LLC'}}));
  }}};
 vm.runInNewContext(code,context,{timeout:2000});
 for(let i=0;i<20&&!out;i++)await new Promise(r=>setImmediate(r));
 assert.equal(calls,1);
 assert(out.content.includes('落地 IP：'+IPV6));
 assert(!requests.some(u=>u.includes('autnum')),'不应额外请求 ASN 注册资料');
 return {last:out.content.split('\n').slice(-2),requests};
}

(async()=>{
 let n=0;async function t(opts,expected,extra){const r=await run(Object.assign({},opts,extra||{}));assert.deepEqual(r.last,expected);n++;}
 await t({},['风险：0','原生：是']);
 await t({page:'Fraud Score: 42'},['风险：42','原生：是']);
 await t({rdap:JSON.stringify({entities:[{handle:'OTHER',vcardArray:['vcard',[['fn',{},'text','Greencloud LLC']]]}]})},['风险：0','原生：否']);
 await t({rdap:''},['风险：0','原生：未知']);
 await t({info:''},['风险：0','原生：未知']);
 await t({page:'<html>no score</html>'},['风险：未知','原生：是']);
 await t({},['风险：未知','原生：是'],{error:true});
 console.log('PASS',n,'IPv6 cases; no live network');
})().catch(e=>{console.error(e);process.exitCode=1;});
