---
name: bot-verify
order: 6
stage: 6. 校验与安全门禁
description: "Verification gate before shipping: run project check/test/smoke commands, security sanity check on auth/data diffs, and enforce project test boundaries. Use for: verify changes, run checks, security check, bot verify."
---

# /bot-verify — 确定性验证与安全门禁

目标：用**真实命令输出与实测证据**证明改动可安全交付；没有经过最新代码实跑的检查，一律不得宣称通过。

{{PREAMBLE}}

## 执行清单

1. **项目级检查（必跑）**：
   - 执行类型检查与测试套件（{{CHECK_COMMAND_HINT}}）。
   - 执行项目集成/冒烟/本地应用验证（{{VERIFY_COMMAND_HINT}}）。
2. **变更敏感面安全自检（若涉及鉴权/支付/网络/文件/外部输入）**：
   - 硬编码密钥与敏感路径脱敏；
   - 认证与鉴权边界（Fail-Closed，默认拒绝而非放行）；
   - 输入校验与路径规范化（`path.resolve` / `realpathSync` 防目录穿越）；
   - 外部请求超时与异常状态码处理。
3. **测试质量反虚胖核对**：
   - 检查新增测试是否真正保护了公开边界行为与失败路径，而非只测“不报错（smoke-only）”或复制实现逻辑。
4. **证据输出格式**：
   - 必须如实列出：**实际跑了什么命令 + 通过/失败/跳过计数 + 未覆盖项与原因**。任何跳过或未跑的环节必须标明，禁止用旧截图或记忆代替实测。

{{STAGE_RULES}}
