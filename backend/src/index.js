/**
 * WebChat Pro - Backend Server Entry Point
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/users', require('./routes/users'));
app.use('/api/v1/conversations', require('./routes/conversations'));
app.use('/api/v1/messages', require('./routes/messages'));
app.use('/api/v1/friends', require('./routes/friends'));
app.use('/api/v1/notifications', require('./routes/notifications'));
app.use('/api/v1/upload', require('./routes/upload'));

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, message: err.message });
});

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Make io accessible to routes
app.set('io', io);

// Load and call socket handler
const socketModule = require('./socket/handler');
console.log('Socket module exports:', Object.keys(socketModule));
console.log('socketHandler type:', typeof socketModule.socketHandler);

socketModule.socketHandler(io);

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`WebChat Pro Backend Started on port ${PORT}`);
});