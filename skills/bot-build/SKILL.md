---
name: bot-build
order: 3
stage: 3. 极简 TDD 实现
description: "Implement vertical slices with seam-first red-green TDD and strict Ponytail minimalism (reuse ladder, Rule of Three, zero glue bloat). Use for: implement ticket, tdd build, write code, bot build."
---

# /bot-build — Ponytail 极简门禁 + 接缝 TDD 实现

目标：用**最少、最干净、可被重构验证**的代码跑通纵向切片。

{{PREAMBLE}}

## 开工前硬检查

1. **分支 / Worktree 闸门（硬闸门 #2）**：
   - 如需要新建分支或 worktree（`git checkout -b` / `git switch -c` / `git worktree add`），**必须先问用户确认分支名与基线**；未经同意严禁私自切换或建 worktree。
2. **Ponytail 写前复用阶梯（按顺序止步）**：
   - ① 本仓库已有 helper / 模式 → ② 语言标准库 → ③ 平台原生特性 → ④ 已安装依赖。
   - 只有在第 ①–④ 步都确认无法直接满足时，才自己写新代码；**严禁未经确认新增第三方依赖**。

## 编码循环（Vertical-Slice TDD）

1. **Red before Green**：在 `/bot-plan` 商定的公共接缝（Seam）上先写一个失败测试，再写刚好让它变绿的最小实现。
2. **拒绝三大反模式**：
   - **耦合实现细节**：禁止 mock 内部协作者、测私有方法或绕过公开接口偷看内部状态。
   - **自证断言（Tautological）**：禁止用被测逻辑同款公式算期望值，期望值必须来自独立真值（字面量/规格样例）。
   - **横向铺测试**：一次一个切片（1 个接缝 → 1 个红测 → 1 个最小实现），不提前为未来假设写空壳抽象。
3. **写后冗余自检（Ponytail 红线）**：
   - 检查是否违反 **Rule of Three**（不足 3 处真实重复却提前抽了工厂/策略/配置层）。
   - 检查是否引入纯转发函数（Middle Man）或 >2 个纯胶水文件，若出现立刻内联化简。
4. **收尾自测**：跑通受影响文件测试与项目级检查（{{CHECK_COMMAND_HINT}}），准备进入 `/bot-review`。

{{STAGE_RULES}}
