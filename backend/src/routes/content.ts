import { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs/promises';

const router = Router();

// Use backend/data as persistent storage (stable across builds)
const DATA_DIR = path.resolve(process.cwd(), 'data');
const FILES = {
  players: path.join(DATA_DIR, 'players.json'),
  games: path.join(DATA_DIR, 'games.json'),
  matches: path.join(DATA_DIR, 'matches.json'),
  seasons: path.join(DATA_DIR, 'seasons.json'),
  announcements: path.join(DATA_DIR, 'announcements.json'),
};

// Types
interface Player {
  id: number;
  name: string;
  wins: number;
  losses: number;
  notPlayed?: number;
  points?: number;
}

interface Game {
  id: number;
  title: string;
  platform?: string;
  active?: boolean;
}

interface Match {
  id: number;
  seasonId?: number;
  playerAId: number;
  playerBId: number;
  gameId: number;
  winnerId?: number;
  playedAt?: string; // ISO
}

interface Season {
  id: number;
  name: string;
  startsAt?: string; // ISO
  endsAt?: string;   // ISO
  active?: boolean;
}

interface Announcement {
  id: number;
  title: string;
  message: string;
  createdAt: string; // ISO
}

// Helpers
async function ensureDataFiles() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const seed: Record<string, unknown> = {
    players: [],
    games: [],
    matches: [],
    seasons: [],
    announcements: [],
  };
  await Promise.all(
    Object.entries(FILES).map(async ([key, file]) => {
      try {
        await fs.access(file);
      } catch {
        await fs.writeFile(file, JSON.stringify(seed[key] ?? [], null, 2), 'utf8');
      }
    })
  );
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(file: string, data: T): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8');
}

// Simple auth for mutating routes using ADMIN_PASSWORD from .env
function requireAdmin(req: Request, res: Response, next: NextFunction): Response | void {
  const provided = (req.headers['x-admin-password'] as string) || '';
  const expected = process.env.ADMIN_PASSWORD || '';
  if (!expected) return res.status(500).json({ error: 'Server not configured: ADMIN_PASSWORD missing' });
  if (provided !== expected) return res.status(401).json({ error: 'Unauthorized' });

  // Express session is not present on the base Request type; cast to any for runtime checks
  const session = (req as any).session;
  const isAdmin = (session && session.user && session.user.username === process.env.ADMIN_USERNAME);

  if (!isAdmin) {
    return res.status(403).json({ error: 'Forbidden', service: 'Edwards Web Development API' });
  }

  next();
}

// Bootstrap data files
ensureDataFiles().catch(() => { /* noop */ });

// Health
router.get('/health', (_req, res) => res.json({ ok: true }));

// Aggregate fetch
router.get('/all', async (_req, res) => {
  const [players, games, matches, seasons, announcements] = await Promise.all([
    readJson<Player[]>(FILES.players, []),
    readJson<Game[]>(FILES.games, []),
    readJson<Match[]>(FILES.matches, []),
    readJson<Season[]>(FILES.seasons, []),
    readJson<Announcement[]>(FILES.announcements, []),
  ]);
  res.json({ players, games, matches, seasons, announcements });
});

/* Players */
router.get('/players', async (_req, res) => {
  res.json(await readJson<Player[]>(FILES.players, []));
});

router.post('/players', requireAdmin, async (req, res) => {
  const players = await readJson<Player[]>(FILES.players, []);
  const newPlayer: Player = {
    id: Date.now(),
    name: String(req.body?.name ?? 'Player'),
    wins: Number(req.body?.wins ?? 0),
    losses: Number(req.body?.losses ?? 0),
    notPlayed: Number(req.body?.notPlayed ?? 0),
    points: Number(req.body?.points ?? 0),
  };
  players.push(newPlayer);
  await writeJson(FILES.players, players);
  res.status(201).json(newPlayer);
});

router.put('/players/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const id = Number(req.params.id);
    const players = await readJson<Player[]>(FILES.players, []);
    const idx = players.findIndex(p => p.id === id);
    if (idx < 0) return res.status(404).json({ error: 'Player not found' });
    players[idx] = { ...players[idx], ...req.body, id };
    await writeJson(FILES.players, players);
    const updatedPlayer = players[idx];
    return res.status(200).json(updatedPlayer);
  } catch (err) {
    return next(err);
  }
});

router.delete('/players/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const id = Number(req.params.id);
    const players = await readJson<Player[]>(FILES.players, []);
    const nextPlayers = players.filter(p => p.id !== id);
    if (nextPlayers.length === players.length) return res.status(404).json({ error: 'Player not found' });
    await writeJson(FILES.players, nextPlayers);
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
});

/* Games */
router.get('/games', async (_req, res) => {
  res.json(await readJson<Game[]>(FILES.games, []));
});

router.post('/games', requireAdmin, async (req, res) => {
  const games = await readJson<Game[]>(FILES.games, []);
  const newGame: Game = {
    id: Date.now(),
    title: String(req.body?.title ?? 'Game'),
    platform: req.body?.platform,
    active: req.body?.active ?? true,
  };
  games.push(newGame);
  await writeJson(FILES.games, games);
  res.status(201).json(newGame);
});

router.put('/games/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const id = Number(req.params.id);
    const games = await readJson<Game[]>(FILES.games, []);
    const idx = games.findIndex(g => g.id === id);
    if (idx < 0) return res.status(404).json({ error: 'Game not found' });
    games[idx] = { ...games[idx], ...req.body, id };
    await writeJson(FILES.games, games);
    res.json(games[idx]);
  } catch (err) {
    return next(err);
  }
});

router.delete('/games/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const id = Number(req.params.id);
    const games = await readJson<Game[]>(FILES.games, []);
    const nextGames = games.filter(g => g.id !== id);
    if (nextGames.length === games.length) return res.status(404).json({ error: 'Game not found' });
    await writeJson(FILES.games, nextGames);
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
});

/* Matches */
router.get('/matches', async (_req, res) => {
  res.json(await readJson<Match[]>(FILES.matches, []));
});

router.post('/matches', requireAdmin, async (req, res) => {
  const matches = await readJson<Match[]>(FILES.matches, []);
  const newMatch: Match = {
    id: Date.now(),
    seasonId: req.body?.seasonId,
    playerAId: Number(req.body?.playerAId),
    playerBId: Number(req.body?.playerBId),
    gameId: Number(req.body?.gameId),
    winnerId: req.body?.winnerId ? Number(req.body.winnerId) : undefined,
    playedAt: req.body?.playedAt ?? new Date().toISOString(),
  };
  matches.push(newMatch);
  await writeJson(FILES.matches, matches);
  res.status(201).json(newMatch);
});

router.put('/matches/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const id = Number(req.params.id);
    const matches = await readJson<Match[]>(FILES.matches, []);
    const idx = matches.findIndex(m => m.id === id);
    if (idx < 0) return res.status(404).json({ error: 'Match not found' });
    matches[idx] = { ...matches[idx], ...req.body, id };
    await writeJson(FILES.matches, matches);
    res.json(matches[idx]);
  } catch (err) {
    return next(err);
  }
});

router.delete('/matches', requireAdmin, async (_req, res) => {
  await writeJson(FILES.matches, []);
  res.json({ success: true });
});

/* Seasons */
router.get('/seasons', async (_req, res) => {
  res.json(await readJson<Season[]>(FILES.seasons, []));
});

router.post('/seasons', requireAdmin, async (req, res) => {
  const seasons = await readJson<Season[]>(FILES.seasons, []);
  const newSeason: Season = {
    id: Date.now(),
    name: String(req.body?.name ?? `Season ${new Date().getFullYear()}`),
    startsAt: req.body?.startsAt,
    endsAt: req.body?.endsAt,
    active: req.body?.active ?? true,
  };
  seasons.push(newSeason);
  await writeJson(FILES.seasons, seasons);
  res.status(201).json(newSeason);
});

router.put('/seasons/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const id = Number(req.params.id);
    const seasons = await readJson<Season[]>(FILES.seasons, []);
    const idx = seasons.findIndex(s => s.id === id);
    if (idx < 0) return res.status(404).json({ error: 'Season not found' });
    seasons[idx] = { ...seasons[idx], ...req.body, id };
    await writeJson(FILES.seasons, seasons);
    res.json(seasons[idx]);
  } catch (err) {
    return next(err);
  }
});

router.delete('/seasons/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const id = Number(req.params.id);
    const seasons = await readJson<Season[]>(FILES.seasons, []);
    const nextSeasons = seasons.filter(s => s.id !== id);
    if (nextSeasons.length === seasons.length) return res.status(404).json({ error: 'Season not found' });
    await writeJson(FILES.seasons, nextSeasons);
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
});

/* Announcements (optional public site content) */
router.get('/announcements', async (_req, res) => {
  res.json(await readJson<Announcement[]>(FILES.announcements, []));
});

router.post('/announcements', requireAdmin, async (req, res) => {
  const list = await readJson<Announcement[]>(FILES.announcements, []);
  const item: Announcement = {
    id: Date.now(),
    title: String(req.body?.title ?? 'Announcement'),
    message: String(req.body?.message ?? ''),
    createdAt: new Date().toISOString(),
  };
  list.push(item);
  await writeJson(FILES.announcements, list);
  res.status(201).json(item);
});

router.delete('/announcements/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const id = Number(req.params.id);
    const list = await readJson<Announcement[]>(FILES.announcements, []);
    const nextList = list.filter(a => a.id !== id);
    if (nextList.length === list.length) return res.status(404).json({ error: 'Announcement not found' });
    await writeJson(FILES.announcements, nextList);
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
});

export default router;