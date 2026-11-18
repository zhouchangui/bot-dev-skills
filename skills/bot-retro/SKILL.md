---
name: bot-retro
order: 8
stage: 8. 复盘与环境进化
description: "Session retrospective: convert recurring agent mistakes into deterministic checks (linters/hooks/tests), prune bloat from AGENTS/steering docs, and evolve bot-dev-skills templates. Use for: retrospective, improve workflow, bot retro."
---

# /bot-retro — 复盘沉淀与工具链进化

目标：不让同一个坑踩第二次。复盘对象不是刚才的业务代码，而是**Agent 工作的环境、规则与 `bot-dev-skills` 模板本身**。

{{PREAMBLE}}

## 复盘四问

1. **机械化检查（Deterministic > Prompt）**：
   - 本次出现过哪些“靠提示词叮嘱却还是踩了”的机械错误（导入边界、路径规范、命名格式、空配置检查）？能否把它变成一条 linter 规则、预提交钩子或自动化单测？**优先写校验代码，而不是往 `AGENTS.md` / `CLAUDE.md` 堆文字。**
2. **上下文瘦身与导航修复**：
   - 这次找文件/找命令多走了哪些弯路？是否只需在入口文档加一行指针（而非复制长段正文）就能省掉下次探索？
   - 检查项目入口文档是否出现“从未生效的废话指令（No-ops）”或过时描述，清理删减。
3. **极简门禁自省**：
   - 这次在编码或审查中是否还是写出了冗余封装或过度抽象？是哪个阶段的提示词不够硬？
4. **输出与跨项目反哺**：
   - 按严重度列出环境改进项（**必须落成确定性检查的** > **需更新项目文档指针的** > **建议反哺回 `bot-dev-skills` 模板源的**），确认后执行或记录。

{{STAGE_RULES}}
