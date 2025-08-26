"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
console.log('--- PM2 .env DEBUG ---');
console.log('Attempting to load .env from:', path_1.default.resolve(__dirname, '../.env'));
console.log('ADMIN_USERNAME is:', process.env.ADMIN_USERNAME ? 'Loaded' : 'NOT LOADED');
console.log('ADMIN_PASSWORD is:', process.env.ADMIN_PASSWORD ? 'Loaded' : 'NOT LOADED');
console.log('--- END DEBUG CODE ---');
const auth_1 = __importDefault(require("./routes/auth"));
const contact_1 = __importDefault(require("./routes/contact"));
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '3000', 10);
// Restrict trust proxy to loopback only to avoid permissive proxy configuration
// which express-rate-limit rejects. Use explicit loopback instead of `true`.
app.set('trust proxy', '127.0.0.1');
app.use((0, helmet_1.default)({
    frameguard: false,
    contentSecurityPolicy: false
}));
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', [].join('; '));
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    next();
});
app.use((0, cors_1.default)({
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
const limiter = (0, express_rate_limit_1.default)({
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
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)('combined'));
const publicPath = path_1.default.join(__dirname, '../public');
if (process.env.NODE_ENV === 'production') {
    app.use(express_1.default.static(publicPath));
    console.log('📁 Serving Edwards Web Development frontend from:', publicPath);
}
app.get('/health', (req, res) => {
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
app.use('/api/auth', auth_1.default);
app.use('/api/contact', contact_1.default);
app.use('/api/*', (req, res) => {
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
if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
        res.sendFile(path_1.default.join(publicPath, 'index.html'));
    });
}
app.use((error, req, res, next) => {
    console.error('🚨 Edwards Web Development API Error:', error);
    res.status(error.status || 500).json({
        error: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : error.message,
        service: 'Edwards Web Development API',
        timestamp: new Date().toISOString()
    });
});
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Edwards Web Development API server running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`💼 Professional web development services ready`);
    console.log(`📡 Health check: http://localhost:${PORT}/health`);
    console.log(`🖼️  Iframe test: http://localhost:${PORT}/iframe-test`);
    console.log(`📱 Frontend: http://localhost:4200`);
    console.log('\n✅ Edwards Web Development API routes mounted:');
    console.log('   - /api/auth/* (authentication endpoints)');
    console.log('   - /api/contact/* (contact form endpoints)');
    console.log('   - /health (health check endpoint)');
});
exports.default = app;
