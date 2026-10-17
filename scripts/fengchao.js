/* Confirmed homepage ad module only. No logging or network requests.
 * Unknown response shapes and failures are returned unchanged.
 */
(function () {
  const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  try {
    if (typeof $request === 'undefined' || typeof $response === 'undefined' ||
        $request.method !== 'GET' ||
        !/^https:\/\/webchatapp\.fcbox\.com\/fcboxactivityweb\/api\/v2\/clientPage\/modulesAggregated(?:\?|$)/.test($request.url) ||
        $response.status !== 200 || typeof $response.body !== 'string') {
      return $done({});
    }
    const body = JSON.parse($response.body);
    if (!object(body) || body.success !== true || body.code !== '0' ||
        !object(body.data) || typeof body.data.homePageConfig !== 'string') {
      return $done({});
    }
    const config = JSON.parse(body.data.homePageConfig);
    if (!object(config) || !Array.isArray(config.moduleList) ||
        !config.moduleList.every(object)) {
      return $done({});
    }
    // Triple discriminator observed in the capture; do not remove other modules.
    const retained = config.moduleList.filter(module => !(
      module.moduleType === 'm2' && module.title === '广告' && module.name === 'banner模块'
    ));
    if (retained.length === config.moduleList.length) return $done({});
    config.moduleList = retained;
    body.data.homePageConfig = JSON.stringify(config);
    return $done({ body: JSON.stringify(body) });
  } catch (_) {
    return $done({});
  }
})();
