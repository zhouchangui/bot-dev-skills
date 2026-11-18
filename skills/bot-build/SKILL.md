---
name: bot-build
order: 3
stage: 3. 极简实现（TDD 分流）
description: "Implement vertical slices with strict minimalism (reuse ladder, Rule of Three, zero glue bloat) and smart TDD routing (seam TDD for logic, spike-then-lock for unknowns, state/UI split). Use for: implement ticket, tdd build, write code, bot build."
---

# /bot-build — 极简门禁 + 按场景分流实现

目标：用**最少、最干净、可被重构验证**的代码跑通纵向切片；既用接缝 TDD 守住核心逻辑质量，又不在 UI 视觉与未知探索上机械套用红绿循环破坏心流。

{{PREAMBLE}}

## 开工前硬检查

1. **分支 / Worktree 闸门（硬闸门 #2）**：
   - 如需要新建分支或 worktree（`git checkout -b` / `git switch -c` / `git worktree add`），**必须先问用户确认分支名与基线**；未经同意严禁私自切换或建 worktree。
2. **写前复用阶梯（按顺序止步）**：
   - ① 本仓库已有 helper / 模式 → ② 语言标准库 → ③ 平台原生特性 → ④ 已安装依赖。
   - 只有在第 ①–④ 步都确认无法直接满足时，才自己写新代码；**严禁未经确认新增第三方依赖**。

## 实现分流（选最匹配的一条）

1. **规则 / 接口 / 状态 / 脚本（默认 → 接缝 TDD）**：
   - **接缝定位**：读取 `/bot-plan` 商定的测试接缝（若跳过规划阶段，动手前先用 1–2 句话锁定要测的公开边界）。
   - **Red before Green**：在商定的公共接缝上先写一个失败测试，再写刚好让它变绿的最小实现。
   - **拒绝三大反模式与 Mock 边界**：禁止耦合内部实现（禁止测私有方法或 mock 内部协作者，**Mock 仅限系统边界外 I/O**）；禁止自证断言（期望值来自独立真值）；禁止一次性横向铺测试（一次 1 个切片）。
2. **陌生 SDK / 未知效果探索（Spike → 先探后锁）**：
   - 先用最小抛弃式原型验证核心技术假设与真实接口形态（**严禁直接把探索胶水堆进主流程**）。
   - 一旦看清公共接缝，清理多余试验代码，按路径 1 补上接缝测试后再落正式实现。
3. **前端 UI 视觉 / 静态装配（状态与展示分离）**：
   - 把状态流转、筛选、派生计算抽成纯函数走路径 1 的接缝单测；
   - 实现布局、样式与交互前**先读 `{{UI_CRAFT_PATH}}`**：严格复用 `DESIGN.md` / 既有样式 token，落实五态、真实文案/真实产品画面、微排版（`-0.02em`、行宽控制、`tabular-nums`）、同心圆角、tinted grays（彩底禁灰字）与浏览面定制（`::selection` / 焦点环 / 滚动条）；
   - 交互动效统一采用 `ease-out`（`cubic-bezier(0.23,1,0.32,1)`，`scale(0.97)` 按下回弹、触发点 `transform-origin`、只动画 `transform`/`opacity`、仅 `fixed`/`sticky` 层用 `backdrop-blur`、每容器单次入场），**不写脆弱的 DOM/CSS 快照测试**，界面靠 `/bot-verify` 实跑验收。

## 写后收尾

1. **写后冗余自检（极简红线）**：
   - 检查是否违反 **三次法则（Rule of Three）**（不足 3 处真实重复却提前抽了工厂/策略/配置层）。
   - 检查是否引入纯转发函数（Middle Man）或 >2 个纯胶水文件，若出现立刻内联化简。
2. **收尾自测**：跑通受影响文件测试与项目级检查（{{CHECK_COMMAND_HINT}}），准备进入 `/bot-review`。

{{STAGE_RULES}}
