# 丰巢小程序：精准广告精简（待实机验证）

## 静态证据与实际范围

仅在本机使用 Python 解析授权 HAR（90 条），未重放任何用户请求。HAR、请求凭据、查询参数、个人响应及地址均不进入仓库。

- `dsp.fcbox.com/adSearch/getMulti`：捕获 3 次，其中 1 次有广告数组，其余为空；广告项包含 `mediaType`、`url`、`adExposureTrackerUrl`、`adClickTrackerUrl`、`adTag`、`adPosition` 等字段。独立广告检索接口，精准 reject。
- `dsp.fcbox.com/adSearch/get`：捕获 2 次，均为空广告响应，包含 `fcDspFlag`、`interstitialErrSwitch` 等广告配置字段。与上一接口同属独立广告检索，精准 reject。
- `webchatapp.fcbox.com/commerce/mobile/appConfig/getPositions`：广告位配置标明“微信小程序首页 Banner 第二帧程序化”。只作为证据，不修改。
- `webchatapp.fcbox.com/fcboxactivityweb/api/v2/clientPage/modulesAggregated`：混合首页响应，`data.homePageConfig` 为 JSON 字符串，包含 `moduleList` 与 `userTierInfo`。只移除同时满足 `moduleType=m2`、`title=广告`、`name=banner模块` 的模块；保留储物服务、生活服务、省钱小攻略、用户等级及其他字段。

**未证实开屏广告对应的具体接口/广告位。** 不能仅凭 `interstitialErrSwitch` 断言它就是启动开屏。此版本不声称消除开屏或全部内置广告，DSP 被拒绝后是否出现微信广告兜底、重试或空白区域均待实机观察。没有修改广告开关或推测其真假语义。

## 安全边界

MITM 仅追加 `dsp.fcbox.com`、`webchatapp.fcbox.com`；后者同时承载业务，但脚本只匹配上述一个完整路径，并要求 GET、HTTP 200、成功码及严格的响应结构。错误、未知结构或无目标广告时 `$done({})` 原样放行，不记录 body、凭据，不发网络请求。

不屏蔽整个 fcbox 域、不匹配通用微信图片域、不拦截共享静态资源。不修改登录、取件、寄件、支付、地址、会员权益、金刚区和其他首页混合配置。URL Rewrite 仅精确匹配两个 DSP 路径，拒绝发生在响应结构检查之前，不代表 DSP 请求也有脚本式 fail-open。

## 安装

- [稳定源文件](https://raw.githubusercontent.com/BABYANYU/Surge/refs/heads/main/Fengchao.sgmodule)
- [打开 Surge 安装](https://babyanyu.github.io/Surge/?m=fengchao)

需要用户自行安装/启用模块、启用 MITM 并信任 Surge CA。本次未修改设备活动配置或本地模块，也未上传全 Profile 至官方校验服务。

## 离线验收与实机待办

运行 `node --check scripts/fengchao.js` 与 `node tests/fengchao.test.js`：14 组纯合成 mock 覆盖广告移除、空广告、业务不变、未知模块保留、内外层异常 JSON、错误状态与结构、路径/域/方法边界、两条广告检索规则及业务路径排除。此为本地语法/逻辑验证，不是 Surge 引擎或业务实测。

安装后完全退出小程序再打开，观察启动广告、首页 Banner、首页广告卡片及是否出现空白/重试；检查登录状态、取件列表、寄件入口和支付页面可用性。支付只观察页面，不为测试创建订单或付款。出现异常即可关闭此模块回退。

若仍有开屏，只需补抓一次“启动至广告结束”的短 HAR，同时记录广告出现时刻与类型；无需重复抓登录、地址和订单全流程。仅在本机检查该短窗口内广告检索响应、广告位字段或微信广告 SDK 流量，再决定是否扩大规则。不得将 HAR 原件上传仓库或公开。
