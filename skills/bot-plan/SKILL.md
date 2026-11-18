---
name: bot-plan
order: 2
stage: 2. 规格与切片
description: "Turn aligned design into executable spec, tracer-bullet vertical slices with blocking edges, data-flow failure analysis, UI design checks when UI is touched, and test seams. Use for: plan feature, write spec, split tickets, bot plan."
---

# /bot-plan — 规格、工程深审与纵向切片

目标：把已对齐的想法拆成**可独立验证的纵向切片（Tracer Bullets）**，在写代码前锁死数据流、失败模式、UI 交互态（若涉及界面）与公共测试接缝（Seam）。

{{PREAMBLE}}

## 执行步骤

1. **接口深度与故障检查**：
   - 优先复用已有接缝与深模块（少接口、高内聚），警惕浅模块、信息泄露、纯透传函数与手同步双份清单。
   - 用简明 ASCII 图画出核心数据流/状态流，并为每条新路径标出**至少 1 个真实生产故障点**及其错误处理/可观测性（禁止静默吞错）。
2. **UI 与交互设计检查（仅涉及页面 / 组件 / 样式 / 交互时必做；纯后端/CLI 直接跳过）**：
   - **对齐设计系统**：先读项目 `DESIGN.md` 或现有 CSS 变量/主题 token/组件约定，严禁另起炉灶硬编码色值与字号；若项目无设计文档，先确定统一间距、字阶与色板基准。
   - **交互五态补齐**：明确规格中的**空态（Empty，含引导动作）、加载态（Loading）、错态（Error + 可恢复路径）、长文本/极大数据溢出（Overflow）与首次使用引导**。
   - **视觉层级与克制**：每屏锁定清晰的主/次视觉焦点，做减法砍掉多余装饰，拒绝千篇一律的“三栏图标卡片 + 渐变大横幅”模板味。
   - **响应式与可达性（A11y）**：说明不同视口下的布局意图（非简单纵向堆叠）、键盘导航、焦点/对比度与可点击区域大小。
3. **测试接缝锁定（Seam First）**：
   - 在写测试前，明确写出每个关键路径的**公共边界接缝（Seam）**、断言目标（保护什么不变量、什么回归会让它失败）与测试类型（单测 / 集成 / E2E）。
4. **自包含规格与纵向切片拆票**：
   - 每个 ticket 必须是从输入到输出可独立跑通验证的**垂直切片**（不要按“全做 schema → 全做 API → 全做 UI”横向切片）。
   - 大范围机械重构采用 **Expand–Contract**（先兼容扩展、分批迁移、最后收口删除旧路径），确保每步绿色。
   - 若项目已有工单约定按其落盘（{{TRACKER_HINT}}）；无既有约定则在 `.scratch/<feature>/` 自包含落盘：
     - `spec.md`：`Problem` / `Solution` / `Decisions` / `Data Flow & Failure Modes` / `UI & States (if applicable)` / `Test Seams` / `Out of Scope`；
     - `issues/<NN>-<slug>.md`（一票一文件）：`Status: ready-for-agent`、`Blocked by: <NN | None>`、**交付行为**、**公共测试接缝**与**验收清单**。
5. **对齐确认**：仅当本阶段发现 `/bot-think` 未覆盖的跨模块/Schema/UI 主结构/范围变更时，触发**硬闸门 #1**由用户确认；已对齐则直接进入 `/bot-build`。

{{STAGE_RULES}}
