# YouTube Enhance（iOS / tvOS）

本模块在上游 `gholts/surge` 的 `youtube-enhance.sgmodule` 基础上移植到本仓库，脚本改为本仓库托管，并移除平台限制以同时支持 iOS 与 tvOS。

## 与上游的差异

| 项目 | 上游 | 本仓库 |
|---|---|---|
| 平台限制 | `SYSTEM = 'iOS'` | 无限制 |
| 脚本托管 | gholts/surge | 本仓库 `scripts/youtube-enhance/` |
| 脚本引擎 | response、ump 使用 `engine=webview` | 统一使用默认 jsc |
| MITM 主机名 | `www.youtube.com`、`s.youtube.com` | `*.youtube.com` |

改 `webview` 为 `jsc` 的原因：tvOS 不提供 WebView 环境，同一份代码若保留 webview 将无法在电视端运行。四个脚本经检查未使用 DOM 或浏览器专属对象，仅依赖 `$request`、`$response`、`$argument`、`$done`、`TextDecoder`、`Uint8Array` 等通用能力。

## 功能参数

| 参数 | 作用 | tvOS 是否有效 |
|---|---|---|
| `block_upload` | 隐藏上传入口 | 是 |
| `block_shorts` | 隐藏 Shorts | 是 |
| `auto_hd` | 优先最高画质 | 是 |
| `block_games` | 隐藏 Playables | 是 |
| `block_vertical_live` | 隐藏竖屏直播 | 是 |
| `jump_ahead` | 跳过精彩片段按钮 | 视 UI 而定 |
| `block_store` | 隐藏创作者商店 | 是 |
| `block_ai` | 移除 Ask、AI 摘要 | 是 |
| `on_the_go` | On-the-go 控件 | 否，仅移动端 |

后台播放、画中画、4 倍速属于 iOS 播放器行为，tvOS 无对应能力，参数存在但不会生效。

## 署名

脚本逻辑源自 gholts 的模块，其说明标注基于 Maasea 的代码（Apache-2.0）。本仓库仅调整托管位置与平台兼容性，保留上游署名。

## 验证边界

已完成：四个脚本 `node --check` 通过；模块结构与参数占位符检查通过。
未完成：未在 Apple TV 实机验证广告拦截与页面精简效果，也未验证 iOS 端升级后的表现。
