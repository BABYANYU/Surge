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
  const location = compact([localCountry(data), localCity(data)]);
  const asn = data.asn ? `AS${data.asn}` : "未知";
  const fallbackOrganization = text(data.asOrganization, "未知");
  const nativeIp = nativeLabel(data.isBroadcast);

  lookupPolicy((policy) => {
    lookupProvider(data.ip, fallbackOrganization, (provider) => {
      const organization = fitText(provider, 20);
      const content = [
        `检测IP：${data.ip}`,
        `ASN：${asn} · ${organization}`,
        `位置：${location || "未知"}`,
        `风险：${score === null ? "未知" : score}`,
        `原生：${nativeIp}`,
      ].join("\n");

      $done({
        title: policy ? `IPPure：${fitText(policy, 24)}` : "IPPure",
        content,
        icon: "network",
        "icon-color": "#64D2FF",
      });
    });
  });
});

function lookupPolicy(done) {
  if (typeof $httpAPI === "undefined") return done("");

  $httpAPI("GET", "/v1/requests/recent", null, (result) => {
    const requests = result && Array.isArray(result.requests) ? result.requests : [];
    const request = requests
      .slice(0, 20)
      .find((item) => /my\.ippure\.com/i.test(String(item && item.URL)));
    done(text(request && request.policyName, ""));
  });
}

function lookupProvider(ip, fallback, done) {
  $httpClient.get(
    {
      url: `https://ipwho.is/${encodeURIComponent(ip)}?lang=zh-CN`,
      headers: {
        Accept: "application/json",
        "User-Agent": "Surge IPPure Panel/1.0",
      },
    },
    (error, response, body) => {
      const status = Number(response && (response.status || response.statusCode));
      if (error || (status && (status < 200 || status >= 300))) return done(fallback);

      try {
        const data = JSON.parse(body);
        const connection = data && data.connection;
        done(text(connection && (connection.isp || connection.org), fallback));
      } catch (_) {
        done(fallback);
      }
    }
  );
}

function renderError(message) {
  $done({
    title: "IPPure",
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

function localCity(data) {
  const city = text(data.city, "");
  if (!city) return "";
  if (/[^\x00-\xff]/.test(city)) return city.replace(/市$/u, "");

  const names = {
    "kwai chung": "葵涌",
    "hong kong": "",
    central: "中环",
    kowloon: "九龙",
    "tsuen wan": "荃湾",
    "sha tin": "沙田",
    singapore: "",
    tokyo: "东京",
    osaka: "大阪",
    seoul: "首尔",
    taipei: "台北",
    london: "伦敦",
    frankfurt: "法兰克福",
    paris: "巴黎",
    "los angeles": "洛杉矶",
    "san jose": "圣何塞",
    "new york": "纽约",
  };
  return names[city.toLowerCase()] || "";
}

function fitText(value, maxWidth) {
  const input = text(value, "未知");
  let output = "";
  let width = 0;

  for (const character of input) {
    const nextWidth = /[^\x00-\xff]/.test(character) ? 2 : 1;
    if (width + nextWidth > maxWidth) return `${output.trim()}…`;
    output += character;
    width += nextWidth;
  }

  return output;
}

function compact(values) {
  const result = [];
  values.forEach((value) => {
    const item = String(value || "").trim();
    if (item && !result.includes(item)) result.push(item);
  });
  return result.join(" ");
}

function text(value, fallback) {
  const result = String(value || "").trim();
  return result || fallback;
}
