'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const adminPackages = [
  ['@strapi/strapi', './admin'], ['@strapi/admin', './strapi-admin'],
  ...['content-manager', 'content-type-builder', 'email', 'upload', 'i18n', 'content-releases', 'review-workflows', 'plugin-cloud', 'plugin-users-permissions'].map(name => [`@strapi/${name}`, './strapi-admin']),
];
function runtimeProblems(version = process.versions.node) {
  return [20, 22, 24].includes(Number(version.split('.')[0])) ? [] : [`Node ${version} is not a supported LTS version. Use Node 24 (see .nvmrc), or Node 20/22.`];
}
function exportTargets(value) {
  if (typeof value === 'string') return [value];
  if (!value || typeof value !== 'object') return [];
  return [...new Set(Object.entries(value).filter(([key]) => !['types', 'source'].includes(key)).flatMap(([, target]) => exportTargets(target)))];
}
function inspectInstall(root = path.resolve(__dirname, '..')) {
  const problems = runtimeProblems();
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const expected = manifest.dependencies['@strapi/strapi'];
  const appRequire = createRequire(path.join(root, 'package.json'));
  let coreRequire;
  try { coreRequire = createRequire(appRequire.resolve('@strapi/strapi/package.json')); }
  catch { problems.push('Strapi is not installed. Run npm ci inside strapi-backend.'); }
  for (const [name, entry] of adminPackages) {
    // A stale nested admin can fail even if the top-level installation is healthy.
    const seen = new Set();
    for (const context of [appRequire, ...(coreRequire ? [coreRequire] : [])]) {
      let filename;
      try { filename = context.resolve(`${name}/package.json`); }
      catch { problems.push(`${name} cannot be resolved. The backend installation is incomplete.`); continue; }
      if (seen.has(filename)) continue;
      seen.add(filename);
      const pkg = JSON.parse(fs.readFileSync(filename, 'utf8'));
      if (pkg.version !== expected) problems.push(`${name} is ${pkg.version}; this project requires ${expected}. Reinstall from package-lock.json.`);
      const targets = exportTargets(pkg.exports?.[entry]);
      if (!targets.length) problems.push(`${name}${entry.slice(1)} has no runtime export.`);
      for (const target of targets) if (!fs.existsSync(path.resolve(path.dirname(filename), target))) problems.push(`Missing ${path.relative(root, path.resolve(path.dirname(filename), target))}. The published package was not fully installed.`);
    }
  }
  return [...new Set(problems)];
}
function main() {
  let problems;
  try { problems = inspectInstall(); } catch (error) { problems = [`Could not inspect the backend installation: ${error.message}`]; }
  if (problems.length) {
    console.error('\nBackend dependency check failed:\n' + problems.map(problem => `  - ${problem}`).join('\n'));
    console.error('\nStop Strapi, then run inside strapi-backend:\n  npm run repair\n  npm run develop\n\nRepair reinstalls locked dependencies and removes generated caches. It preserves .env, uploads and database files.\n');
    process.exitCode = 1;
  } else console.log('Backend dependency check passed: matching Strapi versions and published admin entry files are present.');
}
if (require.main === module) main();
module.exports = { adminPackages, exportTargets, inspectInstall, runtimeProblems };
