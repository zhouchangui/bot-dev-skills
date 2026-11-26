---
name: bot-verify
order: 6
stage: 6. 校验与安全门禁
description: "Verification gate before shipping: run project check/test/smoke commands, security sanity check on auth/data diffs, and enforce project test boundaries. Use for: verify changes, run checks, security check, bot verify."
---

# /bot-verify — 确定性验证与安全门禁

目标：用**真实命令输出、跨层契约实测与零新增告警净空证据**证明改动可安全交付；没有在最后一次代码修改后实跑的检查，一律不得宣称通过。

{{PREAMBLE}}

## 执行清单

1. **项目级检查与真实运行验收**：
   - **全仓基线检查（必跑）**：执行类型检查与测试套件（{{CHECK_COMMAND_HINT}}）；若未显式配置，自动识别 `package.json` / `pyproject.toml` / `Cargo.toml` / `go.mod` / `Makefile` 中的 check/test 命令实跑，均无则如实汇报 `未配置检查命令`。
   - **按变更影响面触发端到端验收**：若改动涉及前端界面 / 客户端 / 服务端 / 运行态 / 构建脚本，执行 {{VERIFY_COMMAND_HINT}}（涉及 Web UI 时按项目允许的真实运行入口核查视觉布局、交互五态、`<dialog>`/`popover` 焦点锁定与 `Esc` 关闭、中文 IME 回车防误触、`prefers-reduced-motion` 降级及零布局偏移 CLS，严禁越过项目环境禁令）；纯文档或无关子模块改动可跳过并在证据中写明原因，不拖慢心流。
2. **变更敏感面安全自检（若涉及鉴权/支付/网络/文件/外部输入/Web DOM）**：
   - **密钥与敏感信息**：无硬编码秘钥，且密钥/Token 不进日志、报错或 URL 查询参数；
   - **认证与鉴权边界**：Fail-Closed，默认拒绝而非放行，服务端二次校验归属权；
   - **注入、DOM 与子资源边界**：SQL/Shell 参数化、不可信 HTML 经 Sanitizer / Trusted Types 过滤（禁裸 `innerHTML`）、外链 CDN 资源具备 `integrity`（SRI）、路径 `path.resolve`/`realpathSync` 防穿越、防 SSRF（禁止未校验用户 URL 直连内网）；
   - **外部请求韧性**：显式超时与非 2xx 异常状态处理。
3. **测试真伪与跨层往返核对**：
   - 检查新增测试是否真正保护了公开边界行为与失败路径（反转关键分支会报红），而非只测“不报错（smoke-only）”或复制实现逻辑；
   - 核对跨层契约变更（前后端、序列化读写、CLI 参数）是否包含至少 1 条无 Mock 真实往返测试。
4. **零新增噪音与工作区净空核对（Zero Net-New Warnings & Diff Hygiene）**：
   - 即使退出码为 `0`，也必须检查命令输出是否新增了 `Warning / Deprecation / UnhandledRejection / console.error`；
   - 对照 `git status` 与 `git diff` 确认无遗留的调试打印（`console.log` / `debugger`）、Spike 临时文件、未纳入测试的孤儿新文件或重构遗留死文件。
5. **证据输出格式**：
   - 必须如实列出：**实际跑了什么命令 + 通过/失败/跳过计数 + 新增告警与工作区净空核对结论 + 未覆盖项与原因**。任何跳过或未跑的环节必须标明，禁止用旧截图或记忆代替实测。

{{STAGE_RULES}}
