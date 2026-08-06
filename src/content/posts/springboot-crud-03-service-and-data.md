---
title: "SpringBoot 手写 CRUD 03 · Service 分层与数据访问"
published: 2026-08-03
description: "Service 接口与实现、依赖注入、防御性编程、实体与 Mapper 层，以及分页和条件查询实战。"
image: ""
tags: ["SpringBoot", "Service", "MyBatis-Plus", "ORM", "依赖注入"]
category: "SpringBoot"
draft: false
---

> 核心：接口 = 服务契约、实现类 = 业务细节；实体 = 表映射；Mapper = 白送增删改查。

## Service 层：接口 + 实现

**接口文件**：`src/main/java/ad/ovo/demo2/service/SysUserService.java`

```java
package ad.ovo.demo2.service;

import ad.ovo.demo2.entity.SysUser;

public interface SysUserService {
    SysUser getById(Long id);
    void add(SysUser user);
    void update(SysUser user);
    void delete(Long id);
}
```

**实现文件**：`src/main/java/ad/ovo/demo2/service/impl/SysUserServiceImpl.java`

```java
package ad.ovo.demo2.service.impl;

import ad.ovo.demo2.common.exception.BizException;
import ad.ovo.demo2.common.result.ResultCode;
import ad.ovo.demo2.entity.SysUser;
import ad.ovo.demo2.mapper.SysUserMapper;
import ad.ovo.demo2.service.SysUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SysUserServiceImpl implements SysUserService {

    private final SysUserMapper sysUserMapper;   // 依赖注入 Mapper

    @Override
    public SysUser getById(Long id){
        SysUser user = sysUserMapper.selectById(id);
        if (user == null) {
            throw new BizException(ResultCode.NOT_FOUND, "用户不存在: id=" + id);
        }
        return user;
    }

    @Override
    public void add(SysUser user){
        sysUserMapper.insert(user);
    }

    @Override
    public void update(SysUser user) {
        // 前置校验：先拦住"没带 id"的请求，再查库（防御性编程）
        if (user == null || user.getId() == null) {
            throw new BizException(ResultCode.NOT_FOUND, "用户信息或ID不能为空");
        }
        int row = sysUserMapper.updateById(user);
        if (row == 0) {
            throw new BizException(ResultCode.NOT_FOUND, "用户不存在：id = " + user.getId());
        }
    }

    @Override
    public void delete(Long id){
        int row = sysUserMapper.deleteById(id);
        if (row == 0) {
            throw new BizException(ResultCode.NOT_FOUND, "用户不存在: id=" + id);
        }
    }
}
```

### 为什么要分接口和实现？（面试高频）

| 视角 | 接口 | 实现类 |
| --- | --- | --- |
| 抽象 | 只声明"提供什么服务" | 写具体业务逻辑 |
| 依赖方向 | 调用方（Controller）只依赖抽象 | 不关心调用方如何使用 |

**好处**：

1. **面向接口编程**：调用方只依赖抽象，不关心实现细节
2. **可替换性**：将来换实现（加缓存、换数据源），新建一个 Impl 即可，Controller 零改动
3. **便于测试**：单测时 mock 接口比 mock 具体类容易

### 依赖注入（@Service + @RequiredArgsConstructor + final）

```java
@Service                      // 告诉 Spring："我是业务类，注册进容器"
@RequiredArgsConstructor      // Lombok：为 final 字段生成构造器
public class SysUserServiceImpl implements SysUserService {
    private final SysUserMapper sysUserMapper;   // Spring 自动注入，不用 new
```

**为什么不用 `new SysUserMapper()`？** Spring 管理对象生命周期（单例、销毁等），你只管声明"我要什么"，Spring 给你"注入"什么——这叫**控制反转（IoC）/ 依赖注入（DI）**，Spring 的基石。

### 防御性编程：前置校验

```java
if (user == null || user.getId() == null) {
    throw new BizException(ResultCode.NOT_FOUND, "用户信息或ID不能为空");
}
```

**为什么要有前置校验？**

| 场景 | 不加前置校验 | 加了前置校验 |
| --- | --- | --- |
| 前端没传 id | 带着 null 去查库，SQL 行为不可控 | 进库前就拦住，报清晰错误 |
| 传了不存在的 id | 走 `row == 0` 分支，但此时 `user.getId()` 可能是 null | 提前区分"没带 id"和"id 不存在" |

**核心思想（面试可说）**：**先校验参数合法性，再操作数据**——把错误挡在"入口"，而不是等到"出口"才兜底。这叫**前置校验 / 防御性编程**（Defensive Programming）。工程上更省事的方案是用 `@Valid` 注解校验。

### String.format：格式化字符串

```java
String.format("用户不存在：id = %d", user.getId())
```

| 占位符 | 填什么 | 示例 |
| --- | --- | --- |
| `%d` | 整数（int/long） | `%d` → 填 4 |
| `%s` | 字符串 | `%s` → 填 "张三" |
| `%f` | 小数 | `%.2f` → 保留两位小数 |

- **与 `+` 拼接对比**：`+` 适合简单拼接；`format` 适合长模板、含格式要求（补零、小数位）
- **注意**：`%d` 遇到 null 会抛 `IllegalFormatConversionException`——所以要先做前置校验保证 id 不为 null（两个知识点正好配合）

## 实体层（一个类对应一张表）

**文件**：`src/main/java/ad/ovo/demo2/entity/SysUser.java`（当前最新版，含校验注解 + 分组）

```java
package ad.ovo.demo2.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("sys_user")
public class SysUser {

    @TableId(type = IdType.AUTO)
    private Long id;

    // 校验注解：新增时必须非空；groups=AddGroup 表示"仅新增场景校验"
    @NotBlank(message = "用户名不能为空", groups = AddGroup.class)
    private String username;

    @Size(min = 6, max = 20, message = "密码长度必须在6-20之间", groups = AddGroup.class)
    private String password;

    private String nickname;
    private Integer status;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;

    /** 新增场景校验分组。 */
    public interface AddGroup {}

    /** 更新场景校验分组：无约束，支持部分更新。 */
    public interface UpdateGroup {}
}
```

### ORM 概念（面试基础）

ORM（Object-Relational Mapping，对象关系映射）= Java 对象和数据库记录之间的"翻译官"：

| Java 概念 | 数据库概念 |
| --- | --- |
| 类 `SysUser` | 表 `sys_user` |
| 字段 `username` | 列 `username` |
| 一个对象 `new SysUser()` | 一行记录 |

### 注解讲解

| 注解 | 作用 |
| --- | --- |
| `@TableName("sys_user")` | 类名 `SysUser` ≠ 表名 `sys_user`，必须告诉 MP 对应关系 |
| `@TableId(type = IdType.AUTO)` | 标记主键，`AUTO` = 数据库自增 |
| `@Data` | Lombok 自动生成 getter/setter/toString |

### 驼峰 ↔ 下划线自动转换

Java 的 `createTime` 自动对应数据库 `create_time`——MyBatis-Plus 默认约定（yaml 里 `map-underscore-to-camel-case: true`）。

### 类型对应表

| Java | SQL |
| --- | --- |
| `Long` | BIGINT |
| `Integer` | TINYINT/INT |
| `String` | VARCHAR |
| `LocalDateTime` | DATETIME |

## Mapper 层（白送增删改查）

**文件**：`src/main/java/ad/ovo/demo2/mapper/SysUserMapper.java`

```java
package ad.ovo.demo2.mapper;

import ad.ovo.demo2.entity.SysUser;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface SysUserMapper extends BaseMapper<SysUser> {
}
```

### 核心：extends BaseMapper\<SysUser\>

`BaseMapper` 是 MyBatis-Plus **写好的"增删改查工具箱"**，继承它就免费获得全部方法：

| 方法 | SQL | 返回值 |
| --- | --- | --- |
| `selectById(id)` | SELECT ... WHERE id=? | 实体 或 null |
| `insert(user)` | INSERT | int 影响行数 |
| `updateById(user)` | UPDATE ... WHERE id=? | int 影响行数 |
| `deleteById(id)` | DELETE WHERE id=? | int 影响行数 |
| `selectList(wrapper)` | SELECT ... | 列表 |
| `selectCount(wrapper)` | SELECT COUNT(*) | Long |
| `selectPage(page, wrapper)` | 分页查询 | Page |

**这就是你"一行 SQL 都没写却能操作数据库"的原因**——框架帮你写了。

> 面试可以说：MyBatis-Plus 基于 MyBatis 封装，BaseMapper 提供通用 CRUD，LambdaQueryWrapper 用 Java 链式写条件（防 SQL 注入）。

## 分页查询实战

### 为什么需要分页？（面试必问）

数据量大时（如 10 万条），一次 `SELECT *` 全查会内存爆掉、响应卡死。分页 = **一次只查一页**（SQL 的 `LIMIT`）。两个核心参数：

- `pageNum`（页码）：第几页，从 1 开始
- `pageSize`（每页条数）：一页放几条

### ⚠️ 重要坑：分页插件必须手动注册（MP 3.5.9+）

**MyBatis-Plus 3.5.9+ 分页插件不默认开启**，必须写配置类注册：

```java
@Configuration
public class MybatisPlusConfig {

    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.MYSQL));
        return interceptor;
    }
}
```

| 注解/概念 | 作用 |
| --- | --- |
| `@Configuration` | 告诉 Spring："我是配置类" |
| `@Bean` | 方法的返回值交给 Spring 容器管理 |
| `MybatisPlusInterceptor` | 拦截器：SQL 执行前拦截，往里加东西（如 LIMIT） |
| `PaginationInnerInterceptor` | 分页拦截器：把 Page 对象翻译成 LIMIT SQL |

**没注册的故障表现**：`selectPage` 返回全部数据、`total=0`、日志 SQL **没有 LIMIT**——调试时先查这个。

**注册后的效果**（日志可见）：每条分页查询自动变两条 SQL：

```
SELECT COUNT(*) AS total FROM sys_user          -- 查总数
SELECT ... FROM sys_user LIMIT ?,?              -- 取本页数据
```

### 三层联动写法

**Service 接口**：

```java
Page<SysUser> page(long pageNum, long pageSize);
```

**Service 实现**：

```java
@Override
public Page<SysUser> page(long pageNum, long pageSize) {
    return sysUserMapper.selectPage(Page.of(pageNum, pageSize), null);
}
```

> `Page.of(pageNum, pageSize)` 造分页对象；第二个参数是查询条件 wrapper，无过滤时传 null。

**Controller**：

```java
@GetMapping("/page")
public Result<Page<SysUser>> page(
        @RequestParam(defaultValue = "1") long pageNum,
        @RequestParam(defaultValue = "10") long pageSize) {
    return Result.success(sysUserService.page(pageNum, pageSize));
}
```

**`@RequestParam`**：从 URL `?` 后取值（`/user/page?pageNum=1&pageSize=10`）；`defaultValue` = 前端没传时用默认值，这样 `/user/page` 不带参数也能访问。

### Page 对象自带字段（前端画分页条用）

| 字段 | 含义 |
| --- | --- |
| `records` | 本页数据列表 |
| `total` | 总记录数 |
| `pages` | 总页数 |
| `current` | 当前页码 |
| `size` | 每页条数 |

### ⚠️ URL 路径冲突

`/user/{id}` 和 `/user/page` 都挂在 `/user` 下——Spring **精确路径优先于占位符**，`/page` 不会被子路径抢走，但要知道这个机制。

## 条件分页：LambdaQueryWrapper

### 为什么用 wrapper？（面试必问：防 SQL 注入）

条件查询不能手拼 SQL 字符串（注入风险）。**LambdaQueryWrapper** 用**方法引用**写字段，值全部走 `?` 占位符预编译：

```java
LambdaQueryWrapper<SysUser> wrapper = new LambdaQueryWrapper<>();
wrapper.like(username != null && !username.isBlank(), SysUser::getUsername, username)
       .orderByDesc(SysUser::getId);
return sysUserMapper.selectPage(Page.of(pageNum, pageSize), wrapper);
```

**逐项解读**：

| 写法 | 含义 |
| --- | --- |
| `new LambdaQueryWrapper<>()` | 装查询条件的容器 |
| `like(boolean, 字段, 值)` | 模糊匹配；**第一个参数是开关**——true 加条件，false 跳过（动态条件） |
| `SysUser::getUsername` | 方法引用：字段由编译器检查，拼不错、可防注入 |
| `.orderByDesc(...)` | 链式调用：排序条件 |
| 生成的 SQL | `WHERE (username LIKE ?) ORDER BY id DESC LIMIT ?`——**值全走占位符** |

**常用 wrapper 方法速查**（面试能说出 3 个就行）：

| 方法 | SQL 对应 | 用途 |
| --- | --- | --- |
| `eq(字段, 值)` | `=` | 精确等于 |
| `like(字段, 值)` | `LIKE '%值%'` | 模糊匹配 |
| `ge(字段, 值)` / `le` | `>=` / `<=` | 范围 |
| `orderByDesc(字段)` | `ORDER BY ... DESC` | 倒序 |
| `in(字段, 集合)` | `IN (...)` | 批量匹配 |

**Controller 侧**：搜索参数用 `@RequestParam(required = false)`——前端可不传，不传为 null 走"查全部"分支。

### 动态条件套路（面试加分）

```java
wrapper.like(username != null && !username.isBlank(), ...)  // 有值才过滤
```

条件表达式的 boolean 控制"加不加这个条件"——搜索框为空时不加 WHERE，有值才加。所有搜索接口都是这个套路。

## 系列文章

- 上一篇：[02 · Controller 请求处理](/posts/springboot-crud-02-controller/)
- 下一篇：[04 · 统一返回与全局异常](/posts/springboot-crud-04-result-and-exception/)
- 面试速查：[05 · 面试速查与易错点](/posts/springboot-crud-05-interview-cheatsheet/)
