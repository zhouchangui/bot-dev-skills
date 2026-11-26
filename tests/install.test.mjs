import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  buildSkillsDistribution,
  checkSkills,
  compileSkills,
  compileSkillsDistribution,
  computeSourceVersion,
  installSkills,
  safetyGuard,
} from '../lib/compiler.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.resolve(here, '..');

function makeTempDir(prefix = 'bot-skills-test-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

test('compileSkills builds all 9 bot-* skills + 1 router in pipeline order without hand-synced drift', () => {
  const result = compileSkills({
    sourceDir: srcRoot,
    hosts: ['dsh', 'agents', 'claude'],
    projectConfig: {
      tracker: '.scratch',
      checkCommand: 'pnpm check',
      verifyCommand: 'pnpm test:local',
      rules: {
        global: ['禁止直接启动未打品牌的 DSH shell'],
        perStage: {
          'bot-verify': ['桌面验收走 叩问.app，禁止浏览器加载 DSH Web UI'],
        },
      },
    },
  });

  assert.equal(result.skills.length, 9);
  assert.deepEqual(
    result.skills.map((s) => s.name),
    ['bot-auto', 'bot-think', 'bot-plan', 'bot-build', 'bot-debug', 'bot-review', 'bot-verify', 'bot-ship', 'bot-retro'],
  );

  // Check host-specific stage path resolution inside bot-auto
  const dshAuto = result.outputs.find((o) => o.relPath === '.dsh/bot-stages/bot-auto/SKILL.md');
  const agentsAuto = result.outputs.find((o) => o.relPath === '.agents/skills/bot-auto/SKILL.md');
  assert.match(dshAuto.content, /\.dsh\/bot-stages\/<skill>\/SKILL\.md/);
  assert.match(agentsAuto.content, /\.agents\/skills\/<skill>\/SKILL\.md/);

  // Check DSH router references all 8 stages inside .dsh/bot-stages/
  const dshRouter = result.outputs.find((o) => o.relPath === '.dsh/skills/bot/SKILL.md');
  assert.ok(dshRouter, 'dsh router must exist');
  for (const skill of result.skills) {
    assert.match(dshRouter.content, new RegExp(`\\.dsh/bot-stages/${skill.name}/SKILL\\.md`));
  }

  // Check perStage rule and global rule injected into bot-verify for agents
  const agentsVerify = result.outputs.find((o) => o.relPath === '.agents/skills/bot-verify/SKILL.md');
  assert.ok(agentsVerify);
  assert.match(agentsVerify.content, /禁止直接启动未打品牌的 DSH shell/);
  assert.match(agentsVerify.content, /桌面验收走 叩问\.app/);
  assert.match(agentsVerify.content, /pnpm test:local/);
  assert.match(agentsVerify.content, /pnpm check/);

  // Check agents/openai.yaml emitted alongside SKILL.md
  const agentsYaml = result.outputs.find((o) => o.relPath === '.agents/skills/bot-verify/agents/openai.yaml');
  assert.ok(agentsYaml);
  assert.match(agentsYaml.content, /display_name:/);
});

test('compileSkills rejects unknown hosts and description exceeding 1024 chars', () => {
  assert.throws(
    () => compileSkills({ sourceDir: srcRoot, hosts: ['unknown-host'] }),
    /Unknown host/i,
  );

  const tmpSrc = makeTempDir('bot-src-longdesc-');
  try {
    fs.cpSync(srcRoot, tmpSrc, { recursive: true });
    const badSkillPath = path.join(tmpSrc, 'templates', 'bot-think', 'SKILL.tmpl.md');
    const orig = fs.readFileSync(badSkillPath, 'utf8');
    const longDesc = 'x'.repeat(1025);
    fs.writeFileSync(badSkillPath, orig.replace(/description: ".*"/, `description: "${longDesc}"`));

    assert.throws(
      () => compileSkills({ sourceDir: tmpSrc, hosts: ['agents'] }),
      /1024/,
    );
  } finally {
    fs.rmSync(tmpSrc, { recursive: true, force: true });
  }
});

test('safetyGuard blocks writes into protected system DSH/tianji paths including symlinks', () => {
  const home = os.homedir();
  const protectedTargets = [
    path.join(home, '.dsh'),
    path.join(home, '.dsh', 'profiles', 'desktop'),
    path.join(home, '.tianji'),
  ];

  for (const bad of protectedTargets) {
    assert.throws(() => safetyGuard(bad), /protected/i);
  }

  // Symlink pointing to ~/.dsh must also be blocked if ~/.dsh exists
  const dshDir = path.join(home, '.dsh');
  if (fs.existsSync(dshDir)) {
    const tmp = makeTempDir('bot-symlink-guard-');
    try {
      const linkPath = path.join(tmp, 'alias-dsh');
      fs.symlinkSync(dshDir, linkPath);
      assert.throws(() => safetyGuard(path.join(linkPath, 'skills')), /protected/i);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  }
});

test('installSkills preserves existing non-bot skills, manages .claude/skills symlinks, and updates .git/info/exclude', () => {
  const repo = makeTempDir('bot-repo-');
  try {
    // Fake git repo with .git/info and an existing local custom skill + real .claude/skills dir
    fs.mkdirSync(path.join(repo, '.git', 'info'), { recursive: true });
    fs.mkdirSync(path.join(repo, '.agents', 'skills', 'custom-local-skill'), { recursive: true });
    fs.writeFileSync(path.join(repo, '.agents', 'skills', 'custom-local-skill', 'SKILL.md'), '# keep me\n');
    fs.mkdirSync(path.join(repo, '.agents', 'skills', 'bot-stale-old'), { recursive: true });
    fs.writeFileSync(path.join(repo, '.agents', 'skills', 'bot-stale-old', 'SKILL.md'), '# stale\n');
    fs.mkdirSync(path.join(repo, '.claude', 'skills'), { recursive: true });
    fs.symlinkSync('../../.agents/skills/custom-local-skill', path.join(repo, '.claude', 'skills', 'custom-local-skill'));

    fs.writeFileSync(
      path.join(repo, '.bot-skills.json'),
      JSON.stringify({
        tracker: '.scratch',
        checkCommand: 'pnpm check',
        verifyCommand: 'pnpm test:local',
        rules: { global: ['rule-1'], perStage: {} },
      }),
    );

    const summary = installSkills({
      sourceDir: srcRoot,
      targetDir: repo,
      hosts: ['dsh', 'agents', 'claude'],
    });

    assert.equal(summary.dryRun, false);
    assert.ok(fs.existsSync(path.join(repo, '.agents', 'skills', 'custom-local-skill', 'SKILL.md')));
    assert.equal(fs.existsSync(path.join(repo, '.agents', 'skills', 'bot-stale-old')), false);
    assert.ok(fs.existsSync(path.join(repo, '.dsh', 'skills', 'bot', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(repo, '.dsh', 'bot-stages', 'bot-build', 'SKILL.md')));

    // .claude/skills/bot-build must be a symlink to ../../.agents/skills/bot-build
    const claudeLink = path.join(repo, '.claude', 'skills', 'bot-build');
    assert.equal(fs.lstatSync(claudeLink).isSymbolicLink(), true);
    assert.equal(fs.readlinkSync(claudeLink), '../../.agents/skills/bot-build');
    assert.equal(fs.readlinkSync(path.join(repo, '.claude', 'skills', 'custom-local-skill')), '../../.agents/skills/custom-local-skill');

    // .git/info/exclude must ignore .dsh/bot-stages/
    const excludeText = fs.readFileSync(path.join(repo, '.git', 'info', 'exclude'), 'utf8');
    assert.match(excludeText, /\.dsh\/bot-stages\//);
  } finally {
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

test('installSkills --claude-copy refuses when .claude/skills itself is a directory symlink', () => {
  const repo = makeTempDir('bot-claude-symlink-');
  try {
    fs.mkdirSync(path.join(repo, '.agents', 'skills'), { recursive: true });
    fs.mkdirSync(path.join(repo, '.claude'), { recursive: true });
    fs.symlinkSync('../.agents/skills', path.join(repo, '.claude', 'skills'));

    assert.throws(
      () =>
        installSkills({
          sourceDir: srcRoot,
          targetDir: repo,
          hosts: ['agents', 'claude'],
          claudeCopy: true,
        }),
      /symlink/i,
    );
  } finally {
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

test('CLI install.mjs --dry-run writes nothing to disk and reports planned outputs', () => {
  const repo = makeTempDir('bot-cli-dryrun-');
  try {
    const stdout = execFileSync(
      process.execPath,
      [path.join(srcRoot, 'scripts', 'install.mjs'), '--target', repo, '--hosts', 'dsh,agents', '--dry-run'],
      { encoding: 'utf8' },
    );
    assert.match(stdout, /DRY RUN/i);
    assert.equal(fs.existsSync(path.join(repo, '.agents')), false);
    assert.equal(fs.existsSync(path.join(repo, '.dsh')), false);
  } finally {
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

test('rendered skills are self-contained with zero leaked external skill references', () => {
  const result = compileSkills({
    sourceDir: srcRoot,
    hosts: ['dsh', 'agents', 'claude'],
    claudeCopy: true,
  });

  const forbidden = /\b(gstack|mattpocock|ponytail|grill-me|grill-with-docs|improve-codebase-architecture|plan-eng-review|plan-design-review|design-review|design-consultation|to-spec|to-tickets|codebase-design|document-release|diagnosing-bugs|office-hours|TODOS\.md|taste-skill|impeccable|emil-design-eng|frontend-design|ui-ux-pro-max|modern-web-guidance)\b/i;
  for (const out of result.outputs) {
    assert.equal(
      forbidden.test(out.content),
      false,
      `Found leaked external skill reference in ${out.relPath}: ${out.content.match(forbidden)?.[0]}`,
    );
  }

  const agentsThink = result.outputs.find((o) => o.relPath === '.agents/skills/bot-think/SKILL.md');
  const agentsPlan = result.outputs.find((o) => o.relPath === '.agents/skills/bot-plan/SKILL.md');
  const agentsBuild = result.outputs.find((o) => o.relPath === '.agents/skills/bot-build/SKILL.md');
  const agentsReview = result.outputs.find((o) => o.relPath === '.agents/skills/bot-review/SKILL.md');
  const agentsAuto = result.outputs.find((o) => o.relPath === '.agents/skills/bot-auto/SKILL.md');
  const dshBuild = result.outputs.find((o) => o.relPath === '.dsh/bot-stages/bot-build/SKILL.md');
  const claudeReview = result.outputs.find((o) => o.relPath === '.claude/skills/bot-review/SKILL.md');
  const agentsUiCraft = result.outputs.find((o) => o.relPath === '.agents/skills/bot-auto/references/ui-craft.md');
  const dshUiCraft = result.outputs.find((o) => o.relPath === '.dsh/bot-stages/bot-auto/references/ui-craft.md');
  const claudeUiCraft = result.outputs.find((o) => o.relPath === '.claude/skills/bot-auto/references/ui-craft.md');

  const dshThink = result.outputs.find((o) => o.relPath === '.dsh/bot-stages/bot-think/SKILL.md');
  const claudeThink = result.outputs.find((o) => o.relPath === '.claude/skills/bot-think/SKILL.md');
  const dshRouter = result.outputs.find((o) => o.relPath === '.dsh/skills/bot/SKILL.md');

  assert.ok(agentsUiCraft && dshUiCraft && claudeUiCraft && dshThink && claudeThink && dshRouter);
  assert.match(agentsUiCraft.content, /Skeleton Test/);
  assert.match(agentsUiCraft.content, /cubic-bezier\(0\.23, 1, 0\.32, 1\)/);
  assert.match(agentsThink.content, /\.agents\/skills\/bot-auto\/references\/ui-craft\.md/);
  assert.match(agentsThink.content, /DESIGN\.md/);
  assert.match(agentsThink.content, /第一眼记忆点/);
  assert.match(agentsThink.content, /第一性原理必要性审查/);
  assert.match(agentsThink.content, /必要性拆刀（Cut List）/);
  assert.match(agentsThink.content, /Option 0（不做/);
  assert.match(agentsThink.content, /业务问清楚优先/);
  assert.match(agentsThink.content, /≤ 4 个独立离散选择题/);
  assert.match(agentsThink.content, /正文分组编号清单/);
  assert.match(claudeThink.content, /AskUserQuestion`（仅用于 ≤4 个独立选择题/);
  assert.match(dshThink.content, /多选项确认工具仅用于 ≤4 个独立选择题/);
  assert.match(dshRouter.content, /批量提问（业务问透优先）/);
  assert.match(agentsPlan.content, /\.agents\/skills\/bot-auto\/references\/ui-craft\.md/);
  assert.match(agentsPlan.content, /DESIGN\.md/);
  assert.match(agentsPlan.content, /交互五态/);
  assert.match(agentsPlan.content, /Necessity \/ Why/);
  assert.match(agentsPlan.content, /Out of Scope \(Cut List\)/);
  assert.match(agentsBuild.content, /\.agents\/skills\/bot-auto\/references\/ui-craft\.md/);
  assert.match(dshBuild.content, /\.dsh\/bot-stages\/bot-auto\/references\/ui-craft\.md/);
  assert.match(claudeReview.content, /\.claude\/skills\/bot-auto\/references\/ui-craft\.md/);
  assert.match(agentsReview.content, /维度 D：UI 与交互审计/);
  assert.match(agentsReview.content, /卡片套卡片/);
  assert.match(agentsReview.content, /独特性判词/);
  assert.match(agentsReview.content, /目标验收矩阵/);
  assert.match(agentsReview.content, /Out of Scope \(Cut List\)/);
  assert.match(agentsReview.content, /P0 \/ P1 \/ P2/);
  assert.match(agentsReview.content, /M\/L 级改动默认派干净上下文独立子代理/);
  assert.match(agentsAuto.content, /UI 影响面强制激活/);
  assert.match(agentsAuto.content, /第一性原理必要性速审/);
  assert.match(agentsAuto.content, /质量收敛闭环/);
  assert.match(agentsAuto.content, /S 级 ≤ 2 轮、M\/L 级 ≤ 3 轮/);
  assert.match(agentsAuto.content, /硬退出门槛（Exit Gate）/);
  assert.match(agentsAuto.content, /双熔断/);
});

test('installSkills works cleanly on a completely empty brand-new directory and git worktree', () => {
  const blankRepo = makeTempDir('bot-blank-repo-');
  const worktreeRepo = makeTempDir('bot-worktree-repo-');
  const realGitDir = makeTempDir('bot-real-gitdir-');
  try {
    const blankRes = installSkills({
      sourceDir: srcRoot,
      targetDir: blankRepo,
      hosts: ['dsh', 'agents', 'claude'],
    });
    assert.equal(blankRes.outputs.length, 30);
    assert.equal(blankRes.symlinks.length, 9);
    assert.ok(fs.existsSync(path.join(blankRepo, '.dsh', 'skills', 'bot', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(blankRepo, '.dsh', 'bot-stages', 'bot-auto', 'references', 'ui-craft.md')));
    assert.ok(fs.existsSync(path.join(blankRepo, '.agents', 'skills', 'bot-auto', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(blankRepo, '.agents', 'skills', 'bot-auto', 'references', 'ui-craft.md')));
    assert.ok(fs.existsSync(path.join(blankRepo, '.claude', 'skills', 'bot-auto', 'references', 'ui-craft.md')));
    assert.ok(fs.existsSync(path.join(blankRepo, '.agents', 'skills', 'bot-think', 'SKILL.md')));
    assert.equal(fs.lstatSync(path.join(blankRepo, '.claude', 'skills', 'bot-think')).isSymbolicLink(), true);

    fs.mkdirSync(path.join(realGitDir, 'info'), { recursive: true });
    fs.writeFileSync(path.join(worktreeRepo, '.git'), `gitdir: ${realGitDir}\n`);
    installSkills({ sourceDir: srcRoot, targetDir: worktreeRepo, hosts: ['dsh'] });
    const excludeText = fs.readFileSync(path.join(realGitDir, 'info', 'exclude'), 'utf8');
    assert.match(excludeText, /\.dsh\/bot-stages\//);
  } finally {
    fs.rmSync(blankRepo, { recursive: true, force: true });
    fs.rmSync(worktreeRepo, { recursive: true, force: true });
    fs.rmSync(realGitDir, { recursive: true, force: true });
  }
});

test('installSkills into homedir prefixes stage and ui-craft paths with ~/ and still blocks ~/.dsh', () => {
  const home = os.homedir();
  const res = installSkills({
    sourceDir: srcRoot,
    targetDir: home,
    hosts: ['agents'],
    dryRun: true,
  });

  const agentsAuto = res.outputs.find((o) => o.relPath === '.agents/skills/bot-auto/SKILL.md');
  const agentsBuild = res.outputs.find((o) => o.relPath === '.agents/skills/bot-build/SKILL.md');
  assert.ok(agentsAuto && agentsBuild);
  assert.match(agentsAuto.content, /~\/\.agents\/skills\/<skill>\/SKILL\.md/);
  assert.match(agentsAuto.content, /~\/\.agents\/skills\/bot-auto\/references\/ui-craft\.md/);
  assert.match(agentsBuild.content, /~\/\.agents\/skills\/bot-auto\/references\/ui-craft\.md/);

  assert.throws(
    () => installSkills({ sourceDir: srcRoot, targetDir: home, hosts: ['dsh'], dryRun: true }),
    /protected/i,
  );
});

test('installSkills refuses to write through a skill directory symlink escaping targetDir', () => {
  const repo = makeTempDir('bot-escape-repo-');
  const external = makeTempDir('bot-external-global-');
  try {
    fs.mkdirSync(path.join(repo, '.agents', 'skills'), { recursive: true });
    fs.mkdirSync(path.join(external, 'bot-think'), { recursive: true });
    fs.writeFileSync(path.join(external, 'bot-think', 'SKILL.md'), '# global skill\n');
    fs.symlinkSync(path.join(external, 'bot-think'), path.join(repo, '.agents', 'skills', 'bot-think'));

    assert.throws(
      () => installSkills({ sourceDir: srcRoot, targetDir: repo, hosts: ['agents'] }),
      /escaping targetDir/i,
    );
    assert.equal(fs.readFileSync(path.join(external, 'bot-think', 'SKILL.md'), 'utf8'), '# global skill\n');
  } finally {
    fs.rmSync(repo, { recursive: true, force: true });
    fs.rmSync(external, { recursive: true, force: true });
  }
});

test('skills.sh distribution in skills/ is in sync with templates/ and self-contained with zero unrendered placeholders', () => {
  const expected = compileSkillsDistribution({ sourceDir: srcRoot });
  assert.equal(expected.skills.length, 9);

  // Verify no raw SKILL.md exists inside templates/ so skills.sh scanners never discover raw templates
  const templatesDir = path.join(srcRoot, 'templates');
  for (const entry of fs.readdirSync(templatesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    assert.equal(fs.existsSync(path.join(templatesDir, entry.name, 'SKILL.md')), false);
    assert.equal(fs.existsSync(path.join(templatesDir, entry.name, 'SKILL.tmpl.md')), true);
  }

  // Verify every compiled file matches disk byte-for-byte with zero unrendered placeholders
  const expectedRelPaths = new Set(expected.outputs.map((o) => o.relPath));
  for (const out of expected.outputs) {
    const absPath = path.join(srcRoot, out.relPath);
    assert.ok(fs.existsSync(absPath), `Missing built skills.sh file: ${out.relPath} (run "npm run build:skills")`);
    const actual = fs.readFileSync(absPath, 'utf8');
    assert.equal(actual, out.content, `Out-of-date skills.sh file: ${out.relPath} (run "npm run build:skills")`);
    assert.equal(/\{\{[A-Z0-9_]+\}\}/.test(actual), false, `Unrendered placeholder in ${out.relPath}`);
  }

  // Verify no stale extra files exist under skills/
  const walkFiles = (dir, base = '') => {
    const list = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const rel = base ? `${base}/${entry.name}` : entry.name;
      if (entry.isDirectory()) list.push(...walkFiles(path.join(dir, entry.name), rel));
      else list.push(rel);
    }
    return list;
  };
  const actualFiles = walkFiles(path.join(srcRoot, 'skills')).map((f) => `skills/${f}`);
  assert.deepEqual(actualFiles.sort(), [...expectedRelPaths].sort());

  // Verify portable paths in skills.sh build (works in both local and global installs + single-skill installs)
  const autoSkill = expected.outputs.find((o) => o.relPath === 'skills/bot-auto/SKILL.md');
  const thinkSkill = expected.outputs.find((o) => o.relPath === 'skills/bot-think/SKILL.md');
  assert.match(autoSkill.content, /\.\.\/<skill>\/SKILL\.md/);
  assert.match(autoSkill.content, /`references\/ui-craft\.md`/);
  assert.match(thinkSkill.content, /`references\/ui-craft\.md`/);
  for (const uiSkill of ['bot-auto', 'bot-think', 'bot-plan', 'bot-build', 'bot-review']) {
    assert.ok(expectedRelPaths.has(`skills/${uiSkill}/references/ui-craft.md`));
  }

  // Verify buildSkillsDistribution cleans stale bot-* directories cleanly in an isolated copy
  const tmpSrc = makeTempDir('bot-dist-build-');
  try {
    fs.cpSync(srcRoot, tmpSrc, { recursive: true });
    fs.mkdirSync(path.join(tmpSrc, 'skills', 'bot-stale-old'), { recursive: true });
    fs.writeFileSync(path.join(tmpSrc, 'skills', 'bot-stale-old', 'SKILL.md'), '# stale\n');
    buildSkillsDistribution({ sourceDir: tmpSrc });
    assert.equal(fs.existsSync(path.join(tmpSrc, 'skills', 'bot-stale-old')), false);
  } finally {
    fs.rmSync(tmpSrc, { recursive: true, force: true });
  }
});

test('workflow refinements, 6 quality guardrails, frontier grilling, and modern native Web rules are rendered', () => {
  const result = compileSkills({
    sourceDir: srcRoot,
    hosts: ['agents'],
  });

  const auto = result.outputs.find((o) => o.relPath === '.agents/skills/bot-auto/SKILL.md');
  const think = result.outputs.find((o) => o.relPath === '.agents/skills/bot-think/SKILL.md');
  const plan = result.outputs.find((o) => o.relPath === '.agents/skills/bot-plan/SKILL.md');
  const build = result.outputs.find((o) => o.relPath === '.agents/skills/bot-build/SKILL.md');
  const debug = result.outputs.find((o) => o.relPath === '.agents/skills/bot-debug/SKILL.md');
  const review = result.outputs.find((o) => o.relPath === '.agents/skills/bot-review/SKILL.md');
  const verify = result.outputs.find((o) => o.relPath === '.agents/skills/bot-verify/SKILL.md');
  const uiCraft = result.outputs.find((o) => o.relPath === '.agents/skills/bot-auto/references/ui-craft.md');

  // Architectural consistency, Deep-Module Deletion Test, 4-tier seam strategy & Locality Guard
  assert.match(build.content, /同构一致性侦察/);
  assert.match(build.content, /跨过其他模块的公开入口/);
  assert.match(build.content, /公开接口即测试面/);
  assert.match(build.content, /删除检验（Deletion Test）/);
  assert.match(plan.content, /按四档依赖性质定接缝策略/);
  assert.match(debug.content, /浅模块泥潭信号/);
  assert.match(review.content, /架构同构一致性与封装边界/);

  // Multi-round Design Tree Frontier grilling in bot-think
  assert.match(think.content, /Design Tree \+ Frontier Rounds/);
  assert.match(think.content, /挑刺概念边界/);
  assert.match(think.content, /主动构造极端反例/);
  assert.match(think.content, /全程禁用 4 题弹窗压缩/);
  assert.match(think.content, /❓ \*\*Q1/);
  assert.match(think.content, /➡️ 推荐：/);
  assert.match(think.content, /零静默假设/);

  // Workflow resilience & UI modes
  assert.match(auto.content, /断点续跑嗅探（Resume First）/);
  assert.match(auto.content, /Touched Paths/);
  assert.match(auto.content, /单装兜底/);
  assert.match(plan.content, /One-way door/);
  assert.match(plan.content, /Touched Paths:/);
  assert.match(review.content, /开放代码库只读检索/);
  assert.match(review.content, /不可逆变更保护（One-way door）/);
  assert.match(uiCraft.content, /Mode A: Marketing \/ Persuade/);
  assert.match(uiCraft.content, /Mode B: App \/ Workbench/);

  // 6 Modification Quality Control Guardrails
  assert.match(build.content, /as unknown as T/);
  assert.match(build.content, /假默认值投毒/);
  assert.match(build.content, /真实往返契约测试/);
  assert.match(auto.content, /Test-Lock then Fix/);
  assert.match(auto.content, /Surgical Fix Budget/);
  assert.match(review.content, /热路径复杂度与 I\/O 放大/);
  assert.match(verify.content, /Zero Net-New Warnings & Diff Hygiene/);

  // Modern Web Platform native primitives & anti-legacy hacks
  assert.match(uiCraft.content, /Baseline Widely Available/);
  assert.match(uiCraft.content, /showModal\(\)/);
  assert.match(uiCraft.content, /popovertarget/);
  assert.match(uiCraft.content, /isComposing/);
  assert.match(uiCraft.content, /:user-invalid/);
  assert.match(uiCraft.content, /field-sizing: content/);
  assert.match(uiCraft.content, /interpolate-size: allow-keywords/);
  assert.match(uiCraft.content, /light-dark\(\)/);
  assert.match(uiCraft.content, /fetchpriority="high"/);
  assert.match(review.content, /现代原生 Web 反模式检查/);
});

test('checkSkills and CLI --check detect clean sync, outdated files, stale dirs, and auto-detect partial hosts', () => {
  const repoFull = makeTempDir('bot-check-full-');
  const repoDshOnly = makeTempDir('bot-check-dsh-');
  const externalAgents = makeTempDir('bot-check-ext-agents-');
  try {
    const ver1 = computeSourceVersion(srcRoot);
    assert.match(ver1.stamp, /^v\d+\.\d+\.\d+\+[0-9a-f]{12}$/);

    installSkills({ sourceDir: srcRoot, targetDir: repoFull, hosts: ['dsh', 'agents', 'claude'] });
    const cleanReport = checkSkills({ sourceDir: srcRoot, targetDir: repoFull });
    assert.equal(cleanReport.ok, true);
    assert.deepEqual(cleanReport.hosts.sort(), ['agents', 'claude', 'dsh']);
    assert.equal(cleanReport.issues.length, 0);

    // Partial install (dsh only, while .agents/skills is a symlink to external global skills like knock-marketing)
    installSkills({ sourceDir: srcRoot, targetDir: repoDshOnly, hosts: ['dsh'] });
    fs.mkdirSync(path.join(repoDshOnly, '.agents'), { recursive: true });
    fs.symlinkSync(externalAgents, path.join(repoDshOnly, '.agents', 'skills'));
    const dshOnlyReport = checkSkills({ sourceDir: srcRoot, targetDir: repoDshOnly });
    assert.equal(dshOnlyReport.ok, true);
    assert.deepEqual(dshOnlyReport.hosts, ['dsh']);

    // CLI --check passes across multiple targets when in sync
    const cliOk = execFileSync(
      process.execPath,
      [path.join(srcRoot, 'scripts', 'install.mjs'), '--check', '--target', repoFull, '--target', repoDshOnly],
      { encoding: 'utf8' },
    );
    assert.match(cliOk, /\[OK\]/);

    // Introduce drift (tampered file + stale bot-* directory + broken symlink)
    fs.appendFileSync(path.join(repoFull, '.agents', 'skills', 'bot-auto', 'SKILL.md'), '\n<!-- drift -->\n');
    fs.mkdirSync(path.join(repoFull, '.agents', 'skills', 'bot-legacy-removed'), { recursive: true });
    fs.unlinkSync(path.join(repoFull, '.claude', 'skills', 'bot-review'));

    const driftReport = checkSkills({ sourceDir: srcRoot, targetDir: repoFull });
    assert.equal(driftReport.ok, false);
    assert.ok(driftReport.issues.some((i) => i.kind === 'outdated' && i.relPath === '.agents/skills/bot-auto/SKILL.md'));
    assert.ok(driftReport.issues.some((i) => i.kind === 'stale' && i.relPath === '.agents/skills/bot-legacy-removed'));
    assert.ok(driftReport.issues.some((i) => i.kind === 'missing' && i.relPath === '.claude/skills/bot-review'));

    assert.throws(
      () =>
        execFileSync(
          process.execPath,
          [path.join(srcRoot, 'scripts', 'install.mjs'), '--check', '--target', repoFull],
          { encoding: 'utf8' },
        ),
      /Command failed/i,
    );
  } finally {
    fs.rmSync(repoFull, { recursive: true, force: true });
    fs.rmSync(repoDshOnly, { recursive: true, force: true });
    fs.rmSync(externalAgents, { recursive: true, force: true });
  }
});
