// Stable Hostinger entrypoint.
// Do not replace this file during the frontend build: Hostinger starts it directly.
import { spawn } from 'node:child_process';

const child = spawn(process.execPath, ['--import', 'tsx', 'server.ts'], {
  stdio: 'inherit',
  env: process.env,
});

const forwardSignal = (signal) => {
  if (!child.killed) child.kill(signal);
};

process.on('SIGTERM', () => forwardSignal('SIGTERM'));
process.on('SIGINT', () => forwardSignal('SIGINT'));

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
