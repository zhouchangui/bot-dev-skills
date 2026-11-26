---
name: bot-plan
order: 2
stage: 2. 规格与切片
description: "Turn aligned design into executable spec, tracer-bullet vertical slices with blocking edges, data-flow failure analysis, UI design checks when UI is touched, and test seams. Use for: plan feature, write spec, split tickets, bot plan."
---

# /bot-plan — 规格、工程深审与纵向切片

目标：把已对齐的想法拆成**可独立验证的纵向切片（Tracer Bullets）**，在写代码前锁死数据流、不可逆风险（One-way door）、失败模式、UI 交互态（若涉及界面）与公共测试接缝（Seam）。

{{PREAMBLE}}

## 执行步骤

1. **接口深度、门型识别与故障检查**：
   - 优先复用已有接缝与深模块（少接口、高内聚），警惕浅模块、信息泄露、纯透传函数与手同步双份清单。
   - **前置标定 `Two-way door` vs `One-way door`**：明确判定本次改动是否包含**不可逆/高迁移成本变更（`One-way door`：DB Schema 删改列、本地持久化格式变更、公开 API 破坏性变更或权限模型调整）**；凡属 `One-way door`，必须在规格中写明兼容演进路径（Expand–Contract）、旧数据回填/兼容读取与回滚验证方案。
   - 用简明 ASCII 图画出核心数据流/状态流，并为每条新路径标出**至少 1 个真实生产故障点**及其错误处理/可观测性（禁止静默吞错）。
2. **UI 与交互设计检查（仅涉及页面 / 组件 / 样式 / 交互时必做，按需参考 `{{UI_CRAFT_PATH}}`——若路径以 `references/` 开头则相对于本 `SKILL.md` 所在目录解析；纯后端/CLI 直接跳过）**：
   - **对齐或补建设计系统与界面模式**：优先读取根目录 `DESIGN.md` 并锁定界面属于 **Mode A（Marketing 叙事转化页）** 还是 **Mode B（Workbench 高频生产力工具台）**；若无 `DESIGN.md`（例如跳过 `/bot-think` 直接进入本阶段）：① 已有前端代码则先从现有 CSS 变量/主题配置反推提炼精简 `DESIGN.md`；② 全新空白项目且未建档时，先在澄清/对齐里确定模式、基础色板（含 tinted gray）、字阶、圆角几何与间距并落盘 `DESIGN.md`（若用户明确不做全局文档，则退化为在当前 `spec.md` 写明本次 UI 基准），严禁临场硬编码杂乱色值。
   - **交互五态补齐**：明确规格中的**空态（Empty，含引导动作）、加载态（Loading）、错态（Error + 可恢复路径）、长文本/极大数据溢出（Overflow）与首次使用引导**。
   - **屏幕节奏 / 工作区密度、Skeleton Test 与动效角色**：Mode A 按 `min-h-[100dvh]` 1 屏 1 观点与全页对齐边界组织叙事，Mode B 优先保障主工作区首屏面积、固定壳层独立滚动与高频键盘流（禁套营销页 `py-24` 大留白）；统一通过**无文案骨架校验（Skeleton Test）**，并为有动效的区域划分 **Lead / Support / Decoration / Static**（坚持每容器单次入场、高频操作零延迟零 stagger）。
   - **响应式与可达性（A11y）**：说明桌面/平板/手机多断点布局意图（非简单纵向堆叠）、键盘导航、清晰 `:focus-visible` 焦点环、对比度（严禁彩底灰字）与可点击区域大小。
3. **测试接缝锁定（Seam First）**：
   - 在写测试前，明确写出每个关键路径的**公共边界接缝（Seam）**、断言目标（保护什么不变量、什么回归会让它失败）与测试类型（单测 / 集成 / E2E）。
4. **自包含规格与纵向切片拆票**：
   - 每个 ticket 必须是从输入到输出可独立跑通验证的**垂直切片**（不要按“全做 schema → 全做 API → 全做 UI”横向切片）。
   - 大范围机械重构或 `One-way door` 变更采用 **Expand–Contract**（先兼容扩展、分批迁移、最后收口删除旧路径），确保每步绿色。
   - 若项目已有工单约定按其落盘（{{TRACKER_HINT}}）；无既有约定则在 `.scratch/<feature>/` 自包含落盘：
     - `spec.md`：`Necessity / Why`（根问题与不做代价）/ `Door Type & Rollback`（Two-way or One-way door）/ `Problem` / `Solution` / `Decisions` / `Data Flow & Failure Modes` / `UI & States (if applicable)` / `Test Seams` / `Out of Scope (Cut List)`；
     - `issues/<NN>-<slug>.md`（一票一文件）：`Status: ready-for-agent`、`Blocked by: <NN | None>`、`Touched Paths: <预计读写文件或目录范围>`（供并行分派做写冲突隔离判定）、**交付行为**、**公共测试接缝**与**验收清单**。
5. **对齐确认**：当本阶段发现 `/bot-think` 未覆盖的跨模块/Schema/`One-way door`/UI 主结构/范围变更时，触发**硬闸门 #1**由用户确认；已对齐则直接进入 `/bot-build`。

{{STAGE_RULES}}
