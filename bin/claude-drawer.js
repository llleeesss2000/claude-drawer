#!/usr/bin/env node
if (parseInt(process.versions.node.split('.')[0]) < 18) {
  console.error('Error: Node.js version must be >= 18');
  process.exit(1);
}

const { startServer } = require('../src/server/index.js');
let open;

const PORT = 3847;
let serverInstance;

import('open').then(m => { open = m.default; });

startServer(PORT).then(({ server }) => {
  serverInstance = server;
  console.log(`Claude 抽屜已啟動：http://localhost:${PORT}`);
  if (open) open(`http://localhost:${PORT}`).catch(() => {});
  else setTimeout(() => { if (open) open(`http://localhost:${PORT}`).catch(() => {}); }, 500);
}).catch(err => {
  console.error('啟動失敗：', err.message);
  process.exit(1);
});

function gracefulShutdown() {
  if (serverInstance) {
    serverInstance.close(() => process.exit(0));
  } else {
    process.exit(0);
  }
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);