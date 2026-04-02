import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import githubRoutes from './routes/github';
import projectRoutes from './routes/projects';
import shortUrlRoutes from './routes/shorturl';
import filesRoutes from './routes/files';
import { authenticate, AuthRequest } from './middleware/auth';
import { setSocketIO } from './utils/websocket';
import { cleanupExpiredApiKeys } from './utils/apiKey';

// Load environment variables
dotenv.config();

// Initialize Prisma Client
const prisma = new PrismaClient();

// Initialize Express app
const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"]
  }
});

const PORT = parseInt(process.env.PORT || '6000', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication required'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
    socket.data.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User ${socket.data.userId} connected to socket ${socket.id}`);
  
  // Join user to their own room for targeted messaging
  socket.join(`user_${socket.data.userId}`);
  
  socket.on('disconnect', () => {
    console.log(`User ${socket.data.userId} disconnected from socket ${socket.id}`);
  });
});

// Set the Socket.IO instance for use in other modules
setSocketIO(io);

// Start periodic cleanup of expired API keys (every hour)
setInterval(() => {
  cleanupExpiredApiKeys().catch(err => 
    console.error('Failed to cleanup expired API keys:', err)
  );
}, 60 * 60 * 1000); // 1 hour

// Run initial cleanup
cleanupExpiredApiKeys().catch(err => 
  console.error('Initial API key cleanup failed:', err)
);

// CORS Configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (playground)
app.use('/public', express.static(path.join(__dirname, '../public')));

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'Welcome to Express + TypeScript + Prisma API with JWT Auth',
    playground: `${req.protocol}://${req.get('host')}/public/playground.html`
  });
});

// Playground shortcut
app.get('/playground', (req: Request, res: Response) => {
  res.redirect('/public/playground.html');
});

// Auth routes
app.use('/auth', authRoutes);

// GitHub routes
app.use('/api', githubRoutes);

// Project routes (protected)
app.use('/projects', projectRoutes);

// Short URL routes
app.use('/url', shortUrlRoutes); // For /url/shorten, /url/my-urls, etc.

// File serving routes (public) - must be before /s/ shorturl redirect
app.use('/f', filesRoutes);      // For /f/:shortCode to serve files directly

// Short URL redirect (public)
app.use('/s', shortUrlRoutes);   // For /s/:shortCode redirect

// Protected route example
app.get('/users', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Protected route - Get current user
app.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Start server
server.listen(PORT, HOST, () => {
  console.log(`🚀 Server is running on:`);
  console.log(`   - Local:   http://localhost:${PORT}`);
  console.log(`   - Network: http://${HOST}:${PORT}`);
  console.log(`   - Playground: http://localhost:${PORT}/playground`);
  console.log(`   - WebSocket: Available for real-time communication`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
