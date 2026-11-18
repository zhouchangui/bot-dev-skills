---
name: bot-review
order: 5
stage: 5. 多维合入评审
description: "Unified pre-landing review: gstack Adversarial/Chaos pass + mattpocock dual-axis (Standards w/ Fowler smells + Spec compliance) + Ponytail bloat audit with Fix-First. Use for: review diff, code review, check pr, bot review."
---

# /bot-review — 对抗 + 双轴 + Ponytail 冗余融合评审

目标：合并前把关。用一次结构化审查同时覆盖“系统会不会在线上炸”“代码是不是符合标准与规格”“有没有 AI 冗余代码”，并直接修复确定性小问题（Fix-First）。

{{PREAMBLE}}

## 审查范围锁定

1. 确定对比基准（`git diff <base>...HEAD` + 未提交改动）。
2. 若有源 spec / ticket（{{TRACKER_HINT}}）与项目规范文档，同步读入作为对照依据。

## 三维并行检查清单（不要合并混淆）

### 维度 A：Adversarial & Production Failure（攻击者与混沌视角）
- **边界与权限**：越权访问、未校验输入、路径穿越、注入、空值/超大负载、并发竞争与部分写入崩溃恢复。
- **失败可见性**：是否存在错误被静默吞掉、超时未设、资源/文件句柄未关闭。

### 维度 B：Dual-Axis（Spec 符合度 + Standards）
- **Spec 符合度**：① 漏掉的规格需求；② 偏离规格的行为；③ 未被要求的 **Scope Creep（额外加戏）**。
- **Standards & Fowler 坏味道**：先看仓库明文规范（优先级最高），再对照代码坏味道：**重复逻辑、神秘命名、过长参数团（Data Clumps）、过长开关分支、霰弹枪式修改（Shotgun Surgery）、消息链过长**。跳过 linter 已自动检查的格式项。

### 维度 C：Ponytail 冗余审计（严抓 AI 膨胀）
- **复用阶梯违规**：是否重写了仓库已有 helper、标准库或平台原生能力？
- **早熟抽象（Rule of Three）**：是否为了 1–2 个调用点新建了工厂/策略类/抽象接口？
- **胶水与死代码**：是否存在纯转发函数（Middle Man）、>2 个纯透传胶水文件、或为不可能状态编写的冗余防御分支与未使用的导出？

## 修复与输出规则

- **Fix-First**：明显且局部的 bug、死代码、纯转发层、拼写/类型疏漏直接修复并在报告列出。
- **硬闸门 #1**：凡涉及改变架构、公开接口、范围取舍或不确定意图的问题，停下来列成选项交用户拍板。
- **输出分栏**：分别报告 `Adversarial` / `Spec & Standards` / `Ponytail Bloat` 发现与修复结果，严禁捏造未验证的行号或输出。

{{STAGE_RULES}}
