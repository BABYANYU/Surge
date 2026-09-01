const PANEL = {
  icon: "globe.asia.australia",
  color: "#6699FF",
};

const LOOKUP_URL = `https://ipwho.is/?surge_panel=${Date.now()}`;

main().catch((error) => {
  finishError(error && error.message ? error.message : "查询失败");
});

async function main() {
  const landing = parseIPWho(await getJSON(LOOKUP_URL));
  const request = await findPanelRequest();
  const policy = clean(request && request.policyName) || "当前策略";
  const entranceIP = extractProxyIP(request && request.remoteAddress);

  let entrance = {};

  if (entranceIP) {
    entrance = await safeLookup(
      () => getJSON(`https://ipwho.is/${encodeURIComponent(entranceIP)}`),
      parseIPWho
    );
  }

  const lines = [
    `入口 IP：${entranceIP || "未知"}`,
    `位置：${formatLocation(entrance)}`,
    `运营商：${clean(entrance.operator) || "未知"}`,
  ];

  lines.push(
    "",
    `落地 IP：${landing.ip}`,
    `位置：${formatLocation(landing)}`,
    `运营商：${clean(landing.operator) || "未知"}`
  );

  $done({
    title: `代理策略：${policy}`,
    content: lines.join("\n"),
    icon: PANEL.icon,
    "icon-color": PANEL.color,
  });
}

function getJSON(url) {
  return new Promise((resolve, reject) => {
    $httpClient.get(
      {
        url,
        headers: {
          Accept: "application/json",
          "User-Agent": "Surge Proxy Chain Panel/1.0",
        },
      },
      (error, response, body) => {
        const status = Number(response && (response.status || response.statusCode));

        if (error) return reject(new Error(String(error)));
        if (status && (status < 200 || status >= 300)) {
          return reject(new Error(`HTTP ${status}`));
        }

        try {
          resolve(JSON.parse(body));
        } catch (_) {
          reject(new Error("接口返回格式错误"));
        }
      }
    );
  });
}

function findPanelRequest() {
  return new Promise((resolve) => {
    if (typeof $httpAPI === "undefined") return resolve(null);

    $httpAPI("GET", "/v1/requests/recent", null, (result) => {
      const requests = result && Array.isArray(result.requests) ? result.requests : [];
      const request = requests
        .slice(0, 20)
        .find((item) => /ipwho\.is/i.test(String(item && item.URL)));
      resolve(request || null);
    });
  });
}

async function safeLookup(request, parser) {
  try {
    return parser(await request());
  } catch (_) {
    return {};
  }
}

function parseIPWho(data) {
  if (!data || data.success === false || !data.ip) {
    throw new Error("无法获取 IP 信息");
  }

  return {
    ip: data.ip,
    countryCode: data.country_code,
    country: data.country,
    region: data.region,
    city: data.city,
    operator: data.connection && (data.connection.isp || data.connection.org),
  };
}

function extractProxyIP(value) {
  let text = clean(value).replace(/\s*\(Proxy\)\s*/gi, "");
  if (!text) return "";

  const bracketIPv6 = text.match(/^\[([^\]]+)\](?::\d+)?$/);
  if (bracketIPv6) return bracketIPv6[1];

  if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(text)) {
    text = text.replace(/:\d+$/, "");
  }

  return text;
}

function formatLocation(info) {
  const values = unique([
    countryName(info && info.countryCode, info && info.country),
    info && info.region,
    info && info.city,
  ]);
  return values.length ? values.join(" ") : "未知";
}

function countryName(code, fallback) {
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
  return names[String(code || "").toUpperCase()] || clean(fallback);
}

function unique(values) {
  const output = [];
  values.forEach((value) => {
    const item = clean(value);
    if (item && !output.includes(item)) output.push(item);
  });
  return output;
}

function clean(value) {
  return String(value || "").trim();
}

function finishError(message) {
  $done({
    title: "代理链信息",
    content: `${message}\n\n请稍后点击面板重试`,
    icon: "exclamationmark.triangle.fill",
    "icon-color": "#FF453A",
  });
}
