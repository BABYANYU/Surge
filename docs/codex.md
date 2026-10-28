# Codex 额度面板（Surge iOS）

[安装 Codex](https://babyanyu.github.io/Surge/?m=codex) · [模块源文件](../Codex.sgmodule) · [脚本](../Codex/codex-panel.js)

## Windows 参数复制工具

下载 [启动文件](../Codex/Open-Codex-Helper.cmd) 和 [PowerShell 脚本](../Codex/Copy-Codex-Parameters.ps1)，放在同一文件夹，双击启动文件。工具只读取本机已登录 Codex 的 `CODEX_HOME/auth.json` 或 `~/.codex/auth.json`，点击按钮复制 AccessToken 或 AccountId；不联网、不显示凭据、不保存副本。不能在 iPhone Surge 内执行这个 Windows 工具。不要把凭据、auth.json 或含参数的配置上传到 GitHub。

## 配置

在 Surge 的模块设置里手动填写，仓库中的 AccessToken / AccountId 默认为空：

| 参数 | 填写内容 |
| --- | --- |
| `AccessToken` | 短期 `access_token` 本身，不带 `Bearer `。不是 API key 或 refresh token。 |
| `AccountId` | 与令牌匹配的 ChatGPT 账户/工作区 ID；不是用户 ID、邮箱或 API 组织密钥。 |
| `Policy` | 已有的 Surge 策略或策略组名，默认为 `AI`；空值也回退到 `AI`。不自动创建或切换策略组。 |

安装启用后在策略选择页查看面板，点击卡片刷新查询最新额度。`update-interval=-1` 关闭面板自动刷新，不后台轮询，不需要 MITM。模块订阅 URL 与面板标识保持稳定；脚本发布时在内部 URL 附加基于脚本内容的版本参数，避免手机继续执行旧缓存，无需用户更换模块链接；沿用 IPPure、Route、HTTPS 的配置：`update-interval=-1`，`script-update-interval=1`。脚本更新间隔不代表每秒查询额度。更新模块获取新版配置；查询实时额度仍由面板刷新触发。

### 参数编码与保密

Surge 的 `{{{参数}}}` 是**应用模块前原样替换配置文本**，官方没有承诺自动转义；它不是安全的 JSON 或 JavaScript 字符串插值。模块参数表本身使用 `#!arguments=AccessToken,AccountId,Policy:AI`，`argument` 内的 `key=value&...` 仅是本脚本自己的传参协议，不是 Surge 的模块参数表语法。

- 标准 JWT（字母、数字、`-`、`_`、`.`）和常见账户 ID 可直接填写。
- 值含其他字符时，先在本地用 `encodeURIComponent` 编码**单个值**，再填对应参数框；不要编码整个 `key=value&...` 字串，也不要发送凭据到在线编码网站。
- 尤其不能把原始引号、逗号、换行或 `&` 直接放进参数框。空格填 `%20`，双引号填 `%22`，逗号 `%2C`，`&` 为 `%26`，`=` 为 `%3D`，字面 `%` 为 `%25`，`+` 为 `%2B`。策略名 `香港 Proxy` 填 `%E9%A6%99%E6%B8%AF%20Proxy`。
- 参数解析器严格检查键名、重复键、分隔符、百分号编码及控制字符，按值解码后再验证 token / account ID。不会使用 `eval`、JS/JSON 插值、任意 URL 或额外请求字段；也不把 `+` 转为空格。脚本层校验不能修复已经破坏模块配置的原始引号，务必遵守上述编码要求。
- 凭据由 Surge 本地模块实例保存，不在远端源文件中；本脚本不调用 `$persistentStore`，不获取浏览器/ChatGPT 登录态，不记录 token、account ID、响应正文或原始错误。不要分享模块设置截图、导出配置或包含凭据的诊断记录。
- 令牌过期后由用户本地更新；脚本不会刷新令牌。

## 数据与展示兼容

按 [Egern 模块](https://raw.githubusercontent.com/BABYANYU/Egern/main/modules/Codex.yaml) 引用的 [固定脚本版本 d36a632](https://github.com/BABYANYU/Egern/blob/d36a632f19f45addb611d8006d590deee2548f1b/scripts/Codex.js) 移植数据语义：

- 一次只读 GET `https://chatgpt.com/backend-api/wham/usage`，使用 `$httpClient.get` 官方 `policy`，请求超时 10 秒、脚本超时 15 秒；禁用自动重定向与 cookie。12 秒补偿计时器确保没有回调时仍返回失败面板。
- 仅解析顶层 `rate_limit`，按 `limit_window_seconds` 识别 18000 秒（5h）与 604800 秒（7d），不按 primary/secondary 的位置猜测窗口，也不混入代码审查或模型额外额度。
- 剩余为 `100 - used_percent`（最多一位小数）；`reset_at` 为服务端返回的 Unix 秒，与本次请求完成时刻相减生成倒计时。5 小时额度显示到分钟（不足一分钟明确提示）；周额度显示天和小时（不足一小时明确提示），不显示无意义的零单位。时间已到只提示刷新，不假设额度已恢复；缺失重置时间明确提示。
- Surge 原生文本面板：标题 `Codex`，图标 `bolt.circle.fill`，颜色 `#6699FF`。按浅色精简版显示「5 小时额度 · 剩余 58%」「1 小时 9 分钟后重置」，空行后显示每周额度及按天／小时精简的倒计时；不显示进度条、已用比例或完整日期。字体和行距由 Surge 控制。
- 401 提示更新令牌，403 提示检查账户/访问限制，429 提示稍后重试（不解释为 Codex 额度耗尽）。网络、超时、无效状态、JSON/结构错误均安全返回失败面板，不输出服务端正文。
- 保持手动刷新。倒计时是刷新时的快照，不会逐秒变化；下次点击卡片刷新后重新查询。Surge 缓存上次面板结果，网络查询完成前可能短暂显示旧内容。更新模块时原订阅链接不变，内部脚本使用内容版本参数避开旧脚本缓存。

接口不是稳定公开 API，可能变化；只能显示服务端实际返回的 5h / 7d 窗口，没有有效窗口时明确提示。

## 验证边界

离线执行：

```sh
node --check scripts/codex-panel.js
node --check tests/codex-panel.test.js
node tests/codex-panel.test.js
# 可选：把固定版本上游脚本下载到本地后，追加其路径做解析器差分校验
node tests/codex-panel.test.js /tmp/codex-original.js
```

所有测试仅使用合成结构与合成标记，无真实凭据、无网络额度请求。覆盖真实源字段结构映射、5h/7d 交换和去重、额外池排除、非法/缺失字段、重置边界、编码/注入式输入、策略传递、401/403/429/重定向/服务器错误、网络异常、无回调超时、重复回调、所有运行分支恰好一次 `$done` 与输出无凭据检查。

未读取现有 ChatGPT 登录态，未进行真实账户额度测试或 Surge 真机面板验收；未安装模块、未改本机 `Surge.conf`、未备份或上传活动 Profile，也未调用官方云配置校验。测试不能替代 Surge 引擎实测。

官方依据：[模块参数表](https://manual.nssurge.com/profile/module.html)、[generic](https://manual.nssurge.com/scripting/generic.html)、[JS API / HTTP client](https://manual.nssurge.com/scripting/api.html)、[Information Panel](https://manual.nssurge.com/tools/panel.html)。
