---
name: bot-ship
order: 7
stage: 7. 交付与发布
description: "Ship workflow: sync base branch, re-run full verification, update CHANGELOG and affected docs, write evidence-backed PR, and ask approval before push/merge/deploy. Use for: ship it, create pr, merge release, bot ship."
---

# /bot-ship — 同步、文档收口与受控交付

目标：把已验证的分支平稳送上主干/PR，确保代码、测试、文档与变更日志同步，并在任何外部副作用前严格过闸门。

{{PREAMBLE}}

## 执行步骤

1. **前置确认与主干同步**：
   - 检查工作区干净度与最新基线（如拉取或合并最新主干），若出现冲突立即停下解决并重新验证。
   - **必须先确认 `/bot-review` 与 `/bot-verify` 已在最新内容上跑通**（{{CHECK_COMMAND_HINT}} 全绿）。
2. **文档与台账同步（`/document-release` 精神）**：
   - 更新受影响模块 README / 架构文档 / `CHANGELOG.md`（仅记录真实用户可见或接口变化，不写虚构条目）。
   - 如本次顺手发现超出当前 PR 范围的改进点，记入项目待办/延后账本（如 `TODOS.md` 或工单状态），不硬塞进当前提交。
3. **证据驱动 PR 摘要**：
   - 简述改动动机与范围；
   - 附上最小可视化/输出证据（命令输出摘要、Before/After 对比）；
   - 明确标出本次属于 **Two-way door（可逆）** 还是 **One-way door（不可逆/迁移/破环性变更）**。
4. **硬闸门 #3（发布与合并必须询问）**：
   - 在执行 `git push`、创建/合并 PR、触发发版打包或部署上线前，**必须暂停并向用户明确展示目标分支、提交摘要与命令，获得确认后再执行**。

{{STAGE_RULES}}
