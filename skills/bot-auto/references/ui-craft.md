# UI 与现代 Web 工程工艺参考（仅涉及界面/官网/样式/交互时按需加载）

> 适用：官网/着陆页（Mode A）与产品前端/工作台（Mode B）。纯后端/CLI 任务勿读。

---

## 1. 审美红线与 Craft Floor（反 AI 模板味）

- **禁用 5 类 AI 默认皮肤**：① 暖米白 `#F4F1EA` 配赤陶橙 `#D97757`；② 纯黑底荧光绿发光 Bento；③ 无主题宽报拼贴；④ “主标题 + 副标题 + 3 列彩色圆圈图标卡”；⑤ 标题上方全大写微药丸（eyebrow pill）+ 按钮内嵌 `→`/`↗`。
- **容器与层次节制**：严禁**卡片套卡片**；一套界面只选一种层次手段（色阶差 / 极细描边 / 极柔阴影 三选一）；禁手绘涂鸦 SVG、多余图注、把多步骤详情硬塞 Modal。
- **几何与色彩**：同心圆角 `innerRadius = outerRadius - padding`；中性灰带轻微品牌色相（Tinted Grays）；**严禁彩底灰字**（改用同色相深/浅阶）；渐变优先 `oklch` 多停靠点插值消生硬灰带。
- **浏览面打磨**：同步定制 `::selection`、`caret-color`、`scrollbar-color`/`scrollbar-gutter` 与清晰 `:focus-visible` 焦点环，兼容高对比度。

---

## 2. 界面双模式分流 & Skeleton Test

动手或评审前先锁定模式，严禁拿官网留白套工具台：

- **Mode A: Marketing / Persuade（官网 / 着陆页）**
  - **首屏三要素**：一眼讲清 **卖什么 + 给谁用 + 至少 1 个硬事实**，直接露出**可工作的首要转化动作**（非装饰锚点）；
  - **文案与材质**：主动语态、实义标题、动词+宾语按钮，禁虚构人名/客户数/假指标；软件优先**真实产品画面/架构图**，消费/服务用**真实摄影+版式+色块**（WebGL 仅技术/游戏确有必要时用并带降级）；
  - **节奏**：桌面 `min-h-[100dvh]`/`100svh` 1–2 屏 1 观点 + 大留白（`py-24` 起）+ 全页垂直对齐边界。
- **Mode B: App / Workbench（产品应用 / 高密度工作台）**
  - **主画布优先**：首屏让给核心工作区，**禁搬营销页 `min-h-[100dvh]` 分屏与 `py-24` 大留白**；
  - **固定壳层 + 独立滚动**：顶/侧壳层锁定，长列表虚拟化或 `content-visibility: auto`；
  - **键盘流与防跳动**：高频操作支持键盘直达与就地反馈（禁全屏成功页/多余弹窗），`4px/8px` 紧凑网格，动态数值/徽章固定槽宽 + `tabular-nums`。
- **Skeleton Test（双模式必过）**：抽干全部文案和图片后，仅靠排版比例、空间分区与母题能否立住主次与气质？全靠字大或边框撑住即未过关。

---

## 3. 排版微雕

- **角色字栈**：区分 Display / Body-UI / Mono，禁无意识裸系统字栈；自定义字体配 `size-adjust`/`font-size-adjust` 防闪烁，全站 `rem` 尊重缩放。
- **校准数值**：大标题收紧字距（英文 `-0.02em`，行高 `1.15–1.3`）+ `text-wrap: balance`；正文限宽（英文 `<= 65ch`，中文 `30–40` 字/行，行高 `1.65–1.8`）+ `text-wrap: pretty`；数据/指标列 `font-variant-numeric: tabular-nums`；少用 `900`/`700`，靠尺度与留白拉层级。

---

## 4. 物理手感与动效编排

- **曲线与时长**：进场/交互统一 `ease-out`（`cubic-bezier(0.23, 1, 0.32, 1)`），**禁 `ease-in` 与机械 `linear`**；功能交互 `< 300ms`；点击 `:active { transform: scale(0.97) }`；浮层设触发点 `transform-origin`。
- **编排四律**：① 划分 `Lead`（主角先动）→ `Support` → `Decoration`（仅淡入）→ `Static`；② **每容器单次入场**，严禁外层入场 + 子列表二次 stagger；③ **高频操作零延迟零 stagger**（仅首访首屏可用非线性波浪 `100–150ms` 总长 `0.5–0.6s`）；④ 只动画 `transform`/`opacity`，`backdrop-blur` 仅限 `fixed`/`sticky` 层，退场立即离流，必支持中途打断与 `prefers-reduced-motion`。

---

## 5. 现代原生 Web 平台优先（反历史 JS Hack · 渐进增强）

- **Baseline 兼容基线**：未声明策略时默认 **Baseline Widely Available**；Newly Available 按风险分流：① 忽略即安全退化（`field-sizing`、`text-wrap: balance`）直接用并设 `min/max`；② 核心交互用 `@supports` 或极简分支降级，禁臃肿 Polyfill、禁未经授权用单引擎未稳特性。**改造存量代码时保留刻意的 `@supports` 兜底与虚拟滚动测量，禁盲删降级分支。**
- **原生顶层交互层**：
  - 模态框用 `<dialog>` + `showModal()`（支持 `closedby="any"` 与原生 `Esc`/焦点锁定；**禁手写 `e.target === dialog` 关窗破坏拖拽选字**，勿重复加 `role="dialog"`/`aria-modal`；SSR 做好 `window`/`HTMLElement` 守卫）；
  - 菜单/气泡用 `popover` + `popovertarget` + Anchor Positioning（配合 `@starting-style` + `transition-behavior: allow-discrete`）。
- **表单与 CJK 输入法安全**：
  - **IME 守卫**：所有 `Enter` 提交输入/textarea **必加 `if (e.isComposing || e.keyCode === 229) return;`**；
  - **交互后校验**：用 `:user-invalid`/`:user-valid` 同步 `aria-invalid`，**禁裸 `:invalid` 首屏飘红**；
  - **零重排与原生控件**：多行增高用 `field-sizing: content`（配 `min/max-block-size`，**禁每次输入读 `scrollHeight`**）；补齐标准 `autocomplete`；优先 `accent-color`、`color-scheme`、`<input type="checkbox" switch>` 而非 `div` 假控件。
- **现代 CSS 架构**：折叠过渡用 `interpolate-size: allow-keywords` / `calc-size()` / Grid `0fr → 1fr`（**禁 `max-height: 9999px`**），页内可查找折叠用 `hidden="until-found"`/`<details>`；组件响应优先 `@container` + `subgrid`；状态联动用 `:has(:checked|:focus-visible|:user-invalid)` 替代 JS 搬运 class；双主题用 `color-scheme: light dark` + `light-dark()`。
- **Core Web Vitals 与安全**：首屏 LCP 主图设 `fetchpriority="high"`（**禁 `loading="lazy"`**），媒体声明尺寸/`aspect-ratio` 防 CLS；滚动期禁同步重排（延至 `scrollend`），长任务 `scheduler.yield()`，离屏/后台停 `<canvas>`/轮询；外链 CDN 必带 `integrity`（SRI）+ `crossorigin="anonymous"`，不可信 HTML 必经 Sanitizer/Trusted Types（禁裸 `innerHTML`）。

---

## 6. 评审判词与手术调校四动词

先给**独特性判词**：“抽掉品牌名和文案，是否换个同类 Logo 也能套用？”再按病因择一修复：
- **提纯（Distill）**：砍嵌套卡、冗余边框/色值与可被原生 HTML/CSS 替代的 JS 胶水；Mode A 每屏 1 动作，Mode B 去画布遮挡；
- **降噪（Quieter）**：收高饱和色与字重冲突，用 tinted gray 与呼吸留白做有观点的克制；
- **强化（Bolder）**：不加新色/新字，只把已有最强母题、标题尺度与对比拉满并通过 Skeleton Test；
- **打磨（Polish）**：在 `1440 / 768 / 390` 实测溢出、交互五态、IME 安全、焦点管理、对比度与字体稳定。
