import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { initializeDatabase } from './utils/database';
import authRoutes from './routes/auth';
import groupRoutes from './routes/groups';
import participantRoutes from './routes/participants';
import wishlistRoutes from './routes/wishlist';
import recommendationRoutes from './routes/recommendations';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting - more lenient for development
// Skip rate limiting for health check endpoint
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs (increased from 100)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => req.path === '/api/health', // Skip rate limiting for health checks
});

// Apply rate limiting to all routes except health check
app.use((req, res, next) => {
  if (req.path === '/api/health') {
    return next();
  }
  limiter(req, res, next);
});

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root endpoint - helpful for checking if server is running
app.get('/', (req, res) => {
  res.json({ 
    message: 'Secret Santa API Server',
    status: 'running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      groups: '/api/groups',
      participants: '/api/participants',
      wishlist: '/api/wishlist',
      recommendations: '/api/recommendations'
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/participants', participantRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/recommendations', recommendationRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({ error: err.message || 'Something went wrong!' });
});

// 404 handler - catch all unmatched routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const startServer = async () => {
  try {
    // Initialize database
    await initializeDatabase();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Secret Santa API server running on port ${PORT}`);
      console.log(`📧 Email service: ${process.env.EMAIL_USER ? 'Configured' : 'Not configured'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
