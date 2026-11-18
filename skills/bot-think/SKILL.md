---
name: bot-think
order: 1
stage: 1. 构思与澄清
description: "Idea sharpening and architecture framing: batch grill-me clarification, premise challenge, 2-3 alternatives, and ADR/glossary grounding. Use for: brainstorm, clarify requirements, bot think."
---

# /bot-think — 构思、前提挑战与批量澄清

目标：在动一行代码前，先把问题定义、边界假设与 2–3 条备选路线对齐，产物是一份精简设计稿或 ADR 结论（**严禁在本阶段写业务代码**）。

{{PREAMBLE}}

## 执行步骤

1. **先读上下文再提问**：快速扫描项目入口文档（`AGENTS.md` / `CLAUDE.md`）、领域术语表与现有 `docs/adr/`，不问仓库里已经写明的事实。
2. **前提挑战（Premise Challenge）**：
   - 这是不是正确的问题？如果什么都不做会怎样？
   - 仓库现有代码、标准库或既有工具是否已经解决了一部分？
3. **批量澄清（`grill-me` 风格）**：
   - 把所有未决取舍、边界条件与范围问题**合并成一组结构化问题**一次抛出，每个问题给出默认推荐选项与理由，快速收敛到无歧义状态。
4. **Two-Shapes / 备选方案对比**：
   - 至少给出 **2 个结构有本质差异的方案**（如“最小可行” vs “更深接口封装”），标明工作量、风险、改动文件规模与推荐理由。
   - **硬闸门 #1（重大决策）**：停下来由用户拍板选定方案，再进入 `/bot-plan` 或落盘设计文档。
5. **沉淀落盘**：若形成架构或术语共识，顺手更新 ADR 或设计文档（不留聊天垃圾）。

{{STAGE_RULES}}
