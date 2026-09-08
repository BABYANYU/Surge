// Surge Single-Stream panel
// Uses Ookla's server configuration and download endpoints used by Speedtest.

(async function () {
  "use strict";

  var BLUE = "#5B9CF5";
  var CONFIG_URL = "https://www.speedtest.net/api/js/config-sdk?engine=js&limit=10&https_functional=true";
  var CHUNK_BYTES = 16 * 1024 * 1024;
  var settings = parseArguments(typeof $argument === "string" ? $argument : "");

  try {
    var config = await getJson({
      url: CONFIG_URL + "&_=" + Date.now(),
      timeout: 8,
      headers: {
        Accept: "application/json",
        Referer: "https://single.speedtest.net/",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1"
      }
    });

    var candidates = buildCandidates(config, settings.server_url);
    if (!candidates.length) throw new Error("No available test server");

    var authToken = config.clientAuth && config.clientAuth.token ? config.clientAuth.token : "";
    var selected = await selectLowestLatency(candidates.slice(0, 3), authToken);
    var latency = await measureLatency(selected, authToken, settings.ping_count);

    if (!latency.successCount) throw new Error("All latency probes failed");

    await warmUp(selected, authToken, settings.warmup_seconds);
    var download = await measureDownload(selected, authToken, settings.test_seconds, settings.max_download_gb);

    if (!download.bytes || !download.seconds) throw new Error("No download data received");

    var mbps = download.bytes * 8 / download.seconds / 1000000;
    var loss = latency.lossCount / settings.ping_count * 100;

    $done({
      title: "Single-Stream",
      content: [
        "Location: " + selected.location,
        "Download: " + formatNumber(mbps, 1) + " Mbps",
        "Ping: " + formatNumber(latency.ping, 0) + " ms",
        "Jitter: " + formatNumber(latency.jitter, 0) + " ms",
        "Loss: " + formatNumber(loss, 1) + "%"
      ].join("\n"),
      icon: "speedometer",
      "icon-color": BLUE
    });
  } catch (error) {
    $done({
      title: "Single-Stream",
      content: "Speed test failed\n" + cleanError(error),
      icon: "speedometer",
      "icon-color": BLUE
    });
  }

  function parseArguments(argument) {
    var values = {
      ping_count: 6,
      warmup_seconds: 0,
      test_seconds: 8,
      max_download_gb: 2,
      server_url: "auto"
    };

    argument.split("&").forEach(function (item) {
      var pair = item.split("=");
      if (pair.length < 2) return;
      var key = pair.shift();
      var value = pair.join("=");
      if (Object.prototype.hasOwnProperty.call(values, key)) values[key] = value;
    });

    values.ping_count = clampInteger(values.ping_count, 2, 12, 6);
    values.warmup_seconds = clampNumber(values.warmup_seconds, 0, 5, 0);
    values.test_seconds = clampNumber(values.test_seconds, 2, 20, 8);
    values.max_download_gb = clampNumber(values.max_download_gb, 0.1, 5, 2);
    values.server_url = String(values.server_url || "auto").trim();
    return values;
  }

  function buildCandidates(config, customUrl) {
    if (customUrl && customUrl.toLowerCase() !== "auto") {
      return [{ baseUrl: normalizeServerUrl(customUrl), location: hostnameOf(customUrl) }];
    }

    var servers = Array.isArray(config.servers) ? config.servers : [];
    return servers.filter(function (server) {
      return server && server.https_functional && (server.host || server.url);
    }).map(function (server) {
      var host = server.host || hostnameOf(server.url);
      return {
        baseUrl: normalizeServerUrl("https://" + host),
        location: server.name || server.country || host
      };
    });
  }

  async function selectLowestLatency(servers, token) {
    var winner = servers[0];
    var best = Infinity;

    for (var i = 0; i < servers.length; i++) {
      try {
        var sample = await latencyProbe(servers[i], token, 3);
        if (sample < best) {
          best = sample;
          winner = servers[i];
        }
      } catch (_) {}
    }
    return winner;
  }

  async function measureLatency(server, token, count) {
    var samples = [];
    var losses = 0;

    for (var i = 0; i < count; i++) {
      try {
        samples.push(await latencyProbe(server, token, 3));
      } catch (_) {
        losses++;
      }
    }

    var sortedSamples = samples.slice().sort(function (a, b) { return a - b; });
    var ping = sortedSamples.length ? median(sortedSamples) : 0;
    var jitterValues = [];
    for (var j = 1; j < samples.length; j++) {
      jitterValues.push(Math.abs(samples[j] - samples[j - 1]));
    }

    return {
      ping: ping,
      jitter: jitterValues.length ? average(jitterValues) : 0,
      lossCount: losses,
      successCount: samples.length
    };
  }

  async function latencyProbe(server, token, timeout) {
    var start = Date.now();
    var response = await httpGet({
      url: server.baseUrl + "/speedtest/latency.txt?_=" + Date.now() + Math.random(),
      timeout: timeout,
      headers: requestHeaders(token, false)
    });
    if (response.status < 200 || response.status >= 300 || String(response.data).indexOf("test=test") === -1) {
      throw new Error("Latency probe rejected");
    }
    return Date.now() - start;
  }

  async function warmUp(server, token, seconds) {
    if (seconds <= 0) return;
    var started = Date.now();
    while ((Date.now() - started) / 1000 < seconds) {
      await downloadChunk(server, token, CHUNK_BYTES, 8);
    }
  }

  async function measureDownload(server, token, seconds, maxGb) {
    var capBytes = Math.round(maxGb * 1000000000);
    var received = 0;
    var started = Date.now();

    while (received < capBytes && (Date.now() - started) / 1000 < seconds) {
      var remaining = capBytes - received;
      var size = Math.min(CHUNK_BYTES, remaining);
      var elapsed = (Date.now() - started) / 1000;
      var timeout = Math.max(2, Math.ceil(seconds - elapsed) + 2);
      received += await downloadChunk(server, token, size, timeout);
    }

    return {
      bytes: received,
      seconds: Math.max((Date.now() - started) / 1000, 0.001)
    };
  }

  async function downloadChunk(server, token, size, timeout) {
    var response = await httpGet({
      url: server.baseUrl + "/download?size=" + size + "&_=" + Date.now() + Math.random(),
      timeout: timeout,
      "binary-mode": true,
      headers: requestHeaders(token, true)
    });
    if (response.status < 200 || response.status >= 300) throw new Error("Download server returned HTTP " + response.status);
    if (!response.data || typeof response.data.byteLength !== "number") throw new Error("Invalid download response");
    return response.data.byteLength;
  }

  function requestHeaders(token, binary) {
    var headers = {
      Accept: binary ? "application/octet-stream" : "text/plain",
      Referer: "https://single.speedtest.net/",
      "Cache-Control": "no-cache"
    };
    if (token) headers.Authorization = "Bearer " + token;
    return headers;
  }

  function httpGet(options) {
    return new Promise(function (resolve, reject) {
      $httpClient.get(options, function (error, response, data) {
        if (error) return reject(new Error(error));
        resolve({ status: response && response.status ? response.status : 0, data: data });
      });
    });
  }

  async function getJson(options) {
    var response = await httpGet(options);
    if (response.status < 200 || response.status >= 300) throw new Error("Configuration returned HTTP " + response.status);
    try {
      return JSON.parse(response.data);
    } catch (_) {
      throw new Error("Invalid server configuration");
    }
  }

  function normalizeServerUrl(value) {
    var text = String(value || "").trim();
    if (!/^https?:\/\//i.test(text)) text = "https://" + text;
    var match = text.match(/^(https?:\/\/[^/]+)/i);
    if (!match) throw new Error("Invalid server URL");
    return match[1].replace(/^http:/i, "https:");
  }

  function hostnameOf(value) {
    var match = String(value || "").match(/^(?:https?:\/\/)?([^/]+)/i);
    return match ? match[1] : "Custom Server";
  }

  function median(values) {
    var middle = Math.floor(values.length / 2);
    return values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2;
  }

  function average(values) {
    return values.reduce(function (sum, value) { return sum + value; }, 0) / values.length;
  }

  function clampInteger(value, min, max, fallback) {
    var number = parseInt(value, 10);
    return isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
  }

  function clampNumber(value, min, max, fallback) {
    var number = Number(value);
    return isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
  }

  function formatNumber(value, digits) {
    return Number(value).toFixed(digits);
  }

  function cleanError(error) {
    var message = error && error.message ? error.message : String(error || "Unknown error");
    return message.replace(/^Error:\s*/i, "").slice(0, 160);
  }
})();
