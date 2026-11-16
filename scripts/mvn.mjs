// Runs the Maven wrapper of this repository with the given arguments, on Windows and elsewhere, so the
// pnpm scripts (lint, typecheck, test, build, dev, db:seed, openapi) work the same everywhere.
// MAVEN_CMD overrides the wrapper (e.g. MAVEN_CMD=mvn when a matching Maven is installed).
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const isWindows = process.platform === 'win32';
const command = process.env.MAVEN_CMD ?? path.join(apiRoot, isWindows ? 'mvnw.cmd' : 'mvnw');
// With shell: true Node joins the command and arguments unquoted, so cmd.exe would split a path
// that contains spaces (e.g. "D:\Web Programming\...").
const shellCommand = isWindows ? `"${command}"` : command;

const result = spawnSync(shellCommand, ['-B', ...process.argv.slice(2)], {
  cwd: apiRoot,
  stdio: 'inherit',
  shell: isWindows,
  env: {
    // Local runs read the repository's .env (see application.yml).
    MEAL_ENV_FILE: path.resolve(apiRoot, '.env'),
    ...process.env,
  },
});
if (result.error) {
  console.error(`Could not run ${command}: ${result.error.message}`);
  process.exit(1);
}
process.exit(result.status ?? 1);
