import { Router, Request, Response } from 'express';

const router = Router();

// Simple test route
router.get('/test', (req: Request, res: Response) => {
  res.json({ message: 'Tournament API is working!' });
});

export default router;
