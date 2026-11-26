---
name: bot-ship
order: 7
stage: 7. 交付与发布
description: "Ship workflow: sync base branch, re-run full verification, update CHANGELOG and affected docs, write evidence-backed PR, and ask approval before push/merge/deploy. Use for: ship it, create pr, merge release, bot ship."
---

# /bot-ship — 同步、文档收口与受控交付

目标：确保代码、测试、文档与变更日志同步，在所有外部副作用前严格过闸门。

{{PREAMBLE}}

## 执行步骤

1. **前置净空确认与基线同步**：
   - 确认 `/bot-review`（含 `Test-Lock` 与外科手术修复）后已在最新代码上跑通 `/bot-verify`（{{CHECK_COMMAND_HINT}} 全绿 + 零新增告警与脏文件）；
   - **特性分支 / PR 模式**：同步最新主干基线，解冲突后重跑 `/bot-verify`；**本地单仓模式**：核对 `git status` 与 commit 范围即可。
2. **文档与台账同步**：更新受影响 README / 架构文档 / `CHANGELOG.md`（仅写真实可见变化）；超范围改进记入延后待办或 {{TRACKER_HINT}}，不硬塞当前提交。
3. **证据驱动交付摘要**：简述动机与范围、附最小实测证据（命令/计数/净空/Before-After），并复核 `Two-way` 或 `One-way door`（后者附兼容迁移与回滚验证结论）。
4. **硬闸门 #3**：`git push`、建/合 PR、发版构建或上线前，必暂停展示目标分支、摘要与命令，获确认后再执行。

{{STAGE_RULES}}
