---
name: bot-auto
description: "End-to-end automated pipeline driver: orchestrates bot-think → bot-plan → bot-build/debug → bounded verify/review/fix convergence loop → bot-ship, ensuring complete goal delivery and self-elevated quality while stopping only at the 3 Hard Gates. Use for: full auto flow, run full pipeline, auto review fix loop, bot auto."
---

# /bot-auto — 全流程自动编排入口

目标：一次触发即串起完整研发流水线，靠**有界 `Verify ⇄ Review ⇄ Fix` 收敛闭环**确保目标闭环与质量自抬升，只在 `/bot-think` 决策树追问、熔断与三道硬闸门处停顿。

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

## 断点嗅探、定级与跳步

0. **断点续跑嗅探（Resume First）**：开工前检查规格目录（项目 `.scratch/` 或 issue tracker）与 `git status` 是否有未完结的 `spec.md`、`issues/` 或收敛账本；若有，对齐进度直接从上次断点续跑，禁失忆重跑。
1. **10 秒定级并推进**（不问用户）：
   - **S 级（明确修复 / 纯文档或配置 / 单模块小改）**：确定性 bug、纯文档或纯配置可跳过 `think`/`plan`；凡涉及**新增功能、新入口、新开关或新模块**，开工前必过 30 秒**第一性原理必要性速审**（根目标 + 能否删改/零代码替代 + `Option 0`，存疑走硬闸门 #1）；涉及界面则同步按需读 `references/ui-craft.md`。流程：`/bot-build`（或 `/bot-debug`）→ **收敛闭环（≤ 2 轮）** → `/bot-ship`。
   - **M 级（标准新功能 / 跨文件改动 / 重构）**：`/bot-think` → `/bot-plan` → `/bot-build` → **收敛闭环（≤ 3 轮）** → `/bot-ship`，并将 `AC-1..N` 与收敛账本落盘到 项目 `.scratch/` 或 issue tracker。
   - **L 级（>3 个独立切片）**：先完成 `/bot-think` 与 `/bot-plan` 落盘全部切片、`Touched Paths` 与 `Blocked by`；进 `/bot-build` 前询问串行还是并行（**仅当 `Touched Paths` 无交集或采用独立 `git worktree` 隔离才允许并行**；触碰公共 Schema/路由/共享类型一律串行）。每片先跑局部测试与极简自检（内环），合拢后跑全局**收敛闭环（≤ 3 轮，外环）**，全程落盘 项目 `.scratch/` 或 issue tracker。

## 质量收敛闭环（Verify ⇄ Review ⇄ Fix）

```text
/bot-build ──▶ /bot-verify ──(红灯/报错)──▶ /bot-debug（单点根因 + 回归锁定）──┐
                    │ (全绿 + 零新增告警)                                      │
                    ▼                                                          │
              /bot-review（冷视角：验收矩阵 + A/B/C/D + P0/P1/P2 分级）        │
                    │                                                          │
                    ├─ 触及架构/契约/新依赖/范围变更 ──▶ 停在【硬闸门 #1】     │
                    ├─ 命中熔断（达上限 / 连续2轮未收敛）──▶ 停下交用户裁决    │
                    ├─ 仍有 P0 或预算内可修 P1 ──▶ Test-Lock + 外科手术修复 ───┘
                    └─ 满足全部退出条件 ──▶ 放行 /bot-ship【硬闸门 #3】
```

1. **目标验收矩阵（`AC-1..N`）**：从需求、`spec.md` 与 `DESIGN.md` 抽出逐条验收项；每轮核对“代码实现 + 最新实测证据”，缺项或无实证直接判 **P0**。
2. **先净空验证，再冷视角审查**：先跑 `/bot-verify`（红灯走 `/bot-debug` 根因修复）；全绿后跑 `/bot-review`（M/L 级在支持子代理的宿主默认派干净上下文只读子代理，传入全量 diff、轮间增量 Diff、验收矩阵与 verify 输出）。
3. **分级修复、先锁测试与最小半径**：
   - **P0（阻断）**：必修；逻辑/边界缺陷一律 **`Test-Lock then Fix`**（先补修复前报红的回归测试再改代码）；
   - **P1（质量提升）**：清完 P0 后若预算有余，主动跑 1 轮精准质量抬升；
   - **P2（锦上添花）**：只记入交付说明/待办，不开新轮；
   - **轮间最小爆炸半径（Surgical Fix Budget）**：第 2 轮起只改被点名处，禁顺手重构无关代码，复审优先查本轮增量 Diff 的次生回归；严禁删测、弱断言、`skip`、空 `catch` 或违背反静默退化铁律换绿灯。
4. **预算、账本与双熔断**：默认 **S 级 ≤ 2 轮、M/L 级 ≤ 3 轮**（用户要求“深度打磨”放宽至 **≤ 5 轮**）；每轮输出 1 行账本 `Round k/N | 验收 X/Y | Verify: PASS/FAIL | P0:a P1:b P2:c | 动作: fix/debug/stop`（M/L 级追加落盘）。达上限或**连续 2 轮同类反复 / `P0+P1` 不降反升**立即**双熔断**交用户拍板。
5. **硬退出门槛（Exit Gate）**：① 验收矩阵 100% 闭环；② 零 P0 且预算内可自主解决的 P1 已清零；③ 最后一次改代码后跑通全新、全绿且净空的 `/bot-verify` —— 三者齐备方放行 `/bot-ship`。

## 编排执行铁律

1. **按需读阶段与单装兜底**：进下一阶段前直读 `../<skill>/SKILL.md`（`../` 相对本 `SKILL.md` 目录，其余相对项目根或 `~`）；若仅单装 `bot-auto` 致阶段文件缺失，按本编排器内置门禁与收敛环直接执行，不报错中断。
2. **UI 影响面强制激活**：凡涉页面、官网、组件、样式或前端交互，按需直读 `references/ui-craft.md`（`references/` 相对本 `SKILL.md` 目录）并激活各阶段 UI/现代原生 Web 门禁；纯后端/CLI 跳过，零额外开销。
3. **不重问已决问题**：`/bot-think` 敲定的结论完整透传至下游，禁失忆重问。
4. **统一守三道硬闸门**：**#1 重大决策**（`/bot-think` 拍板或后续发现未预见的跨模块/Schema/`One-way door`/新依赖/范围变更）；**#2 建分支/worktree**（`/bot-build` 动代码前，明确直改当前分支则跳过）；**#3 发布与合并**（达 Exit Gate 后在 `/bot-ship` 推送/建合 PR/部署前展示证据与账本）。
5. **轻量复盘提示**：交付后仅当出现值得沉成 linter/hook/测试的重复坑时，附一句询问是否跑 `/bot-retro`。
