"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const router = (0, express_1.Router)();
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        error: 'Too many authentication attempts from this IP',
        service: 'Edwards Web Development Auth',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});
router.post('/login', authLimiter, [
    (0, express_validator_1.body)('username')
        .notEmpty()
        .withMessage('Username is required'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                message: 'Invalid input data',
                errors: errors.array(),
                service: 'Edwards Web Development Auth'
            });
            return;
        }
        const { username, password } = req.body;
        const isValidCredentials = (username === process.env.ADMIN_USERNAME &&
            password === process.env.ADMIN_PASSWORD);
        if (isValidCredentials) {
            const authToken = `edwards_auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            res.status(200).json({
                success: true,
                message: 'Authentication successful',
                token: authToken,
                user: {
                    id: '1',
                    username: process.env.ADMIN_USERNAME,
                    name: 'Edwards Web Development Admin',
                    role: 'administrator'
                },
                service: 'Edwards Web Development Auth'
            });
        }
        else {
            res.status(401).json({
                success: false,
                message: 'Invalid username or password',
                service: 'Edwards Web Development Auth'
            });
        }
    }
    catch (error) {
        console.error('🚨 Edwards Web Development Auth Error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication service temporarily unavailable',
            service: 'Edwards Web Development Auth'
        });
    }
});
router.post('/logout', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Logout successful',
        service: 'Edwards Web Development Auth'
    });
});
router.get('/status', (req, res) => {
    const authHeader = req.headers.authorization;
    const isAuthenticated = authHeader?.startsWith('Bearer edwards_auth_') || false;
    res.status(200).json({
        success: isAuthenticated,
        message: isAuthenticated ? 'User authenticated' : 'User not authenticated',
        service: 'Edwards Web Development Auth'
    });
});
exports.default = router;
