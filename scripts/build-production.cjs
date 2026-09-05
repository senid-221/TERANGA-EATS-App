const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const nativeEsbuild = path.join(root, 'node_modules', '@esbuild', 'linux-x64', 'bin', 'esbuild');
const fallbackEsbuild = path.join(root, 'node_modules', 'esbuild', 'bin', 'esbuild');
const viteCli = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');

const env = { ...process.env };
const esbuild = process.platform === 'linux' && fs.existsSync(nativeEsbuild)
  ? nativeEsbuild
  : fallbackEsbuild;

if (fs.existsSync(esbuild)) {
  try { fs.chmodSync(esbuild, 0o755); } catch {}
  env.ESBUILD_BINARY_PATH = esbuild;
  console.log(`Using esbuild binary: ${esbuild}`);
}

if (!fs.existsSync(viteCli)) {
  console.error(`Vite CLI not found: ${viteCli}`);
  process.exit(1);
}

const result = spawnSync(process.execPath, [viteCli, 'build'], {
  cwd: root,
  stdio: 'inherit',
  env
});

if (result.error) {
  console.error(`Vite build process failed: ${result.error.message}`);
  process.exit(1);
}

if (result.status !== 0) process.exit(result.status || 1);
