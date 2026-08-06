---
title: "SpringBoot 手写 CRUD 01 · 项目骨架与分层架构"
published: 2026-08-03
description: "从零手写 SpringBoot CRUD 的第一篇：项目骨架、分层架构，以及一次请求的完整旅程。"
image: ""
tags: ["SpringBoot", "分层架构", "后端基础"]
category: "SpringBoot"
draft: false
---

> 核心：一次请求 = 浏览器 → Controller → Service接口 → ServiceImpl → Mapper → MySQL，所有 SpringBoot 项目都是这条链的变体。

## 技术栈与项目结构

```
技术栈：SpringBoot 3.5.16 + Java 17 + MyBatis-Plus 3.5.17 + MySQL 8.4 + Lombok
包名：ad.ovo.demo2
```

```
src/main/java/ad/ovo/demo2/
├── DemoApplication.java               # 启动类
├── common/
│   ├── result/
│   │   ├── Result.java                # 统一返回封装（泛型盒子）
│   │   └── ResultCode.java            # 错误码枚举清单
│   └── exception/
│       ├── BizException.java          # 业务异常（带错误码）
│       └── GlobalExceptionHandler.java# 全局异常安全网
├── controller/
│   ├── HelloController.java           # 测试接口
│   └── SysUserController.java         # 用户 CRUD 接口
├── entity/
│   └── SysUser.java                   # 用户实体 ↔ sys_user 表
├── mapper/
│   └── SysUserMapper.java             # 继承 BaseMapper 白送增删改查
└── service/
    ├── SysUserService.java            # Service 接口（服务契约）
    └── impl/
        └── SysUserServiceImpl.java    # Service 实现（业务逻辑）
```

数据库表 `sys_user`：

```sql
CREATE TABLE sys_user (
    id          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
    username    VARCHAR(64)  NOT NULL COMMENT '登录用户名',
    password    VARCHAR(128) NOT NULL DEFAULT '' COMMENT '密码',
    nickname    VARCHAR(64)  NULL COMMENT '昵称',
    status      TINYINT      NOT NULL DEFAULT 0 COMMENT '状态: 0-正常 1-停用',
    create_time DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_username (username)
) ENGINE = InnoDB COMMENT = '系统用户表';
```

## 启动类 DemoApplication

**文件**：`src/main/java/ad/ovo/demo2/DemoApplication.java`

```java
package ad.ovo.demo2;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
```

### 逐行讲解

| 代码 | 含义 |
| --- | --- |
| `package ad.ovo.demo2;` | 包名：给代码"归个类"，必须和目录结构一致 |
| `import ...SpringApplication;` | 引入 Spring 的启动器工具类 |
| `@SpringBootApplication` | **核心注解**：项目启动入口的"标签" |
| `public class DemoApplication` | 类名，必须和文件名一致 |
| `SpringApplication.run(...)` | 启动整个 SpringBoot 引擎 |

### 面试考点：@SpringBootApplication 是什么？

**它一个顶三个**（复合注解）：

| 组合注解 | 作用 |
| --- | --- |
| `@SpringBootConfiguration` | 声明这是个配置类 |
| `@EnableAutoConfiguration` | **自动配置**：根据 pom 依赖自动配好（装 MP 就自动配数据源） |
| `@ComponentScan` | **组件扫描**：扫描本包及子包，找到 `@Service`/`@Controller` 等标签的类注册进容器 |

> 这就是 SpringBoot"约定大于配置"的核心——不写一堆 XML，框架按约定自动干活。

## 分层职责（写进脑子）

| 层 | 职责 |
| --- | --- |
| Controller | 请求入口：只接请求、转发、包 Result——不写业务逻辑 |
| Service 接口 | 服务契约：只声明"提供什么服务" |
| ServiceImpl | 业务实现：真正的业务逻辑，`@Service` 注册 |
| Mapper | 数据访问：`extends BaseMapper<实体>` 继承增删改查 |
| Entity | 表映射：一个类对应一张表，`@TableName("表名")` 映射 |

## 一次请求的完整旅程（串联所有层）

```
浏览器 GET /user/1
  ↓
① SysUserController.getById(1)          # @PathVariable 取出 id=1
  ↓ sysUserService.getById(1L)
② SysUserService 接口                    # 契约：声明有 getById 服务
  ↓
③ SysUserServiceImpl.getById(1L)        # 实现：真正执行
  ↓ sysUserMapper.selectById(1L)
④ SysUserMapper（extends BaseMapper）    # 翻译官：Java 方法 → SQL
  ↓
⑤ MySQL: SELECT ... FROM sys_user WHERE id=1
  ↓ 返回数据，原路返回
⑥ Controller 包成 Result.success(user)
  ↓
⑦ 浏览器收到 {"code":200,"message":"操作成功","data":{...},"timestamp":...}
```

**任何 SpringBoot 接口，本质都是这个流程**——把这条线刻进脑子，所有 Web 项目都是它的变体。

## 系列文章

- 下一篇：[02 · Controller 请求处理](/posts/springboot-crud-02-controller/)
- 下一篇：[03 · Service 分层与数据访问](/posts/springboot-crud-03-service-and-data/)
- 面试速查：[05 · 面试速查与易错点](/posts/springboot-crud-05-interview-cheatsheet/)
