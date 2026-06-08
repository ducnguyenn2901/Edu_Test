const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Classroom = require('./models/Classroom');
const { protect } = require('./middleware/auth');

const sanitize = (data) => {
  if (data === null || data === undefined) return data;
  
  if (Array.isArray(data)) {
    return data.map(sanitize);
  }
  
  if (typeof data === 'object' && data !== null && Object.prototype.toString.call(data) === '[object Object]') {
    const sanitized = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const safeKey = key.startsWith('$') ? '_' + key : key;
        sanitized[safeKey] = sanitize(data[key]);
      }
    }
    return sanitized;
  }
  
  return data;
};

const mongoSanitizeMiddleware = (req, res, next) => {
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  next();
};

dotenv.config();

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Middleware
app.use(helmet());
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (corsOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(mongoSanitizeMiddleware);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 600,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  }),
);

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
app.use((req, res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();
  if (req.path === '/api/auth/login' || req.path === '/api/auth/register') return next();
  if (!req.cookies?.edutest_access) return next();

  const csrfCookie = req.cookies?.edutest_csrf;
  const csrfHeader = req.get('x-csrf-token');
  if (!csrfCookie || !csrfHeader || csrfHeader !== csrfCookie) {
    return res.status(403).json({ message: 'CSRF token không hợp lệ' });
  }
  return next();
});

const uploadsRoot = path.join(__dirname, 'uploads');
app.get('/uploads/:filename', protect, (req, res, next) => {
  const filename = path.basename(req.params.filename);
  const fullPath = path.join(uploadsRoot, filename);
  res.sendFile(fullPath, (err) => {
    if (!err) return;
    if (err.code === 'ENOENT') return res.status(404).json({ message: 'Không tìm thấy tệp' });
    return next(err);
  });
});

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: corsOrigins,
    credentials: true,
  },
});

const activeUsers = new Map();

const parseCookieHeader = (cookieHeader) => {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach((part) => {
    const [rawKey, ...rawValue] = part.trim().split('=');
    if (!rawKey) return;
    cookies[rawKey] = decodeURIComponent(rawValue.join('=') || '');
  });
  return cookies;
};

const isUserIdInClassroom = (classroom, userId) => {
  const id = userId.toString();
  if (classroom.homeroomTeacher?.toString() === id) return true;
  if (classroom.teachers?.some((v) => v.toString() === id)) return true;
  if (classroom.students?.some((v) => v.toString() === id)) return true;
  return false;
};

io.use(async (socket, next) => {
  try {
    const cookies = parseCookieHeader(socket.request.headers.cookie);
    const token = cookies.edutest_access;
    if (!token) return next(new Error('Unauthorized'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return next(new Error('Unauthorized'));

    socket.user = user;
    return next();
  } catch {
    return next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-class', async ({ classroomId }) => {
    try {
      const classroom = await Classroom.findById(classroomId).select(
        'homeroomTeacher teachers students',
      );
      if (!classroom) return;
      if (socket.user.role !== 'admin' && !isUserIdInClassroom(classroom, socket.user._id)) return;

      socket.join(`class-${classroomId}`);
      activeUsers.set(socket.id, { userId: socket.user._id.toString(), classroomId });
    } catch {
      return;
    }
  });

  socket.on('send-message', async (message) => {
    try {
      const classroomId = message?.classroom;
      if (!classroomId) return;
      const classroom = await Classroom.findById(classroomId).select(
        'homeroomTeacher teachers students',
      );
      if (!classroom) return;
      if (socket.user.role !== 'admin' && !isUserIdInClassroom(classroom, socket.user._id)) return;
      io.to(`class-${classroomId}`).emit('new-message', message);
    } catch {
      return;
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    activeUsers.delete(socket.id);
  });
});

// Database Connection
mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    if (err.message.includes('IP address is not whitelisted')) {
      console.warn(
        'WARNING: Your IP is not whitelisted in MongoDB Atlas. Please add 0.0.0.0/0 to your whitelist for development.',
      );
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
const examFolderRoutes = require('./routes/examFolders');

app.use(
  '/api/auth',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 60,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  }),
);

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
app.use('/api/exam-folders', examFolderRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: 'Không tìm thấy tài nguyên' });
});

// Error Handling Middleware
app.use((err, req, res, _next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    message: 'Đã có lỗi xảy ra trên server',
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
