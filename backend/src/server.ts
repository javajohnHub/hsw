import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import path from 'path';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
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
import tournamentsApi from './routes/tournaments';

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);
const NODE_ENV_RAW = (process.env.NODE_ENV || '').trim().toLowerCase();
const isProd = NODE_ENV_RAW === 'production';

// Trust proxy for Edwards Web Development
app.set('trust proxy', '127.0.0.1');

// Security middleware for Edwards Web Development
// Configure CSP explicitly. Do NOT force upgrade-insecure-requests unless enabled via env.
const enableHttpsUpgrade = process.env.FORCE_HTTPS === 'true';
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", 'https:', 'data:'],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      imgSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      scriptSrcAttr: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
      connectSrc: ["'self'"],
      // Only add upgrade-insecure-requests when explicitly enabled (i.e., after TLS is working)
      ...(enableHttpsUpgrade ? { upgradeInsecureRequests: [] } : {})
    }
  },
  // Keep HSTS; browsers only apply it over HTTPS
  hsts: { maxAge: 15552000, includeSubDomains: true },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' }
}));

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

// Only apply rate limiting in production and when not disabled
const disableRateLimit = process.env.DISABLE_RATE_LIMITING === 'true';
if (isProd && !disableRateLimit) {
  app.use('/api/', limiter);
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression middleware
app.use(compression());

// Static file serving for Edwards Web Development
const publicPath = path.join(__dirname, '../public');
const tournamentsPath = path.join(publicPath, 'tournaments');
import fs from 'fs';
const rawFrontendUrl = process.env.FRONTEND_URL;
console.log('FRONTEND_URL env value:', rawFrontendUrl);
if (isProd) {
  if (fs.existsSync(publicPath)) {
    // Serve the main site at root
    app.use('/', express.static(publicPath));
    console.log('📁 Serving Edwards Web Development frontend from:', publicPath, 'mounted at /');
  } else {
    console.error('❌ publicPath does not exist:', publicPath, '\nStatic frontend will NOT be served.');
  }

  // Serve Tournament SPA under /tournaments
  if (fs.existsSync(tournamentsPath)) {
    app.use('/tournaments', express.static(tournamentsPath));
    console.log('🎮 Serving Tournament app from:', tournamentsPath, 'mounted at /tournaments');
  } else {
    console.warn('⚠️ tournamentsPath does not exist yet:', tournamentsPath);
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
import adminRoutes from './routes/admin';
app.use('/api/admin', adminRoutes);
// Lightweight write-guard for tournaments API using auth cookie/header or basic auth
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  // Allow GETs without auth
  if (req.method === 'GET') return next();
  
  const cookieVal = (req as any).cookies?.['ed_auth'] as string | undefined;
  const authHeader = req.headers.authorization;
  
  // Check token-based auth first
  const tokenAuth = Boolean(
    (cookieVal && cookieVal.startsWith('edwards_auth_')) ||
    (authHeader && authHeader.startsWith('Bearer edwards_auth_'))
  );
  
  // Check basic auth as fallback
  let basicAuth = false;
  if (authHeader && authHeader.startsWith('Basic ')) {
    try {
      const base64Credentials = authHeader.split(' ')[1];
      const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
      const [username, password] = credentials.split(':');
      
      const clean = (v: string | undefined) => (v ?? '').replace(/\r/g, '').trim();
      const envUser = clean(process.env.ADMIN_USERNAME);
      const envPass = clean(process.env.ADMIN_PASSWORD);
      
      basicAuth = (username === envUser && password === envPass);
    } catch (e) {
      // Invalid basic auth format
    }
  }
  
  if (!tokenAuth && !basicAuth) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  next();
};

app.use('/api/tournaments', requireAdmin, tournamentsApi);

// 404 handler for Edwards Web Development API
app.use((req: Request, res: Response, next: NextFunction): void => {
  // Only handle unmatched API routes
  if (req.path.startsWith('/api/')) {
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
  } else {
    next();
  }
});

// Serve Angular app for all non-API routes (SPA routing)
if (isProd) {
  // Tournament SPA fallback for its client-side routes
  app.get(/^\/tournaments\/.*/, (req: Request, res: Response): void => {
    res.sendFile(path.join(tournamentsPath, 'index.html'));
  });

  // Main site fallback
  app.get(/^(?!\/api).*/, (req: Request, res: Response): void => {
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

// Note: In development we don't serve static SPA files here; Angular runs separately.

export default app;
