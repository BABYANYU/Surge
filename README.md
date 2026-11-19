# Surge 模块库

面向 **Surge iOS** 的独立模块合集，覆盖网络信息、延迟测试、定时策略切换与常用 App 净化。选择所需模块，使用对应添加链接即可。

## 安装与更新

1. 在 iPhone 上打开本页，找到要使用的模块。
2. 点击该模块的「添加」链接，在 Surge iOS 中确认安装；需要填写参数的模块，按对应说明配置。
3. 更新时再次打开该模块的「添加」链接，并按 Surge 提示更新已安装模块。

## 模块列表

| 模块 | 用途 | 添加 | 源文件 |
| --- | --- | --- | --- |
| **IPPure** | 查看出口 IP、ASN、运营商、位置、风险值与原生状态 | [添加](https://babyanyu.github.io/Surge/?m=ippure) | [IPPure.sgmodule](./IPPure.sgmodule) |
| **Route** | 查看代理入口与落地信息，附 IP 风险与原生状态 | [添加](https://babyanyu.github.io/Surge/?m=landing) | [Route.sgmodule](./Route.sgmodule) |
| **HTTPS** | 点击预热 1 轮＋正式 5 轮，比较综合延迟与 MAD 抖动，提示失败及秒级高值 | [添加](https://babyanyu.github.io/Surge/?m=latency) | [Latency.sgmodule](./Latency.sgmodule) |
| **Codex** | 查询 Codex 5 小时与周额度；[参数与使用说明](./docs/codex.md) · [Codex 工具指南](./Codex/README.md) · [参数工具文件](./Codex) | [添加](https://babyanyu.github.io/Surge/?m=codex) | [Codex.sgmodule](./Codex/Codex.sgmodule) |
| **Cron** | 定时切换指定策略组，附状态面板 | [添加](https://babyanyu.github.io/Surge/?m=cron) | [Cron.sgmodule](./Cron.sgmodule) |
| **YouTube Enhance** | 去广告、后台播放、画中画及播放体验增强 | [添加](https://babyanyu.github.io/Surge/?m=youtube) | [YouTube-Plus.sgmodule](./YouTube-Plus.sgmodule) |
| **AQIYI Clean** | 爱奇艺广告与部分页面内容清理 | [添加](https://babyanyu.github.io/Surge/?m=iqiyi) | [iQiYi.sgmodule](./iQiYi.sgmodule) |
| **Bilibili 空降助手** | 跳过视频内广告片段 | [添加](https://babyanyu.github.io/Surge/?m=bilibili) | [Bilibili空降助手.sgmodule](./Bilibili空降助手.sgmodule) |
| **腾讯视频净化** | 去除开屏与播放前广告，清理底部导航栏与「我的」页广告 | [添加](https://babyanyu.github.io/Surge/?m=txvideo) | [TxvideoAD.sgmodule](./TxvideoAD.sgmodule) |
| **喜马拉雅** | SVIP 相关响应改写与广告请求拦截 | [添加](https://babyanyu.github.io/Surge/?m=ximalaya) | [Ximalaya.sgmodule](./Ximalaya.sgmodule) |
| **115 分享跳转** | 从分享链接直接唤起 115 客户端 | [添加](https://babyanyu.github.io/Surge/?m=share115) | [115Share.sgmodule](./115Share.sgmodule) |

---

许可证：[MIT License](./LICENSE)。
