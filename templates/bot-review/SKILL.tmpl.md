---
name: bot-review
order: 5
stage: 5. 多维合入评审
description: "Unified pre-landing review: goal acceptance check + Adversarial/Chaos pass + dual-axis (Standards w/ Fowler smells + Spec compliance) + bloat audit + conditional UI audit with P0/P1/P2 severity triage and Fix-First. Use for: review diff, code review, check pr, bot review."
---

# /bot-review — 对抗 + 双轴 + 冗余 + UI 融合评审

目标：合并前把关。用一次结构化审查同时核对**目标验收是否彻底闭环**、系统会不会在线上炸、代码是否符合标准与规格、有没有冗余膨胀，以及（若改到界面）设计系统与交互五态是否到位，按 `P0 / P1 / P2` 分级并直接修复确定性问题（Fix-First）。

{{PREAMBLE}}

## 审查范围锁定

1. 确定对比基准（`git diff <base>...HEAD` + 未提交改动）。
2. 同步读入用户原始目标、源 spec / ticket（{{TRACKER_HINT}}）、项目规范/设计文档（如 `AGENTS.md`、`DESIGN.md`）以及最新 `/bot-verify` 实测输出，列出**目标验收矩阵（`AC-1..N`）**作为核对依据。

## 多维独立检查清单（不合并打分）

> **独立冷视角原则**：支持子代理的宿主对 **M/L 级改动默认派干净上下文独立子代理**执行审查（隔离作者对话历史与主观推理；传入 `git diff <base>...HEAD` + 验收矩阵 + `/bot-verify` 实测输出，同时开放代码库只读检索及 `AGENTS.md` / `DESIGN.md` 读取权限，以实证核查未改调用方与既有 helper）；S 级或单代理宿主强制重读全量 diff，按 **目标验收 → 维度 A → B → C（→ D）** 依次独立核查并分栏输出，严禁笼统写“已检查无问题”。

### 维度 A：Adversarial & Production Failure（攻击者与混沌视角）
- **边界、权限与调用链**：越权访问、未校验输入、路径穿越、注入、空值/超大负载、并发竞争、部分写入崩溃恢复，以及**签名/行为变化后未同步更新的上游调用方**。
- **不可逆变更保护（One-way door）**：若触及 DB Schema、本地持久化格式或公开契约变更，核查是否具备兼容读取/迁移与回滚路径（缺失即判 P0）。
- **失败可见性**：是否存在错误被静默吞掉、超时未设、资源/文件句柄未关闭。

### 维度 B：Dual-Axis（目标验收 & Spec 符合度 + Standards）
- **目标验收与 Spec 符合度**：① 逐条核对 `AC-1..N` 是否均有代码实现与最新实测证据（缺一项即 P0）；② 偏离规格的行为；③ 对照 `Out of Scope (Cut List)` 严查未被要求的 **Scope Creep（额外加戏）**。
- **Standards & 代码坏味道**：先看仓库明文规范（优先级最高），再对照常见坏味道：**重复逻辑、神秘命名、过长参数团（Data Clumps）、过长开关分支、霰弹枪式修改（Shotgun Surgery）、消息链过长**。跳过 linter 已自动检查的格式项。

### 维度 C：极简冗余审计（Bloat Audit）
- **复用阶梯违规**：只读检索代码库确认是否重写了仓库已有 helper、标准库或平台原生能力？
- **早熟抽象（Rule of Three）**：是否为了 1–2 个调用点新建了工厂/策略类/抽象接口？
- **胶水与死代码**：是否存在纯转发函数（Middle Man）、>2 个纯透传胶水文件、或为不可能状态编写的冗余防御分支与未使用的导出？

### 维度 D：UI 与交互审计（仅 diff 涉及页面 / 组件 / 样式 / 交互时必查，对照 `{{UI_CRAFT_PATH}}`——若路径以 `references/` 开头则相对于本 `SKILL.md` 所在目录解析；否则写 `无 UI 改动，跳过`）
- **界面模式、独特性判词 & Skeleton Test**：先核对页面属于 **Mode A（Marketing 叙事面）** 还是 **Mode B（Workbench 工具台面）**（勿拿官网大留白苛求高频工具台，也勿拿工具台密度堆砌官网），再明确判定“抽掉品牌名和文案，是否一眼像同类可互换模板？无文案骨架主次是否立得住？”
- **设计与微工艺偏移**：是否违背 `DESIGN.md`、出现硬编码色/间距、彩底灰字、漏改 `::selection`/`:focus-visible` 浏览面，或违背物理动效与 GPU 约束（出现 `ease-in`/`linear` 入场、容器+子项双重延迟、大面积滚动 `backdrop-blur`）？
- **边缘五态与多断点**：空态、加载态、错态（可恢复）、长文本溢出与首用态是否遗漏？`1440 / 768 / 390` 等视口下是否错位、低对比或不可键盘操作？
- **反套路视觉红线**：是否出现**卡片套卡片**、AI 默认皮肤、三栏彩色圆圈图标网格、标题上方全大写小药丸、`→`/`↗` 装饰按钮、暗底霓虹光晕或假指标占位？Fix-First 按 **`提纯 / 降噪 / 强化 / 打磨`** 四动词精准修复。

## 分级、修复与输出规则

- **严重级分流（`P0 / P1 / P2`）**：
  - **P0（阻断 · 必修）**：验收项遗漏/无实测证据、功能 bug、安全/边界漏洞、不可逆变更缺失兼容/回滚保护、验证失败、UI 不可用或缺失可恢复错态；
  - **P1（质量提升 · 可自主修）**：坏味道、违背极简三铁律、薄弱测试（smoke-only 或漏失败路径）、UI 独特性/微排版/五态/动效瑕疵；
  - **P2（锦上添花 · 只记录不改）**：风格偏好或范围外优化，记入交付说明/待办，不触发新改代码轮次。
- **Fix-First 与反作弊红线**：局部明确的 P0/P1 直接修复并在报告列出（**凡修改了代码，后续必须重新执行 `/bot-verify`**）；**严禁通过删测试、弱化断言、加 `skip`、空 `catch` 或放宽类型来换取通过**。
- **硬闸门 #1**：凡涉及改变架构、公开接口、`One-way door` 迁移方案、新依赖、范围取舍或不确定意图的问题，停下来列成选项交用户拍板。
- **输出分栏**：分别报告 `Goal Acceptance (AC-1..N)`、`Adversarial`、`Spec & Standards`、`Bloat Audit`（以及涉及 UI 时的 `UI & UX Audit`）的 `P0/P1/P2` 计数、发现与修复结果，严禁捏造未验证的行号或输出。

{{STAGE_RULES}}
