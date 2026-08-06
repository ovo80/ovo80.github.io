---
title: "SpringBoot 手写 CRUD 05 · 面试速查与易错点"
published: 2026-08-03
description: "一份可以 30 秒讲完的项目介绍、14 条高频面试问答速记，以及 15 条用实践换来的易错点。"
image: ""
tags: ["SpringBoot", "面试", "易错点", "速查"]
category: "面试"
draft: false
---

> 核心：一份可以 30 秒讲完的项目介绍 + 15 条用实践换来的易错点。

## 面试口述版（30 秒版本）

> **Q：介绍一下你的项目？**
>
> 我独立开发了一个 SpringBoot 用户管理模块作为演示项目。技术栈是 SpringBoot + MyBatis-Plus + MySQL。
> 架构上采用分层设计：Controller 负责接收请求，Service 接口+实现类承载业务逻辑，Mapper 基于 MyBatis-Plus 的 BaseMapper 实现零 SQL 的增删改查。
> 工程细节上：统一使用泛型 Result 封装返回（含错误码枚举），自定义 BizException + 全局 @RestControllerAdvice 统一处理异常，查/改/删不存在的记录会返回 404 而不是假成功；更新接口做了前置校验（id 为空先拦截）和 String.format 格式化消息。
> 目前已经实现了用户完整的增删改查，下一步计划接入 Sa-Token 做登录认证和 RBAC 权限控制。

## 高频面试问答速记

| 问题 | 一句话回答 |
| --- | --- |
| @SpringBootApplication 是什么？ | 三合一注解：配置 + 自动配置 + 组件扫描 |
| 为什么 Service 要分接口和实现？ | 面向接口编程，可替换、可测试 |
| 什么是 IoC / DI？ | 对象由 Spring 容器创建管理，你只声明"要什么"它注入 |
| 为什么不用 try-catch？ | 几十个接口集中一处处理，@RestControllerAdvice 统一接 |
| 泛型 Result 有什么好处？ | 编译期类型安全 + 统一格式 |
| GET 和 POST 区别？ | GET 参数在 URL 用于查；POST 数据在 body 用于写 |
| MyBatis-Plus 怎么防注入？ | LambdaQueryWrapper 用方法引用，SQL 由框架拼 |
| 空结果怎么处理？ | selectById 判 null、update/delete 判影响行数，抛 404 |
| 分页怎么做？ | `Page.of(pageNum, pageSize)` + `selectPage`，分页插件手动注册（MP 3.5.9+） |
| 条件查询怎么写？ | LambdaQueryWrapper 链式：`like(boolean开关, SysUser::getUsername, 值)` 动态拼 WHERE |
| 参数校验怎么做？ | 实体加 `@NotBlank`/`@Size` 注解 + Controller 加 `@Validated` 触发 |
| 新增必填、更新可选怎么办？ | validation 分组：`AddGroup`/`UpdateGroup` 接口 + `@Validated(XxxGroup.class)` |
| 校验失败抛什么异常？ | `MethodArgumentNotValidException` → 全局处理器聚合字段错误返回 400 |
| 方法引用 `::` 是什么？ | `SysUser::getUsername` = 方法的引用；编译器检查方法存在，防拼错 + 防注入 |

## 关键点 / 易错点汇总（15 条）

1. **`@RequestBody` 最易漏**：POST/PUT 收 JSON 必须加，忘了则对象全为 null
2. **接口和实现类签名必须一字不差**：方法名+参数类型，否则 `@Override` 报错
3. **`static` 字段是"属于类"的**：代表单个对象属性的字段（如 Result.code）不能加 static
4. **方法调用不写类型**：`sysUserMapper.insert(user)`，不是 `insert(SysUser user)`
5. **方法返回值**：增删改返回 void 或影响行数 int；`if (rows == 0)` 判断记录是否存在
6. **IDEA import 陷阱**：自动补全会选到同名类（如 `org.apache.catalina.User`），看清包名选 `ad.ovo.demo2.*`
7. **测试注意自增 id**：数据库自增可能跳过，别假设新记录 id 一定是下一个整数
8. **包名全小写**：`common.result` 不是 `common.Result`（Java 规范）
9. **Controller 无业务逻辑**：只做"接参→调 Service→包 Result"
10. **空结果必须处理**：查不到/改不到/删不到，都要抛 404，不能假装成功
11. **前置校验先行**：操作数据前先校验参数（id 为空等），把错误挡在入口，避免撞 null（防御性编程）
12. **String.format 注意 null**：`%d` 占位符遇到 null 会抛异常，用之前确保值不为 null
13. **分页插件必须注册**（MP 3.5.9+）：不注册 `selectPage` 返回全量数据、total=0、SQL 无 LIMIT
14. **wrapper 值走占位符**：`like` 等条件的值全部 `?` 预编译，防 SQL 注入；动态条件用 boolean 开关控制
15. **校验异常要单独接**：`MethodArgumentNotValidException` 需在全局处理器加方法返回 400，否则落 500 兜底

## 下一步学习方向

- [x] 分页查询：MyBatis-Plus `Page` + 分页插件
- [x] 条件分页：LambdaQueryWrapper 模糊查询 + 排序
- [x] 参数校验：@Valid/@Validated + 分组校验
- [ ] 认证授权：Sa-Token + JWT 登录、拦截器、`@SaCheckLogin`
- [ ] RBAC：用户-角色-权限三表 + 注解鉴权
- [ ] Redis：缓存 + 分布式锁

## 系列文章

- 系列：[01 · 项目骨架与分层架构](/posts/springboot-crud-01-project-skeleton/) → [02 · Controller 请求处理](/posts/springboot-crud-02-controller/) → [03 · Service 分层与数据访问](/posts/springboot-crud-03-service-and-data/) → [04 · 统一返回与全局异常](/posts/springboot-crud-04-result-and-exception/)
