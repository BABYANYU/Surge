// On-demand HTTPS latency: one warm-up, then five measured rounds.
const GROUP_NAME = String(typeof $argument === "undefined" ? "" : $argument).trim() || "Proxy";
const TEST_URL = "https://cp.cloudflare.com/generate_204";
const TEST_ROUNDS = 5;
const LOCK_KEY = "latency-panel-lock:" + GROUP_NAME;
const OWNER = String(Date.now()) + ":" + Math.random();
let finished = false;
let ownsLock = false;
let deadline;

function complete(panel) {
  if (finished) return;
  finished = true;
  if (deadline) clearTimeout(deadline);
  if (ownsLock) {
    try {
      if ($persistentStore.read(LOCK_KEY) === OWNER) $persistentStore.write("", LOCK_KEY);
    } catch (_) {}
  }
  $done(panel);
}

try {
  // Best-effort cross-run guard, not an atomic system lock. Stale locks expire.
  if (typeof $persistentStore !== "undefined") {
    const old = $persistentStore.read(LOCK_KEY);
    const age = Date.now() - Number(String(old || "").split(":")[0]);
    if (old && age >= 0 && age < 70000) {
      renderError("该策略组正在测试，请稍后再刷新");
    } else {
      ownsLock = $persistentStore.write(OWNER, LOCK_KEY) !== false;
    }
  }
  if (!finished) {
    deadline = setTimeout(() => renderError("测试超时，请稍后重试"), 55000);
    getGroupNodes((error, nodes) => {
      if (finished) return;
      if (error) return renderError(error);
      if (!nodes.length) return renderError(`策略组 ${GROUP_NAME} 中没有可检测节点`);
      const samples = Object.fromEntries(nodes.map((name) => [name, []]));
      runRound(0);
      function runRound(round) {
        if (finished) return;
        if (round > TEST_ROUNDS) return renderResults(nodes, samples);
        testPolicies(nodes, (result) => {
          if (finished) return;
          // Round zero is warm-up only. Failures and zero/invalid values are not samples.
          if (round > 0) nodes.forEach((name) => {
            const value = result && result[name] && result[name]["round-one-total"];
            if (typeof value === "number" && Number.isFinite(value) && value > 0) samples[name].push(value);
          });
          runRound(round + 1);
        });
      }
    });
  }
} catch (_) {
  renderError("无法完成测试，请检查策略组及接口状态");
}

function getGroupNodes(done) {
  $httpAPI("GET", "/v1/policy_groups", null, (result) => {
    const entries = result && Array.isArray(result[GROUP_NAME])
      ? result[GROUP_NAME]
      : result && result.group && Array.isArray(result.group.options) ? result.group.options : null;
    if (!entries) return done(`未找到策略组 ${GROUP_NAME}`, []);

    const names = entries
      .filter((item) => item && item.enabled !== false && !item.isGroup && item.name)
      .map((item) => String(item.name));

    done(null, unique(names));
  });
}

function testPolicies(names, done) {
  $httpAPI(
    "POST",
    "/v1/policies/test",
    { policy_names: names, url: TEST_URL },
    (result) => done(result && typeof result === "object" ? result : {})
  );
}

function renderResults(nodes, samples) {
  const rows = nodes.map((name) => {
    const values = samples[name];
    if (!values.length) return { name, latency: null, jitter: null };

    const latency = median(values);
    return {
      name,
      latency,
      jitter: median(values.map((value) => Math.abs(value - latency))),
    };
  });

  rows.sort((a, b) => {
    if (a.latency === null) return 1;
    if (b.latency === null) return -1;
    return a.latency - b.latency;
  });

  const content = rows
    .map((row) =>
      row.latency === null
        ? `${row.name} · 失败`
        : `${row.name} · ${Math.round(row.latency)} ms · ${formatJitter(row.jitter)} ms`
    )
    .join("\n\n");

  const notes = nodes.flatMap((name) => {
    const values = samples[name];
    const messages = [];
    if (values.length !== TEST_ROUNDS) messages.push(`${name} 成功 ${values.length}/${TEST_ROUNDS} 轮`);
    if (values.some((value) => value >= 1000)) messages.push(`${name} 出现秒级高值（最高 ${Math.round(Math.max(...values))} ms）`);
    return messages;
  });
  complete({
    title: "HTTPS",
    content: content + (notes.length ? "\n\n" + notes.join("\n") : ""),
    icon: "gauge.with.dots.needle.67percent",
    "icon-color": "#6699FF",
  });
}

function renderError(message) {
  complete({
    title: "HTTPS",
    content: `${message}\n请稍后点击面板重试`,
    icon: "gauge.with.dots.needle.67percent",
    "icon-color": "#6699FF",
  });
}

function median(values) {
  const sorted = values.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function formatJitter(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function unique(values) {
  return values.filter((value, index) => values.indexOf(value) === index);
}
