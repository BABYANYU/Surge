# Surge 项目上下文

最后更新：2026-09-10

这份文件用于把项目交接给另一台电脑上的 Codex。开始修改前，请先完整阅读本文件，再检查仓库当前状态和实际代码；仓库文件始终是最终事实来源。

## 仓库

- GitHub：<https://github.com/BABYANYU/Surge>
- 默认分支：`main`
- Raw 地址前缀：`https://raw.githubusercontent.com/BABYANYU/Surge/main/`
- 当前电脑的历史工作目录：`F:\Codex\Documents\2026-09-01\https-scamalytics-com-ip-156-0\work\Surge`

在另一台电脑继续工作时，克隆上述 GitHub 仓库，然后让 Codex 先读取本文件。

## 用户偏好与维护约定

1. 所有安装地址使用稳定 Raw URL，不添加 `?v=`、时间戳或其他版本参数。
2. 修改完成后直接提交并推送到 `main`，最终优先给出可安装的 Raw 模块链接。
3. 用户自行在 Surge 中刷新外部资源，不需要 Codex持续轮询 GitHub 是否生效。
4. IPPure、Route 等查询面板只允许手动刷新，保持 `update-interval=-1`，不要增加五分钟或其他自动刷新。
5. 自有面板脚本使用 `script-update-interval=1`，目的是 GitHub 代码更新后，下次手动触发即可加载新脚本；这不是每秒后台执行。
6. 面板统一使用浅蓝色 `#6699FF`。UI 追求简约、整齐，字段尽量保持一行，避免过长运营商名称换行。
7. 不在稳定链接后添加更新标记，也不在面板中显示版本号或“刚刚更新”等文案。
8. 删除无关作者、频道和推广信息；依赖第三方资源时保留必要的上游链接和来源说明。
9. 工作区可能包含用户自己的改动，提交前先检查 `git status`，不要覆盖无关更改。

## 当前模块

### IPPure

- 模块：[IPPure.sgmodule](https://raw.githubusercontent.com/BABYANYU/Surge/main/IPPure.sgmodule)
- 生效脚本：`scripts/ippure-panel.js`
- 面板图标：SF Symbol `network`
- 面板标题：`IPPure：当前策略名`
- 数据顺序：

  ```text
  检测IP
  ASN
  运营商
  位置
  风险
  原生
  ```

- IP、位置、ASN、风险和广播 IP 状态来自 `https://my.ippure.com/v1/info`。
- 运营商优先使用 `https://ipwho.is/<IP>?lang=zh-CN`，失败时回退到 IPPure 的 `asOrganization`。
- “原生”换算规则：`isBroadcast=true` 显示“否”，`isBroadcast=false` 显示“是”，未知显示“未知”。
- 风险只显示数字，不显示“低/中等/高”等文字。
- 当前策略名通过 Surge HTTP API 最近请求记录取得。
- 面板仅手动查询。

### Route / 代理链信息

- 模块：[LandingIP.sgmodule](https://raw.githubusercontent.com/BABYANYU/Surge/main/LandingIP.sgmodule)
- 生效脚本：`scripts/landing-ip-panel.js`
- 面板标题：`Route：当前策略名`
- 面板图标：SF Symbol `globe.asia.australia`
- 落地 IP 与地理信息主数据源：IPWhois（`ipwho.is`）。
- 入口 IP：从本次 IPWhois 请求在 Surge 最近请求记录中的 `remoteAddress` 提取。
- 入口信息：IPWhois 为主，`api.ip.sb` 为失败回退。
- 当入口 IP 与落地 IP 不同，显示：

  ```text
  入口 IP
  运营商
  位置

  落地 IP
  运营商
  位置
  ```

- 当入口 IP 与落地 IP 相同，隐藏入口段，只显示落地信息。
- 运营商优先转换为简短品牌名，例如 `Huawei Cloud`、`UCloud`、`Alibaba Cloud`、`Tencent Cloud`、`DMIT Cloud`、`Eons Data`；其他长名称按显示宽度精简。
- 面板仅手动查询。

### RoutePure

- 模块：[RoutePure.sgmodule](https://raw.githubusercontent.com/BABYANYU/Surge/main/RoutePure.sgmodule)
- 生效脚本：`scripts/route-pure-panel.js`
- 这是 Route 与 IPPure 的独立合并版本，不覆盖原有两个模块。
- 保留 Route 的入口/落地判断、字段顺序、运营商精简和浅蓝色地球图标。
- 在落地信息最下方增加 `原生`、`风险`两行，两项均来自 IPPure，并对应落地 IP。
- IPPure 查询失败时，Route 信息仍然显示，`原生`和`风险`显示“未知”。
- 面板仅手动查询，使用 `update-interval=-1` 和 `script-update-interval=1`。

### Cron 定时切换

- 模块：[Cron.sgmodule](https://raw.githubusercontent.com/BABYANYU/Surge/main/Cron.sgmodule)
- 生效脚本：`scripts/cron-policy.js`
- 面板图标：SF Symbol `stopwatch`
- 默认参数：

  ```text
  Group         AI
  A_Start_HH    20
  A_Start_MM    30
  A_Policy      香港 A
  B_Start_HH    22
  B_Start_MM    30
  B_Policy      香港 B
  ```

- `Group` 必须是需要被控制的 `select` 策略组。
- `A_Policy`、`B_Policy` 可以是该组的直接节点、直接子策略组或 `DIRECT`，名称必须完全一致。
- A 时段从 A 开始时间持续到 B 开始时间；B 时段从 B 开始时间持续到下一次 A 开始时间，首尾衔接，不重叠。
- 到两个边界时间自动切换，同时在 Surge 引擎启动和配置重载时校正当前策略。
- 面板内容只显示两个时间段，中间空一行；已经删除 `Now` 和 `Next`。
- 面板本身仅手动刷新，但定时切换任务必须继续自动执行。

### 喜马拉雅

- 模块：[Ximalaya.sgmodule](https://raw.githubusercontent.com/BABYANYU/Surge/main/Ximalaya.sgmodule)
- 模块说明：`解锁 SVIP`
- 上游脚本：<https://raw.githubusercontent.com/WeiGiegie/666/main/ximalaya.js>
- 模块直接引用上游脚本，没有在本仓库复制 JS。
- `script-update-interval=-1`，关闭脚本自动更新；只有用户手动刷新 Surge 外部资源时才检查更新。
- 上游脚本经过混淆，其后续内容由第三方维护者控制。

### 115 分享跳转

- 模块：[115Share.sgmodule](https://raw.githubusercontent.com/BABYANYU/Surge/main/115Share.sgmodule)
- 使用 Surge 原生 URL Rewrite，不运行 JavaScript。
- 支持 `115.com`、`115cdn.com` 以及两者的 `www` 形式。
- 只匹配 `/s/分享码`，完整保留分享码和查询参数，然后通过 `oof.disk://` 唤起 115 客户端。
- Surge 无法点击 115 客户端原生界面的“确定”按钮，也无法扫描聊天文字或剪贴板；只有链接真正被打开时才触发。

### 爱奇艺去广告

- 模块：[iQiYi.sgmodule](https://raw.githubusercontent.com/BABYANYU/Surge/main/iQiYi.sgmodule)
- 使用 Surge 原生规则、Body Rewrite jq 和 Map Local，没有外部 JS。
- 当前包含 6 条规则、21 条 Body Rewrite、5 条 Map Local。
- 要求支持 Body Rewrite 的 Surge iOS 核心版本。
- 当前文件是 Script Hub 转换结果的固定副本，不会自行跟随上游更新。
- Loon 上游：<https://kelee.one/Tool/Loon/Lpx/iQiYi_Video_remove_ads.lpx>
- 原始 Script Hub 转换链接：

  ```text
  http://script.hub/file/_start_/https://kelee.one/Tool/Loon/Lpx/iQiYi_Video_remove_ads.lpx/_end_/iQiYi_Video_remove_ads.sgmodule?type=loon-plugin&target=surge-module&del=true&jqEnabled=true&pm=.&sni=.
  ```

- 原转换链接依赖 Surge 中已安装并启用的 Script Hub 模块。删除 Script Hub 后，已缓存模块可能继续生效，但该转换链接不能可靠地重新读取和转换上游。
- 上游更新时，需要重新取得转换后的模块内容，再同步到本仓库。

### Bilibili 空降助手

- 模块：`Bilibili空降助手.sgmodule`
- 该模块直接引用第三方 Sparkle 脚本，修改前先检查上游兼容性和授权信息。

## 当前文件与历史文件

当前模块引用的生效脚本只有：

```text
scripts/ippure-panel.js
scripts/landing-ip-panel.js
scripts/route-pure-panel.js
scripts/cron-policy.js
```

以下文件是历史版本，除非用户明确要求回退，否则不要重新接入模块：

```text
scripts/ippure-panel-v12.js
scripts/ippure-panel-v13.js
scripts/landing-ip-panel-v8.js
scripts/landing-ip-panel-v9.js
```

## 修改与发布流程

1. 先读取目标模块和它当前引用的脚本。
2. 检查 `git status --short`，保留不属于当前任务的改动。
3. 使用最小范围修改，避免顺便重构无关模块。
4. JavaScript 至少运行 `node --check <file>`；所有修改运行 `git diff --check`。
5. 涉及时间边界、IP 判断或正则时，增加针对性样例测试。
6. 提交前确认本地分支与 `origin/main` 没有分叉。
7. 提交并推送到 `main`。
8. 最终给用户稳定 Raw 链接，不添加查询参数。

## Surge 更新行为

- 刷新已安装模块的外部资源：更新 `.sgmodule` 文件。
- 面板脚本返回结果会被 Surge 缓存；更新模块或 JS 后，通常还需要点击面板右上角刷新一次才会重新渲染。
- `update-interval=-1` 表示面板不自动运行。
- `script-update-interval=1` 表示远程脚本缓存超过一秒后，在下一次触发时允许检查更新，不代表每秒后台运行。
- 喜马拉雅使用 `script-update-interval=-1`，明确关闭远程脚本自动更新。

## 给新 Codex 的起始提示

```text
请先完整阅读 PROJECT_CONTEXT.md 和目标模块的当前代码。保持稳定 Raw 链接、不添加 ?v= 参数，保留手动面板刷新机制。完成修改后进行针对性验证，提交并推送到 origin/main，最后只给出简洁的结果和模块链接。
```
