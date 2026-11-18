---
name: bot-think
order: 1
stage: 1. 构思与澄清
description: "Idea sharpening and architecture framing: batched clarification, premise challenge, 2-3 structural alternatives, and ADR/glossary/DESIGN.md grounding. Use for: brainstorm, clarify requirements, bot think."
---

# /bot-think — 构思、前提挑战与批量澄清

目标：在动一行代码前，先把问题定义、边界假设、视觉系统（若含新界面或改版）与 2–3 条备选路线对齐，产物是一份精简设计稿、`DESIGN.md` 或 ADR 结论（**严禁在本阶段写业务代码**）。

{{PREAMBLE}}

## 执行步骤

1. **先读上下文再提问**：快速扫描项目入口文档（`AGENTS.md` / `CLAUDE.md`）、领域术语表（如 `CONTEXT.md` / `GLOSSARY.md`）、`DESIGN.md`（若含界面）与现有 `docs/adr/`，不问仓库里已经写明的事实。
2. **前提挑战（Premise Challenge）**：
   - 这是不是正确的问题？如果什么都不做会怎样？
   - 仓库现有代码、标准库或既有工具是否已经解决了一部分？
3. **结构化批量澄清**：
   - 把所有未决取舍、边界条件与范围问题**合并成一组结构化问题**一次抛出，每个问题给出默认推荐选项与理由，快速收敛到无歧义状态。
4. **设计系统定调（仅当新建 `DESIGN.md` 或视觉改版时激活；日常增量或纯后端跳过）**：
   - **第一眼记忆点 & 场景明暗**：在澄清里问清“**用户第一次看到后最该记住哪一件事？**”，并按真实使用场景（谁、在哪里、什么光线）定明暗主题，不套行业刻板印象。
   - **已有代码反推 vs 从零提案**：已有前端代码时先从现有样式变量/主题配置提炼草案；0→1 新建时给出 **2–3 套有明显审美差距的方向**（气质定位 + 色板 Token + 角色字体 Display/Body-UI/Mono + 布局密度 + 1–2 个刻意与同类拉开差距的设计点）。
   - **视觉红线**：严禁卡片套卡片、三栏彩色圆圈图标网格、标题上方漂浮无意义小药丸、渐变主 CTA、暗底霓虹光晕与假数据占位。
   - **可选静态预览**：拍板前如需眼见为实，可先生成单文件静态 HTML 样式预览页展示真实色板/字阶/组件与空错态，确认后再固化。
5. **多形态备选方案对比**：
   - 至少给出 **2 个结构有本质差异的方案**（如“最小可行” vs “更深接口封装”），标明工作量、风险、改动文件规模与推荐理由。
   - **硬闸门 #1（重大决策）**：停下来由用户拍板选定方案（及设计方向），再进入 `/bot-plan` 或落盘设计文档。
6. **独立落盘模板**：
   - 设计稿默认写到 `docs/designs/<feature>.md`（或项目约定的规格目录）；
   - 新建/更新的设计系统落盘到根目录 `DESIGN.md`（结构：定位与记忆点 / 色彩 Tokens / 角色字体与字阶 / 间距与圆角 / 布局与五态 / 视觉红线；若用户明确只做临时草稿则记入单任务 `spec.md`）；
   - 若形成不可逆架构决策，顺手写一份精简 ADR 到 `docs/adr/<NNNN>-<slug>.md`（`Context` → `Decision` → `Consequences`）。

{{STAGE_RULES}}
