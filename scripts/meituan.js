/* Response-only cleanup. Unknown schemas and errors leave the response untouched. */
(function () {
  "use strict";
  var output = {};
  try {
    var text = $response.body;
    // UTF-8 byte budget, also enforced by the module's max-size.
    if (typeof text !== "string" || !text || text.length > 2097152) {
      $done(output);
      return;
    }
    var bytes = 0;
    for (var cursor = 0; cursor < text.length; cursor += 1) {
      var unit = text.charCodeAt(cursor);
      if (unit < 128) bytes += 1;
      else if (unit < 2048) bytes += 2;
      else if (unit >= 55296 && unit <= 56319 && cursor + 1 < text.length &&
               text.charCodeAt(cursor + 1) >= 56320 && text.charCodeAt(cursor + 1) <= 57343) {
        bytes += 4;
        cursor += 1;
      } else bytes += 3;
      if (bytes > 2097152) { $done(output); return; }
    }
    var address = /^https?:\/\/([^/?#]+)(\/[^?#]*)/.exec($request.url);
    if (!address) { $done(output); return; }
    var site = address[1].toLowerCase();
    var route = address[2];
    var document = JSON.parse(text);
    var edits = 0;
    function record(value) {
      return value !== null && typeof value === "object" && !Array.isArray(value);
    }
    function at(path, root) {
      return path.reduce(function (value, key) {
        return record(value) ? value[key] : undefined;
      }, root === undefined ? document : root);
    }
    function assign(parent, key, value) {
      if (JSON.stringify(parent[key]) !== JSON.stringify(value)) {
        parent[key] = value;
        edits += 1;
      }
    }
    function empty(path) {
      var parent = at(path.slice(0, -1));
      var key = path[path.length - 1];
      if (record(parent) && Array.isArray(parent[key])) assign(parent, key, []);
    }
    function drop(path, field, names) {
      var parent = at(path.slice(0, -1));
      var key = path[path.length - 1];
      if (record(parent) && Array.isArray(parent[key])) {
        assign(parent, key, parent[key].filter(function (entry) {
          return !record(entry) || names.indexOf(entry[field]) === -1;
        }));
      }
    }
    var mode = "";
    if (site === "apimobile.meituan.com") {
      if (route.indexOf("/aggroup/indexTab") === 0) mode = "tabs";
      else if (route.indexOf("/group/v1/deal/searchpage/defaultword") === 0) mode = "search";
      else if (route.indexOf("/group/v1/deal/searchpage/hotword/city/divide/hotrecommend/") === 0) mode = "hot";
    } else if (site === "feedguess.meituan.com" &&
               /^\/lycoris\/scene\/(gwc_feed1_2265|personalcenter_2154)$/.test(route)) mode = "feed";
    else if (site === "mt-personalcenter.meituan.com" && route.indexOf("/usercenter/display") === 0) mode = "mine";
    else if (site === "assistify.meituan.com" && route.indexOf("/assistant/getAppClientHornConfig") === 0) mode = "assistant";
    else if (site === "mop.meituan.com") {
      if (route.indexOf("/mop/entry/shoppingCartEntry") === 0) mode = "cart";
      else if (route.indexOf("/api/entryModule/startupPicture") === 0) mode = "startup";
    }
    switch (mode) {
      case "tabs": {
        var tabs = at(["data", "resource", "tabArea"]);
        if (!Array.isArray(tabs)) break;
        var anchors = tabs.reduce(function (found, tab) {
          if (record(tab)) found[tab.tabName] = true;
          return found;
        }, Object.create(null));
        if (anchors.homepage && anchors.mine) drop(["data", "resource", "tabArea"], "tabName", ["video", "xiaotuan"]);
        break;
      }
      case "feed":
        if (record(document) && Array.isArray(document.data)) {
          empty(["data"]);
          assign(document, "bottom", true);
          if (!record(document.ext)) assign(document, "ext", {});
          assign(document.ext, "forbidByExp", true);
        }
        break;
      case "mine":
        drop(["children"], "name", ["mine_cross_recommend"]);
        break;
      case "search":
        empty(["searchIntroduceResponse", "defaultWordRes", "defaultWordItems"]);
        empty(["searchIntroduceResponse", "HotWordInfos"]);
        break;
      case "hot": {
        var segments = at(["data", "segmentsV2"]);
        if (!Array.isArray(segments)) break;
        var rebuilt = [];
        segments.forEach(function (segment) {
          if (!record(segment) || !Array.isArray(segment.hotwordSegments)) {
            rebuilt.push(segment);
            return;
          }
          var remaining = segment.hotwordSegments.filter(function (item) {
            return !record(item) || ["EntranceHotwordsV2Hotwords", "EntranceHotwordsV2ContentCard"].indexOf(item.pageName) < 0;
          });
          if (remaining.length === segment.hotwordSegments.length) rebuilt.push(segment);
          else if (remaining.length) {
            segment.hotwordSegments = remaining;
            rebuilt.push(segment);
            edits += 1;
          }
        });
        assign(document.data, "segmentsV2", rebuilt);
        empty(["data", "aiSearchBubble", "bubbleTexts"]);
        break;
      }
      case "assistant": {
        var packed = at(["data"]);
        if (typeof packed !== "string") break;
        var settings = JSON.parse(packed);
        if (record(settings) && record(settings.skills) && Object.keys(settings.skills).length) {
          settings.skills = {};
          assign(document, "data", JSON.stringify(settings));
        }
        break;
      }
      case "cart":
      case "startup":
        [[], ["data"]].forEach(function (base) {
          ["resource", "resourcesMap"].forEach(function (container) {
            empty(base.concat([container, mode === "cart" ? "topBannerArea" : "startupPicArea"]));
          });
        });
        break;
    }
    if (edits) output.body = JSON.stringify(document);
  } catch (_) {
    output = {};
  }
  $done(output);
})();
