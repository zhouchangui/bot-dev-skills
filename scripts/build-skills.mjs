#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSkillsDistribution } from '../lib/compiler.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = path.resolve(here, '..');

const dist = buildSkillsDistribution({ sourceDir });
console.log(
  `Built skills.sh distribution (${dist.skills.length} skills, ${dist.outputs.length} files) in ${path.join(sourceDir, 'skills')}.`,
);
