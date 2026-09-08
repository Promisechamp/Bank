const app = require('./src/app');
const http = require('http');
const { Server } = require('socket.io');
const { setupSocket } = require('./src/socket');

const PORT = process.env.PORT || 5000;

// Parse allowed origins the same way as in app.js
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'https://bank-tzkw.onrender.com'];

const server = http.createServer(app);

// Attach Socket.IO with the same CORS settings
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,  // now an array (supports multiple origins)
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make `io` available in your controllers (via req.app.get('io'))
app.set('io', io);

// Initialise all socket handlers (chat, notifications, online users, etc.)
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