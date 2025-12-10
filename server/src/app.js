const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const { initDatabase } = require('./db/database');
const characterRoutes = require('./routes/character');
const diceRoutes = require('./routes/dice');
const spellsRoutes = require('./routes/spells');
const combatRoutes = require('./routes/combat');

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// CORS configuration (restrictive for security)
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3000', /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d+$/],
  credentials: true
};

// Socket.IO configuration
const io = new Server(httpServer, {
  cors: corsOptions,
  pingTimeout: 60000,
  pingInterval: 25000
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../client/dist')));

// Rate limiting
const limiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 20 // max 20 requests per second
});
app.use('/api', limiter);

// Initialize database
initDatabase();

// Routes
app.use('/api/character', characterRoutes(io));
app.use('/api/dice', diceRoutes(io)); // Pass io to dice routes for broadcasting
app.use('/api/spells', spellsRoutes(io));
app.use('/api/combat', combatRoutes(io)); // Pass io for real-time combat updates

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });

  socket.on('ping', () => {
    socket.emit('pong');
  });

  // For debugging
  socket.on('test_roll', (data) => {
    console.log('🎲 Test roll received:', data);
    io.emit('dice_roll', data);
  });

  // Broadcast spell cast to all clients
  socket.on('spell_cast', (data) => {
    console.log('✨ Spell cast:', data.spell, 'at level', data.level);
    io.emit('spell_cast', data);
  });
});

// Serve frontend for all other routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🎲 Server started on port ${PORT}`);
});

// Export io for use in routes
module.exports = { io };
