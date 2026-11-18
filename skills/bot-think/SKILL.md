---
name: bot-think
order: 1
stage: 1. 构思与澄清
description: "Idea sharpening and architecture framing: batched clarification, premise challenge, 2-3 structural alternatives, and ADR/glossary/DESIGN.md grounding. Use for: brainstorm, clarify requirements, bot think."
---

# /bot-think — 构思、前提挑战与批量澄清

目标：在动一行代码前，先把问题定义、边界假设、视觉基调（若含界面）与 2–3 条备选路线对齐，产物是一份精简设计稿或 ADR 结论（**严禁在本阶段写业务代码**）。

{{PREAMBLE}}

## 执行步骤

1. **先读上下文再提问**：快速扫描项目入口文档（`AGENTS.md` / `CLAUDE.md`）、领域术语表（如 `CONTEXT.md` / `GLOSSARY.md`）、`DESIGN.md`（若含界面）与现有 `docs/adr/`，不问仓库里已经写明的事实。
2. **前提挑战（Premise Challenge）**：
   - 这是不是正确的问题？如果什么都不做会怎样？
   - 仓库现有代码、标准库或既有工具是否已经解决了一部分？
3. **结构化批量澄清（含首次 UI 建档）**：
   - 把所有未决取舍、边界条件与范围问题**合并成一组结构化问题**一次抛出，每个问题给出默认推荐选项与理由，快速收敛到无歧义状态。
   - **若需求涉及界面且仓库尚无 `DESIGN.md`**：
     - 已有前端代码/样式变量时，先从现有样式自动提炼精简版 `DESIGN.md` 草案（视觉气质 + 色彩 Tokens + 字阶间距 + 组件边界），随本轮一并确认；
     - 全新空白项目时，在批量澄清里给出 2–3 套视觉基调与色板/字阶候选供选（或由用户明确跳过全局建档、退回单需求 `spec.md` 内约定基准）。
4. **多形态备选方案对比**：
   - 至少给出 **2 个结构有本质差异的方案**（如“最小可行” vs “更深接口封装”），标明工作量、风险、改动文件规模与推荐理由。
   - **硬闸门 #1（重大决策）**：停下来由用户拍板选定方案，再进入 `/bot-plan` 或落盘设计文档。
5. **独立落盘模板**：
   - 设计稿默认写到 `docs/designs/<feature>.md`（或项目约定的规格目录）；若拍板了新项目/反推的 `DESIGN.md`，同步落盘到仓库根目录 `DESIGN.md`；若形成不可逆架构决策，顺手写一份精简 ADR 到 `docs/adr/<NNNN>-<slug>.md`（`Context` → `Decision` → `Consequences`）。

{{STAGE_RULES}}
