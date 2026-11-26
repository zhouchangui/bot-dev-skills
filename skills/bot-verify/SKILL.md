---
name: bot-verify
description: "Verification gate before shipping: run project check/test/smoke commands, security sanity check on auth/data diffs, and enforce project test boundaries. Use for: verify changes, run checks, security check, bot verify."
---

# /bot-verify — 确定性验证与安全门禁

目标：用**最后一次改代码后的真实命令输出、跨层契约实测与零新增告警净空证据**证明可安全交付。

## 通用流控与极简铁律

1. **澄清全正文，闸门可点选**：每题附默认推荐与理由，按**交互性质**分流：
   - **需求澄清与多轮追问（不限阶段/题数）**：一律用**正文分组编号清单**（`❓ Qn` + `➡️ 推荐`，支持回“全默认，仅改第 N 题”），输出后**立即停下等回复**，**严禁调用交互式提问弹窗**，严禁自问自答或代拍板；
   - **仅三道硬闸门与最终方案拍板**：这类 1–2 项离散确认点可用宿主交互多选工具（无工具则用正文）。
2. **三道硬暂停闸门（未获明确同意严禁执行）**：
   - **重大决策**：架构路线、公开契约/Schema、不可逆 `One-way door`、删核心范围、新依赖；
   - **建分支 / worktree**：`git checkout -b` / `git switch -c` / `git worktree add` 前确认分支名与基线；
   - **发布与合并**：`git push`、建/合 PR、发版构建或上线前。
   其余探索、测试、局部重构与修 bug 连续推进。
3. **极简与反退化四铁律**：
   - **复用阶梯**：`仓库既有 helper/模式 → 语言标准库 → 平台原生特性 → 已安装依赖`，高位能解即止步，禁擅加新包；
   - **三次法则（Rule of Three）**：同一逻辑 `< 3` 次且无第二真实调用方时不抽工厂/策略/包装层；
   - **零纯转发**：禁写透传参数的 Middle Man 与不可能状态的冗余兜底；
   - **反静默退化**：边界入参显式窄化，内部不变量损坏 Fail-Fast；**禁类型逃逸（`as any` / `as unknown as T` / `@ts-ignore` / `# type: ignore`）与假默认值投毒（`?? 0` / `?? ''` / `?? []` 掩盖契约断裂）**。
4. **宿主工具**：采用宿主中立表达：读取/编辑文件、执行终端命令、代码库检索；交互式多选工具仅用于硬闸门与最终方案拍板，所有需求澄清与追问一律正文输出。

## 执行清单

1. **基线检查与影响面端到端验收**：
   - **全仓基线（必跑）**：跑 项目 typecheck/test；未配置时自动识别 `package.json` / `pyproject.toml` / `Cargo.toml` / `go.mod` / `Makefile` 中的 check/test 命令实跑，均无则如实汇报 `未配置检查命令`。
   - **端到端验收**：涉及前端/客户端/服务端/运行态/构建脚本时执行 项目集成/冒烟验证（Web UI 须按项目允许入口实测视觉、交互五态、顶层焦点/`Esc`、中文 IME 回车守卫、`prefers-reduced-motion` 与零 CLS，严禁越过环境禁令）；纯文档/无关子模块可跳过并说明原因。
2. **变更敏感面安全自检（涉鉴权/支付/网络/文件/外部输入/Web DOM）**：
   - 无硬编码密钥且不进日志/报错/URL；鉴权 Fail-Closed + 服务端二次校验归属权；
   - SQL/Shell 参数化、不可信 HTML 经 Sanitizer/Trusted Types（禁裸 `innerHTML`）、外链 CDN 带 SRI、`path.resolve`/`realpathSync` 防穿越、防 SSRF、外部请求设超时与非 2xx 处理。
3. **测试真伪与跨层往返核对**：确认新测试保护公开边界与失败路径（反转分支必红，非 smoke-only），且跨层契约改动含至少 1 条无 Mock 真实往返测试。
4. **零新增噪音与工作区净空（Zero Net-New Warnings & Diff Hygiene）**：退出码 `0` 仍须核查无新增 `Warning / Deprecation / UnhandledRejection / console.error`；对照 `git status` / `git diff` 确认无调试打印、Spike 临时文件或孤儿/死文件。
5. **证据格式**：如实列明**实际命令 + 通过/失败/跳过计数 + 新增告警与净空结论 + 未覆盖项与原因**，禁用旧截图或记忆替代实测。
