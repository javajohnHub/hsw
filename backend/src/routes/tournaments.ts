import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import type { NextFunction } from 'express';

const router = Router();
// Simple write-guard middleware: allow GETs; require auth cookie/header for others
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'GET') return next();
  const cookies = (req as any).cookies as Record<string, string> | undefined;
  const cookieVal = cookies?.['ed_auth'];
  const authHeader = req.headers.authorization;
  const ok = Boolean(
    (cookieVal && cookieVal.startsWith('edwards_auth_')) ||
    (authHeader && authHeader.startsWith('Bearer edwards_auth_'))
  );
  if (!ok) return res.status(401).json({ success: false, message: 'Unauthorized' });
  next();
};

router.use(requireAdmin);

// Resolve persistent data directory:
// - Prefer explicit env vars (TOURNAMENTS_DATA_DIR or DATA_DIR)
// - Otherwise, default to backend/data (outside dist) so builds don't overwrite data
const cleanEnvPath = (v?: string) => (v ?? '').replace(/\r/g, '').trim();
const envDirRaw = process.env.TOURNAMENTS_DATA_DIR || process.env.DATA_DIR || '';
const envDir = cleanEnvPath(envDirRaw);
const defaultDirOutsideDist = path.resolve(__dirname, '../../data');
const legacyDistDir = path.resolve(__dirname, '../data'); // old location (inside dist)
const dataDir = envDir
  ? path.resolve(envDir)
  : defaultDirOutsideDist;

// Log chosen data directory once for debugging
try {
  // eslint-disable-next-line no-console
  console.log('[tournaments] Using data directory:', dataDir);
} catch {}
const file = (name: string) => path.join(dataDir, `${name}.json`);

// Ensure data directory exists and migrate legacy files from dist/data on first run
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
try {
  // If using default dir and legacy dist/data exists, migrate JSON files once
  if (!envDir && fs.existsSync(legacyDistDir)) {
    const entries = fs.readdirSync(legacyDistDir).filter(f => f.toLowerCase().endsWith('.json'));
    for (const name of entries) {
      const src = path.join(legacyDistDir, name);
      const dst = path.join(dataDir, name);
      if (!fs.existsSync(dst)) {
        fs.copyFileSync(src, dst);
      }
    }
  }
} catch {
  // ignore migration errors; runtime will continue with empty fallbacks
}

function readJson<T>(name: string, fallback: T): T {
  try {
    const p = file(name);
    if (!fs.existsSync(p)) return fallback;
    const raw = fs.readFileSync(p, 'utf-8');
    return JSON.parse(raw) as T;
  } catch (e) {
    return fallback;
  }
}

function writeJson<T>(name: string, data: T) {
  const p = file(name);
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8');
}

// In-memory cache loaded at startup; persisted on writes
let players = readJson<any[]>('players', []);
let games = readJson<any[]>('games', []);
let matches = readJson<any[]>('matches', []);
let seasons = readJson<any[]>('seasons', []);
let activeWeekObj = readJson<{ week: number }>('active-week', { week: 1 });

// Players
router.get('/players', (_req: Request, res: Response) => {
  res.json(players);
});

router.post('/players', (req: Request, res: Response) => {
  const player = req.body || {};
  player.id = players.length ? Math.max(...players.map(p => p.id || 0)) + 1 : 1;
  players.push(player);
  writeJson('players', players);
  res.json(player);
});

router.put('/players/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const idx = players.findIndex(p => p.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Player not found' });
    return;
  }
  players[idx] = { ...players[idx], ...req.body };
  writeJson('players', players);
  res.json(players[idx]);
});

router.delete('/players/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  players = players.filter(p => p.id !== id);
  writeJson('players', players);
  res.json({ success: true });
});

// Games
router.get('/games', (_req: Request, res: Response) => {
  res.json(games);
});

router.post('/games', (req: Request, res: Response) => {
  const incoming = req.body || {};
  const name = String(incoming.name || '').trim();
  if (!name) {
    res.status(400).json({ error: 'Game name is required' });
    return;
  }
  const exists = games.find(g => String(g.name || '').toLowerCase() === name.toLowerCase());
  if (exists) {
    res.status(409).json({ error: 'A game with this name already exists' });
    return;
  }
  const game = {
    id: games.length ? Math.max(...games.map((g: any) => g.id || 0)) + 1 : 1,
    name,
    category: incoming.category,
    isChosen: false
  };
  games.push(game);
  writeJson('games', games);
  res.json(game);
});

router.put('/games/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const idx = games.findIndex(g => g.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Game not found' });
    return;
  }
  games[idx] = { ...games[idx], ...req.body };
  writeJson('games', games);
  res.json(games[idx]);
});

router.delete('/games/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  games = games.filter(g => g.id !== id);
  writeJson('games', games);
  res.json({ success: true });
});

router.post('/games/reset', (_req: Request, res: Response) => {
  games = games.map(g => ({ ...g, isChosen: false }));
  writeJson('games', games);
  res.json({ success: true });
});

// Matches
router.get('/matches', (_req: Request, res: Response) => {
  res.json(matches);
});

router.post('/matches', (req: Request, res: Response) => {
  const body = req.body;
  if (!Array.isArray(body)) {
    res.status(400).json({ success: false, message: 'Invalid matches data' });
    return;
  }
  if (body.length === 1) {
    const m = body[0];
    const maxId = matches.length ? Math.max(...matches.map(m2 => m2.id || 0)) : 0;
    m.id = maxId + 1;
    matches.push(m);
  } else {
    matches = body.map((m, i) => ({ ...m, id: m.id || i + 1 }));
  }
  writeJson('matches', matches);
  res.json({ success: true, count: matches.length });
});

router.put('/matches/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const idx = matches.findIndex(m => m.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Match not found' });
  }
  matches[idx] = { ...matches[idx], ...req.body };
  writeJson('matches', matches);
  return res.json({ success: true, match: matches[idx] });
});

router.delete('/matches/all', (_req: Request, res: Response) => {
  matches = [];
  writeJson('matches', matches);
  res.json({ success: true });
});

// Seasons
router.get('/seasons', (_req: Request, res: Response) => {
  res.json(seasons);
});

router.post('/seasons', (req: Request, res: Response) => {
  const newSeason = {
    id: Date.now(),
    name: req.body?.name,
    weeks: req.body?.weeks,
    status: req.body?.status || 'draft',
    startDate: req.body?.startDate,
    endDate: req.body?.endDate
  };
  seasons.push(newSeason);
  writeJson('seasons', seasons);
  res.json(newSeason);
});

router.put('/seasons/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const idx = seasons.findIndex(s => s.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Season not found' });
  }
  seasons[idx] = { ...seasons[idx], ...req.body };
  writeJson('seasons', seasons);
  return res.json(seasons[idx]);
});

router.delete('/seasons/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  seasons = seasons.filter(s => s.id !== id);
  writeJson('seasons', seasons);
  res.json({ success: true });
});

// Active Week
router.get('/active-week', (_req: Request, res: Response) => {
  res.json({ week: activeWeekObj.week || 1 });
});

router.post('/active-week', (req: Request, res: Response) => {
  const week = Number(req.body?.week);
  if (!Number.isFinite(week) || week < 1) {
    return res.status(400).json({ error: 'Invalid week number' });
  }
  activeWeekObj.week = week;
  writeJson('active-week', activeWeekObj);
  return res.json({ success: true, week });
});

export default router;
