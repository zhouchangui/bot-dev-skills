---
name: bot-build
order: 3
stage: 3. 极简实现（TDD 分流）
description: "Implement vertical slices with architectural consistency, deep-module boundaries, strict minimalism (reuse ladder, deletion test, Rule of Three), and smart TDD routing. Use for: implement ticket, tdd build, write code, bot build."
---

# /bot-build — 同构深模块 + 极简门禁 + 分流实现

目标：在**严格对齐仓库既有架构惯例与深模块封装边界**的前提下，用最少、最干净、可被重构验证的代码跑通纵向切片；既用公开接缝 TDD 守住核心逻辑质量，又不在 UI 视觉与未知探索上机械套用红绿循环破坏心流。

{{PREAMBLE}}

## 开工前硬检查

1. **分支 / Worktree 与并发隔离闸门（硬闸门 #2）**：
   - 如需要新建分支或 worktree（`git checkout -b` / `git switch -c` / `git worktree add`），**必须先问用户确认分支名与基线**；未经同意严禁私自切换或建 worktree。
   - 若多切片并行实现，必须先核对各票据 `Touched Paths` 无交集或已在各自独立 `git worktree` 中隔离，严禁多个代理在同一工作区并发改写共享文件。
2. **同构一致性侦察与接口边界守卫（Consistency & Encapsulation Recon）**：
   - 动代码前先读同域 **1–2 个既有标杆模块**、`GLOSSARY.md`（若有）与相关 `docs/adr/`，严格对齐仓库现有的**目录职责分层、错误返回/异常格式、配置注入方式与领域名词**——**严禁在同一仓库自创第二套平行编码范式或把同一业务概念起两种名字**；
   - **严禁跨过其他模块的公开入口直接 `import` 其内部子文件或读写私有状态**；所有跨模块协作一律走对方的公开接口。
3. **写前复用阶梯（按顺序止步）**：
   - ① 本仓库已有深模块 / helper / 模式 → ② 语言标准库 → ③ 平台原生特性（含现代 Baseline HTML/CSS 原生能力）→ ④ 已安装依赖。
   - 只有在第 ①–④ 步都确认无法直接满足时，才自己写新代码；**严禁未经确认新增第三方依赖**。

## 实现分流（选最匹配的一条）

1. **规则 / 接口 / 状态 / 脚本（默认 → 公开接缝 TDD + 四档依赖策略）**：
   - **公开接口即测试面（The interface is the test surface）**：读取 `/bot-plan` 商定的测试接缝（若跳过规划阶段，动手前先用 1–2 句话锁定要测的窄公开接口及其不变量/错误模式）；业务调用方与测试穿过同一公开接缝，**禁止单纯为好写单测把内聚逻辑拆碎成一地小函数（导致真正的集成 bug 漏在调用方拼装胶水里）**。
   - **Red before Green 与反永真核对**：在公开接缝上先写一个失败测试，再写刚好让它变绿的最小实现；若是后补的边界测试，必须核对“反转/注释对应实现分支时测试必败”，杜绝永真假单测。
   - **四档依赖分层与跨层零 Mock 往返**：**1 个适配器不切抽象接缝，2 个真实适配器才切接缝**；按依赖性质选测试方式——① **进程内纯计算/状态**直接合并直测；② **本地可替代依赖**（内存库 / SQLite / 临时目录）跑真实本地替身；③ **自有跨网络服务**注入内存 Fake；④ **外部第三方服务**才注入窄端口用 Mock 替身。**凡生产方与消费方同步改动（前后端字段、序列化读写、CLI 参数），至少补 1 条不 Mock 该边界的真实往返契约测试**。
2. **陌生 SDK / 未知效果探索（Spike → 先探后锁）**：
   - 先用最小抛弃式原型验证核心技术假设与真实接口形态（**严禁直接把探索胶水堆进主流程**）。
   - 一旦看清公共接缝，彻底清理试验文件与调试打印，按路径 1 补上接缝测试后再落正式实现。
3. **前端 UI 视觉 / 现代 Web 装配（状态与展示分离 + 原生平台优先）**：
   - 把状态流转、筛选、派生计算抽成深模块纯逻辑走路径 1 的接缝单测；
   - 实现布局、样式与交互前**先读 `{{UI_CRAFT_PATH}}`（若路径以 `references/` 开头则相对于本 `SKILL.md` 所在目录解析）**：严格复用 `DESIGN.md` / 既有样式 token，按界面模式（Marketing 叙事面 vs Workbench 工具台面）落实五态、真实文案/真实产品画面、微排版（`-0.02em`、`text-wrap: balance`、行宽控制、`tabular-nums`）、同心圆角、tinted grays（彩底禁灰字）与浏览面定制（`::selection` / 焦点环 / 滚动条）；
   - **现代原生 Web 优先替代历史 JS Hack**：模态框与浮层优先用原生 `<dialog>` + `showModal()`（禁手写 `e.target === dialog` 点击关窗）与声明式 `popover` / Anchor Positioning；回车提交必加 `e.isComposing || e.keyCode === 229` 中文 IME 守卫；表单校验用 `:user-invalid`（禁裸 `:invalid` 首屏飘红）与标准 `autocomplete`；自适应输入框与折叠动画优先用 `field-sizing: content`、`interpolate-size` / Grid `0fr → 1fr`（禁读 `scrollHeight` 重排与 `max-height: 9999px`）；双主题优先用 `light-dark()`，组件自适应优先用 `@container` 与 `:has()`，首屏 LCP 主图设 `fetchpriority="high"`（禁加 `loading="lazy"`）并按 Baseline 规则做好 `@supports` 渐进降级；
   - 交互动效统一采用 `ease-out`（`cubic-bezier(0.23,1,0.32,1)`，`scale(0.97)` 按下回弹、触发点 `transform-origin`、只动画 `transform`/`opacity`、仅 `fixed`/`sticky` 层用 `backdrop-blur`、每容器单次入场），**不写脆弱的 DOM/CSS 快照测试**，界面靠 `/bot-verify` 实跑验收。

## 写后收尾

1. **删除检验、局部性收口与反退化自检**：
   - **5 秒删除检验（Deletion Test）与极简核对**：审视新建的模块/函数——若删掉它复杂度直接消失（纯透传 Middle Man、不足 3 处重复的早熟抽象、或只有单一实现的假接口层），立刻内联化简；
   - **局部性失守信号（Locality Guard）**：若实现单一概念改动被迫跨 4–5 个文件同步跳跃修改，优先在局部收拢进单一深模块入口；若需跨模块大改公开契约，停在**硬闸门 #1**向用户提议先做模块加深（或记入延后待办），禁止顺着浅模块泥潭硬糊新胶水；
   - **反静默退化与风格自检**：核对新建代码与邻近模块在命名、错误处理、分层上保持同构一致，且无双层类型强转（`as any` / `as unknown as T` / `@ts-ignore`）、无假默认值投毒（`?? 0` / `?? []`）、无循环内串行 N+1 I/O 或调试残留（`console.log` / `debugger`）。
2. **收尾自测与状态回写**：跑通受影响文件测试与项目级检查（{{CHECK_COMMAND_HINT}}）；若当前任务存在规格票据（{{TRACKER_HINT}}），同步更新对应切片状态，准备进入 `/bot-review`。

{{STAGE_RULES}}
