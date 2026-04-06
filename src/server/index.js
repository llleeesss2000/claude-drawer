const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const systemRoutes = require('./routes/system');
const skillsRoutes = require('./routes/skills');
const mcpRoutes = require('./routes/mcp');
const backupRoutes = require('./routes/backup');
const exploreRoutes = require('./routes/explore');
const claudemdRoutes = require('./routes/claudemd');
const settingsRoutes = require('./routes/settings');
const presetsRoutes = require('./routes/presets');
const exportRoutes = require('./routes/export');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/system', systemRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/mcp', mcpRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/explore', exploreRoutes);
app.use('/api/claudemd', claudemdRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/presets', presetsRoutes);
app.use('/api/export', exportRoutes);

// Static files (production mode)
const distPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
} else {
  console.warn('Warning: dist directory not found. Skipping static file serving.');
}

// SPA fallback - handle all non-API routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: true, message: 'Not Found' });
  }
  
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(500).json({ error: true, message: 'Client build not found' });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: true, message: err.message });
});

const startServer = async (port) => {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      resolve({ server, port });
    });
    
    server.on('error', (err) => {
      reject(err);
    });
  });
};

module.exports = { startServer };