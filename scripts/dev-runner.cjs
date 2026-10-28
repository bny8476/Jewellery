const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting YAZHINI FINE JEWELS & PAWN SHOP (Frontend + Backend)...');

const isWindows = process.platform === 'win32';
const envFile = path.resolve(__dirname, '../.env');
const envExample = path.resolve(__dirname, '../.env.example');

// Auto-create local .env from .env.example if missing
if (!fs.existsSync(envFile) && fs.existsSync(envExample)) {
  fs.copyFileSync(envExample, envFile);
  console.log('📝 Created default .env from .env.example');
}

// Start Backend on port 5001
const backendArgs = ['--watch'];
if (fs.existsSync(envFile)) {
  backendArgs.push(`--env-file=${envFile}`);
}
backendArgs.push('src/server.ts');

let isCleaningUp = false;
let backend = null;

function launchBackend() {
  backend = spawn('node', backendArgs, {
    cwd: path.resolve(__dirname, '../backend'),
    stdio: 'inherit',
    shell: isWindows,
    env: { ...process.env, PORT: '5001' }
  });

  backend.on('error', (err) => {
    console.error('❌ Backend server process error:', err.message);
  });

  backend.on('close', (code) => {
    if (!isCleaningUp) {
      console.log(`Backend exited with code ${code}. Restarting in 1s...`);
      setTimeout(launchBackend, 1000);
    }
  });
}

launchBackend();

// Start Frontend Vite Dev Server on port 5173
const npmCmd = isWindows ? 'npm.cmd' : 'npm';
const frontend = spawn(npmCmd, ['--workspace=frontend', 'run', 'dev'], {
  cwd: path.resolve(__dirname, '..'),
  stdio: 'inherit',
  shell: isWindows,
  env: { ...process.env }
});

frontend.on('error', (err) => {
  console.error('❌ Frontend server process error:', err.message);
});

function cleanup() {
  isCleaningUp = true;
  console.log('\n🛑 Shutting down development servers...');
  try {
    backend.kill();
  } catch {}
  try {
    frontend.kill();
  } catch {}
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
