# 美团App 精简

[添加到 Surge](https://babyanyu.github.io/Surge/?m=meituan) · [模块](../Meituan.sgmodule) · [脚本](../scripts/meituan.js)

## 适配与来源边界

接口地址、字段行为及网络端点参考 [ZenmoFeiShi/Qx 的 MT.snippet](https://github.com/ZenmoFeiShi/Qx/blob/6bb62bec15a36719ef4acc9ad9252f60055259a6/MT.snippet) 与 [MT.js](https://github.com/ZenmoFeiShi/Qx/blob/6bb62bec15a36719ef4acc9ad9252f60055259a6/MT.js)。该参考版本标注美团 12.67.403，不等于本模块已在该版本实测。

检查时 GitHub license API 返回 404，未获得明确代码再发布许可。因此没有复制、改名或托管其脚本；本仓库根据接口/字段规格独立实现响应处理，保留事实性端点及规则映射。这不是授权声明，不声称参考代码归本仓库所有，也不保证与参考行为或线上版本一比一兼容。模块和运行脚本不包含第三方署名或源脚本链接；参考关系仅记于本说明。

## 功能与保守处理

- 保留 35 条网络规则：域名、通配域名及 IPv4/IPv6；未额外添加 `no-resolve`。拦截可能影响连接方式或部分业务，异常时请停用模块排查。
- 保留 8 组响应匹配与 5 个 MITM 域名。需用户自行在 Surge 配置 MITM 及信任证书；仅安装模块并不能保证 HTTPS 响应可改写。
- 底栏：仅当 `data.resource.tabArea` 同时含 `homepage`、`mine` 时删除 `video`、`xiaotuan`，保留其他项目。
- 推荐流：仅处理 `gwc_feed1_2265`、`personalcenter_2154`，清空 `data`，设置 `bottom=true`、`ext.forbidByExp=true`。
- 个人中心：仅过滤顶层 `children` 中的 `mine_cross_recommend`。
- 搜索默认词：清空 `searchIntroduceResponse.defaultWordRes.defaultWordItems` 和 `HotWordInfos`。
- 搜索推荐：过滤 `data.segmentsV2[].hotwordSegments` 中两种指定热词卡片；仅删除因过滤而变空的分段，保留原有空分段；同时清空 `data.aiSearchBubble.bubbleTexts`。`segmentsV2` 缺失时保守透传。
- 助手：仅在 `data` 为合法 JSON 字符串且内部 `skills` 为非空对象时清空技能，保留其他字段。
- 购物车/开屏：清空顶层或 `data` 下 `resource`/`resourcesMap` 的 `topBannerArea`/`startupPicArea` 数组，不递归清除同名业务字段。

脚本只读取当前请求地址及响应体，不发起网络请求、写存储或记录响应/个人数据。脚本与模块均限制 2 MiB；空体、异常 JSON、未知主机/接口、异常结构及内部处理错误透传，无改动也不重新序列化响应。

## 更新和验证

模块和脚本订阅使用本仓库 `refs/heads/main` 稳定地址；安装页不附加 `?v=`。Surge 可能缓存远程脚本，更新时请在 Surge 内检查模块/脚本更新。

离线验证：`node --check scripts/meituan.js`、`node tests/meituan.test.js`。合成 fixtures 覆盖全部 8 组接口与保护路径，仅证明字段转换行为，不代表真实用户会话或真机验收。此次发布不修改本机 Surge 配置、不安装模块、不生成配置备份。
