<div align="center">

<sub>B A B Y A N Y U · S U R G E</sub>

# 网络有序，体验从容。

节点洞察 · 策略调度 · 应用增强

面向 Surge iOS 的自用模块集合，让每一次连接更清晰，让日常使用更顺手。

<img src="https://img.shields.io/badge/Surge-iOS-6699FF?style=flat-square" alt="Surge iOS">
<img src="https://img.shields.io/badge/Modules-9-6699FF?style=flat-square" alt="9 modules">
<img src="https://img.shields.io/badge/Branch-main-24292F?style=flat-square" alt="main branch">

**[模块目录](#模块目录) · [安装指南](#安装指南) · [使用详情](#使用详情) · [维护与来源](#维护与来源)**

</div>

---

## 模块目录

### 01 / 节点洞察与策略调度

从出口信息到连接质量，再到按时切换，集中管理日常使用的节点。

| 模块 | 功能 | 安装 | 源文件 |
| :--- | :--- | :---: | :---: |
| **IPPure** | 出口 IP、ASN、运营商、位置、风险值与原生状态 | [添加](https://babyanyu.github.io/Surge/?m=ippure) | [查看](./IPPure.sgmodule) |
| **Route** | 代理入口与落地 IP、运营商及位置 | [添加](https://babyanyu.github.io/Surge/?m=landing) | [查看](./Route.sgmodule) |
| **HTTPS** | 5 轮 HTTPS 请求，比较节点综合延迟与抖动 | [添加](https://babyanyu.github.io/Surge/?m=latency) | [查看](./Latency.sgmodule) |
| **Cron** | 两个时段自动切换指定策略组，附状态面板 | [添加](https://babyanyu.github.io/Surge/?m=cron) | [查看](./Cron.sgmodule) |

### 02 / 应用体验

减少打扰，优化播放与跳转体验。功能是否可用取决于客户端版本、接口变化及服务端限制。

| 模块 | 功能 | 安装 | 源文件 |
| :--- | :--- | :---: | :---: |
| **YouTube Enhance** | 去广告、后台播放、画中画及播放体验增强 | [添加](https://babyanyu.github.io/Surge/?m=youtube) | [查看](./YouTube-Plus.sgmodule) |
| **AQIYI Clean** | 爱奇艺广告与部分页面内容清理 | [添加](https://babyanyu.github.io/Surge/?m=iqiyi) | [查看](./iQiYi.sgmodule) |
| **Bilibili 空降助手** | 基于脚本改写，跳过视频内广告片段 | [添加](https://babyanyu.github.io/Surge/?m=bilibili) | [查看](./Bilibili空降助手.sgmodule) |
| **喜马拉雅** | SVIP 相关响应改写与广告请求拦截 | [添加](https://babyanyu.github.io/Surge/?m=ximalaya) | [查看](./Ximalaya.sgmodule) |
| **115 分享跳转** | 从分享链接直接唤起 115 客户端 | [添加](https://babyanyu.github.io/Surge/?m=share115) | [查看](./115Share.sgmodule) |

## 安装指南

1. 在安装了 Surge 的 iPhone 上点击模块对应的 **添加**，按页面提示打开 Surge。
2. 核对模块名称与参数，确认安装并启用。`Group`、节点及子策略组名称应与当前配置完全一致。
3. 应用模块包含 HTTPS 改写时，需要启用 MITM，并完成证书安装与信任；各模块的域名已通过 `%APPEND%` 追加。
4. IPPure、Route、HTTPS 与 Cron 的面板按需点击刷新；Cron 的定时任务仍会按设定时间执行。

安装页面未能唤起 Surge 时，打开上表的 **源文件**，获取其 Raw 链接，再在 Surge 的模块管理中从 URL 安装。

> 模块按 Surge iOS 场景维护，不可直接当作 Clash / mihomo YAML 使用。AQIYI Clean 另有 `CORE_VERSION >= 20` 的要求。

## 使用详情

<details>
<summary><strong>IPPure · 看清当前出口</strong></summary>

<br>

查询当前请求出口的 IP、ASN、运营商、位置、风险值与原生状态，面板标题尽可能显示此次请求的策略。

- 出口与当前分流规则有关：请求走直连时，显示直连出口；走代理时，显示对应代理出口。
- IP 与风险数据来自 [IPPure](https://ippure.com/)，运营商信息由 `ipwho.is` 补充，查询失败时使用 IPPure 返回的信息。
- 原生状态由 `isBroadcast` 字段换算：`true` 显示“否”，`false` 显示“是”，缺失时显示“未知”。
- 风险与原生状态属于第三方数据判断，作为选线参考。

</details>

<details>
<summary><strong>Route · 分辨入口与落地</strong></summary>

<br>

展示代理入口与落地的 IP、运营商及位置，便于辨认连接路径。入口信息依赖 Surge 提供的请求记录；查询结果受接口可用性与 IP 数据库准确度影响。

Route 侧重连接路径信息，不提供 IP 风险评分。

</details>

<details>
<summary><strong>HTTPS · 比较连接质量</strong></summary>

<br>

对指定策略组内可检测的节点执行 5 轮 HTTPS 测试，以综合延迟与抖动辅助选线。

| 参数 | 默认值 | 说明 |
| :--- | :--- | :--- |
| `Group` | `Proxy` | 需要检测的策略组名称 |

- **综合延迟**：采用 Surge 返回的 `round-one-total`，即经节点完成一次 HTTPS HEAD 请求的端到端总耗时，取成功样本的中位数。
- **抖动**：使用 MAD（中位绝对偏差），衡量样本相对中位数的波动。
- **测试方式**：每轮同批检测节点，连续完成 5 轮后展示结果。
- **失败处理**：失败样本不作为高延迟计入统计；存在成功样本时按成功样本计算，全部失败时显示“失败”。

这里测量的是指定 HTTPS 请求的耗时，不能等同于下载速度或所有应用的实际体验。

</details>

<details>
<summary><strong>Cron · 按时切换策略</strong></summary>

<br>

将一天划分为两个首尾相接的时段，在起点切换指定 `select` 策略组。引擎启动及配置重新加载时也会运行脚本，面板可查看当前状态。

| 参数 | 默认值 | 说明 |
| :--- | :--- | :--- |
| `Group` | `Proxy` | 目标 `select` 策略组 |
| `A_Start_HH` / `A_Start_MM` | `19` / `00` | A 时段起点 |
| `A_Policy` | 空 | A 时段使用的节点、子策略组或 `DIRECT` |
| `B_Start_HH` / `B_Start_MM` | `23` / `00` | B 时段起点 |
| `B_Policy` | 空 | B 时段使用的节点、子策略组或 `DIRECT` |

例如：A 设为 19:00，B 设为 23:00，则 A 覆盖 19:00–23:00，B 覆盖 23:00–次日 19:00。

- 小时为 `00–23`，分钟为 `00–59`；策略名称必须与 Surge 完全一致。
- Policy 留空表示该时段不切换。手动编辑参数声明时，只保留 `A_Policy`，不要写成 `A_Policy:`。
- 调整模块参数后，应在 Surge 中重新应用安装配置，使定时表达式与脚本参数同步更新。

</details>

<details>
<summary><strong>YouTube Enhance · 播放与界面增强</strong></summary>

<br>

基于 gholts 的 YouTube Enhance，包含去广告、后台播放、画中画与最高 4 倍速等功能，执行脚本已镜像至本仓库。

| 参数 | 默认值 | 作用 |
| :--- | :---: | :--- |
| `block_upload` | `true` | 隐藏上传入口 |
| `block_shorts` | `false` | 隐藏 Shorts 入口 |
| `auto_hd` | `true` | 优先最高可用画质，并阻止自动降低画质 |
| `block_games` | `true` | 隐藏 Playables 游戏推荐 |
| `block_vertical_live` | `false` | 隐藏竖屏直播推荐 |
| `jump_ahead` | `true` | 启用 Jump Ahead 并移除相关推广 |
| `block_store` | `true` | 隐藏商店及购物内容 |
| `native_download` | `false` | 启用实验性原生下载 |

MITM 覆盖 `*.googlevideo.com`、`youtubei.googleapis.com` 与 `*.youtube.com`。原生下载未指定画质时使用 720p，能否下载仍受服务端限制。

</details>

<details>
<summary><strong>AQIYI Clean · 爱奇艺内容清理</strong></summary>

<br>

通过规则、响应体改写与 URL 改写，拦截广告请求并清理部分页面内容。

- 适用于 iOS，要求 `CORE_VERSION >= 20`。
- MITM 追加 `*.iqiyi.com`，并排除 `i.vip.iqiyi.com`。
- 效果随爱奇艺客户端版本与接口变化而变化。

</details>

<details>
<summary><strong>Bilibili 空降助手 · 跳过视频内广告片段</strong></summary>

<br>

调用 Sparkle 的 Protobuf 请求与响应脚本，处理弹幕与播放进度相关接口；响应脚本启用 `sponsorBlock` 参数，请求脚本使用 WebView 引擎。

MITM 覆盖 `grpc.biliapi.net` 与 `app.bilibili.com`，模块另将 `bsbsb.top` 设为直连。具体跳过效果取决于脚本适配及片段数据。

</details>

<details>
<summary><strong>喜马拉雅 · 响应改写与广告拦截</strong></summary>

<br>

将上游脚本适配为 Surge 模块，处理 SVIP 相关响应，并拦截部分广告与统计请求。响应字段变化不代表服务端授权变化，具体效果以客户端实际表现为准。

执行脚本来自 WeiGiegie/666，设置了 `script-update-interval=-1`；更新时需在 Surge 中手动刷新对应外部资源。

</details>

<details>
<summary><strong>115 分享跳转 · 分享链接直达客户端</strong></summary>

<br>

打开 `115.com`、`115cdn.com` 及其 `www` 域名的分享链接时，改写为 `oof.disk://` 链接并唤起 115 客户端，保留分享码及后续查询参数。

需要设备已安装支持该 URL Scheme 的 115 客户端；HTTPS 链接改写需启用对应域名的 MITM。

</details>

## 维护与来源

### 更新方式

模块安装链接固定指向 `main` 分支。模块文件与远程脚本分别更新：仓库有新提交，不等于设备已立即加载新内容。

| 更新内容 | 操作 |
| :--- | :--- |
| 模块规则、MITM 域名或脚本声明 | 在 Surge 中更新对应模块并核对配置 |
| 本仓库的远程 JavaScript | 由 Surge 按模块声明检查更新，必要时手动刷新资源 |
| 模块参数 | 重新应用安装配置，核对参数及定时表达式 |
| 喜马拉雅远程脚本 | 手动刷新外部资源 |

### 来源与致谢

| 内容 | 来源 |
| :--- | :--- |
| YouTube Enhance | gholts；执行脚本镜像在 [`scripts/youtube-plus`](./scripts/youtube-plus/) |
| Bilibili 空降助手 | [kokoryh / Sparkle](https://github.com/kokoryh/Sparkle) |
| 喜马拉雅脚本 | [WeiGiegie / 666](https://github.com/WeiGiegie/666) |
| IP 与位置查询 | [IPPure](https://ippure.com/)、[ipwho.is](https://ipwho.is/)、[IP.SB](https://ip.sb/) |

使用说明参考 [Surge 官方中文指引](https://manual.nssurge.com/book/understanding-surge/cn/)。发现问题可通过 [Issues](https://github.com/BABYANYU/Surge/issues) 提供模块名称、客户端版本与复现步骤，提交前请隐去订阅链接、凭证和个人信息。

---

<div align="center">

<sub>为日常连接，保留一份清晰与从容。</sub><br>
<sub>Maintained by <a href="https://github.com/BABYANYU">BABYANYU</a></sub>

</div>
