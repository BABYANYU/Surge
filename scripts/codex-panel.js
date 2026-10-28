/** Yanyu · Codex — Surge generic text panel.
 * Port of BABYANYU/Egern scripts/Codex.js at
 * d36a632f19f45addb611d8006d590deee2548f1b.
 * Credentials only from local module arguments; no storage, refresh or logging.
 * One fixed-origin request. Backend endpoint is not a stable public API.
 */
(() => {
  let completed = false;
  const done = state => {
    if (completed) return;
    completed = true;
    $done(render(state));
  };
  try {
    let config;
    try { config = argumentsConfig(typeof $argument === 'string' ? $argument : ''); }
    catch (_) {
      return done({ error: '授权参数格式无效', detail: '参数须按说明百分号编码；不含引号、换行或额外分隔符' });
    }
    const token = clean(config.AccessToken), account = clean(config.AccountId);
    const policy = clean(config.Policy) || 'Proxy';
    if (!token || !account) return done({ error: '待授权', detail: '请在模块设置填写 AccessToken / AccountId' });
    if (!/^[A-Za-z0-9._~+/=-]+$/.test(token) || !/^[A-Za-z0-9_-]+$/.test(account))
      return done({ error: '授权参数格式无效', detail: '仅填 access_token 本身及账户 ID，不含 Bearer 前缀' });
    // A fallback before the 15-second script deadline, even if no callback arrives.
    // No clearTimeout dependency: Surge cancels timers when $done completes.
    setTimeout(() => done({ error: '请求失败', detail: '检查网络、策略或超时；未获取额度' }), 12000);
    $httpClient.get({
      url: 'https://chatgpt.com/backend-api/wham/usage',
      policy, timeout: 10, 'auto-redirect': false, 'auto-cookie': false,
      headers: { Authorization: `Bearer ${token}`, 'ChatGPT-Account-Id': account,
        Accept: 'application/json', 'Cache-Control': 'no-cache' }
    }, (error, response, body) => {
      if (completed) return;
      try {
        if (error) return done({ error: '请求失败', detail: '检查网络、策略或超时；未获取额度' });
        const status = response && response.status;
        if (!Number.isInteger(status)) return done({ error: '无有效 HTTP 状态', detail: '未获取额度' });
        if (status < 200 || status >= 300) {
          const errors = {
            401: ['授权已过期或无效', '请本地重新登录并更新 access_token；不会自动刷新'],
            403: ['访问被拒绝', '检查账户、地区或访问限制'],
            429: ['请求过于频繁', '稍后手动重试；不等同于 Codex 额度耗尽']
          };
          const [error, detail] = errors[status] || [`HTTP ${status}`, '未获取额度；不显示旧数据'];
          return done({ error, detail });
        }
        let data;
        try { data = JSON.parse(body); }
        catch (_) { return done({ error: '接口返回格式错误', detail: 'JSON 解析失败；未获取额度' }); }
        let parsed;
        try { parsed = parseUsage(data); }
        catch (_) { return done({ error: '额度字段无法识别', detail: '接口可能已变更；未获取有效额度' }); }
        return done({ ...parsed, queriedAt: Date.now() });
      } catch (_) { return done({ error: '请求失败', detail: '未获取有效额度；不显示旧数据' }); }
    });
  } catch (_) { return done({ error: '请求失败', detail: '检查网络、策略或超时；未获取额度' }); }
})();

// Native module placeholders are raw config substitution, NOT JavaScript or JSON.
// Percent-encode values before insertion; decode only after splitting exact keys.
// No eval, WebAPI dependency, form-style '+' decoding or duplicate-key override.
function argumentsConfig(raw) {
  if (!raw) return {};
  const config = Object.create(null);
  for (const pair of raw.split('&')) {
    const match = /^(AccessToken|AccountId|Policy)=([A-Za-z0-9._~%+\/-]*)$/.exec(pair);
    if (!match || Object.prototype.hasOwnProperty.call(config, match[1])) throw new Error('arguments');
    const value = decodeURIComponent(match[2]);
    if (/[\x00-\x1F\x7F]/.test(value)) throw new Error('arguments');
    config[match[1]] = value;
  }
  if (Object.keys(config).length !== 3) throw new Error('arguments');
  return config;
}

function clean(v) { return typeof v === 'string' ? v.trim() : ''; }
function object(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
function parseUsage(d) {
  if (!object(d) || !clean(d.plan_type) || !Object.prototype.hasOwnProperty.call(d, 'rate_limit')) throw new Error('schema');
  if (d.rate_limit !== null && !object(d.rate_limit)) throw new Error('schema');
  const windows = [];
  // Only top-level Codex windows; do not mix review/model/additional pools.
  for (const key of ['primary_window', 'secondary_window']) {
    const w = d.rate_limit && d.rate_limit[key];
    if (!object(w)) continue;
    const seconds = w.limit_window_seconds;
    if (seconds !== 18000 && seconds !== 604800) continue;
    if (typeof w.used_percent !== 'number' || !Number.isFinite(w.used_percent) || w.used_percent < 0 || w.used_percent > 100) continue;
    if (windows.some(x => x.seconds === seconds)) continue;
    const reset = Number.isInteger(w.reset_at) && w.reset_at > 0 && w.reset_at <= 8640000000000
      ? w.reset_at * 1000 : null;
    windows.push({ seconds, used: w.used_percent, reset });
  }
  windows.sort((a, b) => a.seconds - b.seconds);
  const plans = { plus: 'Plus', pro: 'Pro', free: 'Free', team: 'Team', business: 'Business', enterprise: 'Enterprise', edu: 'Edu' };
  return { plan: plans[d.plan_type] || '其他套餐', windows };
}
// Relative times are a snapshot at manual refresh, not a live timer.
function resetCountdown(reset, windowSeconds, now = Date.now()) {
  if (reset === null) return '重置时间未返回';
  const delta = reset - now;
  if (delta <= 0) return '重置时间已到，请刷新';
  if (windowSeconds === 604800) {
    const totalHours = Math.floor(delta / 3600000);
    if (totalHours === 0) return '不足 1 小时后重置';
    const days = Math.floor(totalHours / 24), hours = totalHours % 24;
    const parts = [];
    if (days) parts.push(`${days} 天`);
    if (hours) parts.push(`${hours} 小时`);
    return `${parts.join(' ')}后重置`;
  }
  if (delta < 60000) return '不足 1 分钟后重置';
  const totalMinutes = Math.ceil(delta / 60000);
  const hours = Math.floor(totalMinutes / 60), minutes = totalMinutes % 60;
  const parts = [];
  if (hours) parts.push(`${hours} 小时`);
  if (minutes) parts.push(`${minutes} 分钟`);
  return `${parts.join(' ')}后重置`;
}
function render(state) {
  const base = { title: 'Codex', icon: 'bolt.circle.fill', 'icon-color': '#6699FF' };
  if (state.error) return { ...base, style: 'error', content: `${state.error}\n${state.detail}` };
  const windows = state.windows || [];
  const now = Number.isFinite(state.queriedAt) ? state.queriedAt : Date.now();
  const section = w => {
    const remaining = Number((100 - w.used).toFixed(1));
    return `${w.seconds === 18000 ? '5 小时额度' : '每周额度'} · 剩余 ${remaining}%\n${resetCountdown(w.reset, w.seconds, now)}`;
  };
  return { ...base, content: windows.length ? windows.map(section).join('\n\n') : '未返回 5 小时 / 周额度窗口' };
}
