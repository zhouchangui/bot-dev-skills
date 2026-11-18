---
name: bot-review
order: 5
stage: 5. 多维合入评审
description: "Unified pre-landing review: Adversarial/Chaos pass + dual-axis (Standards w/ Fowler smells + Spec compliance) + bloat audit + conditional UI audit with Fix-First. Use for: review diff, code review, check pr, bot review."
---

# /bot-review — 对抗 + 双轴 + 冗余 + UI 融合评审

目标：合并前把关。用一次结构化审查同时覆盖“系统会不会在线上炸”“代码是不是符合标准与规格”“有没有冗余膨胀”，以及（若改到界面）“设计系统与交互五态是否到位”，并直接修复确定性小问题（Fix-First）。

{{PREAMBLE}}

## 审查范围锁定

1. 确定对比基准（`git diff <base>...HEAD` + 未提交改动）。
2. 若有源 spec / ticket（{{TRACKER_HINT}}）与项目规范/设计文档（如 `DESIGN.md`），同步读入作为对照依据。

## 多维独立检查清单（不合并打分）

> 支持子代理并行的宿主可分派并行审查；单代理宿主按 **维度 A → B → C（→ D）** 依次独立核查并分栏输出，严禁合并混淆。

### 维度 A：Adversarial & Production Failure（攻击者与混沌视角）
- **边界与权限**：越权访问、未校验输入、路径穿越、注入、空值/超大负载、并发竞争与部分写入崩溃恢复。
- **失败可见性**：是否存在错误被静默吞掉、超时未设、资源/文件句柄未关闭。

### 维度 B：Dual-Axis（Spec 符合度 + Standards）
- **Spec 符合度**：① 漏掉的规格需求；② 偏离规格的行为；③ 未被要求的 **Scope Creep（额外加戏）**。
- **Standards & 代码坏味道**：先看仓库明文规范（优先级最高），再对照常见坏味道：**重复逻辑、神秘命名、过长参数团（Data Clumps）、过长开关分支、霰弹枪式修改（Shotgun Surgery）、消息链过长**。跳过 linter 已自动检查的格式项。

### 维度 C：极简冗余审计（Bloat Audit）
- **复用阶梯违规**：是否重写了仓库已有 helper、标准库或平台原生能力？
- **早熟抽象（Rule of Three）**：是否为了 1–2 个调用点新建了工厂/策略类/抽象接口？
- **胶水与死代码**：是否存在纯转发函数（Middle Man）、>2 个纯透传胶水文件、或为不可能状态编写的冗余防御分支与未使用的导出？

### 维度 D：UI 与交互审计（仅 diff 涉及页面 / 组件 / 样式 / 交互时必查；否则写 `无 UI 改动，跳过`）
- **设计系统偏移**：是否违背 `DESIGN.md` 或现有主题 token，出现硬编码颜色、自造字号/间距或违背明暗场景定位？
- **边缘五态缺失**：空态、加载态、错态（可恢复）、长文本溢出与首用态是否遗漏？
- **反套路视觉红线**：是否出现**卡片套卡片**、三栏彩色圆圈图标网格、标题上方无意义小药丸标签、渐变主 CTA / 暗底霓虹光晕、假指标占位（如虚构统计数）或把次要操作一律塞进 Modal？
- **响应式与可达性**：是否存在视口溢出错位、对比度不足或不可键盘操作控件？

## 修复与输出规则

- **Fix-First**：明显且局部的 bug、死代码、纯转发层、漏掉的空/错态、硬编码样式对齐与拼写/类型疏漏直接修复并在报告列出（**若本步修改了代码，后续必须重新执行 `/bot-verify`**）。
- **硬闸门 #1**：凡涉及改变架构、公开接口、范围取舍或不确定意图的问题，停下来列成选项交用户拍板。
- **输出分栏**：分别报告 `Adversarial` / `Spec & Standards` / `Bloat Audit`（以及涉及 UI 时的 `UI & UX Audit`）发现与修复结果，严禁捏造未验证的行号或输出。

{{STAGE_RULES}}
