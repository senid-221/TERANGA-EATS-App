import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const distIndex = path.join(projectRoot, 'dist', 'index.html');

if (!fs.existsSync(distIndex)) {
  console.log('Production build not found. Running npm run build before starting the server...');
  try {
    execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], {
      cwd: projectRoot,
      stdio: 'inherit',
      env: process.env
    });
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
