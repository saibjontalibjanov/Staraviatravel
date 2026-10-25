'use strict';
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { spawnSync } = require('node:child_process');
const { inspectInstall, runtimeProblems } = require('./check-install');
const root = path.resolve(__dirname, '..');
// Never remove .tmp (default SQLite storage), .env or public/uploads.
const generatedPaths = ['.cache', '.strapi', 'build', 'dist'];
function clearGenerated(directory = root) {
  for (const name of generatedPaths) fs.rmSync(path.join(directory, name), { recursive: true, force: true });
}
function configuredPort(directory = root) {
  const envFile = path.join(directory, '.env');
  const match = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf8').match(/^\s*PORT\s*=\s*["']?(\d+)/m) : null;
  const port = Number(process.env.PORT || match?.[1] || 1337);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be a valid TCP port.');
  return port;
}
function isListening(port) {
  return new Promise(resolve => {
    const socket = net.connect({ port, host: '127.0.0.1' });
    const finish = value => { socket.destroy(); resolve(value); };
    socket.setTimeout(1000); socket.once('connect', () => finish(true)); socket.once('error', () => finish(false)); socket.once('timeout', () => finish(false));
  });
}
function install() {
  const args = ['ci', '--include=dev', '--no-audit', '--no-fund'];
  const npmCli = process.env.npm_execpath;
  return npmCli ? spawnSync(process.execPath, [npmCli, ...args], { cwd: root, stdio: 'inherit' }) : spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
}
async function main() {
  const problems = runtimeProblems(); if (problems.length) throw new Error(problems.join('\n'));
  const port = configuredPort();
  if (await isListening(port)) throw new Error(`Stop the backend listening on port ${port} before running repair. No files were changed.`);
  console.log('Reinstalling the exact backend dependencies from package-lock.json…');
  const result = install();
  if (result.error || result.status !== 0) throw new Error('npm ci failed. Check the npm output above and retry repair. Your .env and database were not removed.');
  clearGenerated(); const issues = inspectInstall(); if (issues.length) throw new Error(issues.join('\n'));
  console.log('Repair complete. .env, databases and uploads were preserved. Run npm run develop (or npm run build, then npm start for production).');
}
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { clearGenerated, configuredPort, generatedPaths };
