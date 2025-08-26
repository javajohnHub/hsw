import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    error: 'Too many authentication attempts from this IP',
    service: 'Edwards Web Development Auth',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * POST /api/auth/login
 * Edwards Web Development admin authentication
 */
router.post('/login', 
  authLimiter,
  [
    body('username')
      .notEmpty()
      .withMessage('Username is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
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

      // Edwards Web Development admin credentials from .env
      const isValidCredentials = (
        username === process.env.ADMIN_USERNAME && 
        password === process.env.ADMIN_PASSWORD
      );

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
      } else {
        res.status(401).json({
          success: false,
          message: 'Invalid username or password',
          service: 'Edwards Web Development Auth'
        });
      }
    } catch (error) {
      console.error('🚨 Edwards Web Development Auth Error:', error);
      res.status(500).json({
        success: false,
        message: 'Authentication service temporarily unavailable',
        service: 'Edwards Web Development Auth'
      });
    }
  }
);

/**
 * POST /api/auth/logout
 * Edwards Web Development admin logout
 */
router.post('/logout', (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    message: 'Logout successful',
    service: 'Edwards Web Development Auth'
  });
});

/**
 * GET /api/auth/status
 * Check Edwards Web Development admin authentication status
 */
router.get('/status', (req: Request, res: Response): void => {
  const authHeader = req.headers.authorization;
  const isAuthenticated = authHeader?.startsWith('Bearer edwards_auth_') || false;
  
  res.status(200).json({
    success: isAuthenticated,
    message: isAuthenticated ? 'User authenticated' : 'User not authenticated',
    service: 'Edwards Web Development Auth'
  });
});

export default router;