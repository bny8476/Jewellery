const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting RCB JEWELRY & PAWN SHOP (Frontend + Backend)...');

// Start Backend on port 5001
const backend = spawn('node', ['--env-file=../.env', 'src/server.ts'], {
  cwd: path.resolve(__dirname, '../backend'),
  stdio: 'inherit',
  env: { ...process.env, PORT: '5001' }
});

// Start Frontend Vite Dev Server on port 5173
const frontend = spawn('npx', ['vite'], {
  cwd: path.resolve(__dirname, '../frontend'),
  stdio: 'inherit',
  env: { ...process.env }
});

function cleanup() {
  console.log('\n🛑 Shutting down development servers...');
  backend.kill();
  frontend.kill();
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
