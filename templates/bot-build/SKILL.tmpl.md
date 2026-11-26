---
name: bot-build
order: 3
stage: 3. 极简实现（TDD 分流）
description: "Implement vertical slices with architectural consistency, deep-module boundaries, strict minimalism (reuse ladder, deletion test, Rule of Three), and smart TDD routing. Use for: implement ticket, tdd build, write code, bot build."
---

# /bot-build — 同构深模块 + 极简门禁 + 分流实现

目标：在对齐仓库既有架构惯例与深模块边界的前提下，用最少、最干净、可重构验证的代码跑通纵向切片。

{{PREAMBLE}}

## 开工前硬检查

1. **分支 / Worktree 与并发隔离（硬闸门 #2）**：建分支/worktree 前必先确认分支名与基线；多切片并行前核对 `Touched Paths` 无交集或已用独立 `git worktree` 隔离，禁并发改写共享文件。
2. **同构一致性侦察与接口边界守卫**：动代码前先读同域 **1–2 个既有标杆模块**、`GLOSSARY.md` 与相关 `docs/adr/`，对齐分层、错误返回格式、配置注入与领域名词，禁自创平行范式或同概念异名；**严禁跨过其他模块的公开入口直接 `import` 内部子文件或读写私有状态**。
3. **写前复用阶梯**：严格按上方复用阶梯（既有深模块/helper → 标准库 → 平台原生能力 → 已安装依赖）逐级止步，均无法满足再写新代码。

## 实现分流（选最匹配一条）

1. **规则 / 接口 / 状态 / 脚本（默认 → 公开接缝 TDD）**：
   - **公开接口即测试面**：锁定 `/bot-plan` 的窄公开接缝（跳过规划时先用 1–2 句明确接口不变量与错误模式）；业务调用方与测试穿过同一公开接口，禁为好写单测拆碎内聚逻辑。
   - **Red before Green 与反永真**：先写失败测试再写最小实现；后补测试必验证“反转实现分支即报红”。
   - **四档依赖与跨层零 Mock 往返**：第 1/2 档本地依赖单实现不切接缝，仅真实存在 ≥2 适配器（含第 3/4 档跨网络/三方边界的“生产实现 + 测试替身”）才切窄接缝；按四档策略直测 / 跑本地替身 / 注入 Fake 或 Mock。**生产方与消费方同步改动必补至少 1 条无 Mock 的真实往返契约测试**。
2. **陌生 SDK / 未知探索（Spike → 先探后锁）**：用最小抛弃式原型验清接口形态（禁堆进主流程），看清接缝后彻底清理试验文件与日志，再按路径 1 补接缝测试落正式实现。
3. **前端 UI / 现代 Web 装配（状态与展示分离 + 原生优先）**：
   - 状态流转、筛选与派生计算抽成纯逻辑走路径 1 接缝单测；
   - 写界面前**先读 `{{UI_CRAFT_PATH}}`（`references/` 相对本 `SKILL.md` 目录）**：复用 `DESIGN.md`/样式 token，按 Mode A/B 落实交互五态、排版微雕、物理动效与**第 5 节现代原生 Web 平台优先**（原生顶层交互、中文 IME 守卫、交互后校验、现代 CSS 与 Baseline `@supports` 渐进降级）；**不写脆弱的 DOM/CSS 快照测试**，界面靠 `/bot-verify` 实跑验收。

## 写后收尾

1. **删除检验、局部性收口与反退化自检**：
   - **5 秒删除检验（Deletion Test）**：删掉新建模块/函数若复杂度直接消失（Middle Man、不足 3 处重复、或本地单实现假接口），立刻内联化简；
   - **局部性失守信号**：若单一概念改动被迫跨 4–5 文件散弹修改，局部安全时收拢进单一深模块；涉跨模块大改则停在**硬闸门 #1**提议先加深边界（或记待办）；
   - **反退化与净空自检**：核对风格同构、严格遵守上方反静默退化铁律，且无循环内串行 N+1 I/O 或调试残留（`console.log` / `debugger`）。
2. **收尾自测与回写**：跑通受影响测试与 {{CHECK_COMMAND_HINT}}，更新 {{TRACKER_HINT}} 切片状态，准备进入 `/bot-verify` 与 `/bot-review`。

{{STAGE_RULES}}
