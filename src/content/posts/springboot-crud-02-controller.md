---
title: "SpringBoot 手写 CRUD 02 · Controller 请求处理"
published: 2026-08-03
description: "Controller 层的完整代码与注解对照表：接参 → 调 Service → 包 Result，以及易错点。"
image: ""
tags: ["SpringBoot", "Controller", "注解", "后端基础"]
category: "SpringBoot"
draft: false
---

> 核心：Controller 是请求入口——接参 → 调 Service → 包 Result，不写业务逻辑。

## 完整代码（当前最新版，含分页 + 分组校验）

**文件**：`src/main/java/ad/ovo/demo2/controller/SysUserController.java`

```java
package ad.ovo.demo2.controller;

import ad.ovo.demo2.common.result.Result;
import ad.ovo.demo2.entity.SysUser;
import ad.ovo.demo2.service.SysUserService;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class SysUserController {

    private final SysUserService sysUserService;   // 依赖注入

    // 查：GET /user/{id}
    @GetMapping("/{id}")
    public Result<SysUser> getById(@PathVariable Long id){
        return Result.success(sysUserService.getById(id));
    }

    // 增：POST /user（AddGroup：校验 username 必填、password 长度）
    @PostMapping
    public Result<SysUser> add(@Validated(SysUser.AddGroup.class) @RequestBody SysUser user){
        sysUserService.add(user);
        return Result.success();
    }

    // 改：PUT /user（UpdateGroup：部分更新，不校验必填字段）
    @PutMapping
    public Result<SysUser> update(@Validated(SysUser.UpdateGroup.class) @RequestBody SysUser user){
        sysUserService.update(user);
        return Result.success();
    }

    // 删：DELETE /user/{id}
    @DeleteMapping("/{id}")
    public Result<SysUser> delete(@PathVariable Long id){
        sysUserService.delete(id);
        return Result.success();
    }

    // 分页查询：GET /user/page?pageNum=1&pageSize=10&username=xx
    @GetMapping("/page")
    public Result<Page<SysUser>> page(
            @RequestParam(defaultValue = "1") long pageNum,
            @RequestParam(defaultValue = "10") long pageSize,
            @RequestParam(required = false) String username) {
        return Result.success(sysUserService.page(pageNum, pageSize, username));
    }
}
```

## 注解对照表（面试基础）

| 注解 | 位置 | 作用 |
| --- | --- | --- |
| `@RestController` | 类 | 声明"我是接 HTTP 请求的 Controller"（= @Controller + @ResponseBody） |
| `@RequestMapping("/user")` | 类 | 类级前缀：本类所有接口都在 /user 下 |
| `@GetMapping("/{id}")` | 方法 | 处理 GET 请求（查询）；`{id}` 是 URL 占位符 |
| `@PostMapping` | 方法 | 处理 POST 请求（新增） |
| `@PutMapping` | 方法 | 处理 PUT 请求（更新） |
| `@DeleteMapping("/{id}")` | 方法 | 处理 DELETE 请求（删除） |
| `@PathVariable Long id` | 参数 | 从 URL 占位符取值给参数 |
| `@RequestBody SysUser user` | 参数 | 把请求体 JSON 自动解析成 Java 对象 |
| `@RequiredArgsConstructor` | 类 | Lombok：为 final 字段自动生成构造器（配合依赖注入） |

## 关键理解

1. **URL 拼接规则**：类级前缀 + 方法级路径。`/user` + `/{id}` = `/user/1`
2. **@PathVariable vs @RequestBody**：
   - `@PathVariable`：从网址取（`/user/1` 里的 `1`）→ 适合查询/删除
   - `@RequestBody`：从请求体取（POST 发的 JSON）→ 适合新增/更新
3. **Controller 三板斧**：接参数 → 调 Service → 包 Result。**Controller 不写业务逻辑**
4. **GET vs POST**（面试高频）：GET 参数在 URL，用于查询；POST 数据在 body，用于写入（数据可能长、可能敏感）

## ⚠️ 易错点

- **@RequestBody 最易漏**：POST/PUT 必须加，忘了则 `user` 全字段为 null，插入的是空记录
- **@PathVariable 的参数名**：URL 写 `{id}`，参数写 `@PathVariable Long id`——名字要对应
- **IDEA import 陷阱**：自动补全会选到同名类（如 `org.apache.catalina.User`），看清包名选 `ad.ovo.demo2.*`

## 系列文章

- 上一篇：[01 · 项目骨架与分层架构](/posts/springboot-crud-01-project-skeleton/)
- 下一篇：[03 · Service 分层与数据访问](/posts/springboot-crud-03-service-and-data/)
- 面试速查：[05 · 面试速查与易错点](/posts/springboot-crud-05-interview-cheatsheet/)
