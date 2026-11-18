# bot-dev-skills

**一套独立自包含、零运行时包袱的 `9 + 1` AI 研发流水线技能体系。**

把构思澄清、工程深审与纵向切片、极简 TDD、紧反馈根因调试、多维合入评审、确定性校验、受控交付与环境复盘收敛成一条低阻力的固定骨干流程；纯 Node.js（`>=22`）原生 ESM 单源编译，**零第三方 npm 依赖**，开箱支持 **DSH**、**Antigravity / Codex（`.agents/skills`）** 与 **Claude Code（`.claude/skills`）**。

---

## 核心理念：心流优先，边界清晰

1. **一次问透，不打乒乓**：需要澄清多个独立问题或取舍时，合并成一次结构化提问或编号清单，给出默认推荐选项后等待确认。
2. **三道硬暂停闸门**（未经明确同意绝不越权执行）：
   - **重大决策**：架构路线、公开契约/Schema、删减核心范围或引入新依赖；
   - **创建分支或 worktree**：执行 `git checkout -b` / `git switch -c` / `git worktree add` 前；
   - **发布与合并**：执行 `git push`、创建/合并 PR、发版打包或部署前。
3. **极简编码三铁律**：
   - **复用阶梯**：`仓库已有 helper / 模式 → 语言标准库 → 平台原生特性 → 已安装依赖`，能止步就止步；
   - **三次法则（Rule of Three）**：同一逻辑出现不足 3 次且无第二个真实调用方时，禁止提前抽工厂/策略/包装层；
   - **零纯转发**：禁止只做参数透传的 Middle Man 函数与冗余防御分支。

---

## 流水线全景（9 + 1）

```text
/bot-auto (一键全流程编排)
   └──▶ /bot-think ──▶ /bot-plan ──▶ /bot-build (or /bot-debug) ──▶ /bot-review ──▶ /bot-verify ──▶ /bot-ship ──▶ /bot-retro
```

| 技能 | 阶段 | 核心职责 | 硬闸门 |
| --- | --- | --- | --- |
| `bot` | 总路由（DSH） | 列出阶段地图与铁律，按路径按需直读 | — |
| `/bot-auto` | 0. 全流程自动编排 | 按 S/M/L 规模智能跳步并串起全流程，仅在闸门停顿 | **统一守三道闸门** |
| `/bot-think` | 1. 构思与澄清 | 前提挑战、批量澄清、**设计系统与首屏说服定调（`DESIGN.md`/HTML 预览）**、2–3 套备选方案、ADR/设计落盘 | **闸门 #1** |
| `/bot-plan` | 2. 规格与切片 | 接口深审、ASCII 数据流与故障点、**UI 五态 / Skeleton Test / 动效角色规划**、测试接缝、垂直切片 | **闸门 #1**（新增大改时） |
| `/bot-build` | 3. 极简实现（TDD 分流） | 复用阶梯 + 接缝 TDD / Spike 探索 / **UI 状态分离与微动效工艺落地** + 写后去冗余 | **闸门 #2**（建分支前） |
| `/bot-debug` | 4. 根因调试 | 先复现稳定红灯 → 单一公共根因点修复 → 回归锁定 | — |
| `/bot-review` | 5. 多维合入评审 | 对抗/混沌视角 + Spec/Standards 双轴 + 冗余审计 + **UI 独特性判词与四动词审计**（Fix-First） | **闸门 #1**（重大改动时） |
| `/bot-verify` | 6. 校验与安全门禁 | 基线测试必跑 + 按影响面端到端验收 + 敏感面安全自检 | — |
| `/bot-ship` | 7. 交付与发布 | PR/单仓双模式同步、文档与 `CHANGELOG.md` 收口、证据摘要 | **闸门 #3**（推送/合并前） |
| `/bot-retro` | 8. 复盘与环境进化 | 把机械失误下沉为 linter/hook/测试，清理无效文本，进化模板 | — |

> 注：安装器同时在各宿主 `bot-auto/references/ui-craft.md` 随附一份**按需加载的设计与微动效工艺参考表**（含反 AI 默认皮肤、Persuade 官网构图、中文微排版、`ease-out` 物理参数与 `Skeleton Test`）；仅在任务涉及界面/官网/样式/交互时由对应阶段读取，纯后端/CLI 任务零开销。

---

## 快速开始

### 前置要求

* Node.js `>= 22.19.0`（纯内置模块运行，无需 `npm install`）

### 安装到目标项目

```bash
git clone https://github.com/zhouchangui/bot-dev-skills.git
cd bot-dev-skills

# 预览将要生成的文件（不落盘）
node scripts/install.mjs --target /path/to/your-repo --hosts dsh,agents,claude --dry-run

# 实际投递到目标仓库
node scripts/install.mjs --target /path/to/your-repo --hosts dsh,agents,claude
```

### 各宿主产物布局

| `--hosts` 值 | 适用工具 | 产物路径 | 说明 |
| --- | --- | --- | --- |
| `dsh` | DeepSeek Harness (DSH) | `.dsh/skills/bot/SKILL.md`<br>`.dsh/bot-stages/bot-*/SKILL.md` | 单路由入口 + 独立阶段目录（自动写入 `.git/info/exclude`） |
| `agents` | Antigravity / Codex | `.agents/skills/bot-*/SKILL.md`<br>`.agents/skills/bot-*/agents/openai.yaml` | 宿主中立通用格式，自动校验 `description <= 1024` 字符 |
| `claude` | Claude Code | `.claude/skills/bot-*` | 默认建逐项软链指向 `../../.agents/skills/bot-*`；传 `--claude-copy` 可生成独立副本（若 `.claude/skills` 本身为目录软链则自动拒绝，防止误覆写） |

---

## 项目级覆写配置（`.bot-skills.json`）

在目标仓库根目录按需放置 `.bot-skills.json`，编译时自动注入共享规范与对应阶段：

```json
{
  "tracker": ".scratch",
  "checkCommand": "pnpm check",
  "verifyCommand": "pnpm test:e2e",
  "protectedPaths": [],
  "rules": {
    "global": [
      "全局项目约定..."
    ],
    "perStage": {
      "bot-verify": [
        "仅影响核心链路时触发端到端验证..."
      ]
    }
  }
}
```

> **安全守卫**：安装器内置路径防护，硬性拦截任何解析后落入 `~/.dsh`、`~/.tianji` 或 `dsh-quant-dev` 的写入路径，且更新时只管理 `bot` 与 `bot-*` 前缀目录，不会改动目标仓库中既有的其他技能。

---

## 运行测试

```bash
npm test
# 等价于: node --test tests/*.test.mjs
```

## License

[MIT](./LICENSE)
