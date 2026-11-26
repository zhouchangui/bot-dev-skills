---
name: bot-ship
order: 7
stage: 7. 交付与发布
description: "Ship workflow: sync base branch, re-run full verification, update CHANGELOG and affected docs, write evidence-backed PR, and ask approval before push/merge/deploy. Use for: ship it, create pr, merge release, bot ship."
---

# /bot-ship — 同步、文档收口与受控交付

目标：把已验证的改动平稳交付，确保代码、测试、文档与变更日志同步，并在任何外部副作用前严格过闸门。

{{PREAMBLE}}

## 执行步骤

1. **前置确认与基线同步**：
   - **必须确认 `/bot-review`（含其 Fix-First 修改）之后已在最新代码上跑通 `/bot-verify`**（{{CHECK_COMMAND_HINT}} 全绿）。
   - **双模式分支适配**：
     - **特性分支 / PR 模式**（有远端且当前在特性分支）：同步/合入最新主干基线，有冲突立即解决并重跑 `/bot-verify`。
     - **本地单仓 / 无 PR 模式**（无远端或直接在允许直提的本地主干）：核对 `git status` 与 commit 范围即可，不强行切分支建 PR。
2. **文档与台账同步**：
   - 更新受影响模块 README / 架构文档 / `CHANGELOG.md`（若存在，仅记录真实用户可见或接口变化，不写虚构条目）。
   - 若顺手发现超出当前范围的改进点，记入项目延后待办账本（若存在，如独立待办文件或 {{TRACKER_HINT}}），不硬塞进当前提交。
3. **证据驱动交付摘要**：
   - 简述改动动机与范围；
   - 附上最小实测输出摘要（命令输出、Before/After 对比）；
   - 复核 `/bot-plan` 标定的 **Two-way door（可逆）** 或 **One-way door（不可逆/迁移/破坏性变更）**：若属 `One-way door`，明确附上兼容迁移与回滚验证结论。
4. **硬闸门 #3（发布与合并必须询问）**：
   - 在执行 `git push`、创建/合并 PR、触发发版打包或部署上线前，**必须暂停并向用户明确展示目标分支、提交摘要与命令，获得确认后再执行**。

{{STAGE_RULES}}
