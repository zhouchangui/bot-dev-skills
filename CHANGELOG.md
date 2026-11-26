# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added / Changed
- **收紧 6 项代码修改质量防线（`preamble.md`、`bot-auto`、`bot-plan`、`bot-build`、`bot-review`、`bot-verify`、`bot-ship`）**：① 封堵双层类型强转逃逸（`as unknown as T` / `@ts-ignore`）与掩盖契约断裂的假默认值投毒（`?? 0` / `?? []`）；② 跨层生产/消费同步改动强制包含至少 1 条无 Mock 真实往返契约测试（Round-trip Test）；③ `/bot-review` 抓到的 P0 逻辑缺陷升级为 `Test-Lock then Fix`（先补失败回归测试再修代码，后补单测须反转分支证伪）；④ `/bot-plan` 与 `/bot-review` 增设热路径复杂度与 N+1 / `O(N²)` / 全量同步读入审查；⑤ 收敛环第 2 轮起启用最小爆炸半径（Surgical Fix）与轮间增量 Diff 次生回归复审；⑥ `/bot-verify` 新增零新增告警与脏文件/调试残留净空核对（Zero Net-New Warnings & Diff Hygiene）。
- **蒸馏融合 `Modern Web Guidance` 现代原生 Web 工程原则（`ui-craft.md` 及 Web 相关阶段）**：在不引入外部 CLI 依赖与遥测的前提下，向 `ui-craft.md` 第 5 节及 `bot-plan`/`bot-build`/`bot-review`/`bot-verify` 内聚注入 Baseline 兼容基线与渐进增强分流（保留存量 `@supports` 安全降级防误删）、原生 `<dialog>` + `showModal()` / `popover` + Anchor Positioning 替代手写点击穿透监听、中文/CJK 输入法 `e.isComposing || e.keyCode === 229` 回车提交守卫、`:user-invalid` 交互后校验、`field-sizing: content` / `interpolate-size` / `@container` / `:has()` / `light-dark()` 替代历史 JS/CSS Hack，以及 LCP `fetchpriority="high"`、CLS/INP 与外链 SRI / Sanitizer 安全护栏。
- **新增模板版本指纹与多仓漂移巡检（`lib/compiler.mjs`、`scripts/install.mjs`）**：基于原生 `node:crypto` 计算模板与宿主配置指纹（`computeSourceVersion`），新增零磁盘写入的 `checkSkills` 与 `install.mjs --check`（支持多 `--target` 批量巡检、自动识别已装宿主并跳过外部目录软链与受保护路径）。
- **补齐流水线实战容错与双模式 UI 分流（`templates/bot-*`、`templates/ui-craft.md`）**：为 `/bot-auto` 增加断点续跑嗅探（Resume First）、M 级账本落盘、L 级 `Touched Paths` 并发隔离条件与单装降级兜底；为 `/bot-review` 冷视角子代理开放代码库只读检索及 `AGENTS.md`/`DESIGN.md` 读取权限；将 `One-way door` 不可逆变更识别与回滚方案前移至 `/bot-plan`；在 `ui-craft.md` 拆出 `Mode A: Marketing / Persuade` 与 `Mode B: App / Workbench` 双模式基准。
- **原生支持 `skills.sh`（`npx skills add zhouchangui/bot-dev-skills`）一键安装**：将原始模板迁移至 `templates/`（`SKILL.tmpl.md` 防误扫描），新增 `npm run build:skills`（`scripts/build-skills.mjs`）编译生成零占位符、自包含 `references/ui-craft.md` 与便携路径（`../<skill>/SKILL.md`）的标准 `skills/` 分发目录，并在单测中强制校验 `templates/` ↔ `skills/` 字节级一致性；同步更新 `README.md` 与安装说明。
- **内嵌第一性原理功能必要性审查（`/bot-think`、`/bot-auto`、`/bot-plan`、`/bot-review`）**：把 `/bot-think` 前提挑战升级为“剥离表层方案还原根目标 + 减法四问 + Must-Have/Cut List 拆刀 + 存疑时强制保留 `Option 0（不做/删改/零代码替代）`”，在 `/bot-auto` 中要求 S 级新增功能/入口/开关也必须先过 30 秒必要性速审，并在 `docs/designs/`、`spec.md` 与 `/bot-review` 的 `Scope Creep` 审计间贯通 `Necessity / Why` 与 `Out of Scope (Cut List)`。
- **升级 `/bot-auto` 与 `/bot-review` 为有界“验证 ⇄ 审查 ⇄ 修复”质量收敛闭环**：新增显式目标验收矩阵（`AC-1..N`）、`P0/P1/P2` 严重级分流（P0 必修、P1 预算内主动质量抬升、P2 只记不改）、反作弊红线（禁删测/弱化断言）、独立冷视角审查（支持子代理宿主对 M/L 级默认派干净上下文独立子代理，单代理宿主优雅降级）、自适应轮次预算（`S ≤ 2 / M·L ≤ 3`，深度打磨口令可放宽至 `≤ 5`）+ 双熔断 + 硬退出门槛，并为 L 级多切片任务启用“切片内测 + 全局收敛外环”与账本落盘。
- **优化批量澄清交互分流（`skills/preamble.md`、`skills/bot-think/SKILL.md` 与各宿主 `toolNotes`）**：明确“业务问清楚优先”，≤ 4 个独立选择题使用宿主交互式多选工具，超 4 题或以开放性业务问题为主时切换为正文分组编号清单（附默认推荐）并等待回复，避免受单次 4 题上限截断业务澄清。
- **全局家目录安装路径适配与跨目录软链防误写（`lib/compiler.mjs`）**：当 `--target` 解析为用户家目录（`~`）时，自动为阶段路径与 `ui-craft.md` 参考路径添加 `~/` 前缀（同时继续硬拦截 `~/.dsh`）；并在写入前拦截经由软链逃逸出 `targetDir` 的输出路径，防止单仓安装误覆写全局 `~/.agents/skills`。
- **新增 `/bot-auto` 全流程自动编排入口（升级为 `9 + 1` 体系）**：按任务规模（S/M/L）自动串行/跳过各阶段，只在三道硬闸门停顿确认，并按宿主注入精确阶段路径（`{{STAGE_PATH_PATTERN}}`）。
- **增强 `/bot-build` 三路径实现分流**：区分“规则/接口/脚本（接缝 TDD）”、“陌生探索 Spike（先探后锁）”与“前端 UI 视觉（状态与展示分离）”，兼顾质量与开发心流。
- **内嵌 UI 与交互设计检查（零额外命令、仅在涉及界面时强制激活）**：在 `/bot-think`、`/bot-plan`、`/bot-build`、`/bot-review`（维度 D）、`/bot-verify` 与 `/bot-auto` 中加入 `DESIGN.md` 首次建档/反推（第一眼记忆点、场景明暗、角色字体、可选静态 HTML 预览板）、五态补齐（空/加载/错/溢出/首用）、反套路视觉红线（禁卡片套卡片/三栏图标网格等）及响应式/可达性检查。
- **新增按需加载设计工艺参考（`skills/ui-craft.md` → 各宿主 `bot-auto/references/ui-craft.md`）**：提炼反 AI 默认皮肤清单、官网 Persuade 首屏三要素与真实材质纪律、中文/英文微排版（`-0.02em`、`65ch`、`tabular-nums`、同心圆角、tinted gray 与彩底禁灰字）、确定性物理动效（`cubic-bezier(0.23,1,0.32,1)`、`:active scale(0.97)`、触发点 `transform-origin`、每容器单次入场、高频零延迟、GPU/fixed-only blur）以及 Skeleton Test + `提纯/降噪/强化/打磨` 精准调校动词，并与 `{{UI_CRAFT_PATH}}` 占位符联动注入 `bot-think`/`bot-plan`/`bot-build`/`bot-review`/`bot-auto`（纯后端任务零读取开销）。

## [0.1.0] - 2026-11-18

### Added
- **8 + 1 独立自包含研发流水线**：`/bot-think`、`/bot-plan`、`/bot-build`、`/bot-debug`、`/bot-review`、`/bot-verify`、`/bot-ship`、`/bot-retro` 与 DSH 单路由入口 `bot`。
- **共享流控与极简底座（`skills/preamble.md`）**：批量结构化提问、三道硬暂停闸门（重大决策 / 建分支与 worktree / 发布与合并）与极简编码三铁律（复用阶梯 / Rule of Three / 零纯转发）。
- **纯 Node.js（`>=22`）多宿主编译器与 CLI 安装器（`lib/compiler.mjs`、`scripts/install.mjs`）**：零第三方依赖，支持 `dsh`、`agents`（Antigravity / Codex）与 `claude` 三端投递及 `--dry-run`、`--claude-copy`。
- **项目级覆写支持（`.bot-skills.json`）**：支持注入工单目录、检查/验收命令、全局及分阶段项目规则。
- **安全与隔离护栏**：受保护系统实例路径硬拦截（含软链解析与 git worktree `info/exclude` 适配）、`.claude/skills` 目录软链防覆写保护、既有非 `bot-*` 技能零触碰以及 `description <= 1024` 字符校验。
- **自动化测试套件（`tests/install.test.mjs`）**：覆盖编译路由一致性、跨宿主输出、安全守卫、空目录/worktree 适配以及零外部技能名泄露检查（8 项全通过）。
