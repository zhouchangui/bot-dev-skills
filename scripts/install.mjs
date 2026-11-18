#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { installSkills } from '../lib/compiler.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = path.resolve(here, '..');

function parseCliArgs(argv) {
  const opts = {
    target: process.cwd(),
    hosts: ['dsh', 'agents', 'claude'],
    claudeCopy: false,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--target' && argv[i + 1]) {
      opts.target = argv[++i];
    } else if (arg === '--hosts' && argv[i + 1]) {
      opts.hosts = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    } else if (arg === '--claude-copy') {
      opts.claudeCopy = true;
    } else if (arg === '--dry-run') {
      opts.dryRun = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log('Usage: node scripts/install.mjs --target <repo> [--hosts dsh,agents,claude] [--claude-copy] [--dry-run]');
      process.exit(0);
    } else {
      throw new Error(`Unknown or incomplete argument: ${arg}`);
    }
  }
  return opts;
}

try {
  const opts = parseCliArgs(process.argv.slice(2));
  const res = installSkills({
    sourceDir,
    targetDir: opts.target,
    hosts: opts.hosts,
    claudeCopy: opts.claudeCopy,
    dryRun: opts.dryRun,
  });

  const prefix = res.dryRun ? '[DRY RUN] ' : '';
  console.log(
    `${prefix}Installed bot-dev-skills (${res.skills.length} skills) into ${res.targetDir} for hosts [${res.hosts.join(', ')}]: ${res.outputs.length} files, ${res.symlinks.length} symlinks.`,
  );
  if (res.dryRun) {
    for (const out of res.outputs) console.log(`  file: ${out.relPath}`);
    for (const link of res.symlinks) console.log(`  link: ${link.relPath} -> ${link.linkTarget}`);
  }
} catch (err) {
  console.error(`bot-dev-skills install failed: ${err.message}`);
  process.exit(1);
}
