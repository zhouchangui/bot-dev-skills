---
name: bot-build
description: "Implement vertical slices with strict minimalism (reuse ladder, Rule of Three, zero glue bloat) and smart TDD routing (seam TDD for logic, spike-then-lock for unknowns, state/UI split). Use for: implement ticket, tdd build, write code, bot build."
---

# /bot-build — 极简门禁 + 按场景分流实现

目标：用**最少、最干净、可被重构验证**的代码跑通纵向切片；既用接缝 TDD 与真实往返契约测试守住核心逻辑质量，又不在 UI 视觉与未知探索上机械套用红绿循环破坏心流。

## 通用流控与极简铁律

1. **业务问透优先，按题量/题型分流（别乒乓，也不削足适履）**：澄清多个独立问题或取舍时合并一次抛出，每题给出默认推荐与理由，**严禁为迁就交互工具的题数/字数上限而删减业务问题或把开放题硬改选择题**：
   - **≤ 4 个独立离散选择题**：直接用宿主交互式多选工具一次点选；
   - **> 4 题、以开放性业务问题为主，或宿主无交互工具**：改用**正文分组编号清单**（标清默认推荐，支持用户回“全默认，仅改第 N 题”），输出后**立即结束本轮等待用户回复**，不要同轮再弹截断式提问框，严禁自问自答。
2. **三道硬暂停闸门（未经用户明确同意，严禁自行执行）**：
   - **重大决策**：架构路线、模块公开契约/Schema 变更、不可逆 `One-way door` 变更、删减核心范围、引入新依赖或不可逆操作。
   - **创建分支或 worktree**：执行 `git checkout -b` / `git switch -c` / `git worktree add` 前必须先询问确认分支名与基线。
   - **发布与合并**：执行 `git push`、创建/合并 PR、发版构建或线上部署前必须先询问确认。
   其余探索、测试、局部重构与修 bug 连续推进，不要琐碎弹窗打断心流。
3. **极简编码与反退化四铁律（写任何代码前先过一遍）**：
   - **复用阶梯**：`仓库已有 helper / 模式 → 语言标准库 → 平台原生特性（如原生 HTML/CSS、DB 约束）→ 已安装依赖`，在最高一层能解决就止步，严禁未经确认新增包。
   - **三次法则（Rule of Three）**：同一逻辑未真实出现 3 次且无第二个真实调用方时，禁止提前抽工厂、策略类、通用配置层或猜测性抽象。
   - **零纯转发**：禁止写只透传参数的中间转发函数（Middle Man），禁止为不可能发生的内部状态写冗余兜底分支。
   - **严禁类型逃逸与假默认值投毒**：系统边界入参必须显式窄化校验，内部不变量损坏必须快速失败（Fail-Fast）；**严禁用双层类型强转（`as any` / `as unknown as T` / `@ts-ignore` / `# type: ignore`）消音，严禁用 `?? 0`、`?? ''`、`?? []` 把上游契约断裂静默吞成合法假数据**。
4. **宿主交互与工具映射**：采用宿主中立表达：读取/编辑文件、执行终端命令、代码库检索、向用户批量提问（≤4 个独立选择题用交互式多选工具；超 4 题、含开放性业务问题或无工具时用正文分组编号清单等待用户回复，业务问清楚优先）。

## 开工前硬检查

1. **分支 / Worktree 与并发隔离闸门（硬闸门 #2）**：
   - 如需要新建分支或 worktree（`git checkout -b` / `git switch -c` / `git worktree add`），**必须先问用户确认分支名与基线**；未经同意严禁私自切换或建 worktree。
   - 若多切片并行实现，必须先核对各票据 `Touched Paths` 无交集或已在各自独立 `git worktree` 中隔离，严禁多个代理在同一工作区并发改写共享文件。
2. **写前复用阶梯（按顺序止步）**：
   - ① 本仓库已有 helper / 模式 → ② 语言标准库 → ③ 平台原生特性（含现代 Baseline HTML/CSS 原生能力）→ ④ 已安装依赖。
   - 只有在第 ①–④ 步都确认无法直接满足时，才自己写新代码；**严禁未经确认新增第三方依赖**。

## 实现分流（选最匹配的一条）

1. **规则 / 接口 / 状态 / 脚本（默认 → 接缝 TDD + 往返契约校验）**：
   - **接缝定位**：读取 `/bot-plan` 商定的测试接缝（若跳过规划阶段，动手前先用 1–2 句话锁定要测的公开边界）。
   - **Red before Green 与反永真核对**：在商定的公共接缝上先写一个失败测试，再写刚好让它变绿的最小实现；若是后补的边界测试，必须核对“反转/注释对应实现分支时测试必败”，杜绝永真假单测。
   - **拒绝三大反模式与跨层零 Mock 往返**：禁止耦合内部实现（禁止测私有方法或 mock 内部协作者，**Mock 仅限系统边界外 I/O**）；禁止自证断言；**凡生产方与消费方同步改动（前后端字段、序列化读写、CLI 参数），至少补 1 条不 Mock 该边界的真实往返契约测试**。
2. **陌生 SDK / 未知效果探索（Spike → 先探后锁）**：
   - 先用最小抛弃式原型验证核心技术假设与真实接口形态（**严禁直接把探索胶水堆进主流程**）。
   - 一旦看清公共接缝，彻底清理试验文件与调试打印，按路径 1 补上接缝测试后再落正式实现。
3. **前端 UI 视觉 / 现代 Web 装配（状态与展示分离 + 原生平台优先）**：
   - 把状态流转、筛选、派生计算抽成纯函数走路径 1 的接缝单测；
   - 实现布局、样式与交互前**先读 `references/ui-craft.md`（若路径以 `references/` 开头则相对于本 `SKILL.md` 所在目录解析）**：严格复用 `DESIGN.md` / 既有样式 token，按界面模式（Marketing 叙事面 vs Workbench 工具台面）落实五态、真实文案/真实产品画面、微排版（`-0.02em`、`text-wrap: balance`、行宽控制、`tabular-nums`）、同心圆角、tinted grays（彩底禁灰字）与浏览面定制（`::selection` / 焦点环 / 滚动条）；
   - **现代原生 Web 优先替代历史 JS Hack**：模态框与浮层优先用原生 `<dialog>` + `showModal()`（禁手写 `e.target === dialog` 点击关窗）与声明式 `popover` / Anchor Positioning；回车提交必加 `e.isComposing || e.keyCode === 229` 中文 IME 守卫；表单校验用 `:user-invalid`（禁裸 `:invalid` 首屏飘红）与标准 `autocomplete`；自适应输入框与折叠动画优先用 `field-sizing: content`、`interpolate-size` / Grid `0fr → 1fr`（禁读 `scrollHeight` 重排与 `max-height: 9999px`）；双主题优先用 `light-dark()`，组件自适应优先用 `@container` 与 `:has()`，首屏 LCP 主图设 `fetchpriority="high"`（禁加 `loading="lazy"`）并按 Baseline 规则做好 `@supports` 渐进降级；
   - 交互动效统一采用 `ease-out`（`cubic-bezier(0.23,1,0.32,1)`，`scale(0.97)` 按下回弹、触发点 `transform-origin`、只动画 `transform`/`opacity`、仅 `fixed`/`sticky` 层用 `backdrop-blur`、每容器单次入场），**不写脆弱的 DOM/CSS 快照测试**，界面靠 `/bot-verify` 实跑验收。

## 写后收尾

1. **写后冗余与反退化自检**：
   - 检查是否违反 **三次法则（Rule of Three）**、引入纯转发函数（Middle Man）或 >2 个纯胶水文件，若出现立刻内联化简；
   - 检查是否混入双层类型强转（`as any` / `as unknown as T` / `@ts-ignore`）、掩盖契约错误的假默认值（`?? 0` / `?? []`）、循环内串行 N+1 I/O 或调试残留（`console.log` / `debugger`）。
2. **收尾自测与状态回写**：跑通受影响文件测试与项目级检查（项目 typecheck/test）；若当前任务存在规格票据（项目 `.scratch/` 或 issue tracker），同步更新对应切片状态，准备进入 `/bot-review`。
