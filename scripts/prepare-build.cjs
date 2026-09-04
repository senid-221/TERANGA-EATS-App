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
