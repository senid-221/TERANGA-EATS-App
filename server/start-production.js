import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const distIndex = path.join(projectRoot, 'dist', 'index.html');

// Production assets are built in GitHub Actions and deployed with the app.
// Do not run Vite/esbuild on Hostinger runtime; the hosting environment was
// terminating the esbuild child process ("service was stopped" / EPIPE).
if (!fs.existsSync(distIndex)) {
  console.error(`Production assets are missing: ${distIndex}`);
  console.error('Deploy the CI-generated dist/ directory before starting the server.');
  process.exit(1);
}

await import('./admin-bootstrap.js');
