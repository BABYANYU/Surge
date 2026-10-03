// Policy group latency panel
const GROUP_NAME = String(typeof $argument === "undefined" ? "" : $argument).trim() || "Proxy";
const TEST_URL = "http://cp.cloudflare.com/generate_204";
const TEST_ROUNDS = 5;

getGroupNodes((error, nodes) => {
  if (error) return renderError(error);
  if (!nodes.length) return renderError(`策略组 ${GROUP_NAME} 中没有可检测节点`);

  const samples = Object.fromEntries(nodes.map((name) => [name, []]));
  runRound(0);

  function runRound(round) {
    if (round >= TEST_ROUNDS) return renderResults(nodes, samples);

    testPolicies(nodes, (result) => {
      nodes.forEach((name) => {
        const value = Number(result && result[name] && result[name]["round-one-total"]);
        if (Number.isFinite(value) && value > 0) samples[name].push(value);
      });
      runRound(round + 1);
    });
  }
});

function getGroupNodes(done) {
  $httpAPI("GET", "/v1/policy_groups", null, (result) => {
    const entries = result && Array.isArray(result[GROUP_NAME]) ? result[GROUP_NAME] : null;
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
        ? `失败 ${row.name}`
        : `${Math.round(row.latency)} ms · ${formatJitter(row.jitter)} ms ${row.name}`
    )
    .join("\n\n");

  $done({
    title: "Latency",
    content,
    icon: "gauge.with.dots.needle.67percent",
    "icon-color": "#6699FF",
  });
}

function renderError(message) {
  $done({
    title: "Latency",
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
