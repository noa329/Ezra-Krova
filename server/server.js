require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const connectDB = require('./config/db');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:4200',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Connect to MongoDB Atlas
connectDB();

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:4200' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'יותר מדי בקשות, נסה שוב מאוחר יותר' },
});
app.use('/api', limiter);

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes (will be added in later features)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/requests', require('./routes/requests'));

// Attach io to app for use in controllers
app.set('io', io);

const setupSockets = require('./sockets/index');
setupSockets(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io };
