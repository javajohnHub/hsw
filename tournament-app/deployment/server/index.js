const { createProxyMiddleware } = require('http-proxy-middleware');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

// --- Electron userData patch start ---
let userDataPath = __dirname;
try {
  // Only use electron's app.getPath if running inside Electron
  if (process.versions.electron) {
    const electron = require('electron');
    userDataPath = (electron.app || electron.remote.app).getPath('userData');
    // Ensure the folder exists
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
  }
} catch (e) {
  // Fallback to __dirname if not in Electron
  userDataPath = __dirname;
}
// --- Electron userData patch end ---

const app = express();
// Allow CORS from any origin and handle preflight requests explicitly.
// This prevents browsers from blocking API requests made from a different
// origin/port (for example Angular dev server or Electron file://).
// --- Manual CORS headers for all responses (fixes stubborn browser CORS issues) ---
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With');
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});
app.use(bodyParser.json());

// Simple admin credentials storage
const adminFile = path.join(userDataPath, 'admin.json');
let admin = { username: 'HSWAdmin', password: 'retroneverdies', mustChangePassword: true };
if (fs.existsSync(adminFile)) {
  admin = JSON.parse(fs.readFileSync(adminFile));
}
function saveAdmin() {
  fs.writeFileSync(adminFile, JSON.stringify(admin));
}

// Players data management
const playersFile = path.join(userDataPath, 'players.json');
let players = [];
if (fs.existsSync(playersFile)) {
  players = JSON.parse(fs.readFileSync(playersFile));
} else {
  players = [
    { id: 1, name: 'HighScoreWins', wins: 0, losses: 0, notPlayed: 0, points: 0 },
    { id: 2, name: 'Apollofish_Games', wins: 0, losses: 0, notPlayed: 0, points: 0 },
    { id: 3, name: 'Fizikzbound', wins: 0, losses: 0, notPlayed: 0, points: 0 },
    { id: 4, name: 'Me5wife', wins: 0, losses: 0, notPlayed: 0, points: 0 },
    { id: 5, name: 'BWhizzle817', wins: 0, losses: 0, notPlayed: 0, points: 0 },
    { id: 6, name: 'Jammin247', wins: 0, losses: 0, notPlayed: 0, points: 0 },
    { id: 7, name: 'EeyoreDad', wins: 0, losses: 0, notPlayed: 0, points: 0 },
    { id: 8, name: 'FOOCHcade', wins: 0, losses: 0, notPlayed: 0, points: 0 },
    { id: 9, name: 'Xtremepot420', wins: 0, losses: 0, notPlayed: 0, points: 0 },
    { id: 10, name: 'aztek138', wins: 0, losses: 0, notPlayed: 0, points: 0 },
    { id: 11, name: 'Dab_a_dab0711', wins: 0, losses: 0, notPlayed: 0, points: 0 },
    { id: 12, name: 'MoMoneyGaming', wins: 0, losses: 0, notPlayed: 0, points: 0 },
    { id: 13, name: 'Crownjo', wins: 0, losses: 0, notPlayed: 0, points: 0 }
  ];
  fs.writeFileSync(playersFile, JSON.stringify(players));
}
function savePlayers() {
  fs.writeFileSync(playersFile, JSON.stringify(players));
}

// Games data management
const gamesFile = path.join(userDataPath, 'games.json');
const serverGamesFile = path.join(__dirname, 'games.json');
let games = [];

if (fs.existsSync(gamesFile)) {
  try {
    games = JSON.parse(fs.readFileSync(gamesFile));
    // If user data games file has less than 80 games, copy the full list from server
    if (games.length < 80 && fs.existsSync(serverGamesFile)) {
      console.log('Updating games.json with full 80-game list');
      const fullGames = JSON.parse(fs.readFileSync(serverGamesFile));
      games = fullGames;
      fs.writeFileSync(gamesFile, JSON.stringify(games));
    }
  } catch (e) {
    console.log('Error reading games.json, creating new one');
    // Try to copy from server directory first
    if (fs.existsSync(serverGamesFile)) {
      games = JSON.parse(fs.readFileSync(serverGamesFile));
    } else {
      games = [
        { id: 1, name: 'Street Fighter 6', category: 'Fighting', isChosen: false },
        { id: 2, name: 'Tekken 8', category: 'Fighting', isChosen: false },
        { id: 3, name: 'Guilty Gear Strive', category: 'Fighting', isChosen: false },
        { id: 4, name: 'Mortal Kombat 1', category: 'Fighting', isChosen: false },
        { id: 5, name: 'Super Smash Bros Ultimate', category: 'Platform Fighter', isChosen: false }
      ];
    }
    fs.writeFileSync(gamesFile, JSON.stringify(games));
  }
} else {
  // Try to copy from server directory first
  if (fs.existsSync(serverGamesFile)) {
    console.log('Copying full games list from server directory');
    games = JSON.parse(fs.readFileSync(serverGamesFile));
  } else {
    games = [
      { id: 1, name: 'Street Fighter 6', category: 'Fighting', isChosen: false },
      { id: 2, name: 'Tekken 8', category: 'Fighting', isChosen: false },
      { id: 3, name: 'Guilty Gear Strive', category: 'Fighting', isChosen: false },
      { id: 4, name: 'Mortal Kombat 1', category: 'Fighting', isChosen: false },
      { id: 5, name: 'Super Smash Bros Ultimate', category: 'Platform Fighter', isChosen: false }
    ];
  }
  fs.writeFileSync(gamesFile, JSON.stringify(games));
}
function saveGames() {
  try {
    console.log('Saving games to file:', gamesFile);
    fs.writeFileSync(gamesFile, JSON.stringify(games, null, 2));
    console.log('Games saved successfully');
  } catch (error) {
    console.error('Error saving games:', error);
    throw error;
  }
}

// Matches data management
const matchesFile = path.join(userDataPath, 'matches.json');
let matches = [];
if (fs.existsSync(matchesFile)) {
  try {
    matches = JSON.parse(fs.readFileSync(matchesFile));
  } catch (e) {
    console.log('Creating new matches.json file');
    matches = [];
    fs.writeFileSync(matchesFile, JSON.stringify(matches));
  }
} else {
  matches = [];
  fs.writeFileSync(matchesFile, JSON.stringify(matches));
}
function saveMatches() {
  fs.writeFileSync(matchesFile, JSON.stringify(matches));
}

// Season management endpoints
const seasonsFile = path.join(userDataPath, 'seasons.json');
let seasons = [];
if (fs.existsSync(seasonsFile)) {
  seasons = JSON.parse(fs.readFileSync(seasonsFile));
}
function saveSeasons() {
  fs.writeFileSync(seasonsFile, JSON.stringify(seasons, null, 2));
}

// Admin login endpoint
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === admin.username && password === admin.password) {
    res.json({ success: true, mustChangePassword: admin.mustChangePassword });
  } else {
    res.json({ success: false, message: 'Invalid credentials' });
  }
});

// Admin change password endpoint
app.post('/admin/change-password', (req, res) => {
  const { username, newPassword } = req.body;
  if (username === admin.username && newPassword && newPassword.length >= 6) {
    admin.password = newPassword;
    admin.mustChangePassword = false;
    saveAdmin();
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'Password must be at least 6 characters.' });
  }
});

// CRUD endpoints for players
app.get('/players', (req, res) => {
  res.json(players);
});
app.post('/players', (req, res) => {
  const player = req.body;
  player.id = players.length ? Math.max(...players.map(p => p.id)) + 1 : 1;
  players.push(player);
  savePlayers();
  res.json(player);
});
app.put('/players/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const idx = players.findIndex(p => p.id === id);
  if (idx !== -1) {
    players[idx] = { ...players[idx], ...req.body };
    savePlayers();
    res.json(players[idx]);
  } else {
    res.status(404).json({ error: 'Player not found' });
  }
});
app.delete('/players/:id', (req, res) => {
  const id = parseInt(req.params.id);
  players = players.filter(p => p.id !== id);
  savePlayers();
  res.json({ success: true });
});

// CRUD endpoints for games
app.get('/games', (req, res) => {
  res.json(games);
});
app.post('/games', (req, res) => {
  console.log('Received request to add game:', req.body);
  
  try {
    const game = req.body;
    
    // Validate required fields
    if (!game.name || typeof game.name !== 'string' || !game.name.trim()) {
      console.log('Validation failed: Game name is required');
      return res.status(400).json({ error: 'Game name is required and must be a non-empty string' });
    }
    
    const trimmedName = game.name.trim();
    console.log('Processing game with name:', trimmedName);
    
    // Check if game with same name already exists (case-insensitive)
    const existingGame = games.find(g => 
      g.name.toLowerCase() === trimmedName.toLowerCase()
    );
    
    if (existingGame) {
      console.log('Validation failed: Game already exists:', existingGame);
      return res.status(409).json({ error: 'A game with this name already exists' });
    }
    
    // Create new game with proper validation
    const newGame = {
      id: games.length ? Math.max(...games.map(g => g.id)) + 1 : 1,
      name: trimmedName,
      category: game.category && typeof game.category === 'string' ? game.category.trim() : undefined,
      isChosen: false // Always default to false for new games
    };
    
    // Remove empty category
    if (!newGame.category) {
      delete newGame.category;
    }
    
    console.log('Creating new game:', newGame);
    games.push(newGame);
    // Try to enrich with RAWG image asynchronously and persist
    (async () => {
      try {
        const img = await fetchRawgImageForName(newGame.name);
        if (img) {
          newGame.image = img;
          // Find and update in games list and save
          const idx = games.findIndex(g => g.id === newGame.id);
          if (idx !== -1) {
            games[idx] = { ...games[idx], image: img };
            saveGames();
            console.log('Enriched new game with image from RAWG:', img);
          }
        }
      } catch (err) {
        console.warn('Failed to enrich game image:', err);
      }
    })();

    saveGames();
    console.log('Game saved successfully. Total games:', games.length);
    res.json(newGame);
  } catch (error) {
    console.error('Error adding game:', error);
    res.status(500).json({ error: 'Internal server error while adding game' });
  }
});

// Endpoint: refresh missing images for existing games (best-effort)
app.get('/games/refresh-images', async (req, res) => {
  const updated = [];
  for (let i = 0; i < games.length; i++) {
    const g = games[i];
    if (!g.image || !String(g.image).trim()) {
      try {
        const img = await fetchRawgImageForName(g.name);
        if (img) {
          games[i].image = img;
          updated.push({ id: g.id, name: g.name, image: img });
        }
      } catch (e) {
        console.warn('Error refreshing image for', g.name, e);
      }
    }
  }
  if (updated.length) saveGames();
  res.json({ updatedCount: updated.length, updated });
});
app.put('/games/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const idx = games.findIndex(g => g.id === id);
  if (idx !== -1) {
    games[idx] = { ...games[idx], ...req.body };
    saveGames();
    res.json(games[idx]);
  } else {
    res.status(404).json({ error: 'Game not found' });
  }
});
app.delete('/games/:id', (req, res) => {
  const id = parseInt(req.params.id);
  games = games.filter(g => g.id !== id);
  saveGames();
  res.json({ success: true });
});
app.post('/games/reset', (req, res) => {
  games.forEach(game => game.isChosen = false);
  saveGames();
  res.json({ success: true });
});

// Endpoint to get all matches
app.get('/matches', (req, res) => {
  res.json(matches);
});

// Endpoint to save matches (replace all)
app.post('/matches', (req, res) => {
  if (Array.isArray(req.body)) {
    // If it's a single match being added (from wheel spin)
    if (req.body.length === 1) {
      const newMatch = req.body[0];
      // Fix ID generation for empty array case
      const maxId = matches.length > 0 ? Math.max(...matches.map(m => m.id || 0)) : 0;
      newMatch.id = maxId + 1;
      matches.push(newMatch);
    } else {
      // Replace all matches (from round robin generation)
      matches = req.body.map((match, index) => ({
        ...match,
        id: match.id || index + 1
      }));
    }
    saveMatches();
    res.json({ success: true, count: matches.length });
  } else {
    res.status(400).json({ success: false, message: 'Invalid matches data' });
  }
});

// Endpoint to update a specific match
app.put('/matches/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const matchIndex = matches.findIndex(m => m.id === id);
  if (matchIndex !== -1) {
    matches[matchIndex] = { ...matches[matchIndex], ...req.body };
    saveMatches();
    res.json({ success: true, match: matches[matchIndex] });
  } else {
    res.status(404).json({ success: false, message: 'Match not found' });
  }
});

// Endpoint to clear all matches
app.delete('/matches/all', (req, res) => {
  matches = [];
  saveMatches();
  res.json({ success: true, message: 'All matches cleared' });
});

// Admin endpoint to update player info
app.post('/admin/update', (req, res) => {
  const { id, name, wins, losses, notPlayed } = req.body;
  const player = players.find(p => p.id === id);
  if (player) {
    player.name = name;
    player.wins = wins;
    player.losses = losses;
    player.notPlayed = notPlayed;
    player.points = wins * 2 + losses * 1;
    savePlayers();
    res.json({ success: true, player });
  } else {
    res.status(404).json({ success: false, message: 'Player not found' });
  }
});

// Get all seasons
app.get('/seasons', (req, res) => {
  res.json(seasons);
});

// Create a new season
app.post('/seasons', (req, res) => {
  const newSeason = {
    id: Date.now(),
    name: req.body.name,
    weeks: req.body.weeks,
    status: req.body.status || 'draft',
    startDate: req.body.startDate,
    endDate: req.body.endDate
  };
  seasons.push(newSeason);
  saveSeasons();
  res.json(newSeason);
});

// Update a season
app.put('/seasons/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const seasonIndex = seasons.findIndex(s => s.id === id);
  if (seasonIndex !== -1) {
    seasons[seasonIndex] = { ...seasons[seasonIndex], ...req.body };
    saveSeasons();
    res.json(seasons[seasonIndex]);
  } else {
    res.status(404).json({ error: 'Season not found' });
  }
});

// Delete a season
app.delete('/seasons/:id', (req, res) => {
  const id = parseInt(req.params.id);
  seasons = seasons.filter(s => s.id !== id);
  saveSeasons();
  res.json({ success: true });
});

// Start a new season (legacy endpoint)
app.post('/season/start', (req, res) => {
  const newSeason = {
    id: Date.now(),
    name: `Season ${seasons.length + 1}`,
    weeks: 14,
    status: 'active',
    startDate: new Date().toISOString()
  };
  seasons.push(newSeason);
  saveSeasons();
  res.json(newSeason);
});

// Active week management
let activeWeek = 1;

// Get active week
app.get('/active-week', (req, res) => {
  res.json({ week: activeWeek });
});

// Set active week
app.post('/active-week', (req, res) => {
  const { week } = req.body;
  if (typeof week === 'number' && week >= 1) {
    activeWeek = week;
    console.log('Active week updated to:', week);
    res.json({ success: true, week: activeWeek });
  } else {
    res.status(400).json({ error: 'Invalid week number' });
  }
});

// Save results for current season
app.post('/season/save', (req, res) => {
  const { season, players, matches } = req.body;
  const idx = seasons.findIndex(s => s.id === season);
  if (idx !== -1) {
    seasons[idx].players = players;
    seasons[idx].matches = matches;
    saveSeasons();
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Season not found' });
  }
});

// Serve Angular production build
let staticPath;
let indexPath;

if (process.env.ELECTRON_APP === 'true') {
  // Running in Electron - serve from the packaged location
  if (process.env.NODE_ENV === 'development' || !process.versions.electron) {
    // Development mode
    staticPath = path.join(__dirname, '../client/dist/retro-never-dies-client');
    indexPath = path.join(__dirname, '../client/dist/retro-never-dies-client/index.html');
  } else {
    // Production/packaged mode - try all possible locations
    const tryPaths = [
      path.join(__dirname, '../app/dist/retro-never-dies-client'),
      path.join(__dirname, '../dist/retro-never-dies-client'),
      path.join(process.resourcesPath, 'app/dist/retro-never-dies-client'),
      path.join(process.resourcesPath, 'app.asar/dist/retro-never-dies-client'),
      path.join(__dirname, '../dist/retro-never-dies-client') // asar fallback
    ];
    for (const p of tryPaths) {
      if (fs.existsSync(p)) {
        staticPath = p;
        indexPath = path.join(p, 'index.html');
        break;
      }
    }
    // If still not found, default to asar-relative
    if (!staticPath) {
      staticPath = path.join(__dirname, '../dist/retro-never-dies-client');
      indexPath = path.join(staticPath, 'index.html');
    }
  }
} else {
  // Standalone server mode
  staticPath = path.join(__dirname, '../client/dist/retro-never-dies-client');
  indexPath = path.join(__dirname, '../client/dist/retro-never-dies-client/index.html');
}

console.log('Serving static files from:', staticPath);
console.log('Index file path:', indexPath);
console.log('Static path exists:', fs.existsSync(staticPath));
console.log('Index file exists:', fs.existsSync(indexPath));

// --- RAWG proxy endpoints (server-side) ---
// These endpoints proxy requests to rawg.io so the client doesn't need to include
// the RAWG API key or deal with CORS. They are best-effort and return the
// upstream JSON directly.

app.get('/rawg/search', async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.status(400).json({ error: 'Missing query parameter q' });
    const url = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(
      String(q)
    )}&page_size=5`;
    const upstream = await fetch(url);
    const data = await upstream.json();
    return res.json(data);
  } catch (err) {
    console.error('RAWG search proxy error', err);
    return res.status(500).json({ error: 'RAWG proxy search failed' });
  }
});

// Helper: attempt to find a good image URL from RAWG for a given game name or id
async function fetchRawgImageForName(name) {
  try {
    if (!name) return undefined;
    const searchUrl = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(String(name))}&page_size=5`;
    const sresp = await fetch(searchUrl);
    if (!sresp.ok) return undefined;
    const sbody = await sresp.json();
    if (!sbody || !Array.isArray(sbody.results) || sbody.results.length === 0) return undefined;
    const top = sbody.results[0];
    const idOrSlug = top.id || top.slug;
    if (idOrSlug) {
      try {
        const detailsUrl = `https://api.rawg.io/api/games/${encodeURIComponent(String(idOrSlug))}?key=${RAWG_API_KEY}`;
        const dresp = await fetch(detailsUrl);
        if (dresp.ok) {
          const details = await dresp.json();
          if (details.background_image_additional) return details.background_image_additional;
          if (details.background_image) return details.background_image;
        }

        const ssUrl = `https://api.rawg.io/api/games/${encodeURIComponent(String(idOrSlug))}/screenshots?key=${RAWG_API_KEY}&page_size=3`;
        const ssResp = await fetch(ssUrl);
        if (ssResp.ok) {
          const ssBody = await ssResp.json();
          if (ssBody && Array.isArray(ssBody.results) && ssBody.results.length > 0) {
            const shot = ssBody.results[0];
            if (shot && (shot.image || shot.image_original)) return shot.image || shot.image_original;
          }
        }
      } catch (err) {
        console.warn('RAWG enrichment details error for', name, err);
      }
    }
    return top.background_image || top.background_image_additional || undefined;
  } catch (err) {
    console.warn('RAWG enrichment error for', name, err);
    return undefined;
  }
}

app.get('/rawg/game/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'Missing id parameter' });
    const url = `https://api.rawg.io/api/games/${encodeURIComponent(
      String(id)
    )}?key=${RAWG_API_KEY}`;
    const upstream = await fetch(url);
    const data = await upstream.json();
    return res.json(data);
  } catch (err) {
    console.error('RAWG details proxy error', err);
    return res.status(500).json({ error: 'RAWG proxy details failed' });
  }
});

app.get('/rawg/game/:id/screenshots', async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'Missing id parameter' });
    const page_size = req.query.page_size || 3;
    const url = `https://api.rawg.io/api/games/${encodeURIComponent(
      String(id)
    )}/screenshots?key=${RAWG_API_KEY}&page_size=${page_size}`;
    const upstream = await fetch(url);
    const data = await upstream.json();
    return res.json(data);
  } catch (err) {
    console.error('RAWG screenshots proxy error', err);
    return res.status(500).json({ error: 'RAWG proxy screenshots failed' });
  }
});

// Proxy setup
app.use('/media', createProxyMiddleware({
    target: 'https://media.rawg.io',
    changeOrigin: true,
    pathRewrite: {
        '^/media': '', // Remove '/media' from the request path
    },
}));

app.use(express.static(staticPath));
app.get('*', (req, res) => {
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Angular app not found. Please ensure the app is built.');
  }
});

const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Export the server instance so it can be closed when needed
module.exports = server;

// --- RAWG proxy endpoints (server-side) ---
// These endpoints proxy requests to rawg.io so the client doesn't need to include
// the RAWG API key or deal with CORS. They are best-effort and return the
// upstream JSON directly.
const RAWG_API_KEY = process.env.RAWG_API_KEY || '87dcbd5c3f9c4c91b4fb9c58f5ce06c5';

app.get('/rawg/search', async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.status(400).json({ error: 'Missing query parameter q' });
    const url = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(
      String(q)
    )}&page_size=5`;
    const upstream = await fetch(url);
    const data = await upstream.json();
    return res.json(data);
  } catch (err) {
    console.error('RAWG search proxy error', err);
    return res.status(500).json({ error: 'RAWG proxy search failed' });
  }
});

// Helper: attempt to find a good image URL from RAWG for a given game name or id
async function fetchRawgImageForName(name) {
  try {
    if (!name) return undefined;
    const searchUrl = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(String(name))}&page_size=5`;
    const sresp = await fetch(searchUrl);
    if (!sresp.ok) return undefined;
    const sbody = await sresp.json();
    if (!sbody || !Array.isArray(sbody.results) || sbody.results.length === 0) return undefined;
    const top = sbody.results[0];
    const idOrSlug = top.id || top.slug;
    if (idOrSlug) {
      try {
        const detailsUrl = `https://api.rawg.io/api/games/${encodeURIComponent(String(idOrSlug))}?key=${RAWG_API_KEY}`;
        const dresp = await fetch(detailsUrl);
        if (dresp.ok) {
          const details = await dresp.json();
          if (details.background_image_additional) return details.background_image_additional;
          if (details.background_image) return details.background_image;
        }

        const ssUrl = `https://api.rawg.io/api/games/${encodeURIComponent(String(idOrSlug))}/screenshots?key=${RAWG_API_KEY}&page_size=3`;
        const ssResp = await fetch(ssUrl);
        if (ssResp.ok) {
          const ssBody = await ssResp.json();
          if (ssBody && Array.isArray(ssBody.results) && ssBody.results.length > 0) {
            const shot = ssBody.results[0];
            if (shot && (shot.image || shot.image_original)) return shot.image || shot.image_original;
          }
        }
      } catch (err) {
        console.warn('RAWG enrichment details error for', name, err);
      }
    }
    return top.background_image || top.background_image_additional || undefined;
  } catch (err) {
    console.warn('RAWG enrichment error for', name, err);
    return undefined;
  }
}

app.get('/rawg/game/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'Missing id parameter' });
    const url = `https://api.rawg.io/api/games/${encodeURIComponent(
      String(id)
    )}?key=${RAWG_API_KEY}`;
    const upstream = await fetch(url);
    const data = await upstream.json();
    return res.json(data);
  } catch (err) {
    console.error('RAWG details proxy error', err);
    return res.status(500).json({ error: 'RAWG proxy details failed' });
  }
});

app.get('/rawg/game/:id/screenshots', async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'Missing id parameter' });
    const page_size = req.query.page_size || 3;
    const url = `https://api.rawg.io/api/games/${encodeURIComponent(
      String(id)
    )}/screenshots?key=${RAWG_API_KEY}&page_size=${page_size}`;
    const upstream = await fetch(url);
    const data = await upstream.json();
    return res.json(data);
  } catch (err) {
    console.error('RAWG screenshots proxy error', err);
    return res.status(500).json({ error: 'RAWG proxy screenshots failed' });
  }
});

