require('dotenv').config();

const app = require('./src/app');
const http = require('http');
const { Server } = require('socket.io');
const { setupSocket } = require('./src/socket');
const { verifyEmailTransporter } = require('./src/email/email');

const PORT = process.env.PORT || 5000;

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://bank-tzkw.onrender.com',
    ];

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.set('io', io);

setupSocket(io);

server.listen(PORT, async () => {
  console.log('=================================');
  console.log('🏦 Banking Demo API Server');
  console.log('=================================');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`📡 Socket.IO ready`);
  console.log('=================================');

  console.log('\n📧 Verifying SMTP configuration...');

  await verifyEmailTransporter();
});