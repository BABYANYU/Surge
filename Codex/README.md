# Codex

| 文件 | 用途 |
| --- | --- |
| [Codex.sgmodule](./Codex.sgmodule) | Surge Codex 额度模块，默认策略组为 AI |
| [codex-panel.js](./codex-panel.js) | 面板查询和倒计时脚本 |
| [Open-Codex-Helper.cmd](./Open-Codex-Helper.cmd) | Windows 参数复制工具启动入口 |
| [Copy-Codex-Parameters.ps1](./Copy-Codex-Parameters.ps1) | 从本机 Codex 登录缓存读取参数，由用户点击复制 |

参数工具的两个文件下载到同一文件夹后，双击启动入口。需先在电脑 Codex 登录 ChatGPT；工具不联网、不显示凭据、不保存副本，不会上传到 GitHub。Token、账户 ID 和 auth.json 不属于仓库内容。Windows 工具不能在 iPhone Surge 内运行。

模块默认使用现有的 `AI` 策略组；也可在模块参数里指定其他策略。已安装用户如果以前手动填了 Proxy，需要自行把该参数改为 AI，更新默认值不会强制覆盖用户设置。

[参数与使用说明](../docs/codex.md)。原根目录模块订阅链接保留兼容，根目录旧脚本入口也保留兼容；两个入口与本目录版本同步。
