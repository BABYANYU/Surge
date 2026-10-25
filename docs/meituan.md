# 美团App 精简

[添加到 Surge](https://babyanyu.github.io/Surge/?m=meituan) · [模块](../Meituan.sgmodule) · [脚本](../scripts/meituan.js)

## 适配与来源边界

接口地址、字段行为及网络端点参考 [ZenmoFeiShi/Qx 的 MT.snippet](https://github.com/ZenmoFeiShi/Qx/blob/6bb62bec15a36719ef4acc9ad9252f60055259a6/MT.snippet) 与 [MT.js](https://github.com/ZenmoFeiShi/Qx/blob/6bb62bec15a36719ef4acc9ad9252f60055259a6/MT.js)。该参考版本标注美团 12.67.403，不等于本模块已在该版本实测。

检查时 GitHub license API 返回 404，未获得明确代码再发布许可。因此没有复制、改名或托管其脚本；本仓库根据接口/字段规格独立实现响应处理，保留事实性端点及规则映射。这不是授权声明，不声称参考代码归本仓库所有，也不保证与参考行为或线上版本一比一兼容。模块和运行脚本不包含第三方署名或源脚本链接；参考关系仅记于本说明。

## 功能与保守处理

- 保留 35 条网络规则：域名、通配域名及 IPv4/IPv6；24 条 IP 拦截规则添加 `no-resolve`，只匹配已有真实地址，不为匹配这些拦截规则主动解析域名，避免模块前置 IP 规则引发 Surge DNS 警告。未修改用户的 GEOIP 国内直连规则。拦截可能影响连接方式或部分业务，异常时请停用模块排查。
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

### 安装地址稳定，模块与脚本版本绑定

模块安装地址保持 `https://raw.githubusercontent.com/BABYANYU/Surge/refs/heads/main/Meituan.sgmodule`，安装页不附加 `?v=`。仅美团模块内的 8 个 `script-path` 固定到已发布 Git commit `cdad546bc78c9380a7570170f356fb66ad2d9c83`，避免远程脚本随 `main` 单独漂移；脚本正文未改变。

今后如修改美团脚本，应先提交并推送脚本，再将模块内全部 8 个脚本 URL 的 commit 更新到该已存在的完整提交号，最后发布模块。不得先发布引用尚未存在的提交的模块。这样模块内容与指定脚本版本绑定，旧模块不会因脚本主分支变化而执行新版。新 URL 的下载成功与实际生效仍需在 Surge 中检查，不能把“手动刷新模块”直接等同于“强制刷新所有原 URL 的脚本缓存”。本次未使用脚本 URL 查询参数。

### 官方语义与未确认项（2026-10-25 核查）

- [官方模块手册](https://manual.nssurge.com/profile/module.html)区分配置目录中的 Local Modules 与 URL 安装的 Installed Modules；在 UI 中看到缓存文件，不代表它是不会自动更新的 Local Module。[官方 iOS 更新日志](https://kb.nssurge.com/surge-knowledge-base/release-notes/surge-ios)明确记载：`Surge will check updates for installed modules automatically.` 因此不能假设 URL 安装的模块默认仅手动更新。
- 当前官方模块手册未载明 `#!update-interval`。未找到足以证实当前 iOS 支持用该元数据禁止模块自动更新的官方说明，不添加猜测参数。自动检查的准确周期、当前可关闭的 UI 开关及其是单模块还是全局范围，尚未确认。
- [官方脚本手册](https://manual.nssurge.com/scripting/overview.html)明确：远程脚本自动下载并缓存；`script-update-interval` 默认 86400 秒，控制脚本 URL 的自动更新间隔，不是模块更新间隔。当前正文未解释负数禁用语义；第三方模块出现 `-1` 不足以证明当前 Surge iOS 行为，因此此次不写 `script-update-interval=-1`，也不声称已经关闭脚本周期请求。固定 commit 只确保所取内容不随主分支漂移，不等于零请求。
- 未找到官方保证“手动更新模块会强制重新下载全部不变 URL 的脚本”的说明；本次未做真机缓存行为实验，不能宣称该联动已验证。版本化脚本 URL 避免依赖这种未经证实的联动，但不承诺下载时机及网络成功。
- 官方 `script-path` 文档仅列相对路径、绝对路径和 HTTP(S) URL，未列内联正文或 `data:` URI。没有官方支持依据，因此不嵌入脚本，不使用伪造的 inline/data URI 方案。

### 用户端待确认：目前不能宣称已经实现“100% 仅手动”

请在 Surge iOS 打开当前配置的「模块」页面，进入已安装的「美团App 精简」详情，查看实际提供的更新操作及自动更新选项，并提供模块列表/详情截图（隐藏私人 URL 与凭据）。若页面没有相关开关，再提供 Surge 设置中的更新相关页面及应用版本。确认实际 UI 之前，不臆造精确开关名称，也不让用户关闭可能影响其他模块的全局选项。

如当前版本提供**单模块**自动更新开关，只关闭美团的开关；若仅有**全局**开关，关闭会影响所有已安装模块，需要用户明确接受后操作。本仓库修改不能替用户关闭客户端开关。之后通过模块页手动更新美团并检查 8 个脚本 URL 已指向发布对应的 commit、下载无错误；这属于待用户真机验收，不是本次已完成项。真正配置目录内的本地文件不等同于 URL 订阅，直接改成本地文件也不应被描述成仍能一键从 GitHub 更新。

离线验证：`node --check scripts/meituan.js`、`node tests/meituan.test.js`。合成 fixtures 覆盖全部 8 组接口、保护路径及脚本固定版本约束，仅证明转换和仓库发布约束，不代表真实用户会话或真机验收。发布时另将固定 commit 的远程脚本与本地脚本逐字节比较，并用 GitHub API 核对发布提交。此次发布不修改本机 Surge 配置、不安装模块、不生成配置备份；未改其他模块、Cron、YouTube 或 `Surge.conf`，未切换策略、未 reload。
