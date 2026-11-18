import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { compileSkills, installSkills, safetyGuard } from '../lib/compiler.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.resolve(here, '..');

function makeTempDir(prefix = 'bot-skills-test-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

test('compileSkills builds all 8 bot-* skills + 1 router in pipeline order without hand-synced drift', () => {
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

  assert.equal(result.skills.length, 8);
  assert.deepEqual(
    result.skills.map((s) => s.name),
    ['bot-think', 'bot-plan', 'bot-build', 'bot-debug', 'bot-review', 'bot-verify', 'bot-ship', 'bot-retro'],
  );

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
    const badSkillPath = path.join(tmpSrc, 'skills', 'bot-think', 'SKILL.md');
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

  const forbidden = /\b(gstack|mattpocock|ponytail|grill-me|plan-eng-review|to-spec|to-tickets|codebase-design|document-release|diagnosing-bugs|office-hours|TODOS\.md)\b/i;
  for (const out of result.outputs) {
    assert.equal(
      forbidden.test(out.content),
      false,
      `Found leaked external skill reference in ${out.relPath}: ${out.content.match(forbidden)?.[0]}`,
    );
  }
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
    assert.equal(blankRes.outputs.length, 25);
    assert.equal(blankRes.symlinks.length, 8);
    assert.ok(fs.existsSync(path.join(blankRepo, '.dsh', 'skills', 'bot', 'SKILL.md')));
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
