import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import githubRoutes from './routes/github';
import projectRoutes from './routes/projects';
import { authenticate, AuthRequest } from './middleware/auth';

// Load environment variables
dotenv.config();

// Initialize Prisma Client
const prisma = new PrismaClient();

// Initialize Express app
const app = express();
const PORT = parseInt(process.env.PORT || '6000', 10);
const HOST = process.env.HOST || '0.0.0.0';

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
app.listen(PORT, HOST, () => {
  console.log(`🚀 Server is running on:`);
  console.log(`   - Local:   http://localhost:${PORT}`);
  console.log(`   - Network: http://${HOST}:${PORT}`);
  console.log(`   - Playground: http://localhost:${PORT}/playground`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
