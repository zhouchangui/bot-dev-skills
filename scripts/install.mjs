#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkSkills, installSkills } from '../lib/compiler.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = path.resolve(here, '..');

function parseCliArgs(argv) {
  const opts = {
    targets: [],
    hosts: null,
    claudeCopy: undefined,
    dryRun: false,
    check: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--target' && argv[i + 1]) {
      opts.targets.push(argv[++i]);
    } else if (arg === '--hosts' && argv[i + 1]) {
      opts.hosts = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    } else if (arg === '--claude-copy') {
      opts.claudeCopy = true;
    } else if (arg === '--dry-run') {
      opts.dryRun = true;
    } else if (arg === '--check') {
      opts.check = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(
        'Usage: node scripts/install.mjs --target <repo> [--target <repo2> ...] [--hosts dsh,agents,claude] [--claude-copy] [--dry-run] [--check]',
      );
      process.exit(0);
    } else {
      throw new Error(`Unknown or incomplete argument: ${arg}`);
    }
  }

  if (opts.targets.length === 0) {
    opts.targets.push(process.cwd());
  }
  return opts;
}

try {
  const opts = parseCliArgs(process.argv.slice(2));

  if (opts.check) {
    let hasDrift = false;
    for (const target of opts.targets) {
      const report = checkSkills({
        sourceDir,
        targetDir: target,
        hosts: opts.hosts ?? undefined,
        claudeCopy: opts.claudeCopy,
      });
      if (report.ok) {
        console.log(
          `[OK] ${report.targetDir} (${report.sourceVersion.stamp}; hosts: ${report.hosts.join(', ')}; ${report.checkedFiles} files, ${report.checkedSymlinks} symlinks in sync)`,
        );
      } else {
        hasDrift = true;
        console.log(
          `[DRIFT] ${report.targetDir} (${report.sourceVersion.stamp}; hosts: ${report.hosts.join(', ')}; ${report.issues.length} issue(s)):`,
        );
        for (const issue of report.issues) {
          console.log(`  ${issue.kind}: ${issue.relPath}`);
        }
      }
    }
    process.exit(hasDrift ? 1 : 0);
  }

  for (const target of opts.targets) {
    const res = installSkills({
      sourceDir,
      targetDir: target,
      hosts: opts.hosts ?? ['dsh', 'agents', 'claude'],
      claudeCopy: Boolean(opts.claudeCopy),
      dryRun: opts.dryRun,
    });

    const prefix = res.dryRun ? '[DRY RUN] ' : '';
    console.log(
      `${prefix}Installed bot-dev-skills ${res.sourceVersion.stamp} (${res.skills.length} skills) into ${res.targetDir} for hosts [${res.hosts.join(', ')}]: ${res.outputs.length} files, ${res.symlinks.length} symlinks.`,
    );
    if (res.dryRun) {
      for (const out of res.outputs) console.log(`  file: ${out.relPath}`);
      for (const link of res.symlinks) console.log(`  link: ${link.relPath} -> ${link.linkTarget}`);
    }
  }
} catch (err) {
  console.error(`bot-dev-skills install failed: ${err.message}`);
  process.exit(1);
}
