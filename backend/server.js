const app = require('./src/app');
const http = require('http');
const { Server } = require('socket.io');
const { setupSocket } = require('./src/socket');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173', // ✅ Updated to Vite's default
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ✅ Attach io to app so controllers can access it
app.set('io', io);

// Attach socket handlers
setupSocket(io);

server.listen(PORT, () => {
  console.log('=================================');
  console.log('🏦 Banking Demo API Server');
  console.log('=================================');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`📡 Socket.IO ready`);
  console.log('=================================');
});