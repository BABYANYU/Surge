"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const code = fs.readFileSync(require("node:path").join(__dirname, "../scripts/meituan.js"), "utf8");
const urls = [
  "https://apimobile.meituan.com/aggroup/indexTab",
  "https://feedguess.meituan.com/lycoris/scene/gwc_feed1_2265",
  "https://mt-personalcenter.meituan.com/usercenter/display",
  "https://apimobile.meituan.com/group/v1/deal/searchpage/defaultword",
  "https://apimobile.meituan.com/group/v1/deal/searchpage/hotword/city/divide/hotrecommend/1",
  "https://assistify.meituan.com/assistant/getAppClientHornConfig",
  "https://mop.meituan.com/mop/entry/shoppingCartEntry",
  "https://mop.meituan.com/api/entryModule/startupPicture"
];
let count = 0;
function execute(url, body) {
  let calls = 0, result;
  vm.runInNewContext(code, {
    $request: {url}, $response: {body},
    $done(value) { calls++; result = JSON.parse(JSON.stringify(value)); }
  }, {timeout: 1500});
  assert.equal(calls, 1);
  return result;
}
function same(actual, expected) { assert.deepEqual(actual, expected); count++; }
function rewrite(index, input, expected, url = urls[index]) {
  const result = execute(url, JSON.stringify(input));
  assert.equal(typeof result.body, "string");
  same(JSON.parse(result.body), expected);
}
const tab = tabName => ({tabName});
rewrite(0, {data: {resource: {tabArea: ["homepage", "video", "xiaotuan", "mine", "other"].map(tab)}}},
  {data: {resource: {tabArea: ["homepage", "mine", "other"].map(tab)}}});
rewrite(1, {data: [1], ext: {keep: 1}, other: 2}, {data: [], ext: {keep: 1, forbidByExp: true}, bottom: true, other: 2});
rewrite(1, {data: [2], ext: null}, {data: [], ext: {forbidByExp: true}, bottom: true}, urls[1].replace("gwc_feed1_2265", "personalcenter_2154") + "?page=1");
rewrite(2, {children: [{name: "mine_cross_recommend"}, {name: "orders"}, null], keep: 1},
  {children: [{name: "orders"}, null], keep: 1});
rewrite(3, {searchIntroduceResponse: {defaultWordRes: {defaultWordItems: [1], keep: 1}, HotWordInfos: [2], keep: 2}},
  {searchIntroduceResponse: {defaultWordRes: {defaultWordItems: [], keep: 1}, HotWordInfos: [], keep: 2}});
rewrite(4, {data: {segmentsV2: [
  {hotwordSegments: [{pageName: "EntranceHotwordsV2Hotwords"}]},
  {hotwordSegments: [{pageName: "EntranceHotwordsV2ContentCard"}, {pageName: "keep"}], id: 2},
  {hotwordSegments: []}, null, {other: 1}
], aiSearchBubble: {bubbleTexts: ["x"], keep: 3}}},
{data: {segmentsV2: [{hotwordSegments: [{pageName: "keep"}], id: 2}, {hotwordSegments: []}, null, {other: 1}], aiSearchBubble: {bubbleTexts: [], keep: 3}}});
rewrite(5, {data: JSON.stringify({skills: {a: 1}, keep: 2}), keep: 3}, {data: JSON.stringify({skills: {}, keep: 2}), keep: 3});
for (const [index, key] of [[6, "topBannerArea"], [7, "startupPicArea"]]) {
  const area = () => ({[key]: [1], keep: [2]});
  const cleared = () => ({[key]: [], keep: [2]});
  rewrite(index, {resource: area(), resourcesMap: area(), data: {resource: area(), resourcesMap: area()}, nested: {resource: area()}},
    {resource: cleared(), resourcesMap: cleared(), data: {resource: cleared(), resourcesMap: cleared()}, nested: {resource: area()}});
}
// Guardrails and exact byte preservation for all no-op cases.
for (const url of urls) {
  for (const body of ["", "{", "null", "[]", "1", "{}", '{ "unrelated": [1, 2] }']) same(execute(url, body), {});
}
for (const data of [
  {data: {resource: {tabArea: [tab("homepage"), tab("video")]}}},
  {data: {resource: {tabArea: [tab("mine"), tab("xiaotuan")]}}}
]) same(execute(urls[0], JSON.stringify(data)), {});
same(execute(urls[1].replace("gwc_feed1_2265", "other"), '{"data":[1]}'), {});
same(execute(urls[1] + "suffix", '{"data":[1]}'), {});
same(execute(urls[0].replace("apimobile.meituan.com", "example.com"), JSON.stringify({data: {resource: {tabArea: ["homepage", "mine", "video"].map(tab)}}})), {});
same(execute(urls[4], '{"data":{"aiSearchBubble":{"bubbleTexts":[1]}}}'), {});
same(execute(urls[5], '{"data":"not json"}'), {});
same(execute(urls[5], '{"data":{"skills":{"a":1}}}'), {});
same(execute(urls[5], '{"data":"{\\"skills\\":{}}"}'), {});
same(execute(urls[6], '{"resource":{"topBannerArea":"not an array"}}'), {});
same(execute(urls[7], JSON.stringify({resource: {startupPicArea: [1]}, padding: "a".repeat(2097152)})), {});
same(execute(urls[7], JSON.stringify({resource: {startupPicArea: [1]}, padding: "中".repeat(710000)})), {});
// Module invariants: identical 35 network rules, 8 matches, 5 MITM names.
const moduleText = fs.readFileSync(require("node:path").join(__dirname, "../Meituan.sgmodule"), "utf8");
same(moduleText.split("\n").filter(line => /^(DOMAIN|IP-CIDR)/.test(line)).length, 35);
same(moduleText.split("\n").filter(line => line.includes("type=http-response")).length, 8);
same(moduleText.split("hostname = %APPEND% ")[1].trim().split(", ").length, 5);
same(/ZenmoFeiShi|ZenMoFiShi|TG@/.test(moduleText + code), false);
const ipRules = moduleText.split("\n").filter(line => /^IP-CIDR6?,/.test(line));
same(ipRules.length, 24);
same(ipRules.every(line => line.endsWith(",REJECT,no-resolve")), true);
moduleText.split("\n").filter(line => line.includes("type=http-response")).forEach((line, index) => {
  const pattern = line.split("pattern=")[1].split(",requires-body")[0];
  same(new RegExp(pattern).test(urls[index]), true);
  same(line.includes("max-size=2097152"), true);
});
// Immutable script URLs bind all routes to one published script version.
const scriptPaths = [...moduleText.matchAll(/script-path=([^,\s]+)/g)].map(match => match[1]);
same(scriptPaths.length, 8);
same(new Set(scriptPaths).size, 1);
same(/^https:\/\/raw\.githubusercontent\.com\/BABYANYU\/Surge\/[a-f0-9]{40}\/scripts\/meituan\.js$/.test(scriptPaths[0]), true);
const scriptCommit = scriptPaths[0].split("/")[5];
const pinnedCode = require("node:child_process").execFileSync("git", ["show", `${scriptCommit}:scripts/meituan.js`], {
  cwd: require("node:path").join(__dirname, ".."), encoding: "utf8", maxBuffer: 4 * 1024 * 1024
});
same(pinnedCode, code);
// Do not silently introduce unverified module metadata or inline/data URI scripts.
same(/^#!update-interval=/m.test(moduleText), false);
console.log(`${count} assertions passed; all 8 response routes covered (synthetic only).`);
