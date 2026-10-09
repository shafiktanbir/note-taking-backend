import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectToDatabase } from './lib/db';

import authRoutes from './routes/auth';
import notesRoutes from './routes/notes';
import userRoutes from './routes/users';
import aggregationRoutes from './routes/aggregations';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';

// CORS Middleware Configuration
app.use(
  cors({
    origin: CLIENT_ORIGIN === '*' ? true : CLIENT_ORIGIN,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

// Ensure Database Connection for every request (Serverless & Express compatible)
app.use(async (req: Request, res: Response, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    console.error('Database connection middleware error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DB_CONNECTION_ERROR', message: 'Failed to connect to database' },
    });
  }
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Secure Note-Taking REST API is healthy',
    timestamp: new Date().toISOString(),
  });
});

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/users', userRoutes);
app.use('/api/aggregations', aggregationRoutes);

// Root route
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Secure Note-Taking REST API',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      notes: '/api/notes',
      users: '/api/users',
      aggregations: '/api/aggregations',
    },
  });
});

// Start Express server if executed directly (non-serverless)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
