/* Experimental: preserve successful DSP responses instead of rejecting transport.
 * Only the two captured ad endpoints are changed. Logs contain types/stages only.
 */
(function () {
  var result = {};
  var stage = 'guard';
  function finish(value) {
    try {
      console.log('[FCAD-diag-1] stage=' + stage + ';rewrite=' + !!value.body +
        ';inputType=' + (typeof $response === 'undefined' ? 'missing' : typeof $response.body));
    } catch (_) {}
    $done(value);
  }
  try {
    if (typeof $request === 'undefined' || typeof $response === 'undefined' ||
        $request.method !== 'GET' || Number($response.status) !== 200 ||
        !/^https:\/\/dsp\.fcbox\.com\/adSearch\/(?:get|getMulti)(?:\?|$)/.test($request.url) ||
        typeof $response.body !== 'string' || $response.body.length > 262144) {
      return finish(result);
    }
    stage = 'parse';
    var body = JSON.parse($response.body);
    stage = 'schema';
    var obj = function (v) { return v !== null && typeof v === 'object' && !Array.isArray(v); };
    if (!obj(body) || (body.code !== '370100000' && body.code !== 370100000) ||
        !(body.data === null || Array.isArray(body.data)) || !obj(body.extendsMap)) {
      return finish(result);
    }
    var changed = false;
    stage = 'known-schema';
    if (Array.isArray(body.data) && body.data.length) {
      body.data = [];
      changed = true;
    }
    ['wxAdsFlag', 'fcDspFlag', 'interstitialErrSwitch'].forEach(function (key) {
      // Preserve original types and never invent absent configuration keys.
      if (body.extendsMap[key] === 'true') {
        body.extendsMap[key] = 'false';
        changed = true;
      } else if (body.extendsMap[key] === true) {
        body.extendsMap[key] = false;
        changed = true;
      }
    });
    if (changed) result.body = JSON.stringify(body);
  } catch (_) { result = {}; stage += '-exception'; }
  finish(result);
})();
