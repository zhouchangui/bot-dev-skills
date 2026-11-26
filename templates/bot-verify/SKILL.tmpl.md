---
name: bot-verify
order: 6
stage: 6. 校验与安全门禁
description: "Verification gate before shipping: run project check/test/smoke commands, security sanity check on auth/data diffs, and enforce project test boundaries. Use for: verify changes, run checks, security check, bot verify."
---

# /bot-verify — 确定性验证与安全门禁

目标：用**最后一次改代码后的真实命令输出、跨层契约实测与零新增告警净空证据**证明可安全交付。

{{PREAMBLE}}

## 执行清单

1. **基线检查与影响面端到端验收**：
   - **全仓基线（必跑）**：跑 {{CHECK_COMMAND_HINT}}；未配置时自动识别 `package.json` / `pyproject.toml` / `Cargo.toml` / `go.mod` / `Makefile` 中的 check/test 命令实跑，均无则如实汇报 `未配置检查命令`。
   - **端到端验收**：涉及前端/客户端/服务端/运行态/构建脚本时执行 {{VERIFY_COMMAND_HINT}}（Web UI 须按项目允许入口实测视觉、交互五态、顶层焦点/`Esc`、中文 IME 回车守卫、`prefers-reduced-motion` 与零 CLS，严禁越过环境禁令）；纯文档/无关子模块可跳过并说明原因。
2. **变更敏感面安全自检（涉鉴权/支付/网络/文件/外部输入/Web DOM）**：
   - 无硬编码密钥且不进日志/报错/URL；鉴权 Fail-Closed + 服务端二次校验归属权；
   - SQL/Shell 参数化、不可信 HTML 经 Sanitizer/Trusted Types（禁裸 `innerHTML`）、外链 CDN 带 SRI、`path.resolve`/`realpathSync` 防穿越、防 SSRF、外部请求设超时与非 2xx 处理。
3. **测试真伪与跨层往返核对**：确认新测试保护公开边界与失败路径（反转分支必红，非 smoke-only），且跨层契约改动含至少 1 条无 Mock 真实往返测试。
4. **零新增噪音与工作区净空（Zero Net-New Warnings & Diff Hygiene）**：退出码 `0` 仍须核查无新增 `Warning / Deprecation / UnhandledRejection / console.error`；对照 `git status` / `git diff` 确认无调试打印、Spike 临时文件或孤儿/死文件。
5. **证据格式**：如实列明**实际命令 + 通过/失败/跳过计数 + 新增告警与净空结论 + 未覆盖项与原因**，禁用旧截图或记忆替代实测。

{{STAGE_RULES}}
