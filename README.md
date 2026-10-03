# Surge

自用 Surge 模块集合，覆盖节点检测、策略切换、流媒体去广告与客户端跳转。全部模块以 `main` 分支稳定链接安装，脚本可随仓库更新自动生效。

| 模块 | 用途 | 安装 |
| --- | --- | --- |
| IPPure | 出口 IP 纯净度检测 | [安装](https://babyanyu.github.io/Surge/?m=ippure) |
| RoutePure | 代理链与落地纯净度 | [安装](https://babyanyu.github.io/Surge/?m=routepure) |
| 代理链信息 | 代理策略、入口与落地 | [安装](https://babyanyu.github.io/Surge/?m=landing) |
| Latency | 综合延迟与抖动检测 | [安装](https://babyanyu.github.io/Surge/?m=latency) |
| Cron | 定时自动切换节点 | [安装](https://babyanyu.github.io/Surge/?m=cron) |
| YouTube Enhance | YouTube 去广告与功能增强 | [安装](https://babyanyu.github.io/Surge/?m=youtube) |
| AQIYI Clean | Remove Ads | [安装](https://babyanyu.github.io/Surge/?m=iqiyi) |
| 115 分享跳转 | 分享链接唤起客户端 | [安装](https://babyanyu.github.io/Surge/?m=share115) |
| 喜马拉雅 | 解锁 SVIP | [安装](https://babyanyu.github.io/Surge/?m=ximalaya) |
| Bilibili 空降助手 | 跳过视频广告片段 | [安装](https://babyanyu.github.io/Surge/?m=bilibili) |

---

# <img src="https://api.iconify.design/mdi:view-dashboard-outline.svg?color=%236699ff" width="28" alt=""> 面板模块

> 在 Surge 的「信息」面板中显示为一行可点击条目，点击后才发起请求，不后台轮询。

## <img src="https://api.iconify.design/mdi:ip-network.svg?color=%236699ff" width="24" alt=""> IPPure

查询当前出口 IP 的位置、ASN、风险分与原生 IP 状态，数据来自 [IPPure](https://ippure.com/)。

- 查询遵循当前分流规则，因此展示的是所选节点的出口信息。
- 「原生 IP」依据 IPPure 的广播 IP 字段换算：广播 IP 显示「否」，非广播 IP 显示「是」。
- IPPure 公共 API 仍处于测试阶段，结果仅供参考。

---

## <img src="https://api.iconify.design/mdi:routes.svg?color=%236699ff" width="24" alt=""> RoutePure

在 IPPure 基础上合并代理链信息：展示代理策略、入口、落地，并在落地信息下方追加原生状态与风险值。原有 Route 与 IPPure 模块可同时保留，互不影响。

---

## <img src="https://api.iconify.design/mdi:transit-connection-variant.svg?color=%236699ff" width="24" alt=""> 代理链信息

仅展示代理策略、入口与落地三段信息，不查询纯净度，请求更轻。

---

## <img src="https://api.iconify.design/mdi:speedometer.svg?color=%236699ff" width="24" alt=""> Latency

对指定策略组的全部节点连续测试 5 轮，输出综合延迟与抖动两列。

- 综合延迟 = TCP RTT + 代理协议握手 + HTTP 首字节时间，取中位数。
- 抖动取 MAD（中位绝对偏差），比标准差更抗尖峰干扰。
- 每轮由 Surge 同批并发检测全部节点，节点之间条件一致。
- 失败不计为高延迟，改为显示成功轮数。

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| Group | Proxy | 策略组名称，须与 Surge 完全一致 |

---

## <img src="https://api.iconify.design/mdi:clock-outline.svg?color=%236699ff" width="24" alt=""> Cron

将一天划分为两个首尾相接的时段，在切换点自动把指定 `select` 策略组切换到对应节点或子策略组。

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

---

# <img src="https://api.iconify.design/mdi:apps.svg?color=%2334c759" width="28" alt=""> 应用模块

> 安装后由 Surge 在后台自动拦截与改写，无需手动点击，多数需要开启 MITM。

## <img src="https://api.iconify.design/mdi:youtube.svg?color=%2334c759" width="24" alt=""> YouTube Enhance

基于 gholts 版本，移除 YouTube 广告并启用后台播放、画中画与最高 4 倍速；支持最高画质、Jump Ahead、内容精简和实验性原生下载。

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| block_upload | true | 隐藏上传入口 |
| block_shorts | false | 隐藏 Shorts |
| auto_hd | true | 优先最高画质并阻止自动降画质 |
| block_games | true | 隐藏 Playables 游戏推荐 |
| block_vertical_live | false | 隐藏竖屏直播推荐 |
| jump_ahead | true | 启用 Jump Ahead 并移除推广 |
| block_store | true | 隐藏商店与购物内容 |
| native_download | false | 实验性原生下载 |

MITM 覆盖 `*.googlevideo.com`、`youtubei.googleapis.com` 和 `*.youtube.com`。模块执行代码已完整镜像到本仓库，来源为 gholts 的 YouTube Enhance。

---

## <img src="https://api.iconify.design/mdi:movie-open-outline.svg?color=%2334c759" width="24" alt=""> AQIYI Clean

Remove Ads

---

## <img src="https://api.iconify.design/mdi:cloud-outline.svg?color=%2334c759" width="24" alt=""> 115 分享跳转

打开 `115.com` 或 `115cdn.com` 的分享链接时，自动跳转到 115 客户端，并保留链接中的分享码与访问码参数。

---

## <img src="https://api.iconify.design/mdi:headphones.svg?color=%2334c759" width="24" alt=""> 喜马拉雅

将上游圈 X 脚本适配为 Surge 模块，解锁 SVIP 相关限制。远程脚本关闭自动更新，仅在 Surge 中手动刷新外部资源时才检查更新。

---

## <img src="https://api.iconify.design/mdi:television-play.svg?color=%2334c759" width="24" alt=""> Bilibili 空降助手

通过 Protobuf 请求与响应改写跳过 B 站视频内的广告片段，需要 WebView 引擎参与处理。
