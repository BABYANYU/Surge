# Codex 额度面板（Surge iOS）

[安装 Codex](https://babyanyu.github.io/Surge/?m=codex) · [模块源文件](../Codex.sgmodule) · [脚本](../scripts/codex-panel.js)

## 配置

在 Surge 的模块设置里手动填写，仓库中的 AccessToken / AccountId 默认为空：

| 参数 | 填写内容 |
| --- | --- |
| `AccessToken` | 短期 `access_token` 本身，不带 `Bearer `。不是 API key 或 refresh token。 |
| `AccountId` | 与令牌匹配的 ChatGPT 账户/工作区 ID；不是用户 ID、邮箱或 API 组织密钥。 |
| `Policy` | 已有的 Surge 策略或策略组名，默认为 `Proxy`；空值也回退到 `Proxy`。不自动创建或切换策略组。 |

安装启用后在策略选择页查看面板，点击刷新查询。模块不自动定时请求，不需要 MITM。

### 参数编码与保密

Surge 的 `{{{参数}}}` 是**应用模块前原样替换配置文本**，官方没有承诺自动转义；它不是安全的 JSON 或 JavaScript 字符串插值。模块参数表本身使用 `#!arguments=AccessToken,AccountId,Policy:Proxy`，`argument` 内的 `key=value&...` 仅是本脚本自己的传参协议，不是 Surge 的模块参数表语法。

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
- 原样保留有效 `used_percent`，剩余为 `100 - used_percent`（最多一位小数）；`reset_at` 为 Unix 秒，显示本地 `MM/DD HH:mm`，未提供时明确提示。不从当前时间推算重置、不显示旧数据为新额度。
- Surge 官方 generic Panel 返回 `title` / `content` / `style` / 图标字段，不支持 Egern 的富组件树、HTML、SVG 进度条或桌面/锁屏 widget 布局。因此这里是**文本面板**：以 10 格 `■` / `□` 近似表示已用进度（每格 10%，四舍五入），精确百分比另行显示。保留标题、5h/7d 已用、剩余及重置信息，但不是视觉一比一复刻。
- 401 提示更新令牌，403 提示检查账户/访问限制，429 提示稍后重试（不解释为 Codex 额度耗尽）。网络、超时、无效状态、JSON/结构错误均安全返回失败面板，不输出服务端正文。
- Surge 自身会缓存上次返回面板，未点击刷新时可能仍显示之前结果；下一次执行无论成功失败都会返回新面板，不把旧值伪装成实时查询。

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
