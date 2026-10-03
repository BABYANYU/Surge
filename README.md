# Surge

自用 Surge 模块集合，覆盖节点检测、策略切换、流媒体去广告与客户端跳转。全部模块以 `main` 分支稳定链接安装，脚本可随仓库更新自动生效。

## 模块一览

| 模块 | 用途 | 一键安装 |
| --- | --- | --- |
| IPPure | 出口 IP 纯净度检测 | [安装](surge:///install-module?url=https%3A%2F%2Fraw.githubusercontent.com%2FBABYANYU%2FSurge%2Frefs%2Fheads%2Fmain%2FIPPure.sgmodule) |
| RoutePure | 代理链与落地纯净度 | [安装](surge:///install-module?url=https%3A%2F%2Fraw.githubusercontent.com%2FBABYANYU%2FSurge%2Frefs%2Fheads%2Fmain%2FRoutePure.sgmodule) |
| 代理链信息 | 代理策略、入口与落地 | [安装](surge:///install-module?url=https%3A%2F%2Fraw.githubusercontent.com%2FBABYANYU%2FSurge%2Frefs%2Fheads%2Fmain%2FLandingIP.sgmodule) |
| Latency | 综合延迟与抖动检测 | [安装](surge:///install-module?url=https%3A%2F%2Fraw.githubusercontent.com%2FBABYANYU%2FSurge%2Frefs%2Fheads%2Fmain%2FLatency.sgmodule) |
| Cron | 定时自动切换节点 | [安装](surge:///install-module?url=https%3A%2F%2Fraw.githubusercontent.com%2FBABYANYU%2FSurge%2Frefs%2Fheads%2Fmain%2FCron.sgmodule) |
| YouTube Plus | YouTube 去广告与字幕 | [安装](surge:///install-module?url=https%3A%2F%2Fraw.githubusercontent.com%2FBABYANYU%2FSurge%2Frefs%2Fheads%2Fmain%2FYouTube-Plus.sgmodule) |
| 爱奇艺去广告 | 移除爱奇艺多处广告 | [安装](surge:///install-module?url=https%3A%2F%2Fraw.githubusercontent.com%2FBABYANYU%2FSurge%2Frefs%2Fheads%2Fmain%2FiQiYi.sgmodule) |
| 115 分享跳转 | 分享链接唤起客户端 | [安装](surge:///install-module?url=https%3A%2F%2Fraw.githubusercontent.com%2FBABYANYU%2FSurge%2Frefs%2Fheads%2Fmain%2F115Share.sgmodule) |
| 喜马拉雅 | 解锁 SVIP | [安装](surge:///install-module?url=https%3A%2F%2Fraw.githubusercontent.com%2FBABYANYU%2FSurge%2Frefs%2Fheads%2Fmain%2FXimalaya.sgmodule) |
| Bilibili 空降助手 | 跳过视频广告片段 | [安装](surge:///install-module?url=https%3A%2F%2Fraw.githubusercontent.com%2FBABYANYU%2FSurge%2Frefs%2Fheads%2Fmain%2FBilibili%25E7%25A9%25BA%25E9%2599%258D%25E5%258A%25A9%25E6%2589%258B.sgmodule) |

## 面板模块

以下模块在 Surge 的「信息」面板中显示一行可点击的条目，点击后才发起请求，不后台轮询。

### IPPure

查询当前出口 IP 的位置、ASN、风险分与原生 IP 状态，数据来自 [IPPure](https://ippure.com/)。

- 查询遵循当前分流规则，因此展示的是所选节点的出口信息。
- 「原生 IP」依据 IPPure 的广播 IP 字段换算：广播 IP 显示「否」，非广播 IP 显示「是」。
- IPPure 公共 API 仍处于测试阶段，结果仅供参考。

### RoutePure

在 IPPure 基础上合并代理链信息：展示代理策略、入口、落地，并在落地信息下方追加原生状态与风险值。原有 Route 与 IPPure 模块可同时保留，互不影响。

### 代理链信息

仅展示代理策略、入口与落地三段信息，不查询纯净度，请求更轻。

### Latency

对指定策略组的全部节点连续测试 5 轮，输出综合延迟与抖动两列。

- 综合延迟 = TCP RTT + 代理协议握手 + HTTP 首字节时间，取中位数。
- 抖动取 MAD（中位绝对偏差），比标准差更抗尖峰干扰。
- 每轮由 Surge 同批并发检测全部节点，节点之间条件一致。
- 失败不计为高延迟，改为显示成功轮数。

参数：

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| Group | Proxy | 策略组名称，须与 Surge 完全一致 |

### Cron

将一天划分为两个首尾相接的时段，在切换点自动把指定 `select` 策略组切换到对应节点或子策略组。

参数：

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| Group | Proxy | 目标 select 策略组 |
| A_Start_HH / A_Start_MM | 19 / 00 | A 时段起点 |
| A_Policy | 空 | A 时段使用的节点 |
| B_Start_HH / B_Start_MM | 23 / 00 | B 时段起点 |
| B_Policy | 空 | B 时段使用的节点 |

说明：

- HH 为小时（00–23），MM 为分钟（00–59）。
- Policy 可填节点、子策略组或 `DIRECT`，名称须与 Surge 完全一致。
- 留空表示不切换，空参数只写参数名、不写冒号（`A_Policy` 正确，`A_Policy:` 会报错）。
- 模块会生成 `cron-policy-a`、`cron-policy-b` 等定时脚本，参数变更后需重新安装模块。

## 应用模块

### YouTube Plus

YouTube 去广告、隐藏 Shorts、画中画与后台播放，并为网页端提供双语字幕和 YouTube Music 歌词翻译。

相对上游版本做了两处修正：修复 PiP 重写规则的捕获组，并移除会与主去广告脚本冲突的 Protobuf 字幕响应项。

参数：

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| blockUpload | true | 隐藏上传入口 |
| blockImmersive | true | 隐藏沉浸式音乐入口 |
| blockShorts | true | 隐藏 Shorts |
| debug | false | 输出调试日志 |
| Type | Translate | 字幕类型，`Official` / `Translate` |
| AutoCC | false | 自动显示翻译字幕 |
| ShowOnly | false | 仅显示翻译字幕 |
| Position | Forward | 原字幕位置，`Forward` / `Reverse` |

MITM 覆盖 `*.googlevideo.com`、`www.youtube.com`、`m.youtube.com`、`tv.youtube.com`、`s.youtube.com`、`music.youtube.com`、`youtubei.googleapis.com`。

### 爱奇艺去广告

移除开屏、焦点图、瀑布流与搜索广告，关闭青少年弹窗，并精简底栏与「我的」页面。要求 Surge 核心版本不低于 20 且运行于 iOS。

### 115 分享跳转

打开 `115.com` 或 `115cdn.com` 的分享链接时，自动跳转到 115 客户端，并保留链接中的分享码与访问码参数。

### 喜马拉雅

将上游圈 X 脚本适配为 Surge 模块，解锁 SVIP 相关限制。远程脚本关闭自动更新，仅在 Surge 中手动刷新外部资源时才检查更新。

### Bilibili 空降助手

通过 Protobuf 请求与响应改写跳过 B 站视频内的广告片段，需要 WebView 引擎参与处理。

## 依赖脚本

模块本身只声明规则与入口，实际逻辑放在 `scripts/` 下，由模块通过 raw 链接引用。因此这些脚本是模块的组成部分，不能单独删除。

| 脚本 | 所属模块 |
| --- | --- |
| `scripts/ippure-panel.js` | IPPure |
| `scripts/route-pure-panel.js` | RoutePure |
| `scripts/landing-ip-panel.js` | 代理链信息 |
| `scripts/latency-panel.js` | Latency |
| `scripts/cron-policy.js` | Cron |
| `scripts/youtube-plus/*.js` | YouTube Plus |

## 安装与更新

安装使用稳定链接，形如：

```text
https://raw.githubusercontent.com/BABYANYU/Surge/refs/heads/main/<模块名>.sgmodule
```

更新规则：

| 变更类型 | 生效方式 |
| --- | --- |
| 脚本逻辑 | 刷新外部资源，或等自动更新 |
| 模块名称、描述、参数 | 重新安装模块 |
| 面板显示 | 点击面板条目重新执行 |

注意不要使用固定 commit 的安装地址，否则会永久锁定在那一版，后续更新不会生效。

## 上游与致谢

| 来源 | 使用部分 |
| --- | --- |
| [gogrhw/surge](https://github.com/gogrhw/surge) | YouTube Plus 脚本，取自 `Scripts/` |
| [kokoryh/Sparkle](https://github.com/kokoryh/Sparkle) | Bilibili 空降助手脚本 |
| [WeiGiegie/666](https://github.com/WeiGiegie/666) | 喜马拉雅脚本 |
| [luestr/IconResource](https://github.com/luestr/IconResource) | 爱奇艺模块图标 |

YouTube Plus 脚本在本地未做代码改动，仅修正模块层的重写规则与响应处理冲突，原作者署名保留在模块元数据中。
