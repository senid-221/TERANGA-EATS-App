const fs = require('fs');
const path = require('path');

// Hostinger can unpack esbuild without the executable bit. Fix it before Vite starts.
const candidates = [
  path.join(__dirname, '..', 'node_modules', '@esbuild', 'linux-x64', 'bin', 'esbuild'),
  path.join(__dirname, '..', 'node_modules', 'esbuild', 'bin', 'esbuild')
];

for (const file of candidates) {
  if (!fs.existsSync(file)) continue;
  try {
    fs.chmodSync(file, 0o755);
    console.log(`Prepared esbuild executable: ${file}`);
  } catch (error) {
    console.warn(`Could not chmod esbuild executable: ${file}`, error?.message || error);
  }
}

// Prefer the native Linux binary explicitly on Hostinger. This avoids esbuild
// resolving a second/incorrect binary wrapper in restricted Node runtimes.
const nativeEsbuild = candidates[0];
if (process.platform === 'linux' && fs.existsSync(nativeEsbuild)) {
  process.env.ESBUILD_BINARY_PATH = nativeEsbuild;
  console.log(`Using native esbuild binary: ${nativeEsbuild}`);
}
