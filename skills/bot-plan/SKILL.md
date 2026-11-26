---
name: bot-plan
description: "Turn aligned design into executable spec, tracer-bullet vertical slices with blocking edges, data-flow failure analysis, UI design checks when UI is touched, and test seams. Use for: plan feature, write spec, split tickets, bot plan."
---

# /bot-plan — 规格、工程深审与纵向切片

目标：把已对齐的想法拆成**可独立验证的纵向切片（Tracer Bullets）**，在写代码前锁死数据流、不可逆风险（One-way door）、热路径复杂度、失败模式、UI 交互态（若涉及界面）与公共测试接缝（Seam）。

## 通用流控与极简铁律

1. **业务问透优先，按题量/题型分流（别乒乓，也不削足适履）**：澄清多个独立问题或取舍时合并一次抛出，每题给出默认推荐与理由，**严禁为迁就交互工具的题数/字数上限而删减业务问题或把开放题硬改选择题**：
   - **≤ 4 个独立离散选择题**：直接用宿主交互式多选工具一次点选；
   - **> 4 题、以开放性业务问题为主，或宿主无交互工具**：改用**正文分组编号清单**（标清默认推荐，支持用户回“全默认，仅改第 N 题”），输出后**立即结束本轮等待用户回复**，不要同轮再弹截断式提问框，严禁自问自答。
2. **三道硬暂停闸门（未经用户明确同意，严禁自行执行）**：
   - **重大决策**：架构路线、模块公开契约/Schema 变更、不可逆 `One-way door` 变更、删减核心范围、引入新依赖或不可逆操作。
   - **创建分支或 worktree**：执行 `git checkout -b` / `git switch -c` / `git worktree add` 前必须先询问确认分支名与基线。
   - **发布与合并**：执行 `git push`、创建/合并 PR、发版构建或线上部署前必须先询问确认。
   其余探索、测试、局部重构与修 bug 连续推进，不要琐碎弹窗打断心流。
3. **极简编码与反退化四铁律（写任何代码前先过一遍）**：
   - **复用阶梯**：`仓库已有 helper / 模式 → 语言标准库 → 平台原生特性（如原生 HTML/CSS、DB 约束）→ 已安装依赖`，在最高一层能解决就止步，严禁未经确认新增包。
   - **三次法则（Rule of Three）**：同一逻辑未真实出现 3 次且无第二个真实调用方时，禁止提前抽工厂、策略类、通用配置层或猜测性抽象。
   - **零纯转发**：禁止写只透传参数的中间转发函数（Middle Man），禁止为不可能发生的内部状态写冗余兜底分支。
   - **严禁类型逃逸与假默认值投毒**：系统边界入参必须显式窄化校验，内部不变量损坏必须快速失败（Fail-Fast）；**严禁用双层类型强转（`as any` / `as unknown as T` / `@ts-ignore` / `# type: ignore`）消音，严禁用 `?? 0`、`?? ''`、`?? []` 把上游契约断裂静默吞成合法假数据**。
4. **宿主交互与工具映射**：采用宿主中立表达：读取/编辑文件、执行终端命令、代码库检索、向用户批量提问（≤4 个独立选择题用交互式多选工具；超 4 题、含开放性业务问题或无工具时用正文分组编号清单等待用户回复，业务问清楚优先）。

## 执行步骤

1. **接口深度、门型识别、复杂度与故障检查**：
   - 优先复用已有接缝与深模块（少接口、高内聚），警惕浅模块、信息泄露、纯透传函数与手同步双份清单。
   - **前置标定 `Two-way door` vs `One-way door`**：明确判定本次改动是否包含**不可逆/高迁移成本变更（`One-way door`：DB Schema 删改列、本地持久化格式变更、公开 API 破坏性变更或权限模型调整）**；凡属 `One-way door`，必须在规格中写明兼容演进路径（Expand–Contract）、旧数据回填/兼容读取与回滚验证方案。
   - **数据规模与热路径预审**：评估真实数据量级，提前规避循环内串行 I/O / N+1 查询、大集合嵌套扫描（`O(N²)`）与无上限全量同步读入内存。
   - 用简明 ASCII 图画出核心数据流/状态流，并为每条新路径标出**至少 1 个真实生产故障点**及其错误处理/可观测性（禁止静默吞错或用假默认值掩盖契约异常）。
2. **UI 与现代 Web 设计检查（仅涉及页面 / 组件 / 样式 / 交互时必做，按需参考 `references/ui-craft.md`——若路径以 `references/` 开头则相对于本 `SKILL.md` 所在目录解析；纯后端/CLI 直接跳过）**：
   - **对齐设计系统、界面模式与兼容基线**：优先读取根目录 `DESIGN.md` 并锁定界面属于 **Mode A（Marketing 叙事转化页）** 还是 **Mode B（Workbench 高频生产力工具台）**；若无 `DESIGN.md`：① 已有前端代码先从现有 CSS 变量/主题配置反推提炼精简 `DESIGN.md`；② 全新空白项目先确定模式、色板（含 tinted gray）、字阶、圆角与间距落盘 `DESIGN.md`（或记入本次 `spec.md`）。优先选用 **Baseline 原生 HTML/CSS 能力**（如 `<dialog>`、`popover`、`@container`、`field-sizing`、`light-dark()`），避免为浏览器已原生支持的行为规划冗余 JS 状态库。
   - **交互五态与输入安全补齐**：明确规格中的**空态（Empty，含引导动作）、加载态（Loading）、错态（Error + `:user-invalid` 交互后校验 + 可恢复路径）、长文本/极大数据溢出（Overflow）与首次使用引导**；凡含回车提交的输入框明确标注中文/CJK 输入法 `isComposing` 守卫。
   - **屏幕节奏 / 工作区密度、Skeleton Test 与动效角色**：Mode A 按 `min-h-[100dvh]` 1 屏 1 观点与全页对齐边界组织叙事（首屏 LCP 主图禁懒加载并锁定宽高比防 CLS），Mode B 优先保障主工作区首屏面积、固定壳层独立滚动与高频键盘流（禁套营销页 `py-24` 大留白）；统一通过**无文案骨架校验（Skeleton Test）**，并为有动效的区域划分 **Lead / Support / Decoration / Static**（坚持每容器单次入场、高频操作零延迟零 stagger）。
   - **响应式与可达性（A11y）**：说明桌面/平板/手机多断点与容器级布局意图（非简单纵向堆叠）、原生焦点管理、清晰 `:focus-visible` 焦点环、对比度（严禁彩底灰字）与 `rem` 缩放兼容。
3. **测试接缝与跨层契约锁定（Seam & Round-Trip First）**：
   - 在写测试前，明确写出每个关键路径的**公共边界接缝（Seam）**、断言目标（保护什么不变量、什么回归会让它失败）与测试类型（单测 / 集成 / E2E）。
   - **跨层契约往返要求**：凡同时改动生产方与消费方（前后端字段、序列化读写、CLI 参数），必须规划至少 1 条**不 Mock 该契约边界的真实往返测试（Round-trip Test）**。
4. **自包含规格与纵向切片拆票**：
   - 每个 ticket 必须是从输入到输出可独立跑通验证的**垂直切片**（不要按“全做 schema → 全做 API → 全做 UI”横向切片）。
   - 大范围机械重构或 `One-way door` 变更采用 **Expand–Contract**（先兼容扩展、分批迁移、最后收口删除旧路径），确保每步绿色。
   - 若项目已有工单约定按其落盘（项目 `.scratch/` 或 issue tracker）；无既有约定则在 `.scratch/<feature>/` 自包含落盘：
     - `spec.md`：`Necessity / Why`（根问题与不做代价）/ `Door Type & Rollback`（Two-way or One-way door）/ `Problem` / `Solution` / `Decisions` / `Data Flow & Failure Modes` / `UI & States (if applicable)` / `Test Seams` / `Out of Scope (Cut List)`；
     - `issues/<NN>-<slug>.md`（一票一文件）：`Status: ready-for-agent`、`Blocked by: <NN | None>`、`Touched Paths: <预计读写文件或目录范围>`（供并行分派做写冲突隔离判定）、**交付行为**、**公共测试接缝**与**验收清单**。
5. **对齐确认**：当本阶段发现 `/bot-think` 未覆盖的跨模块/Schema/`One-way door`/UI 主结构/范围变更时，触发**硬闸门 #1**由用户确认；已对齐则直接进入 `/bot-build`。
