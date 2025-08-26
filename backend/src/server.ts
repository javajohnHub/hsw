import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env') });
console.log('--- PM2 .env DEBUG ---');
console.log('Attempting to load .env from:', path.resolve(__dirname, '../.env'));
console.log('ADMIN_USERNAME is:', process.env.ADMIN_USERNAME ? 'Loaded' : 'NOT LOADED');
console.log('ADMIN_PASSWORD is:', process.env.ADMIN_PASSWORD ? 'Loaded' : 'NOT LOADED');
console.log('--- END DEBUG CODE ---');

// Import routes following Edwards Web Development structure
import authRoutes from './routes/auth';
import contactRoutes from './routes/contact';
import contentRoutes from './routes/content';

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);

// Trust proxy for Edwards Web Development
app.set('trust proxy', '127.0.0.1');

// Security middleware for Edwards Web Development
app.use(helmet({
  frameguard: false, // Allow iframe embedding
  contentSecurityPolicy: false // We'll set CSP manually via headers
}));

// Manual CSP headers for Edwards Web Development iframe support
app.use((req: Request, res: Response, next: NextFunction): void => {
  // Set CSP via HTTP headers (not meta tags)
  res.setHeader('Content-Security-Policy', [
    
  ].join('; '));
  
  // Additional iframe headers
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  
  next();
});

// CORS configuration for Edwards Web Development
app.use(cors({
  origin: [
    'http://localhost:4200',
    'http://localhost:3000',
    'https://edwardswebdevelopment.com'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting for Edwards Web Development API
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: 'Too many requests from this IP',
    service: 'Edwards Web Development API'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Static file serving for Edwards Web Development
const publicPath = path.join(__dirname, '../public');
import fs from 'fs';
const rawFrontendUrl = process.env.FRONTEND_URL;
console.log('FRONTEND_URL env value:', rawFrontendUrl);
if (process.env.NODE_ENV === 'production') {
  if (fs.existsSync(publicPath)) {
    // Always mount at root to avoid path-to-regexp errors
    app.use('/', express.static(publicPath));
    console.log('📁 Serving Edwards Web Development frontend from:', publicPath, 'mounted at /');
  } else {
    console.error('❌ publicPath does not exist:', publicPath, '\nStatic frontend will NOT be served.');
  }
}

// Health check endpoint for Edwards Web Development
app.get('/health', (req: Request, res: Response): void => {
  res.status(200).json({
    status: 'healthy',
    service: 'Edwards Web Development API',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    port: PORT,
    frontend: 'http://localhost:4200',
    iframeSupport: 'enabled'
  });
});

// API routes for Edwards Web Development
app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/content', contentRoutes);

// 404 handler for Edwards Web Development API
app.use('/api/*', (req: Request, res: Response): void => {
  res.status(404).json({
    error: 'API endpoint not found',
    service: 'Edwards Web Development API',
    path: req.path,
    method: req.method,
    availableEndpoints: [
      'POST /api/auth/login',
      'POST /api/auth/logout', 
      'GET /api/auth/status',
      'POST /api/contact',
      'GET /health'
    ]
  });
});

// Serve Angular app for all non-API routes (SPA routing)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req: Request, res: Response): void => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}

// Global error handler
app.use((error: any, req: Request, res: Response, next: NextFunction): void => {
  console.error('🚨 Edwards Web Development API Error:', error);
  
  res.status(error.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message,
    service: 'Edwards Web Development API',
    timestamp: new Date().toISOString()
  });
});

// Start Edwards Web Development server
app.listen(PORT, '0.0.0.0', (): void => {
  console.log(`🚀 Edwards Web Development API server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💼 Professional web development services ready`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🖼️  Iframe test: http://localhost:${PORT}/iframe-test`);
  console.log(`📱 Frontend: http://localhost:4200`);
  
  console.log('\n✅ Edwards Web Development API routes mounted:');
  console.log('   - /api/auth/* (authentication endpoints)');
  console.log('   - /api/contact/* (contact form endpoints)');
  console.log('   - /api/content/* (content management endpoints)');
  console.log('   - /health (health check endpoint)');
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

export default app;
