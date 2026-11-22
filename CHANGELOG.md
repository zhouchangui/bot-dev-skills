# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added / Changed
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
