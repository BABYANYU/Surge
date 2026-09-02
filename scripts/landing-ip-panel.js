// Route panel
const PANEL = {
  icon: "globe.asia.australia",
  color: "#6699FF",
};

const LOOKUP_URL = `https://ipwho.is/?lang=zh-CN&surge_panel=${Date.now()}`;

main().catch((error) => {
  finishError(error && error.message ? error.message : "查询失败");
});

async function main() {
  const landing = parseIPWho(await getJSON(LOOKUP_URL));
  const request = await findPanelRequest();
  const policy = clean(request && request.policyName) || "当前策略";
  const entranceIP = extractProxyIP(request && request.remoteAddress);
  const hasDistinctEntrance = entranceIP && !sameIP(entranceIP, landing.ip);

  let entrance = {};

  if (hasDistinctEntrance) {
    entrance = await lookupEntrance(entranceIP).catch(() => ({}));
  }

  const lines = [];

  if (hasDistinctEntrance) {
    lines.push(
      `入口 IP：${entranceIP}`,
      `运营商：${formatOperator(entrance.operator)}`,
      `位置：${formatLocation(entrance)}`,
      ""
    );
  }

  lines.push(
    `落地 IP：${landing.ip}`,
    `运营商：${formatOperator(landing.operator)}`,
    `位置：${formatLocation(landing)}`
  );

  $done({
    title: `Route：${fitText(policy, 24)}`,
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

async function lookupEntrance(ip) {
  const encodedIP = encodeURIComponent(ip);

  try {
    return parseEntranceIPWho(
      await getJSON(`https://ipwho.is/${encodedIP}?lang=zh-CN&surge_panel=${Date.now()}`)
    );
  } catch (_) {
    return parseIPSB(
      await getJSON(`https://api.ip.sb/geoip/${encodedIP}?surge_panel=${Date.now()}`)
    );
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

function parseEntranceIPWho(data) {
  if (!data || data.success === false || !data.ip) {
    throw new Error("无法获取入口信息");
  }

  const connection = data.connection || {};
  const organization = clean(connection.org);
  const isp = clean(connection.isp);

  return {
    countryCode: data.country_code,
    country: data.country,
    region: data.region,
    city: data.city,
    operator: /^(private customer|unknown|n\/a)$/i.test(organization)
      ? isp
      : organization || isp,
  };
}

function parseIPSB(data) {
  if (!data || !data.ip) {
    throw new Error("无法获取入口信息");
  }

  return {
    countryCode: data.country_code,
    country: data.country,
    region: data.region,
    city: data.city,
    operator: data.organization || data.isp || data.asn_organization,
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

function sameIP(left, right) {
  return normalizeIP(left) === normalizeIP(right);
}

function normalizeIP(value) {
  return clean(value).replace(/^\[|\]$/g, "").toLowerCase();
}

function formatLocation(info) {
  const code = String((info && info.countryCode) || "").toUpperCase();
  const country = countryName(code, info && info.country);
  const region = trimPlaceSuffix(info && info.region);
  const city = trimPlaceSuffix(info && info.city);

  if (["HK", "MO", "TW"].includes(code)) return country || "未知";
  if (code === "CN" && ["北京", "上海", "天津", "重庆"].includes(region)) return region;

  const values = code === "CN" ? unique([region, city]) : unique([country, region, city]);
  return fitText(values.join(" ") || country || "未知", 24);
}

function formatOperator(value) {
  const source = clean(value);
  const lower = source.toLowerCase();

  if (/huawei cloud|hwcsnet/.test(lower)) return "Huawei Cloud";
  if (/ucloud/.test(lower)) return "UCloud";
  if (/alibaba cloud|aliyun/.test(lower)) return "Alibaba Cloud";
  if (/tencent cloud|qcloud/.test(lower)) return "Tencent Cloud";
  if (/amazon|\baws\b/.test(lower)) return "AWS";
  if (/google cloud|google llc/.test(lower)) return "Google Cloud";
  if (/microsoft|azure/.test(lower)) return "Microsoft Azure";
  if (/chinanet|china telecom|中国电信/.test(lower)) return "中国电信";
  if (/china unicom|unicom|中国联通/.test(lower)) return "中国联通";
  if (/china mobile|cmcc|中国移动/.test(lower)) return "中国移动";
  if (/china broadnet|中国广电/.test(lower)) return "中国广电";

  return fitText(shortProvider(source), 18);
}

function shortProvider(value) {
  const source = String(value || "").trim();
  const shortened = source
    .replace(/(?:,?\s+(?:incorporated|inc\.?|limited|ltd\.?|llc|corporation|corp\.?|company|co\.?))+$/i, "")
    .replace(/[,\s]+$/g, "")
    .replace(/\s+/g, " ");
  return shortened || source || "未知";
}

function trimPlaceSuffix(value) {
  return clean(value)
    .replace(/\s+(Sheng|Shi|Zizhiqu|Tequ)$/i, "")
    .replace(/(特别行政区|壮族自治区|回族自治区|维吾尔自治区|自治区|省|市)$/u, "");
}

function fitText(value, maxWidth) {
  const input = clean(value);
  let output = "";
  let width = 0;

  for (const character of input) {
    const nextWidth = /[^\x00-\xff]/.test(character) ? 2 : 1;
    if (width + nextWidth > maxWidth) return `${output.trim()}…`;
    output += character;
    width += nextWidth;
  }

  return output || "未知";
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
