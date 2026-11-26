---
name: bot-retro
order: 8
stage: 8. 复盘与环境进化
description: "Session retrospective: convert recurring agent mistakes into deterministic checks (linters/hooks/tests), prune bloat from AGENTS/steering docs, and evolve bot-dev-skills templates. Use for: retrospective, improve workflow, bot retro."
---

# /bot-retro — 复盘沉淀与工具链进化

目标：不踩同一个坑第二次。复盘对象是 **Agent 工作环境、规则与 `bot-dev-skills` 模板本身**。

{{PREAMBLE}}

## 复盘四问

1. **机械化检查（Deterministic > Prompt）**：本次哪些“提示词叮嘱过仍踩坑”的机械错误（导入边界、命名、同构漂移、体积膨胀）可沉成 linter、hook 或自动化测试？优先写校验代码，不往入口文档堆字。
2. **上下文瘦身与导航修复**：找文件/命令走了哪些弯路？能否在入口加一行指针替代长段正文，并清掉已失效废话指令（No-ops）？
3. **极简与反退化自省**：编码/审查中是否仍出现浅模块、早熟抽象、类型逃逸或假默认值？哪一阶段门禁不够硬？
4. **分级输出与反哺**：按 `必落确定性检查 > 更新项目指针 > 反哺 bot-dev-skills 模板源` 排序，确认后执行或记录。

{{STAGE_RULES}}
