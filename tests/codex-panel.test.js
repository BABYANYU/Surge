'use strict';
// Offline only: synthetic inputs; no real tokens, account IDs or network access.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../scripts/codex-panel.js'), 'utf8');
const markerToken = 'synthetic-token', markerAccount = 'synthetic-account';
const config = (t = markerToken, a = markerAccount, p = 'Proxy') =>
  `AccessToken=${encodeURIComponent(t)}&AccountId=${encodeURIComponent(a)}&Policy=${encodeURIComponent(p)}`;
const window = (seconds = 18000, used = 25.5, reset = 1800000000) =>
  ({ limit_window_seconds: seconds, used_percent: used, reset_at: reset });
const data = () => ({ plan_type: 'plus', rate_limit: {
  primary_window: window(), secondary_window: window(604800, 40)
}, additional_rate_limits: [{ rate_limit: { primary_window: window(18000, 99) } }],
code_review_rate_limit: { primary_window: window(18000, 88) } });
let cases = 0;
function run(options = {}) {
  const results = [], requests = [], logs = [], timers = [];
  const context = { $argument: config(), setTimeout(fn, delay) { timers.push({ fn, delay }); },
    $done(value) { results.push(value); }, console: { log(...args) { logs.push(args); } },
    $httpClient: { get(request, cb) {
      requests.push(request);
      if (options.throw) throw Error('synthetic-request-error');
      if (options.hang) return;
      const response = 'response' in options ? options.response : { status: options.status || 200 };
      const body = 'body' in options ? options.body : JSON.stringify(data());
      cb(options.error || null, response, body);
      if (options.twice) cb(null, { status: 200 }, JSON.stringify(data()));
    } } };
  if ('arg' in options) context.$argument = options.arg;
  vm.createContext(context); vm.runInContext(source, context);
  for (const timer of timers) { assert.equal(timer.delay, 12000); timer.fn(); }
  assert.equal(results.length, 1, 'exactly one $done, including fallback');
  assert.equal(logs.length, 0);
  assert.ok(!JSON.stringify(results).includes(markerToken));
  assert.ok(!JSON.stringify(results).includes(markerAccount));
  cases++;
  return { result: results[0], requests, context };
}
const ok = run({ twice: true });
assert.match(ok.result.content, /5 小时额度\n已用 25.5%  ·  剩余 74.5%/);
assert.match(ok.result.content, /7 天额度\n已用 40%/);
assert.match(ok.result.content, /重置 \d\d\/\d\d \d\d:\d\d/);
assert.equal(ok.result.title, 'Codex');
assert.equal(ok.result.icon, 'terminal');
assert.equal(ok.result['icon-color'], '#8EAFE0');
assert.ok(!/[■□]/.test(ok.result.content));
assert.equal(ok.requests.length, 1);
const request = ok.requests[0];
assert.equal(request.url, 'https://chatgpt.com/backend-api/wham/usage');
assert.equal(request.policy, 'Proxy'); assert.equal(request.timeout, 10);
assert.equal(request['auto-redirect'], false); assert.equal(request['auto-cookie'], false);
assert.equal(request.headers.Authorization, `Bearer ${markerToken}`);
assert.equal(request.headers['ChatGPT-Account-Id'], markerAccount);
assert.equal(run({ arg: config(markerToken, markerAccount, '') }).requests[0].policy, 'Proxy');
assert.equal(run({ arg: config(markerToken, markerAccount, '代理 "A",B&c=1%') }).requests[0].policy, '代理 "A",B&c=1%');
for (const arg of ['', undefined, config('', ''), config('', markerAccount), config(markerToken, '')]) {
  const r = run({ arg }); assert.match(r.result.content, /待授权/); assert.equal(r.requests.length, 0);
}
for (const arg of [config('Bearer synthetic', markerAccount), config(markerToken, 'bad@id'),
  config('line\nbreak', markerAccount), config(markerToken, markerAccount, '\r\ninjected'),
  'AccessToken=x&AccountId=y', config() + '&Policy=evil', config() + '&extra=1',
  config() + '"', config().replace('Proxy', '%GG'), config().replace('Proxy', '%E0%A4'),
  config().replace('Proxy', 'raw space'), config().replace('Proxy', '{{{Policy}}}')]) {
  const r = run({ arg }); assert.match(r.result.content, /授权参数格式无效/); assert.equal(r.requests.length, 0);
}
assert.equal(run({ arg: config('synthetic+/=token', markerAccount) }).requests.length, 1);
for (const options of [{ throw: true }, { hang: true }, { error: 'synthetic secret error' }]) {
  const r = run(options); assert.match(r.result.content, /请求失败/); assert.ok(!r.result.content.includes('synthetic secret'));
}
for (const response of [null, {}, { status: '200' }, { status: 200.5 }])
  assert.match(run({ response }).result.content, /无有效 HTTP 状态/);
for (const [status, message] of [[401, '授权已过期或无效'], [403, '访问被拒绝'],
  [429, '请求过于频繁'], [302, 'HTTP 302'], [500, 'HTTP 500']]) {
  const result = run({ status, body: 'ignored sensitive body' }).result;
  assert.ok(result.content.includes(message)); assert.ok(!result.content.includes('sensitive'));
}
assert.match(run({ body: 'invalid JSON' }).result.content, /JSON 解析失败/);
for (const body of [null, [], {}, { plan_type: 'plus' }, { plan_type: '', rate_limit: null },
  { plan_type: 'plus', rate_limit: [] }])
  assert.match(run({ body: JSON.stringify(body) }).result.content, /额度字段无法识别/);
for (const body of [{ plan_type: 'plus', rate_limit: null }, { plan_type: 'plus', rate_limit: {} }])
  assert.match(run({ body: JSON.stringify(body) }).result.content, /未返回 5 小时 \/ 周额度窗口/);
const parse = value => JSON.parse(JSON.stringify(ok.context.parseUsage(value)));
for (const used of [0, 100, 25.555]) {
  const d = data(); d.rate_limit.primary_window.used_percent = used;
  assert.equal(parse(d).windows[0].used, used); cases++;
}
for (const invalid of [-1, 101, null, '50', NaN, Infinity]) {
  const d = data(); d.rate_limit.primary_window.used_percent = invalid;
  assert.equal(parse(d).windows.length, 1); cases++;
}
for (const reset of [null, 0, -1, '1800000000', 1.5, 8640000000001]) {
  const d = data(); d.rate_limit.primary_window.reset_at = reset;
  assert.equal(parse(d).windows[0].reset, null); cases++;
}
const swapped = data();
[swapped.rate_limit.primary_window, swapped.rate_limit.secondary_window] =
  [swapped.rate_limit.secondary_window, swapped.rate_limit.primary_window];
assert.deepEqual(parse(swapped).windows.map(w => w.seconds), [18000, 604800]); cases++;
const duplicate = data(); duplicate.rate_limit.secondary_window = window(18000, 60);
assert.equal(parse(duplicate).windows.length, 1); cases++;
const unknown = data(); unknown.rate_limit.primary_window = window(3600);
assert.deepEqual(parse(unknown).windows.map(w => w.seconds), [604800]); cases++;
assert.equal(parse({ plan_type: 'new-plan', rate_limit: null }).plan, '其他套餐'); cases++;
// When the fixed upstream script is supplied, compare the full parser on identical structures.
if (process.argv[2]) {
  const upstream = fs.readFileSync(process.argv[2], 'utf8').replace('export default async function(ctx)', 'async function original(ctx)');
  const original = vm.createContext({}); vm.runInContext(upstream, original);
  const fixtures = [data(), swapped, duplicate, unknown,
    { plan_type: 'free', rate_limit: null }, { plan_type: 'new-plan', rate_limit: {} }];
  for (const d of fixtures) {
    assert.deepEqual(parse(d), JSON.parse(JSON.stringify(original.parseUsage(d)))); cases++;
  }
}
const explodingResponse = { get status() { throw Error('synthetic hidden response'); } };
assert.match(run({ response: explodingResponse }).result.content, /未获取有效额度/);
const noReset = data(); noReset.rate_limit.primary_window.reset_at = null;
assert.match(run({ body: JSON.stringify(noReset) }).result.content, /重置时间未返回/);
for (const w of [null, [], 'invalid']) {
  const d = data(); d.rate_limit.primary_window = w;
  assert.equal(parse(d).windows.length, 1); cases++;
}
const full = data(); full.rate_limit.primary_window.used_percent = 100;
assert.match(run({ body: JSON.stringify(full) }).result.content, /已用 100%  ·  剩余 0%/);
const empty = data(); empty.rate_limit.primary_window.used_percent = 0;
assert.match(run({ body: JSON.stringify(empty) }).result.content, /已用 0%  ·  剩余 100%/);
const installHTML = fs.readFileSync(path.join(__dirname, '../docs/index.html'), 'utf8');
let redirected;
const elements = {};
vm.runInNewContext(installHTML.match(/<script>([\s\S]*?)<\/script>/)[1], {
  URLSearchParams, location: { search: '?m=codex', replace(url) { redirected = url; } },
  document: { getElementById(id) { return elements[id] || (elements[id] = { style: {} }); } }
});
assert.equal(redirected, 'surge:///install-module?url=' + encodeURIComponent('https://raw.githubusercontent.com/BABYANYU/Surge/refs/heads/main/Codex.sgmodule')); cases++;
const moduleText = fs.readFileSync(path.join(__dirname, '../Codex.sgmodule'), 'utf8');
assert.match(moduleText, /#!arguments=AccessToken,AccountId,Policy:Proxy/);
assert.match(moduleText, /refs\/heads\/main\/scripts\/codex-panel\.js/);
assert.ok(!/\beval\s*\(|new Function|console\.|\$persistentStore|ctx\.http/.test(source));
console.log(`PASS: ${cases} synthetic cases; no live credentials or network; exactly-once completion and safe output verified.`);
