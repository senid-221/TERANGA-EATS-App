import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const distIndex = path.join(projectRoot, 'dist', 'index.html');

const runBuildWithoutNpm = () => {
  const prepareScript = path.join(projectRoot, 'scripts', 'prepare-build.cjs');
  const viteCli = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');
  const nativeEsbuild = path.join(projectRoot, 'node_modules', '@esbuild', 'linux-x64', 'bin', 'esbuild');

  if (process.platform === 'linux' && fs.existsSync(nativeEsbuild)) {
    process.env.ESBUILD_BINARY_PATH = nativeEsbuild;
    try { fs.chmodSync(nativeEsbuild, 0o755); } catch {}
    console.log(`Using native esbuild binary: ${nativeEsbuild}`);
  }

  if (fs.existsSync(prepareScript)) {
    execFileSync(process.execPath, [prepareScript], {
      cwd: projectRoot,
      stdio: 'inherit',
      env: process.env
    });
  }

  if (!fs.existsSync(viteCli)) {
    throw new Error(`Vite CLI not found at ${viteCli}. Dependencies must be installed before starting the application.`);
  }

  execFileSync(process.execPath, [viteCli, 'build'], {
    cwd: projectRoot,
    stdio: 'inherit',
    env: process.env
  });
};

if (!fs.existsSync(distIndex)) {
  console.log('Production build not found. Running Vite build directly with Node...');
  try {
    runBuildWithoutNpm();
  } catch (error) {
    console.error('Production build failed. Server will not start.', error?.message || error);
    process.exit(1);
  }
}

if (!fs.existsSync(distIndex)) {
  console.error(`Production build is still missing: ${distIndex}`);
  process.exit(1);
}

await import('./admin-bootstrap.js');
