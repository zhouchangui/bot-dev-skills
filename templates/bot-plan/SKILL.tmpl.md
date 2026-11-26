---
name: bot-plan
order: 2
stage: 2. 规格与切片
description: "Turn aligned design into executable spec, tracer-bullet vertical slices with blocking edges, deep-module & consistency checks, data-flow failure analysis, UI design checks when UI is touched, and test seams. Use for: plan feature, write spec, split tickets, bot plan."
---

# /bot-plan — 规格、工程深审与纵向切片

目标：把已对齐的设计拆成**可独立验证的纵向切片（Tracer Bullets）**，写代码前锁死同构一致性、深模块边界、`One-way door` 风险、热路径复杂度、故障模式、UI 五态（若含界面）与公共测试接缝。

{{PREAMBLE}}

## 执行步骤

1. **同构对齐、深模块标尺、门型与故障预审**：
   - **同构一致性基线**：对照同域既有标杆模块、`GLOSSARY.md` 与 `docs/adr/`，对齐目录分层、错误返回结构、状态归属与领域名词，禁引入第二套平行风格或违背既有 ADR。
   - **深模块删除检验（Deletion Test）与双适配器原则**：追求窄接口藏复杂行为（公开契约说清类型、不变量、时序与错误模式）。新建/拆分前做**删除检验**——假想删掉它，复杂度消失说明是浅层透传壳（不建），复杂度散回多处调用方才独立；**禁为测内部步骤拆碎内聚逻辑**；**本地依赖仅有 1 个适配器不切接缝，仅真实存在 2 个及以上适配器（含第 3/4 档“生产实现 + 测试替身”或第二渠道）才切窄接缝**。
   - **`Two-way` vs `One-way door`**：前置判定是否含不可逆/高迁移成本变更（DB Schema 删改列、本地持久化格式、公开 API 破坏性变更、权限模型）；凡属 `One-way door`，必写 **Expand–Contract** 兼容演进、旧数据兼容/回填与回滚验证方案。
   - **热路径复杂度 & 数据流故障**：按真实数据量级规避循环内串行 I/O / N+1、`O(N²)` 嵌套扫描与无上限全量读入；画简明 ASCII 数据/状态流，为每条新路径标出**至少 1 个真实生产故障点**及错误处理/可观测性。
2. **UI 与现代 Web 检查（仅涉及页面/组件/样式/交互时先读 `{{UI_CRAFT_PATH}}`——`references/` 相对本 `SKILL.md` 目录；纯后端跳过）**：
   - 读取或反推/新建 `DESIGN.md`，锁定 **Mode A（Marketing）** 或 **Mode B（Workbench）**，按 `ui-craft.md` 第 5 节优先规划 Baseline 原生 HTML/CSS 能力（避免冗余 JS 状态库）；
   - 补齐规格中的**交互五态**（空态含引导 / 加载态 / 可恢复错态与 `:user-invalid` / 溢出态 / 首用态）、回车提交的中文 IME 守卫、屏幕节奏或工作区密度、Skeleton Test、动效角色（Lead/Support/Decoration/Static）与多断点/A11y 意图。
3. **测试接缝、四档依赖与跨层契约锁定**：
   - **公开接口即测试面**：明确每条关键路径的公共测试接缝与断言目标（业务调用方与测试穿过同一公开接口）。
   - **按四档依赖性质定接缝策略**：① **进程内纯计算/状态** → 合并直测公开接口，零 Adapter；② **本地可替代依赖（内存库 / SQLite / 临时目录）** → 跑真实本地替身；③ **自有跨网络服务** → 窄接口 + 内存 Fake + 跨层往返测；④ **外部第三方服务** → 窄接口 + Mock 替身。
   - **跨层往返测试**：凡同步改动生产方与消费方（前后端字段、序列化读写、CLI 参数），规划至少 1 条**不 Mock 该边界的真实往返测试（Round-trip Test）**。
4. **自包含规格与纵向切片拆票**：
   - 每票必须是从输入到输出可独立跑通的**垂直切片**（禁横向拆票）；`One-way door` 或大范围重构采用 **Expand–Contract** 保持每步绿色。
   - 按项目约定落盘（{{TRACKER_HINT}}）；无既有约定则在 `.scratch/<feature>/` 写入：
     - `spec.md`：`Necessity / Why` / `Door Type & Rollback` / `Problem` / `Solution` / `Decisions` / `Data Flow & Failure Modes` / `UI & States (if applicable)` / `Test Seams` / `Out of Scope (Cut List)`；
     - `issues/<NN>-<slug>.md`：`Status: ready-for-agent`、`Blocked by: <NN | None>`、`Touched Paths: <预计读写路径>`、交付行为、公共测试接缝与验收清单。
5. **对齐确认**：发现 `/bot-think` 未覆盖的跨模块/Schema/`One-way door`/UI 主结构/范围变更时触发**硬闸门 #1**；已对齐则直接进 `/bot-build`。

{{STAGE_RULES}}
