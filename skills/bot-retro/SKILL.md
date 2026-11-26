---
name: bot-retro
description: "Session retrospective: convert recurring agent mistakes into deterministic checks (linters/hooks/tests), prune bloat from AGENTS/steering docs, and evolve bot-dev-skills templates. Use for: retrospective, improve workflow, bot retro."
---

# /bot-retro — 复盘沉淀与工具链进化

目标：不踩同一个坑第二次。复盘对象是 **Agent 工作环境、规则与 `bot-dev-skills` 模板本身**。

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

## 复盘四问

1. **机械化检查（Deterministic > Prompt）**：本次哪些“提示词叮嘱过仍踩坑”的机械错误（导入边界、命名、同构漂移、体积膨胀）可沉成 linter、hook 或自动化测试？优先写校验代码，不往入口文档堆字。
2. **上下文瘦身与导航修复**：找文件/命令走了哪些弯路？能否在入口加一行指针替代长段正文，并清掉已失效废话指令（No-ops）？
3. **极简与反退化自省**：编码/审查中是否仍出现浅模块、早熟抽象、类型逃逸或假默认值？哪一阶段门禁不够硬？
4. **分级输出与反哺**：按 `必落确定性检查 > 更新项目指针 > 反哺 bot-dev-skills 模板源` 排序，确认后执行或记录。
