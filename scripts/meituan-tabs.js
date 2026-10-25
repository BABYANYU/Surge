/* Remove only the 小团 tab from Meituan tab payloads. Unknown shapes pass through. */
(function () {
  "use strict";
  var out = {};
  try {
    if (typeof $response === "undefined" || $response.status !== 200 ||
        typeof $response.body !== "string" ||
        !/^https:\/\/apimobile\.meituan\.com\/aggroup\/indexTab(?:[?#]|$)/.test($request.url)) {
      $done(out);
      return;
    }
    var doc = JSON.parse($response.body);
    var changed = false;
    function isObject(v) { return v !== null && typeof v === "object" && !Array.isArray(v); }
    function isXiaotuan(v) {
      if (!isObject(v)) return false;
      var fields = ["tabName", "name", "title", "tabTitle", "text", "tabText"];
      for (var i = 0; i < fields.length; i += 1) {
        var value = v[fields[i]];
        if (typeof value === "string" && (value.toLowerCase().indexOf("xiaotuan") >= 0 || value.indexOf("小团") >= 0)) {
          return true;
        }
      }
      return false;
    }
    function walk(node, key) {
      if (Array.isArray(node)) {
        if (/tab/i.test(key)) {
          var kept = node.filter(function (item) { return !isXiaotuan(item); });
          if (kept.length !== node.length) {
            node.length = 0;
            Array.prototype.push.apply(node, kept);
            changed = true;
          }
        }
        node.forEach(function (item) { walk(item, key); });
      } else if (isObject(node)) {
        Object.keys(node).forEach(function (childKey) { walk(node[childKey], childKey); });
      }
    }
    walk(doc, "");
    if (changed) out.body = JSON.stringify(doc);
  } catch (_) {
    out = {};
  }
  $done(out);
})();
