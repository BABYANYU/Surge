const fs=require('fs'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync(require('path').join(__dirname,'../scripts/fengchao.js'),'utf8');
let count=0;
function run(body,req={},res={}){let result,calls=0;vm.runInNewContext(code,{$request:{method:'GET',url:'https://dsp.fcbox.com/adSearch/getMulti',...req},$response:{status:200,body:typeof body==='string'?body:JSON.stringify(body),...res},$done:r=>{result=r;calls++;}},{timeout:1000});assert.equal(calls,1);return JSON.parse(JSON.stringify(result));}
function fixture(){return {code:370100000,msg:'操作成功',data:[{synthetic:true}],extendsMap:{wxAdsFlag:'true',fcDspFlag:'true',interstitialErrSwitch:'true',keep:'value'},extendsData:null};}
function test(f){f();count++;}
test(()=>{let b=JSON.parse(run(fixture()).body);assert.deepEqual(b.data,[]);assert.equal(b.extendsMap.wxAdsFlag,'false');assert.equal(b.extendsMap.fcDspFlag,'false');assert.equal(b.extendsMap.interstitialErrSwitch,'false');assert.equal(b.extendsMap.keep,'value');assert.equal(b.code,370100000);});
test(()=>{let b=fixture();b.data=null;delete b.extendsMap.wxAdsFlag;let c=JSON.parse(run(b).body);assert.equal(c.data,null);assert(!('wxAdsFlag' in c.extendsMap));});
test(()=>{let b=fixture();b.extendsMap.wxAdsFlag=true;assert.equal(JSON.parse(run(b).body).extendsMap.wxAdsFlag,false);});
for(const url of ['https://dsp.fcbox.com/adSearch/get?test=1','https://dsp.fcbox.com/adSearch/getMulti?test=1'])test(()=>assert(run(fixture(),{url}).body));
for(const url of ['https://dsp.fcbox.com/adSearch/getOther','https://other.fcbox.com/adSearch/get','https://webchatapp.fcbox.com/post/express/toPickList'])test(()=>assert.deepEqual(run(fixture(),{url}),{}));
test(()=>assert.deepEqual(run(fixture(),{method:'POST'}),{}));
test(()=>assert.deepEqual(run(fixture(),{},{status:500}),{}));
for(const b of ['{','null','[]', {code:0,data:[],extendsMap:{}}, {code:370100000,data:{business:true},extendsMap:{}}])test(()=>assert.deepEqual(run(b),{}));
test(()=>{let b=fixture();b.data=[];Object.keys(b.extendsMap).forEach(k=>{if(k!=='keep')b.extendsMap[k]='false';});assert.deepEqual(run(b),{});});
test(()=>{let b=fixture();b.code='370100000';assert.equal(JSON.parse(run(b).body).code,'370100000');});
console.log('PASS',count,'synthetic cases; no real requests or personal fixtures');
