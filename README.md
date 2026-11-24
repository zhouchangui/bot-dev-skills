# bot-dev-skills

**一套独立自包含、零运行时包袱的 `9 + 1` AI 研发流水线技能体系。**

把第一性原理必要性审查、构思澄清、工程深审与纵向切片、极简 TDD、紧反馈根因调试、有界质量收敛闭环、多维合入评审、确定性校验、受控交付与环境复盘收敛成一条低阻力的固定骨干流程；开箱支持 **[skills.sh](https://skills.sh) 一键安装（`npx skills add`）**，也支持纯 Node.js（`>=22`）单源编译投递到 **DSH**、**Antigravity / Codex（`.agents/skills`）** 与 **Claude Code（`.claude/skills`）**。

---

## 核心理念：心流优先，边界清晰

1. **业务问透优先，按题型分流**：澄清多个独立问题时合并一次抛出并给出默认推荐——≤ 4 个独立选择题用交互式多选工具快速点选；超 4 题或含开放性业务问题时改用正文分组编号清单等待回复，严禁为迁就弹窗上限删减业务问题。
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
| `/bot-auto` | 0. 全流程自动编排 | 按 S/M/L 智能跳步并串起全流程，**内置有界 `Verify ⇄ Review ⇄ Fix` 质量收敛闭环（含目标验收矩阵、P0/P1/P2 分级、双熔断与 L 级内外双环）** | **统一守三道闸门** |
| `/bot-think` | 1. 构思与澄清 | **第一性原理功能必要性审查（反 XY Problem / 减法四问 / Cut List / Option 0）**、批量澄清、**设计系统与首屏说服定调（`DESIGN.md`/HTML 预览）**、2–3 套备选方案、ADR/设计落盘 | **闸门 #1** |
| `/bot-plan` | 2. 规格与切片 | 接口深审、ASCII 数据流与故障点、**UI 五态 / Skeleton Test / 动效角色规划**、测试接缝、垂直切片 | **闸门 #1**（新增大改时） |
| `/bot-build` | 3. 极简实现（TDD 分流） | 复用阶梯 + 接缝 TDD / Spike 探索 / **UI 状态分离与微动效工艺落地** + 写后去冗余 | **闸门 #2**（建分支前） |
| `/bot-debug` | 4. 根因调试 | 先复现稳定红灯 → 单一公共根因点修复 → 回归锁定 | — |
| `/bot-review` | 5. 多维合入评审 | **目标验收矩阵** + 对抗/混沌视角 + Spec/Standards 双轴 + 冗余审计 + **UI 独特性判词与四动词审计**（`P0/P1/P2` 分级 + M/L 级冷视角子代理 + Fix-First） | **闸门 #1**（重大改动时） |
| `/bot-verify` | 6. 校验与安全门禁 | 基线测试必跑 + 按影响面端到端验收 + 敏感面安全自检 | — |
| `/bot-ship` | 7. 交付与发布 | PR/单仓双模式同步、文档与 `CHANGELOG.md` 收口、证据摘要 | **闸门 #3**（推送/合并前） |
| `/bot-retro` | 8. 复盘与环境进化 | 把机械失误下沉为 linter/hook/测试，清理无效文本，进化模板 | — |

> 注：本仓 `skills/` 目录为已编译、零占位符的 **Agent Skills / `skills.sh` 标准分发产物**（含每个 UI 相关技能内置的 `references/ui-craft.md`），仅在任务涉及界面/官网/样式/交互时按需读取，纯后端/CLI 任务零开销；源码模板统一维护在 `templates/`。

---

## 快速开始

### 方式一：通过 `skills.sh` 一键安装（推荐 · 无需 clone）

适用于 **Antigravity、Claude Code、Codex、Cursor、Windsurf** 等所有兼容 [Agent Skills](https://agentskills.io/) / [skills.sh](https://skills.sh) 的编程 Agent：

```bash
# 安装全部 9 个技能到当前项目（默认写入 .agents/skills/ 并按所选宿主自动链接）
npx skills add zhouchangui/bot-dev-skills

# 全局安装（对本机所有项目生效）
npx skills add zhouchangui/bot-dev-skills -g

# 查看仓库提供的技能清单
npx skills add zhouchangui/bot-dev-skills --list

# 仅按需安装单个或指定技能（各技能均自包含所需 references/ui-craft.md）
npx skills add zhouchangui/bot-dev-skills --skill bot-auto --skill bot-think
```

> 非交互 / CI 场景可追加 `-y`、`-s '*'` 与 `-a <agents>`（如 `npx skills add zhouchangui/bot-dev-skills -a antigravity claude-code -s '*' -y`）。

### 方式二：源码编译器安装（DSH 单路由 & `.bot-skills.json` 项目定制）

当你需要 **DSH 单路由模式（`.dsh/skills/bot`）** 或希望通过 **`.bot-skills.json`** 注入项目专属测试/验收命令与附加规则时，使用零依赖本地编译器（前置要求：Node.js `>= 22.19.0`，无需 `npm install`）：

```bash
git clone https://github.com/zhouchangui/bot-dev-skills.git
cd bot-dev-skills

# 预览将要生成的文件（不落盘）
node scripts/install.mjs --target /path/to/your-repo --hosts dsh,agents,claude --dry-run

# 实际投递到目标仓库
node scripts/install.mjs --target /path/to/your-repo --hosts dsh,agents,claude
```

### 各宿主产物布局（方式二）

| `--hosts` 值 | 适用工具 | 产物路径 | 说明 |
| --- | --- | --- | --- |
| `dsh` | DeepSeek Harness (DSH) | `.dsh/skills/bot/SKILL.md`<br>`.dsh/bot-stages/bot-*/SKILL.md` | 单路由入口 + 独立阶段目录（自动写入 `.git/info/exclude`） |
| `agents` | Antigravity / Codex | `.agents/skills/bot-*/SKILL.md`<br>`.agents/skills/bot-*/agents/openai.yaml` | 宿主中立通用格式，自动校验 `description <= 1024` 字符 |
| `claude` | Claude Code | `.claude/skills/bot-*` | 默认建逐项软链指向 `../../.agents/skills/bot-*`；传 `--claude-copy` 可生成独立副本（若 `.claude/skills` 本身为目录软链则自动拒绝，防止误覆写） |

---

## 项目级覆写配置（`.bot-skills.json`，方式二适用）

在目标仓库根目录按需放置 `.bot-skills.json`，使用 `scripts/install.mjs` 编译时自动注入共享规范与对应阶段：

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

> **安全守卫**：安装器内置路径防护，硬性拦截任何解析后落入 `~/.dsh`、`~/.tianji` 或 `dsh-quant-dev` 的写入路径，拦截经由软链逃逸出 `targetDir` 的输出路径，且更新时只管理 `bot` 与 `bot-*` 前缀目录，不会改动目标仓库中既有的其他技能。

---

## 开发与测试

模板唯一真源位于 `templates/`；修改模板后运行构建命令同步生成 `skills/`（`skills.sh` 分发目录），并跑全量测试校验零漂移：

```bash
# 从 templates/ 重新编译生成 skills/（skills.sh 标准分发产物）
npm run build:skills

# 运行自动化测试（含 templates/ ↔ skills/ 字节级一致性与零占位符校验）
npm test
# 等价于: node --test tests/*.test.mjs
```

## License

[MIT](./LICENSE)
