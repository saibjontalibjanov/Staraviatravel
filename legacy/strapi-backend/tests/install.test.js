'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { adminPackages, inspectInstall, runtimeProblems } = require('../scripts/check-install');
const { clearGenerated } = require('../scripts/repair-install');
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'strapi-install-check-'));
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ dependencies: { '@strapi/strapi': '5.48.0' } }));
  for (const [name, entry] of adminPackages) addPackage(root, name, entry);
  return root;
}
function addPackage(root, name, entry, version = '5.48.0') {
  const directory = path.join(root, 'node_modules', name);
  fs.mkdirSync(path.join(directory, 'dist/admin'), { recursive: true });
  fs.writeFileSync(path.join(directory, 'package.json'), JSON.stringify({ name, version, exports: { './package.json': './package.json', [entry]: { types: './missing-types.d.ts', source: './missing-source.ts', import: './dist/admin/index.mjs', require: './dist/admin/index.js' } } }));
  fs.writeFileSync(path.join(directory, 'dist/admin/index.mjs'), 'export default {};');
  fs.writeFileSync(path.join(directory, 'dist/admin/index.js'), 'module.exports = {};');
}
test('detects the screenshot failure even though the CommonJS entry still exists', () => {
  const root = fixture();
  try {
    assert.deepEqual(inspectInstall(root), []);
    fs.unlinkSync(path.join(root, 'node_modules/@strapi/admin/dist/admin/index.mjs'));
    assert(inspectInstall(root).some(issue => issue.includes('index.mjs') && issue.includes('Missing')));
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
test('detects a broken nested admin that shadows a healthy root admin package', () => {
  const root = fixture();
  try {
    const nestedRoot = path.join(root, 'node_modules/@strapi/strapi');
    addPackage(nestedRoot, '@strapi/admin', './strapi-admin', '5.47.0');
    fs.unlinkSync(path.join(nestedRoot, 'node_modules/@strapi/admin/dist/admin/index.mjs'));
    const issues = inspectInstall(root);
    assert(issues.some(issue => issue.includes('5.47.0')));
    assert(issues.some(issue => issue.includes(path.join('@strapi', 'strapi', 'node_modules', '@strapi', 'admin'))));
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
test('repair cache cleanup preserves the database, secrets, uploads and source', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'strapi-repair-check-'));
  try {
    const preserved = ['.env', '.tmp/data.db', 'public/uploads/passport.png', 'src/index.js', 'package-lock.json'];
    for (const name of [...preserved, '.cache/stale', '.strapi/client/app.js', 'build/index.html', 'dist/stale.js']) {
      fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true }); fs.writeFileSync(path.join(root, name), 'preserve-test');
    }
    clearGenerated(root);
    for (const name of preserved) assert.equal(fs.readFileSync(path.join(root, name), 'utf8'), 'preserve-test');
    for (const name of ['.cache', '.strapi', 'build', 'dist']) assert(!fs.existsSync(path.join(root, name)));
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
test('unsupported Node versions are rejected before installation or startup', () => {
  assert.equal(runtimeProblems('24.19.0').length, 0); assert.equal(runtimeProblems('22.20.0').length, 0);
  assert.equal(runtimeProblems('18.20.0').length, 1); assert.equal(runtimeProblems('25.0.0').length, 1);
});
