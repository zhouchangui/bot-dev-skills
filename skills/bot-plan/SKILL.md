---
name: bot-plan
order: 2
stage: 2. 规格与切片
description: "Turn aligned design into executable spec, tracer-bullet vertical slices with blocking edges, data-flow failure analysis, and test seams. Use for: plan feature, write spec, split tickets, bot plan."
---

# /bot-plan — 规格、工程深审与纵向切片

目标：把已对齐的想法拆成**可独立验证的纵向切片（Tracer Bullets）**，在写代码前锁死数据流、失败模式与公共测试接缝（Seam）。

{{PREAMBLE}}

## 执行步骤

1. **接口与深度检查（`codebase-design` + `plan-eng-review`）**：
   - 优先复用已有接缝与深模块（少接口、高内聚），警惕浅模块、信息泄露、纯透传函数与手同步双份清单。
   - 用简明 ASCII 图画出核心数据流/状态流，并为每条新路径标出**至少 1 个真实生产故障点**及其错误处理/可观测性（禁止静默吞错）。
2. **测试接缝锁定（Seam First）**：
   - 在写测试前，明确写出每个关键路径的**公共边界接缝（Seam）**、断言目标（保护什么不变量、什么回归会让它失败）与测试类型（单测 / 集成 / E2E）。
3. **纵向切片拆票（`to-spec` + `to-tickets`）**：
   - 每个 ticket 必须是从输入到输出可独立跑通验证的**垂直切片**（不要按“全做 schema → 全做 API → 全做 UI”横向切片）。
   - 显式标注 `Blocked by` 依赖边，写入项目工单目录（{{TRACKER_HINT}}）。
   - 大范围机械重构采用 **Expand–Contract**（先兼容扩展、分批迁移、最后收口删除旧路径），确保每步绿色。
4. **对齐确认**：如涉及跨模块大改或范围变更，触发**硬闸门 #1**由用户确认后进入 `/bot-build`。

{{STAGE_RULES}}
