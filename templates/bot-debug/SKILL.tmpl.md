---
name: bot-debug
order: 4
stage: 4. 根因调试
description: "Tight-loop bug diagnosis: reproduce with a failing command or test first, fix at the single root owner (deepening shallow seams when locality fails), and lock with a regression test. Use for: debug bug, fix error, diagnose failure, bot debug."
---

# /bot-debug — 紧反馈根因调试

目标：拒绝靠猜改代码；先用最小命令复现红灯，再在单一根因拥有者处一次性修透并补回归测试。

{{PREAMBLE}}

## 铁律流程

1. **先建紧反馈回路（禁止盲改）**：
   - 在理解完报错前不改任何生产代码。先构造一条**确定性复现命令或公开接缝失败测试**，亲眼确认它稳定报红。
2. **二分追根因**：
   - 沿真实调用链与输入边界定位到**最上游共同拥有该状态/不变量的位置**。
3. **单点根因修复与浅模块收口（Locality First）**：
   - **在共享根因模块修复一处，胜过在 N 个调用方各加防御判断**。排查所有调用方，遵循仓库既有错误处理惯例修复，避免在症状处打补丁；严禁为“理论上不可能发生”的内部状态加冗余 fallback 或假默认值（`?? 0` / `?? []`）掩盖真实 bug。
   - **浅模块泥潭信号（Deepening Signal）**：若复现或修复时发现“找不到干净公开接缝下测试”或“同一业务不变量散落在 4–5 个文件导致必须多处同改”，说明暴露了浅模块泄露——局部安全时先将分散规则收拢进单一深模块入口再修；若涉及跨模块公开接口大改，停在**硬闸门 #1**向用户提议先加深模块边界（或记入待办）。
4. **回归锁定**：
   - 先确认新加/更新的回归测试在无修复时必挂、打上修复后必绿，再运行关联套件（{{CHECK_COMMAND_HINT}}）确认无连带回归与新增告警。

{{STAGE_RULES}}
