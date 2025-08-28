import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for auth endpoints (configurable)
const AUTH_WINDOW_MS = parseInt(process.env.AUTH_RATE_WINDOW_MS || '', 10);
const AUTH_MAX = parseInt(process.env.AUTH_RATE_MAX || '', 10);
const AUTH_SKIP_SUCCESS = (process.env.AUTH_RATE_SKIP_SUCCESSFUL || 'true').toLowerCase() === 'true';

const authLimiter = rateLimit({
  windowMs: Number.isFinite(AUTH_WINDOW_MS) && AUTH_WINDOW_MS > 0 ? AUTH_WINDOW_MS : 5 * 60 * 1000, // default 5 minutes
  max: Number.isFinite(AUTH_MAX) && AUTH_MAX > 0 ? AUTH_MAX : 20, // default 20 attempts per window per IP
  message: {
    error: 'Too many authentication attempts from this IP',
    service: 'Edwards Web Development Auth',
    hint: 'Please wait and try again shortly.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: AUTH_SKIP_SUCCESS
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

      const { username, password } = req.body as { username: string; password: string };

      // Normalize env values to avoid CRLF/whitespace issues from .env
      const clean = (v: string | undefined) => (v ?? '').replace(/\r/g, '').trim();
      const envUser = clean(process.env.ADMIN_USERNAME);
      const envPass = clean(process.env.ADMIN_PASSWORD);

      // Compare with trimmed username; do not trim password input to preserve exactness
      const isValidCredentials = (
        (username || '').trim() === envUser &&
        (password || '') === envPass
      );

      if (isValidCredentials) {
        const authToken = `edwards_auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        // Set httpOnly auth cookie for same-origin requests
        try {
          const isProd = (process.env.NODE_ENV === 'production');
          res.cookie('ed_auth', authToken, {
            httpOnly: true,
            secure: isProd, // secure in prod
            sameSite: 'lax',
            maxAge: 1000 * 60 * 60 * 4 // 4 hours
          });
        } catch (cookieErr) {
          // If cookie setting fails, still return token in body for fallback
          console.warn('Auth cookie could not be set:', cookieErr);
        }

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
  try {
    res.clearCookie('ed_auth', { httpOnly: true, sameSite: 'lax' });
  } catch {}
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
  // Prefer httpOnly cookie, fall back to Authorization header
  const cookieVal = (req as any).cookies?.['ed_auth'] as string | undefined;
  const isAuthenticated = Boolean(
    (cookieVal && cookieVal.startsWith('edwards_auth_')) ||
    (authHeader && authHeader.startsWith('Bearer edwards_auth_'))
  );
  
  res.status(200).json({
    success: isAuthenticated,
    message: isAuthenticated ? 'User authenticated' : 'User not authenticated',
    service: 'Edwards Web Development Auth'
  });
});

export default router;