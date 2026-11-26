import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ALLOWED_HOSTS = new Set(['dsh', 'agents', 'claude']);

/**
 * Resolve a path through symlinks even when trailing segments do not yet exist.
 */
function resolveRealPath(targetPath) {
  const abs = path.resolve(targetPath);
  const tail = [];
  let cursor = abs;

  while (!fs.existsSync(cursor)) {
    const parent = path.dirname(cursor);
    if (parent === cursor) break;
    tail.unshift(path.basename(cursor));
    cursor = parent;
  }

  const baseReal = fs.existsSync(cursor) ? fs.realpathSync(cursor) : cursor;
  return path.join(baseReal, ...tail);
}

function isInsideOrEqual(candidate, protectedRoot) {
  const rel = path.relative(protectedRoot, candidate);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

/**
 * Hard-block writes into protected DSH/tianji instances outside this project.
 */
export function safetyGuard(targetPath, extraProtected = []) {
  const home = os.homedir();
  const candidates = [
    path.join(home, '.dsh'),
    path.join(home, '.tianji'),
    ...(process.env.LOCALAPPDATA ? [path.join(process.env.LOCALAPPDATA, 'dsh-quant-dev')] : []),
    ...extraProtected,
  ];

  const resolvedTarget = resolveRealPath(targetPath);
  for (const raw of candidates) {
    const resolvedProtected = resolveRealPath(raw);
    if (isInsideOrEqual(resolvedTarget, resolvedProtected)) {
      throw new Error(`Refusing protected path write: ${targetPath} resolves inside ${resolvedProtected}`);
    }
  }
}

export function loadProjectConfig(targetDir) {
  const cfgPath = path.join(targetDir, '.bot-skills.json');
  if (!fs.existsSync(cfgPath)) return {};

  const parsed = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`Invalid .bot-skills.json at ${cfgPath}: expected object`);
  }
  return parsed;
}

/**
 * Compute deterministic version + 12-char SHA-256 digest across package version, hosts, and templates.
 */
export function computeSourceVersion(sourceDir) {
  const resolvedSource = path.resolve(sourceDir);
  const pkgPath = path.join(resolvedSource, 'package.json');
  const version = fs.existsSync(pkgPath)
    ? JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version || '0.0.0'
    : '0.0.0';

  const hash = crypto.createHash('sha256');
  hash.update(`version:${version}\n`);

  const collectFiles = (dir, relBase = '') => {
    if (!fs.existsSync(dir)) return [];
    const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    const files = [];
    for (const entry of entries) {
      const rel = relBase ? `${relBase}/${entry.name}` : entry.name;
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...collectFiles(abs, rel));
      } else if (entry.isFile()) {
        files.push({ rel, abs });
      }
    }
    return files;
  };

  for (const sub of ['hosts', 'templates']) {
    for (const file of collectFiles(path.join(resolvedSource, sub), sub)) {
      hash.update(`file:${file.rel}\n`);
      hash.update(fs.readFileSync(file.abs));
      hash.update('\n');
    }
  }

  const digest = hash.digest('hex').slice(0, 12);
  return { version, digest, stamp: `v${version}+${digest}` };
}

function parseFrontmatter(raw, filePath) {
  if (!raw.startsWith('---\n')) {
    throw new Error(`Missing YAML frontmatter in ${filePath}`);
  }
  const end = raw.indexOf('\n---\n', 4);
  if (end === -1) {
    throw new Error(`Unterminated YAML frontmatter in ${filePath}`);
  }

  const meta = {};
  for (const line of raw.slice(4, end).split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    meta[key] = key === 'order' ? Number(val) : val;
  }

  return { meta, body: raw.slice(end + 5).replace(/^\n+/, '') };
}

function loadHostConfigs(sourceDir, hosts) {
  const out = {};
  for (const host of hosts) {
    if (!ALLOWED_HOSTS.has(host)) {
      throw new Error(`Unknown host "${host}". Expected one of: ${[...ALLOWED_HOSTS].join(', ')}`);
    }
    const hostPath = path.join(sourceDir, 'hosts', `${host}.json`);
    out[host] = JSON.parse(fs.readFileSync(hostPath, 'utf8'));
  }
  return out;
}

function loadSkillTemplates(sourceDir) {
  const templatesRoot = path.join(sourceDir, 'templates');
  const dirs = fs
    .readdirSync(templatesRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.startsWith('bot-'))
    .map((d) => d.name)
    .sort();

  const skills = dirs.map((dirName) => {
    const filePath = path.join(templatesRoot, dirName, 'SKILL.tmpl.md');
    const raw = fs.readFileSync(filePath, 'utf8');
    const { meta, body } = parseFrontmatter(raw, filePath);

    if (meta.name !== dirName) {
      throw new Error(`Skill name "${meta.name}" must match directory "${dirName}"`);
    }
    if (!meta.description) {
      throw new Error(`Skill "${dirName}" is missing description`);
    }
    return {
      name: meta.name,
      order: Number.isFinite(meta.order) ? meta.order : 999,
      stage: meta.stage || meta.name,
      description: meta.description,
      body,
    };
  });

  return skills.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

function formatProjectContext(projectConfig) {
  const lines = [];
  if (projectConfig.tracker) lines.push(`- 工单/规格目录：\`${projectConfig.tracker}\``);
  if (projectConfig.checkCommand) lines.push(`- 常规检查命令：\`${projectConfig.checkCommand}\``);
  if (projectConfig.verifyCommand) lines.push(`- 本地应用/集成验收：\`${projectConfig.verifyCommand}\``);
  const globalRules = Array.isArray(projectConfig.rules?.global) ? projectConfig.rules.global : [];
  for (const rule of globalRules) {
    lines.push(`- 项目规则：${rule}`);
  }
  if (lines.length === 0) return '';
  return `\n### 本项目约定\n\n${lines.join('\n')}`;
}

function formatStageRules(skillName, projectConfig) {
  const list = projectConfig.rules?.perStage?.[skillName];
  if (!Array.isArray(list) || list.length === 0) return '';
  return `\n## 本项目阶段附加约束\n\n${list.map((r) => `- ${r}`).join('\n')}\n`;
}

function resolveStagePathPattern(hostCfg, pathPrefix = '') {
  const base = hostCfg.name === 'dsh' ? hostCfg.stagesDir : hostCfg.outputDir;
  return `${pathPrefix}${base}/<skill>/SKILL.md`;
}

function resolveUiCraftPath(hostCfg, pathPrefix = '') {
  const base = hostCfg.name === 'dsh' ? hostCfg.stagesDir : hostCfg.outputDir;
  return `${pathPrefix}${base}/bot-auto/references/ui-craft.md`;
}

function renderSkillMarkdown(
  skill,
  hostCfg,
  preambleTemplate,
  projectConfig,
  { pathPrefix = '', stagePathPattern, uiCraftPath } = {},
) {
  const limit = hostCfg.descriptionLimit ?? 1024;
  if (skill.description.length > limit) {
    throw new Error(
      `Skill "${skill.name}" description (${skill.description.length} chars) exceeds ${limit} for host "${hostCfg.name}"`,
    );
  }

  const preamble = preambleTemplate
    .replace('{{HOST_TOOL_NOTES}}', hostCfg.toolNotes)
    .replace('{{PROJECT_CONTEXT}}', formatProjectContext(projectConfig))
    .trim();

  const renderedBody = skill.body
    .replaceAll('{{PREAMBLE}}', preamble)
    .replaceAll('{{STAGE_PATH_PATTERN}}', stagePathPattern ?? resolveStagePathPattern(hostCfg, pathPrefix))
    .replaceAll('{{UI_CRAFT_PATH}}', uiCraftPath ?? resolveUiCraftPath(hostCfg, pathPrefix))
    .replaceAll('{{TRACKER_HINT}}', projectConfig.tracker ? `\`${projectConfig.tracker}\`` : '项目 `.scratch/` 或 issue tracker')
    .replaceAll('{{CHECK_COMMAND_HINT}}', projectConfig.checkCommand ? `\`${projectConfig.checkCommand}\`` : '项目 typecheck/test')
    .replaceAll('{{VERIFY_COMMAND_HINT}}', projectConfig.verifyCommand ? `\`${projectConfig.verifyCommand}\`` : '项目集成/冒烟验证')
    .replaceAll('{{STAGE_RULES}}', formatStageRules(skill.name, projectConfig))
    .trim();

  const leftover = renderedBody.match(/\{\{[A-Z0-9_]+\}\}/);
  if (leftover) {
    throw new Error(`Unrendered placeholder "${leftover[0]}" in skill "${skill.name}"`);
  }

  return `---\nname: ${skill.name}\ndescription: ${JSON.stringify(skill.description)}\n---\n\n${renderedBody}\n`;
}

function renderOpenAiYaml(skill) {
  const title = skill.stage.replace(/^\d+\.\s*/, '');
  return `interface:\n  display_name: ${JSON.stringify(`${skill.name} · ${title}`)}\n  short_description: ${JSON.stringify(skill.description.slice(0, 120))}\n`;
}

function renderDshRouter(skills, dshCfg, projectConfig) {
  const description =
    `bot-dev-skills 研发流水线总入口（${skills.length} 个阶段：` +
    skills.map((s) => `/${s.name}`).join(' → ') +
    '）。统一覆盖构思澄清、纵向切片与 TDD、极简门禁、多维合入评审及受控交付。';

  if (description.length > (dshCfg.descriptionLimit ?? 1024)) {
    throw new Error(`DSH router description exceeds ${dshCfg.descriptionLimit ?? 1024} chars`);
  }

  const rows = skills
    .map((s) => `| ${s.stage} | \`/${s.name}\` | ${s.description} | \`${dshCfg.stagesDir}/${s.name}/SKILL.md\` |`)
    .join('\n');

  const contextBlock = formatProjectContext(projectConfig);
  return [
    '---',
    'name: bot',
    `description: ${JSON.stringify(description)}`,
    '---',
    '',
    '# bot-dev-skills — 统一研发流水线',
    '',
    '按需用文件读取工具**按表格路径直接读取**匹配阶段的 `SKILL.md` 后照做（不要一次加载全部文件，也不要用受 gitignore 限制的搜索/glob 工具查找 `.dsh/bot-stages/`）。',
    '',
    '## 三道硬闸门 & 极简三铁律',
    '',
    '- **批量提问（业务问透优先）**：≤4 个独立选择题用多选项工具，超 4 题或含开放性业务问题用正文分组编号清单一次问清，严禁为凑上限删题。',
    '- **三道硬暂停闸门**：① 重大决策 ② 创建分支或 worktree ③ 发布与合并；其余连续推进。',
    '- **极简三铁律**：复用阶梯止步（repo helper → stdlib → 原生特性 → 已安装依赖）；三次法则（<3 次不抽公共抽象）；零纯转发 Middle Man。',
    contextBlock ? contextBlock.trimStart() : '',
    '',
    '## 流水线阶段路由',
    '',
    '| 阶段 | 命令 | 职责 | 阶段文件 |',
    '| --- | --- | --- | --- |',
    rows,
    '',
  ]
    .filter((line, idx, arr) => !(line === '' && arr[idx - 1] === ''))
    .join('\n');
}

/**
 * Compile bot-dev-skills templates into host-specific files and symlinks without touching disk.
 */
export function compileSkills({
  sourceDir,
  hosts = ['dsh', 'agents', 'claude'],
  projectConfig = {},
  claudeCopy = false,
  pathPrefix = '',
}) {
  const uniqueHosts = [...new Set(hosts)];
  const hostConfigs = loadHostConfigs(sourceDir, uniqueHosts);
  const skills = loadSkillTemplates(sourceDir);
  const sourceInfo = computeSourceVersion(sourceDir);
  const preambleTemplate = fs.readFileSync(path.join(sourceDir, 'templates', 'preamble.md'), 'utf8');
  const uiCraftPath = path.join(sourceDir, 'templates', 'ui-craft.md');
  const uiCraftContent = fs.existsSync(uiCraftPath) ? fs.readFileSync(uiCraftPath, 'utf8') : null;

  const outputs = [];
  const symlinks = [];
  const seenPaths = new Set();

  const pushOutput = (relPath, content) => {
    if (seenPaths.has(relPath)) {
      throw new Error(`Output path conflict: multiple hosts attempted to write "${relPath}"`);
    }
    seenPaths.add(relPath);
    outputs.push({ relPath, content });
  };

  if (hostConfigs.dsh) {
    const cfg = hostConfigs.dsh;
    pushOutput(`${cfg.routerDir}/SKILL.md`, renderDshRouter(skills, cfg, projectConfig));
    for (const skill of skills) {
      pushOutput(
        `${cfg.stagesDir}/${skill.name}/SKILL.md`,
        renderSkillMarkdown(skill, cfg, preambleTemplate, projectConfig, { pathPrefix }),
      );
    }
    if (uiCraftContent) {
      pushOutput(`${cfg.stagesDir}/bot-auto/references/ui-craft.md`, uiCraftContent);
    }
  }

  if (hostConfigs.agents) {
    const cfg = hostConfigs.agents;
    for (const skill of skills) {
      pushOutput(
        `${cfg.outputDir}/${skill.name}/SKILL.md`,
        renderSkillMarkdown(skill, cfg, preambleTemplate, projectConfig, { pathPrefix }),
      );
      if (cfg.generateOpenAiYaml) {
        pushOutput(`${cfg.outputDir}/${skill.name}/agents/openai.yaml`, renderOpenAiYaml(skill));
      }
    }
    if (uiCraftContent) {
      pushOutput(`${cfg.outputDir}/bot-auto/references/ui-craft.md`, uiCraftContent);
    }
  }

  if (hostConfigs.claude) {
    const cfg = hostConfigs.claude;
    if (claudeCopy) {
      for (const skill of skills) {
        pushOutput(
          `${cfg.outputDir}/${skill.name}/SKILL.md`,
          renderSkillMarkdown(skill, cfg, preambleTemplate, projectConfig, { pathPrefix }),
        );
      }
      if (uiCraftContent) {
        pushOutput(`${cfg.outputDir}/bot-auto/references/ui-craft.md`, uiCraftContent);
      }
    } else {
      if (!hostConfigs.agents) {
        throw new Error('Host "claude" symlink mode requires "agents" host (or pass --claude-copy)');
      }
      for (const skill of skills) {
        const relPath = `${cfg.outputDir}/${skill.name}`;
        if (seenPaths.has(relPath)) {
          throw new Error(`Output path conflict on "${relPath}"`);
        }
        seenPaths.add(relPath);
        symlinks.push({ relPath, linkTarget: `../../${hostConfigs.agents.outputDir}/${skill.name}` });
      }
    }
  }

  return { skills, outputs, symlinks, hosts: uniqueHosts, sourceVersion: sourceInfo };
}

/**
 * Compile portable skills.sh / Agent Skills distribution into `skills/<name>/` (in memory).
 */
export function compileSkillsDistribution({ sourceDir }) {
  const { agents: cfg } = loadHostConfigs(sourceDir, ['agents']);
  const skills = loadSkillTemplates(sourceDir);
  const sourceInfo = computeSourceVersion(sourceDir);
  const preambleTemplate = fs.readFileSync(path.join(sourceDir, 'templates', 'preamble.md'), 'utf8');
  const uiCraftPath = path.join(sourceDir, 'templates', 'ui-craft.md');
  const uiCraftContent = fs.existsSync(uiCraftPath) ? fs.readFileSync(uiCraftPath, 'utf8') : null;

  const outputs = [];
  for (const skill of skills) {
    outputs.push({
      relPath: `skills/${skill.name}/SKILL.md`,
      content: renderSkillMarkdown(skill, cfg, preambleTemplate, {}, {
        stagePathPattern: '../<skill>/SKILL.md',
        uiCraftPath: 'references/ui-craft.md',
      }),
    });
    if (cfg.generateOpenAiYaml) {
      outputs.push({
        relPath: `skills/${skill.name}/agents/openai.yaml`,
        content: renderOpenAiYaml(skill),
      });
    }
    if (uiCraftContent && skill.body.includes('{{UI_CRAFT_PATH}}')) {
      outputs.push({
        relPath: `skills/${skill.name}/references/ui-craft.md`,
        content: uiCraftContent,
      });
    }
  }

  return { skills, outputs, sourceVersion: sourceInfo };
}

/**
 * Materialize the skills.sh distribution directory (`<sourceDir>/skills/`) from `<sourceDir>/templates/`.
 */
export function buildSkillsDistribution({ sourceDir }) {
  const resolvedSource = path.resolve(sourceDir);
  const dist = compileSkillsDistribution({ sourceDir: resolvedSource });
  const skillsDir = path.join(resolvedSource, 'skills');
  const expectedSkillNames = new Set(dist.skills.map((s) => s.name));

  for (const out of dist.outputs) {
    const abs = path.join(resolvedSource, out.relPath);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, out.content, 'utf8');
  }

  cleanStaleBotDirs(skillsDir, expectedSkillNames);
  return dist;
}

function cleanStaleBotDirs(parentDir, expectedNames) {
  if (!fs.existsSync(parentDir)) return;
  for (const entry of fs.readdirSync(parentDir, { withFileTypes: true })) {
    if (!entry.name.startsWith('bot-')) continue;
    if (expectedNames.has(entry.name)) continue;
    fs.rmSync(path.join(parentDir, entry.name), { recursive: true, force: true });
  }
}

function resolveGitDir(targetDir) {
  const dotGit = path.join(targetDir, '.git');
  if (!fs.existsSync(dotGit)) return null;
  const stat = fs.lstatSync(dotGit);
  if (stat.isDirectory()) return dotGit;
  if (stat.isFile()) {
    const match = fs.readFileSync(dotGit, 'utf8').match(/^gitdir:\s*(.+)$/m);
    if (match) return path.resolve(targetDir, match[1].trim());
  }
  return null;
}

function ensureGitExclude(targetDir, pattern) {
  const gitDir = resolveGitDir(targetDir);
  if (!gitDir) return;
  const excludeFile = path.join(gitDir, 'info', 'exclude');
  if (!fs.existsSync(path.dirname(excludeFile))) return;
  const current = fs.existsSync(excludeFile) ? fs.readFileSync(excludeFile, 'utf8') : '';
  const lines = current.split('\n').map((l) => l.trim());
  if (lines.includes(pattern)) return;
  const suffix = current.length > 0 && !current.endsWith('\n') ? '\n' : '';
  fs.appendFileSync(excludeFile, `${suffix}${pattern}\n`);
}

function writeSymlinkSafely(absLink, linkTarget) {
  fs.mkdirSync(path.dirname(absLink), { recursive: true });
  try {
    const stat = fs.lstatSync(absLink);
    if (stat.isSymbolicLink() || stat.isFile()) {
      fs.unlinkSync(absLink);
    } else if (stat.isDirectory()) {
      fs.rmSync(absLink, { recursive: true, force: true });
    }
  } catch {
    // does not exist
  }
  fs.symlinkSync(linkTarget, absLink);
}

/**
 * Compile and install bot-dev-skills into a target repository safely.
 */
export function installSkills({
  sourceDir,
  targetDir,
  hosts = ['dsh', 'agents', 'claude'],
  claudeCopy = false,
  dryRun = false,
}) {
  const resolvedTarget = path.resolve(targetDir);
  const projectConfig = loadProjectConfig(resolvedTarget);
  const extraProtected = Array.isArray(projectConfig.protectedPaths) ? projectConfig.protectedPaths : [];
  safetyGuard(resolvedTarget, extraProtected);

  const resolvedTargetReal = resolveRealPath(resolvedTarget);
  const pathPrefix = resolvedTargetReal === resolveRealPath(os.homedir()) ? '~/' : '';
  const compiled = compileSkills({ sourceDir, hosts, projectConfig, claudeCopy, pathPrefix });
  const expectedSkillNames = new Set(compiled.skills.map((s) => s.name));

  // Pre-flight checks before mutating anything on disk
  if (hosts.includes('claude')) {
    const claudeRoot = path.join(resolvedTarget, '.claude', 'skills');
    if (fs.existsSync(claudeRoot) && fs.lstatSync(claudeRoot).isSymbolicLink()) {
      throw new Error(
        `Refusing to write into .claude/skills because it is a directory symlink (${fs.readlinkSync(claudeRoot)}), which would overwrite .agents/skills`,
      );
    }
  }

  for (const out of compiled.outputs) {
    const absOut = path.join(resolvedTarget, out.relPath);
    safetyGuard(absOut, extraProtected);
    const realOut = resolveRealPath(absOut);
    if (!isInsideOrEqual(realOut, resolvedTargetReal)) {
      throw new Error(
        `Refusing to write "${out.relPath}" through symlink escaping targetDir (${realOut})`,
      );
    }
  }
  for (const link of compiled.symlinks) {
    safetyGuard(path.join(resolvedTarget, link.relPath), extraProtected);
  }

  if (dryRun) {
    return { ...compiled, targetDir: resolvedTarget, dryRun: true };
  }

  for (const out of compiled.outputs) {
    const abs = path.join(resolvedTarget, out.relPath);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, out.content, 'utf8');
  }

  for (const link of compiled.symlinks) {
    writeSymlinkSafely(path.join(resolvedTarget, link.relPath), link.linkTarget);
  }

  if (hosts.includes('agents')) {
    cleanStaleBotDirs(path.join(resolvedTarget, '.agents', 'skills'), expectedSkillNames);
  }
  if (hosts.includes('dsh')) {
    cleanStaleBotDirs(path.join(resolvedTarget, '.dsh', 'bot-stages'), expectedSkillNames);
    ensureGitExclude(resolvedTarget, '.dsh/bot-stages/');
  }
  if (hosts.includes('claude')) {
    cleanStaleBotDirs(path.join(resolvedTarget, '.claude', 'skills'), expectedSkillNames);
  }

  return { ...compiled, targetDir: resolvedTarget, dryRun: false };
}

function detectInstalledHosts(resolvedTarget, isHomeTarget) {
  const detected = [];
  if (
    !isHomeTarget &&
    (fs.existsSync(path.join(resolvedTarget, '.dsh', 'skills', 'bot', 'SKILL.md')) ||
      fs.existsSync(path.join(resolvedTarget, '.dsh', 'bot-stages')))
  ) {
    detected.push('dsh');
  }

  const agentsRoot = path.join(resolvedTarget, '.agents', 'skills');
  if (fs.existsSync(agentsRoot) && !fs.lstatSync(agentsRoot).isSymbolicLink()) {
    const hasLocalBot = fs
      .readdirSync(agentsRoot)
      .some((name) => name.startsWith('bot-') && !fs.lstatSync(path.join(agentsRoot, name)).isSymbolicLink());
    if (hasLocalBot) detected.push('agents');
  }

  const claudeRoot = path.join(resolvedTarget, '.claude', 'skills');
  if (fs.existsSync(claudeRoot) && !fs.lstatSync(claudeRoot).isSymbolicLink()) {
    const hasBot = fs.readdirSync(claudeRoot).some((name) => name.startsWith('bot-'));
    if (hasBot) detected.push('claude');
  }

  if (detected.length > 0) return detected;
  return isHomeTarget ? ['agents'] : ['dsh', 'agents', 'claude'];
}

function collectStaleBotEntries(parentDir, relPrefix, expectedNames, issues) {
  if (!fs.existsSync(parentDir) || fs.lstatSync(parentDir).isSymbolicLink()) return;
  for (const entry of fs.readdirSync(parentDir, { withFileTypes: true })) {
    if (!entry.name.startsWith('bot-')) continue;
    if (expectedNames.has(entry.name)) continue;
    issues.push({ kind: 'stale', relPath: `${relPrefix}/${entry.name}` });
  }
}

/**
 * Inspect whether installed bot-dev-skills artifacts in targetDir match current templates byte-for-byte.
 */
export function checkSkills({
  sourceDir,
  targetDir,
  hosts,
  claudeCopy,
}) {
  const resolvedTarget = path.resolve(targetDir);
  const projectConfig = loadProjectConfig(resolvedTarget);
  const resolvedTargetReal = resolveRealPath(resolvedTarget);
  const isHomeTarget = resolvedTargetReal === resolveRealPath(os.homedir());
  const effectiveHosts =
    hosts && hosts.length > 0 ? [...new Set(hosts)] : detectInstalledHosts(resolvedTarget, isHomeTarget);

  let effectiveClaudeCopy = Boolean(claudeCopy);
  if (claudeCopy === undefined && effectiveHosts.includes('claude')) {
    const probe = path.join(resolvedTarget, '.claude', 'skills', 'bot-auto');
    try {
      effectiveClaudeCopy = fs.lstatSync(probe).isDirectory();
    } catch {
      effectiveClaudeCopy = !effectiveHosts.includes('agents');
    }
  }

  const pathPrefix = isHomeTarget ? '~/' : '';
  const compiled = compileSkills({
    sourceDir,
    hosts: effectiveHosts,
    projectConfig,
    claudeCopy: effectiveClaudeCopy,
    pathPrefix,
  });

  const expectedSkillNames = new Set(compiled.skills.map((s) => s.name));
  const issues = [];

  for (const out of compiled.outputs) {
    const abs = path.join(resolvedTarget, out.relPath);
    let stat = null;
    try {
      stat = fs.lstatSync(abs);
    } catch {
      issues.push({ kind: 'missing', relPath: out.relPath });
      continue;
    }
    if (stat.isSymbolicLink() || !stat.isFile()) {
      issues.push({ kind: 'outdated', relPath: out.relPath });
      continue;
    }
    if (fs.readFileSync(abs, 'utf8') !== out.content) {
      issues.push({ kind: 'outdated', relPath: out.relPath });
    }
  }

  for (const link of compiled.symlinks) {
    const abs = path.join(resolvedTarget, link.relPath);
    let stat = null;
    try {
      stat = fs.lstatSync(abs);
    } catch {
      issues.push({ kind: 'missing', relPath: link.relPath });
      continue;
    }
    if (!stat.isSymbolicLink() || fs.readlinkSync(abs) !== link.linkTarget) {
      issues.push({ kind: 'outdated', relPath: link.relPath });
    }
  }

  if (effectiveHosts.includes('agents')) {
    collectStaleBotEntries(path.join(resolvedTarget, '.agents', 'skills'), '.agents/skills', expectedSkillNames, issues);
  }
  if (effectiveHosts.includes('dsh')) {
    collectStaleBotEntries(path.join(resolvedTarget, '.dsh', 'bot-stages'), '.dsh/bot-stages', expectedSkillNames, issues);
  }
  if (effectiveHosts.includes('claude')) {
    collectStaleBotEntries(path.join(resolvedTarget, '.claude', 'skills'), '.claude/skills', expectedSkillNames, issues);
  }

  return {
    ok: issues.length === 0,
    targetDir: resolvedTarget,
    hosts: effectiveHosts,
    claudeCopy: effectiveClaudeCopy,
    sourceVersion: compiled.sourceVersion,
    checkedFiles: compiled.outputs.length,
    checkedSymlinks: compiled.symlinks.length,
    issues,
  };
}
