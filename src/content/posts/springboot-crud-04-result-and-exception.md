---
title: "SpringBoot 手写 CRUD 04 · 统一返回与全局异常"
published: 2026-08-03
description: "泛型 Result 统一返回、错误码枚举、BizException 与全局异常处理器，以及参数校验和分组校验。"
image: ""
tags: ["SpringBoot", "Result", "泛型", "异常处理", "面试"]
category: "SpringBoot"
draft: false
---

> 核心：Result 是"标准盒子"，异常处理是"报警器 + 接警中心"——Service 只管 throw，全局安全网统一接。

## 统一返回 Result

**文件**：`src/main/java/ad/ovo/demo2/common/result/Result.java`

```java
package ad.ovo.demo2.common.result;

import lombok.Data;

@Data
public class Result<T> {
    private Integer code;
    private String message;
    private T data;
    private long timestamp;

    private Result(Integer code, String message, T data){
        this.code = code;
        this.message = message;
        this.data = data;
        this.timestamp = System.currentTimeMillis();
    }

    public static <T> Result<T> success(T data){
        return new Result<>(ResultCode.SUCCESS.getCode(), ResultCode.SUCCESS.getMessage(), data);
    }

    public static <T> Result<T> success(){
        return new Result<>(ResultCode.SUCCESS.getCode(), ResultCode.SUCCESS.getMessage(), null);
    }

    public static <T> Result<T> error(Integer code, String message){
        return new Result<>(code, message, null);
    }
}
```

**文件**：`src/main/java/ad/ovo/demo2/common/result/ResultCode.java`

```java
package ad.ovo.demo2.common.result;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ResultCode {
    SUCCESS(200, "操作成功"),
    BAD_REQUEST(400, "请求参数错误"),
    UNAUTHORIZED(401, "未登录或登录已过期"),
    FORBIDDEN(403, "无权限访问"),
    NOT_FOUND(404, "资源不存在"),
    INTERNAL_ERROR(500, "系统内部错误");

    private final Integer code;
    private final String message;
}
```

### 泛型 `<T>` 详解（面试高频）

```java
Result<String> r1;    // 装字符串的盒子
Result<SysUser> r2;   // 装用户对象的盒子
Result<Void> r3;      // 空盒子（只报成功/失败）
```

- `T` 是占位符（Type），用的时候才指定具体类型
- 作用：**编译期类型安全**——装字符串的盒子不能装用户，写错编译器就报错

### 设计模式：私有构造器 + 静态工厂方法

```java
private Result(...) { ... }                     // 私有：外面不能 new
public static <T> Result<T> success(T data) { ... }  // 只能通过静态方法创建
```

- **好处**：强制所有盒子通过 `Result.success()` / `Result.error()` 创建，保证格式统一
- 这就是**工厂方法模式**（面试会问设计模式时提）

### 错误码为什么用枚举？

1. **一处定义、全局复用**：不怕抄错数字（404 vs 4040）
2. **改一处全局生效**：想改提示语只改枚举
3. 错误码遵循 HTTP 语义：200 成功 / 400 参数错 / 401 未登录 / 403 无权限 / 404 不存在 / 500 服务器错

### ⚠️ 易错点

- **`static` 陷阱**：`code` 字段**不能加 static**！static = 属于类、所有对象共享一份。加了 static，一个盒子的 code 变化会影响所有盒子
- **方法调用不写类型**：`new Result<>(200, "成功", data)`，不是 `new Result<Integer>(...)`（Java 7+ 钻石运算符 `<>` 自动推断）

## 异常处理（全局安全网）

**文件**：`src/main/java/ad/ovo/demo2/common/exception/BizException.java`

```java
package ad.ovo.demo2.common.exception;

import ad.ovo.demo2.common.result.ResultCode;
import lombok.Getter;

@Getter
public class BizException extends RuntimeException {

    private final Integer code;

    public BizException(ResultCode resultCode){
        super(resultCode.getMessage());
        this.code = resultCode.getCode();
    }

    public BizException(ResultCode resultCode, String message) {
        super(message);
        this.code = resultCode.getCode();
    }
}
```

**文件**：`src/main/java/ad/ovo/demo2/common/exception/GlobalExceptionHandler.java`

```java
package ad.ovo.demo2.common.exception;

import ad.ovo.demo2.common.result.Result;
import ad.ovo.demo2.common.result.ResultCode;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BizException.class)
    public Result<Void> handleBizException(BizException e){
        log.warn("业务异常: code={}, message={}", e.getCode(), e.getMessage());
        return Result.error(e.getCode(), e.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public Result<Void> handleException(Exception e) {
        log.error("系统异常", e);
        return Result.error(500, "系统内部错误");
    }

    // 参数校验失败：聚合所有字段错误返回 400
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Result<Void> handleValidException(MethodArgumentNotValidException e) {
        String msg = e.getBindingResult().getFieldErrors().stream()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return Result.error(ResultCode.BAD_REQUEST.getCode(), msg);
    }
}
```

### 机制图解（异常的一生）

```
① Service 发现"用户不存在" → throw new BizException(NOT_FOUND, "用户不存在")
        ↓ 异常向上抛（方法调用栈一层层甩）
② 路过 Controller（不接，只转发）
        ↓
③ @RestControllerAdvice 安全网精准接住（@ExceptionHandler(BizException.class)）
        ↓
④ 包装成 Result.error(404, "用户不存在") → 前端收到标准 JSON
        ↓
⑤ 兜底：任何漏网异常（Exception.class）→ 统一返回 500，绝不崩溃裸奔
```

### 概念理解

| 概念 | 说明 |
| --- | --- |
| `BizException` | 自定义业务异常，"带错误码"；`extends RuntimeException` 才能被 throw |
| `@RestControllerAdvice` | 全局异常处理；不管哪个 Controller 抛异常都被它接住 |
| `@ExceptionHandler(X.class)` | "我只接 X 这种异常"；Exception.class 是兜底网 |
| `throw` | 方法遇到问题主动抛出，后面的代码不执行 |

### 为什么不需要 try-catch？（面试加分点）

项目几十个接口，每个都 try-catch → 代码全是垃圾。**集中一处处理**：

- Service 只管"发现问题就 throw"
- Advice 统一"接住并包装成 Result"
- 中间零 try-catch，代码干净

### ⚠️ 易错点

- 方法名随意（Spring 靠 `@ExceptionHandler` 注解认方法，不靠名字），但**命名规范**要遵守（handleXxxException）
- `log.warn` / `log.error` 要分级：业务异常 warn，系统异常 error（带堆栈）

## 参数校验与校验异常

### 为什么需要参数校验？

没有校验时，空用户名/超长密码会被照单全收，违反数据库约束 → 500 错误。**校验应该挡在入口**（Controller），不合格直接返回 400。

### 声明校验规则（实体上加注解）

```java
@NotBlank(message = "用户名不能为空", groups = AddGroup.class)
private String username;

@Size(min = 6, max = 20, message = "密码长度必须在6-20之间", groups = AddGroup.class)
private String password;
```

常用校验注解：`@NotBlank`（非 null/非空串/非空格）、`@Size`（长度）、`@NotNull`（非 null）、`@Pattern`（正则）、`@Min/@Max`（数值）。

### 触发校验（Controller 加 @Validated）

```java
@PostMapping
public Result<SysUser> add(@Validated(SysUser.AddGroup.class) @RequestBody SysUser user) { ... }
```

### 分组校验：新增必填、更新可选（面试加分）

同一个实体在不同接口场景需要不同规则：新增必须传 username，更新可以不传（只改部分字段）。

```java
// 实体里定义两个空接口作为分组标记
public interface AddGroup {}     // 新增组：标注了 groups=AddGroup 的约束才生效
public interface UpdateGroup {}  // 更新组：无约束 → 更新不校验 username/password

// Controller 按场景指定组
@Validated(SysUser.AddGroup.class)    // 新增：校验必填
@Validated(SysUser.UpdateGroup.class) // 更新：不校验必填
```

**核心**：`groups` 让校验规则按场景生效——这就是 Bean Validation 的分组校验（JSR-303）。

### 校验异常必须单独接（易错！）

校验失败抛 `MethodArgumentNotValidException`，**默认会落 500 兜底**——但校验失败应该是 400。必须在 GlobalExceptionHandler 加专门方法：

```java
@ExceptionHandler(MethodArgumentNotValidException.class)
public Result<Void> handleValidException(MethodArgumentNotValidException e) {
    String msg = e.getBindingResult().getFieldErrors().stream()
            .map(err -> err.getField() + ": " + err.getDefaultMessage())
            .collect(Collectors.joining("; "));   // 聚合所有字段错误
    return Result.error(ResultCode.BAD_REQUEST.getCode(), msg);
}
```

**Stream 解读**：`getFieldErrors()` 拿所有字段错误 → `map` 转成 `"字段: 原因"` → `joining("; ")` 用分号拼成一条消息。前端拿到如 `"username: 用户名不能为空; password: 密码长度必须在6-20之间"`。

### 踩坑记录

- **update 误用 AddGroup**：更新接口必须用 `UpdateGroup.class`，否则"只改昵称"会被"用户名必填"误拦截——新增/更新用错组的典型 bug

### 面试话术（30 秒口述版）

> **Q：你的参数校验怎么做的？**
>
> 我在实体上声明校验注解（@NotBlank、@Size），Controller 用 @Validated 触发。校验失败会抛 MethodArgumentNotValidException，我在全局异常处理器里遍历所有字段错误，聚合成一条消息返回 400。
> 另外用分组校验解决了"新增必填、更新可选"的问题：AddGroup/UpdateGroup 两个接口做分组标记，新增走 AddGroup 校验必填，更新走 UpdateGroup（部分更新语义，只改传入字段）。

### 方法引用 `::` 详解（Lambda 前置知识）

```java
SysUser::getUsername   // 读作：SysUser 类的 getUsername 方法
```

**是什么**：`::` 左边是类、右边是方法名，整体代表"这个类的这个方法"——方法的引用。

**为什么写条件用方法引用更安全？**（防注入面试点）

```java
// 写法 A：字符串（不安全）——拼错不报错，运行时才发现
wrapper.like("username", "张")

// 写法 B：方法引用（安全）——编译器检查 getUsername 存在，拼错编译期就报错
wrapper.like(SysUser::getUsername, "张")
```

**对比**：字符串 `"username"` 像"报一个名字"——没人验证存不存在；`SysUser::getUsername` 像"指着一个真人"——编译器帮你确认存在。这就是**编译期类型安全**，也是防 SQL 注入的一部分（字段名不靠拼字符串）。

## 系列文章

- 上一篇：[03 · Service 分层与数据访问](/posts/springboot-crud-03-service-and-data/)
- 面试速查：[05 · 面试速查与易错点](/posts/springboot-crud-05-interview-cheatsheet/)
