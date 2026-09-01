const API_URL = "https://my.ippure.com/v1/info";

const request = {
  url: API_URL,
  headers: {
    Accept: "application/json",
    "User-Agent": "Surge IPPure Panel/1.0",
  },
};

$httpClient.get(request, (error, response, body) => {
  if (error) {
    return renderError(`请求失败：${error}`);
  }

  const status = Number(response && (response.status || response.statusCode));
  if (status && (status < 200 || status >= 300)) {
    return renderError(`接口异常：HTTP ${status}`);
  }

  let data;
  try {
    data = JSON.parse(body);
  } catch (_) {
    return renderError("接口返回了无效数据");
  }

  if (!data || !data.ip) {
    return renderError("未获取到出口 IP 信息");
  }

  const score = normalizeScore(data.fraudScore);
  const risk = riskLevel(score);
  const location = compact([localCountry(data), data.city]);
  const asn = data.asn ? `AS${data.asn}` : "未知";
  const organization = text(data.asOrganization, "未知");
  const nativeIp = nativeLabel(data.isBroadcast);

  const content = [
    `IP：${data.ip}`,
    `位置：${location || "未知"}`,
    `ASN：${asn} · ${organization}`,
    `风险：${score === null ? "未知" : `${score} / 100 · ${risk.label}`}`,
    `原生 IP：${nativeIp}`,
  ].join("\n");

  $done({
    title: "IPPure · IP 纯净度",
    content,
    icon: "network.badge.shield.half.filled",
    "icon-color": risk.color,
  });
});

function renderError(message) {
  $done({
    title: "IPPure · 查询失败",
    content: `${message}\n请稍后点击面板重试`,
    icon: "exclamationmark.shield.fill",
    "icon-color": "#FF453A",
  });
}

function normalizeScore(value) {
  const score = Number(value);
  if (!Number.isFinite(score)) return null;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function riskLevel(score) {
  if (score === null) return { label: "未知", color: "#8E8E93" };
  if (score <= 19) return { label: "低", color: "#30D158" };
  if (score <= 59) return { label: "中等", color: "#FF9F0A" };
  if (score <= 89) return { label: "高", color: "#FF453A" };
  return { label: "极高", color: "#BF5AF2" };
}

function nativeLabel(isBroadcast) {
  if (isBroadcast === true) return "否";
  if (isBroadcast === false) return "是";
  return "未知";
}

function localCountry(data) {
  const code = String(data.countryCode || "").toUpperCase();
  const names = {
    CN: "中国大陆",
    HK: "中国香港",
    MO: "中国澳门",
    TW: "中国台湾",
    JP: "日本",
    SG: "新加坡",
    US: "美国",
    GB: "英国",
    KR: "韩国",
    DE: "德国",
    FR: "法国",
    CA: "加拿大",
    AU: "澳大利亚",
  };
  return names[code] || text(data.country, code || "未知");
}

function compact(values) {
  const result = [];
  values.forEach((value) => {
    const item = String(value || "").trim();
    if (item && !result.includes(item)) result.push(item);
  });
  return result.join(" · ");
}

function text(value, fallback) {
  const result = String(value || "").trim();
  return result || fallback;
}
