# Surge

## IPPure IP 纯净度

在 Surge 信息面板中查询当前出口 IP，展示位置、ASN、风险分和原生 IP 状态。数据来自 [IPPure](https://ippure.com/)。

[一键安装 IPPure 模块](surge:///install-module?url=https%3A%2F%2Fraw.githubusercontent.com%2FBABYANYU%2FSurge%2Fmain%2FIPPure.sgmodule)

模块地址：

```text
https://raw.githubusercontent.com/BABYANYU/Surge/main/IPPure.sgmodule
```

说明：

- 只有手动点击面板刷新时才会重新查询。
- 查询请求遵循当前 Surge 分流规则，因此展示当前节点的出口 IP。
- “原生 IP”依据 IPPure 的广播 IP 字段换算：广播 IP 显示“否”，非广播 IP 显示“是”。
- IPPure 公共 API 尚处于测试阶段，检测结果仅供参考。

## 其他模块

- [Bilibili 空降助手](./Bilibili空降助手.sgmodule)

## 喜马拉雅

将上游圈 X 脚本适配为 Surge 模块，远程脚本每天自动检查更新。

[一键安装喜马拉雅模块](surge:///install-module?url=https%3A%2F%2Fraw.githubusercontent.com%2FBABYANYU%2FSurge%2Fmain%2FXimalaya.sgmodule)

模块地址：

```text
https://raw.githubusercontent.com/BABYANYU/Surge/main/Ximalaya.sgmodule
```

## Cron 定时切换

通过 Surge 模块参数设置两个时段，定时切换指定 `select` 策略组的节点或子策略组。

[一键安装 Cron 定时切换模块](surge:///install-module?url=https%3A%2F%2Fraw.githubusercontent.com%2FBABYANYU%2FSurge%2Fmain%2FCron.sgmodule)

模块地址：

```text
https://raw.githubusercontent.com/BABYANYU/Surge/main/Cron.sgmodule
```
