const ICON = "clock.arrow.2.circlepath";
const COLOR = "#6699FF";

try {
  const config = parseConfig(typeof $argument === "undefined" ? "" : $argument);
  validateConfig(config);

  if (isPanelRun()) {
    renderPanel(config);
  } else {
    synchronize(config);
  }
} catch (error) {
  finishError(error && error.message ? error.message : "配置无效");
}

function parseConfig(argument) {
  const parts = String(argument || "").split("§");
  if (parts.length !== 7) throw new Error("模块参数不完整");

  return {
    group: clean(parts[0]),
    aHour: parseInteger(parts[1]),
    aMinute: parseInteger(parts[2]),
    aPolicy: clean(parts[3]),
    bHour: parseInteger(parts[4]),
    bMinute: parseInteger(parts[5]),
    bPolicy: clean(parts[6]),
  };
}

function validateConfig(config) {
  if (!config.group) throw new Error("Group 不能为空");
  if (!config.aPolicy) throw new Error("A_Policy 不能为空");
  if (!config.bPolicy) throw new Error("B_Policy 不能为空");

  validateTime(config.aHour, config.aMinute, "A");
  validateTime(config.bHour, config.bMinute, "B");

  if (toMinutes(config.aHour, config.aMinute) === toMinutes(config.bHour, config.bMinute)) {
    throw new Error("A 与 B 的开始时间不能相同");
  }
}

function validateTime(hour, minute, label) {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    throw new Error(`${label}_Start_HH 必须是 00–23`);
  }
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
    throw new Error(`${label}_Start_MM 必须是 00–59`);
  }
}

function isPanelRun() {
  return (
    typeof $input !== "undefined" &&
    $input &&
    $input.purpose === "panel"
  );
}

function synchronize(config) {
  const details = getGroupDetails(config);
  const state = getTimeState(config, new Date());
  const current = clean(details.decisions && details.decisions[config.group]);

  if (current === state.policy) return $done();

  const changed = $surge.setSelectGroupPolicy(config.group, state.policy);
  if (!changed) throw new Error(`无法将 ${config.group} 切换到 ${state.policy}`);

  if (typeof $notification !== "undefined") {
    $notification.post(
      `Cron · ${config.group}`,
      `${state.start}–${state.end}`,
      `Now: ${state.policy}`
    );
  }

  $done();
}

function renderPanel(config) {
  const details = getGroupDetails(config);
  const state = getTimeState(config, new Date());
  const current = clean(details.decisions && details.decisions[config.group]) || "未知";

  $done({
    title: `Cron · ${fitText(config.group, 18)}`,
    content: [
      `${formatTime(config.aHour, config.aMinute)}–${formatTime(config.bHour, config.bMinute)}  ${fitText(config.aPolicy, 18)}`,
      `${formatTime(config.bHour, config.bMinute)}–${formatTime(config.aHour, config.aMinute)}  ${fitText(config.bPolicy, 18)}`,
      "",
      `Now:  ${fitText(current, 18)}`,
      `Next: ${state.nextTime} → ${fitText(state.nextPolicy, 14)}`,
    ].join("\n"),
    icon: ICON,
    "icon-color": COLOR,
  });
}

function getGroupDetails(config) {
  if (typeof $surge === "undefined" || typeof $surge.selectGroupDetails !== "function") {
    throw new Error("当前 Surge 版本不支持策略组脚本接口");
  }

  const details = $surge.selectGroupDetails() || {};
  const members = details.groups && details.groups[config.group];
  if (!Array.isArray(members)) throw new Error(`找不到 select 策略组：${config.group}`);
  if (!members.includes(config.aPolicy)) {
    throw new Error(`${config.group} 中找不到：${config.aPolicy}`);
  }
  if (!members.includes(config.bPolicy)) {
    throw new Error(`${config.group} 中找不到：${config.bPolicy}`);
  }

  return details;
}

function getTimeState(config, date) {
  const now = date.getHours() * 60 + date.getMinutes();
  const aStart = toMinutes(config.aHour, config.aMinute);
  const bStart = toMinutes(config.bHour, config.bMinute);
  const inA = aStart < bStart
    ? now >= aStart && now < bStart
    : now >= aStart || now < bStart;

  if (inA) {
    return {
      policy: config.aPolicy,
      start: formatTime(config.aHour, config.aMinute),
      end: formatTime(config.bHour, config.bMinute),
      nextTime: formatTime(config.bHour, config.bMinute),
      nextPolicy: config.bPolicy,
    };
  }

  return {
    policy: config.bPolicy,
    start: formatTime(config.bHour, config.bMinute),
    end: formatTime(config.aHour, config.aMinute),
    nextTime: formatTime(config.aHour, config.aMinute),
    nextPolicy: config.aPolicy,
  };
}

function finishError(message) {
  if (isPanelRun()) {
    return $done({
      title: "Cron",
      content: `配置错误\n${message}`,
      icon: "exclamationmark.triangle.fill",
      "icon-color": "#FF453A",
    });
  }

  if (typeof $notification !== "undefined") {
    $notification.post("Cron 定时切换", "配置错误", message);
  }
  $done();
}

function parseInteger(value) {
  const text = clean(value);
  if (!/^\d{1,2}$/.test(text)) return NaN;
  return Number(text);
}

function toMinutes(hour, minute) {
  return hour * 60 + minute;
}

function formatTime(hour, minute) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function fitText(value, maxWidth) {
  const input = clean(value) || "未知";
  let output = "";
  let width = 0;

  for (const character of input) {
    const characterWidth = /[^\x00-\xff]/.test(character) ? 2 : 1;
    if (width + characterWidth > maxWidth) return `${output.trim()}…`;
    output += character;
    width += characterWidth;
  }

  return output;
}

function clean(value) {
  return String(value == null ? "" : value).trim();
}
