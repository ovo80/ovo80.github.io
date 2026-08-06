---
title: "WOL 唤醒工具开发记录"
published: 2026-08-06
description: "一款 JavaFX 桌面应用从想法到发布的全过程：核心实现、工程细节与踩坑记录。"
image: ""
tags: ["Java", "JavaFX", "WOL", "工具开发"]
category: "技术"
draft: false
---

## 引言

WOL（Wake-on-LAN，网络唤醒）是一种通过局域网向目标设备发送特定数据包，使其从关机或休眠状态启动的技术。日常场景中，需要远程开启家中或办公室的电脑时，手头往往没有一款顺手的工具。

于是我用 Java 17 和 JavaFX 20.0.2 开发了一款 Windows 桌面应用「WOL 唤醒工具」，代码已开源至 [GitHub](https://github.com/ovo80/WOL)。选择桌面应用而非 Web 方案，是因为工具只做发送魔术包这一件事，轻量桌面应用足够；jpackage 打包后目标机器免装 Java 运行时，分发也方便。版本锁定 Java 17 + JavaFX 20.0.2 的原因很实际：JavaFX 21 以上要求 JDK 21+，而本机环境是 JDK 17。本文记录该项目的核心实现与踩坑过程。

## 核心实现

### 魔术包的构造

WOL 魔术包的结构是固定的：6 字节的 `0xFF` 前缀，后接目标 MAC 地址重复 16 次，共 102 字节。实现代码如下：

```java
byte[] mac = parseMac(macAddress);
byte[] magicPacket = new byte[6 + mac.length * 16];
Arrays.fill(magicPacket, 0, 6, (byte) 0xFF);
for (int i = 0; i < 16; i++) {
    System.arraycopy(mac, 0, magicPacket, 6 + i * mac.length, mac.length);
}
```

### UDP 发送

使用 `DatagramSocket` 发送，关键在于调用 `setBroadcast(true)` 允许广播，否则发送到广播地址会抛异常。目标端口默认 9，也可配置为任意 1-65535 端口。

网络 I/O 全部运行在后台线程（JavaFX 的 `Task<Void>`），通过 `updateMessage()` 回显发送结果，避免阻塞 UI 线程。

### 连发防丢

WOL 协议没有确认机制，单个魔术包可能因网络丢包而失效。因此每次点击默认连发 5 个包（1-100 可配置），间隔 100ms，显著提高唤醒成功率。同时，发送期间禁用界面上全部操作按钮，防止重复提交。

## 工程细节

- **分层架构**：controller → service → model / util / config，业务异常统一为 `WolException`，错误消息可直接展示给用户。
- **多设备管理**：设备列表支持增删切换，以 `device.N.*` 编号持久化；新建或删除设备即时落盘，字段编辑则通过「保存配置」按钮提交，切换设备时有未保存修改会弹窗确认。
- **配置自愈**：早期版本配置存放在程序目录，后来迁移至用户目录（`~/.wol/`），并从单文件拆分为设备、设置两个文件。应用首次启动会自动迁移旧版配置，保证升级无损。
- **输入防护**：MAC 输入框通过 `TextFormatter` 白名单过滤非法字符，发送前 Service 层再做二次校验。
- **双主题**：亮/暗主题通过 CSS 变量实现，偏好自动持久化。

## 踩坑记录

### JDK 启动器对 JavaFX 主类的检查

直接 `java -jar` 运行继承 `javafx.application.Application` 的主类时，会报「缺少 JavaFX 运行时组件」后退出——JDK 启动器要求 `javafx.graphics` 必须是 `--module-path` 上的命名模块，仅放在 classpath 中不行。

解决方案是增加一个独立的 `Launcher` 主类（普通 `main` 方法，内部调用 `Application.launch(MainApp.class)`），一举兼容 `-jar`、`--module-path` 和 jpackage 三种启动方式。

### 脚本与终端编码问题

打包脚本在 Git Bash 中执行时，logback 日志的中文出现乱码（GBK 终端 vs UTF-8 编码）；批处理脚本也有换行符（必须 CRLF）和特殊字符（`>` 是重定向符）等坑。最终约定脚本内容保持全英文，规避编码问题。

## 测试与质量

项目包含 41 个 JUnit 5 测试用例，覆盖魔术包结构、MAC 与端口校验、UDP 单发/连发、配置往返与迁移、FXML 与双主题 CSS 加载等。测试通过 `-Dwol.config.dir` 系统属性隔离到临时目录，不触碰真实配置。

代码遵循 Google Java Style，公开方法均带中文 Javadoc，标注参数、返回值、异常触发条件及副作用（I/O、网络、全局状态）。

## 打包与发布

- **本地构建**：jpackage 生成自包含目录（`WOL.exe` + 精简 JRE + JavaFX），整目录拷贝即用，目标机免装 Java，无控制台窗口；也可生成 MSI 安装包。
- **CI 发布**：GitHub Actions 工作流在打 tag（`v*`）时自动构建 Windows MSI 与 ZIP 压缩包，并发布到 Release。

## 总结

这个项目从立项到发布 v1.2.1 用时约一周，核心功能（发送魔术包）本身不复杂，主要工作量集中在工程化细节上：配置迁移、输入校验、测试覆盖、打包分发。对于工具类应用，这些「看不见的部分」往往决定了实际使用体验的上限。
