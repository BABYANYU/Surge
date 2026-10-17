'use strict';
// Synthetic fixtures only. Never add HAR files or personal response samples.
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'scripts/fengchao.js'), 'utf8');
const endpoint = 'https://webchatapp.fcbox.com/fcboxactivityweb/api/v2/clientPage/modulesAggregated';
const ad = { moduleType: 'm2', title: '广告', name: 'banner模块' };
const business = { moduleType: 'm1', title: '储物服务', name: '储物模块', contents: [{ test: true }] };
function fixture(modules = [business, ad]) {
  return { success: true, code: '0', msg: null, data: {
    homePageConfig: JSON.stringify({ moduleList: modules, userTierInfo: { userLevel: 1 } }),
    grayFlag: true
  }, syntheticExtra: { keep: true } };
}
function run(body, request = {}, response = {}) {
  let result, calls = 0;
  vm.runInNewContext(source, {
    $request: Object.assign({ method: 'GET', url: endpoint }, request),
    $response: Object.assign({ status: 200, body: typeof body === 'string' ? body : JSON.stringify(body) }, response),
    $done: output => { result = output; calls++; }
  }, { timeout: 1000 });
  assert.strictEqual(calls, 1);
  return JSON.parse(JSON.stringify(result));
}
let count = 0;
function test(name, fn) { fn(); count++; console.log('PASS ' + name); }
function unchanged(body, request, response) { assert.deepStrictEqual(run(body, request, response), {}); }
test('confirmed ad removed, business and all other fields preserved', () => {
  const original = fixture();
  const output = JSON.parse(run(original).body);
  const config = JSON.parse(output.data.homePageConfig);
  assert.deepStrictEqual(config.moduleList, [business]);
  assert.deepStrictEqual(config.userTierInfo, { userLevel: 1 });
  const expected = fixture([business]);
  assert.deepStrictEqual(output, expected);
});
test('query allowed without reading values', () => assert.ok(run(fixture(), { url: endpoint + '?synthetic=1' }).body));
test('empty ad list passes through byte-for-byte', () => unchanged(fixture([])));
test('business only passes through', () => unchanged(fixture([business])));
test('similar but unconfirmed modules preserved', () => unchanged(fixture([
  { ...ad, name: 'other' }, { ...ad, title: 'other' }, { ...ad, moduleType: 'm1' }
])));
test('malformed outer JSON fails open', () => unchanged('{'));
test('malformed inner JSON fails open', () => { const b = fixture(); b.data.homePageConfig = '{'; unchanged(b); });
test('null root and arrays fail open', () => { unchanged('null'); unchanged('[]'); });
test('changed module shape fails open', () => { unchanged(fixture([null, ad])); const b = fixture(); b.data.homePageConfig = '{"moduleList":{}}'; unchanged(b); });
test('unknown success or code fails open', () => { unchanged({ ...fixture(), success: false }); unchanged({ ...fixture(), code: 'new' }); });
test('non-success HTTP and missing body fail open', () => { unchanged(fixture(), {}, { status: 500 }); unchanged(fixture(), {}, { body: undefined }); });
test('wrong host, suffix path, method and protocol untouched', () => {
  unchanged(fixture(), { url: endpoint.replace('webchatapp.', 'other.') });
  unchanged(fixture(), { url: endpoint + '/extra' });
  unchanged(fixture(), { method: 'POST' });
  unchanged(fixture(), { url: endpoint.replace('https:', 'http:') });
});
const mod = fs.readFileSync(path.join(root, 'Fengchao.sgmodule'), 'utf8');
const reject = new RegExp(mod.split('\n').find(line => line.endsWith(' _ reject')).split(' ')[0]);
test('reject exactly two confirmed DSP paths', () => {
  for (const suffix of ['get', 'getMulti', 'get?synthetic=1', 'getMulti?synthetic=1'])
    assert.ok(reject.test('https://dsp.fcbox.com/adSearch/' + suffix));
  for (const suffix of ['getOther', 'get/extra', 'getMulti/extra', 'getMultiOther'])
    assert.ok(!reject.test('https://dsp.fcbox.com/adSearch/' + suffix));
  assert.ok(!reject.test('https://other.fcbox.com/adSearch/get'));
});
test('login pickup send payment and shared image domains excluded', () => {
  for (const p of ['/base/personalCenter/userInfo', '/post/express/toPickList',
    '/send/wechat/applets/send/queryWaitSendList', '/pay/create']) {
    const url = 'https://webchatapp.fcbox.com' + p;
    assert.ok(!reject.test(url)); unchanged(fixture(), { url });
  }
  assert.ok(!mod.includes('*.fcbox.com'));
  assert.ok(!mod.includes('common.fcbox.com'));
  assert.ok(!mod.includes('qpic.cn'));
  assert.ok(mod.includes('refs/heads/main/scripts/fengchao.js'));
});
console.log(`${count} synthetic test groups passed; no live requests made.`);
