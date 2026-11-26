---
name: bot-debug
order: 4
stage: 4. 根因调试
description: "Tight-loop bug diagnosis: reproduce with a failing command or test first, fix at the single root owner (deepening shallow seams when locality fails), and lock with a regression test. Use for: debug bug, fix error, diagnose failure, bot debug."
---

# /bot-debug — 紧反馈根因调试

目标：拒绝盲改；先最小命令复现稳定红灯，再在单一根因拥有者处修透并锁回归测试。

{{PREAMBLE}}

## 铁律流程

1. **先建紧反馈回路**：理解完报错前不改生产代码；先构造确定性复现命令或公开接缝失败测试并亲眼确认稳定报红。
2. **二分追根因**：沿调用链与输入边界定位到**最上游共同拥有该状态/不变量的位置**。
3. **单点根因修复与浅模块收口**：
   - 在共享根因处修一处胜过 N 处打补丁；排查全部调用方，遵循既有错误处理惯例，严格遵守反静默退化铁律；
   - **浅模块泥潭信号**：若找不到干净公开接缝下测试，或同一不变量散落 4–5 文件被迫多处同改，局部安全时先收拢进单一深模块入口再修；涉跨模块大改则停在**硬闸门 #1**提议加深边界（或记待办）。
4. **回归锁定**：确认回归测试无修复必挂、有修复必绿，再跑 {{CHECK_COMMAND_HINT}} 确认无连带回归与新增告警。

{{STAGE_RULES}}
