const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

const activeUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-class', ({ userId, classroomId }) => {
    socket.join(`class-${classroomId}`);
    activeUsers.set(socket.id, { userId, classroomId });
    console.log(`User ${userId} joined classroom ${classroomId}`);
  });

  socket.on('send-message', (message) => {
    io.to(`class-${message.classroom}`).emit('new-message', message);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    activeUsers.delete(socket.id);
  });
});

// Database Connection
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    if (err.message.includes('IP address is not whitelisted')) {
      console.warn('WARNING: Your IP is not whitelisted in MongoDB Atlas. Please add 0.0.0.0/0 to your whitelist for development.');
    }
  });

// Routes
app.get('/', (req, res) => {
  res.send('EduTest Pro API is running');
});

// Import Routes
const questionRoutes = require('./routes/questions');
const examRoutes = require('./routes/exams');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categories');
const adminRoutes = require('./routes/admin');
const classroomRoutes = require('./routes/classrooms');
const teacherRoutes = require('./routes/teachers');
const notificationRoutes = require('./routes/notifications');
const chatRoutes = require('./routes/chat');

app.use('/api/questions', questionRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/classes', classroomRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);

// Error Handling Middleware
app.use((err, req, res, _next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    message: 'Đã có lỗi xảy ra trên server', 
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
