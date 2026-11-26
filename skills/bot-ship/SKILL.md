---
name: bot-ship
description: "Ship workflow: sync base branch, re-run full verification, update CHANGELOG and affected docs, write evidence-backed PR, and ask approval before push/merge/deploy. Use for: ship it, create pr, merge release, bot ship."
---

# /bot-ship — 同步、文档收口与受控交付

目标：确保代码、测试、文档与变更日志同步，在所有外部副作用前严格过闸门。

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

## 执行步骤

1. **前置净空确认与基线同步**：
   - 确认 `/bot-review`（含 `Test-Lock` 与外科手术修复）后已在最新代码上跑通 `/bot-verify`（项目 typecheck/test 全绿 + 零新增告警与脏文件）；
   - **特性分支 / PR 模式**：同步最新主干基线，解冲突后重跑 `/bot-verify`；**本地单仓模式**：核对 `git status` 与 commit 范围即可。
2. **文档与台账同步**：更新受影响 README / 架构文档 / `CHANGELOG.md`（仅写真实可见变化）；超范围改进记入延后待办或 项目 `.scratch/` 或 issue tracker，不硬塞当前提交。
3. **证据驱动交付摘要**：简述动机与范围、附最小实测证据（命令/计数/净空/Before-After），并复核 `Two-way` 或 `One-way door`（后者附兼容迁移与回滚验证结论）。
4. **硬闸门 #3**：`git push`、建/合 PR、发版构建或上线前，必暂停展示目标分支、摘要与命令，获确认后再执行。
