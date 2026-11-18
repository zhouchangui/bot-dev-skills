---
name: bot-auto
order: 0
stage: 0. 全流程自动编排
description: "End-to-end automated pipeline driver: orchestrates bot-think → bot-plan → bot-build/debug → bot-review → bot-verify → bot-ship in one flow, stopping only at the 3 Hard Gates. Use for: full auto flow, run full pipeline, bot auto."
---

# /bot-auto — 全流程自动编排入口

目标：用户只需触发一次 `/bot-auto` 并描述需求，即由本编排器自动串起完整研发流水线，**只在大方向澄清与三道硬闸门处停下来交互**，中间阶段静音连续推进，直到交付验收。

{{PREAMBLE}}

## 任务定级与智能跳步（减少阻力）

先用 10 秒阅读相关文件并判断任务规模（不问用户，直接定级并按路径推进）：

* **S 级（小改 / 明确修复 / 单模块调参）**：
  - 跳过 `bot-think` 与 `bot-plan`（或在极简定位接缝后直接开工）。
  - 流程：`/bot-build`（或 `/bot-debug`）→ `/bot-review` → `/bot-verify` → `/bot-ship`。
* **M 级（标准新功能 / 跨文件改动 / 重构）**：
  - 完整流程：`/bot-think` → `/bot-plan` → `/bot-build` → `/bot-review` → `/bot-verify` → `/bot-ship`。
* **L 级（大型多切片任务，预计 >3 个独立切片）**：
  - 先跑通 `/bot-think` 与 `/bot-plan` 落盘全部切片与 `Blocked by` 依赖；在进入 `/bot-build` 前询问用户：按顺序逐片推进，还是支持子代理的宿主分派并行推进。

## 编排执行铁律

1. **按需读入阶段规范**：每次进入下一阶段时，用文件读取工具直接读取对应阶段文件（`{{STAGE_PATH_PATTERN}}`），严格执行其门禁与检查项，不要凭记忆跳步。
2. **不重复提问**：`/bot-think` 已经向用户确认过的问题与方案，自动带入 `/bot-plan` 与 `/bot-build`，严禁重复弹窗。
3. **只守三道硬闸门**：
   - **闸门 #1（重大决策）**：仅在 `/bot-think` 批量澄清+方案拍板时、或后续阶段发现未预见的跨模块/Schema/范围变更时停下来问。
   - **闸门 #2（建分支/worktree）**：在 `/bot-build` 动代码前，如需建分支或 worktree 必须先问确认；若用户明确要求直接在当前分支改则直接开工。
   - **闸门 #3（发布与合并）**：所有代码、`/bot-review`（Fix-First）与最终 `/bot-verify` 全绿收口后，在 `/bot-ship` 执行 `git push` / 创建或合并 PR / 部署前停下来展示证据与清单等用户拍板。
4. **Fix-First 自动闭环**：`/bot-review` 修完确定性小问题后，**自动触发一次新鲜的 `/bot-verify`**，全绿后再交 `/bot-ship` 过闸门 #3，无需用户手动来回点命令。
5. **复盘轻量收尾**：交付完成后，仅在本次确实暴露出“值得沉淀成 linter/hook/测试的重复坑”时，附带一句提示是否执行 `/bot-retro`；顺畅无坑时不打扰。

{{STAGE_RULES}}
