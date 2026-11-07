# YouTube Enhance（iOS / tvOS）

支持 iOS 与 Apple TV 的 YouTube 增强模块：广告拦截、后台播放、画中画、最高 4 倍速、最高画质、Jump Ahead 与页面精简。

## 实现方式

| 项目 | 说明 |
|---|---|
| 脚本托管 | 本仓库 `scripts/youtube-enhance/` |
| 脚本引擎 | 统一使用默认 jsc |
| 平台限制 | 无，iOS 与 tvOS 均可安装 |
| MITM 主机名 | `*.googlevideo.com`、`youtubei.googleapis.com`、`*.youtube.com` |

四个脚本仅依赖 `$request`、`$response`、`$argument`、`$done`、`TextDecoder`、`Uint8Array` 等通用能力，未使用 DOM 或浏览器专属对象。

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

## 验证边界

已完成：四个脚本 `node --check` 通过；模块结构与参数占位符检查通过。
未完成：未在 Apple TV 实机验证广告拦截与页面精简效果，也未验证 iOS 端升级后的表现。
