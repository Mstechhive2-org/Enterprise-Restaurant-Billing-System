import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Middleware
// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  // Add frontend URL from environment variable
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  // Allow from CORS_ORIGIN environment variable (comma-separated)
  ...(process.env.CORS_ORIGIN && process.env.CORS_ORIGIN !== '*'
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : [])
];

const corsOptions = {
  origin: true, // Allow all origins explicitly
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type', 'Authorization']
};

// Security Middleware Imports
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import sanitize from 'mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';

// 1. Set Security HTTP Headers
app.use(helmet());

// 2. Limit requests from same API (Rate Limiting)
const limiter = rateLimit({
  max: 10000, // Safe limit for busy restaurants
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Body limit is increased to support base64 images

// 3. Data sanitization against NoSQL query injection
// Custom middleware to handle Express 5 read-only properties (req.query)
app.use((req, res, next) => {
  try {
    // Sanitize req.body
    if (req.body) {
      req.body = sanitize(req.body);
    }

    // Sanitize req.query (In-place modification for Express 5 compatibility)
    if (req.query) {
      const cleanedQuery = sanitize(req.query);
      // For Express 5, defineProperty is needed to overwrite the getter if assignment fails
      try {
        req.query = cleanedQuery;
      } catch (err) {
        Object.defineProperty(req, 'query', {
          value: cleanedQuery,
          writable: true,
          configurable: true
        });
      }
    }

    // Sanitize req.params
    if (req.params) {
      const cleanedParams = sanitize(req.params);
      try {
        req.params = cleanedParams;
      } catch (err) {
        Object.defineProperty(req, 'params', {
          value: cleanedParams,
          writable: true,
          configurable: true
        });
      }
    }
  } catch (error) {
    console.error('Security Sanitization Error:', error);
  }

  next();
});

// 4. Data sanitization against XSS (removed due to Express 5 compatibility)

// 5. Prevent parameter pollution
app.use(hpp());

// Enable Gzip compression for better performance
import compression from 'compression';
app.use(compression());

// Health check route
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Your restaurant billing backend is running perfect!..!',
    timestamp: new Date().toISOString()
  });
});

import fs from 'fs';
import path from 'path';

// Database Connection
// SECURITY: Do not default to a production database. Use an isolated temp DB.
let MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/unconfigured_client_db';

// Read client-config.json if it exists to override the database name dynamically
// If APP_USER_DATA_PATH is provided (via Electron), use it. Otherwise fallback to process.cwd()
try {
  const configDir = process.env.APP_USER_DATA_PATH || process.cwd();
  const configPath = path.join(configDir, 'client-config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (config.databaseName) {
      const parts = MONGO_URI.split('?');
      const connectionPart = parts[0];
      const queryPart = parts.length > 1 ? `?${parts[1]}` : '';
      const lastSlashIndex = connectionPart.lastIndexOf('/');
      const newConnectionPart = connectionPart.substring(0, lastSlashIndex) + '/' + config.databaseName;
      MONGO_URI = newConnectionPart + queryPart;
      console.log(`Using client-specific database: ${config.databaseName}`);
    }
  }
} catch (error) {
  console.error('Failed to parse client-config.json, using default database', error);
}

// Connection state
let isConnected = false;
let connectionPromise = null;

const connectDB = async () => {
  // If already connected, return
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return mongoose.connection;
  }

  // If connection is in progress, return the existing promise
  if (connectionPromise) {
    return connectionPromise;
  }

  // Start new connection
  connectionPromise = mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 30000, // Increased for serverless
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 1,
  }).then((connection) => {
    isConnected = true;
    console.log('Connected to MongoDB');
    return connection;
  }).catch((error) => {
    console.error('MongoDB connection error:', error);
    connectionPromise = null; // Reset on error to allow retry
    isConnected = false;
    throw error;
  });

  return connectionPromise;
};

// Middleware to ensure DB connection before handling requests (for serverless)
const ensureDBConnection = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({
      message: 'Database connection failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Apply middleware to all API routes BEFORE routes are registered
app.use('/api', ensureDBConnection);

// Routes
import menuRoutes from './routes/menuRoutes.js';
import billRoutes from './routes/billRoutes.js';
import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import configRoutes from './routes/configRoutes.js';
import startSessionCleanupJob from './utils/sessionCleanup.js';

app.use('/api/menu', menuRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/config', configRoutes);

// Start background session cleanup job
startSessionCleanupJob();

// Initialize connection for serverless (non-blocking)
// Connection will be established on first request via middleware
if (process.env.VERCEL === '1' || process.env.VERCEL_ENV) {
  // In serverless, connect on module load but don't block
  connectDB().catch((err) => {
    console.error('Initial connection attempt failed (will retry on request):', err.message);
  });
}

// Only start server if not in serverless environment (local development)
if (!process.env.VERCEL && !process.env.VERCEL_ENV) {
  const PORT = process.env.PORT || 5000;
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }).catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

export default app;