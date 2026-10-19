import { spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootDir = resolve(__dirname, '..');

console.log('[Dev Runner] Starting Ariadne Instructor Portal backend & frontend...');

// 1. Start Server on port 4000
const serverProc = spawn('node', ['--experimental-strip-types', 'server/index.ts'], {
  cwd: rootDir,
  stdio: 'inherit'
});

// 2. Start Vite on port 5173
const viteProc = spawn('npx', ['vite', 'web', '--port', '5173'], {
  cwd: rootDir,
  stdio: 'inherit'
});

function cleanup() {
  console.log('\n[Dev Runner] Shutting down services...');
  serverProc.kill();
  viteProc.kill();
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
