import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HttpClient } from "@angular/common/http";
// Use correct environment path (Angular CLI structure uses src/environments)
import { environment } from '../environments/environment';
import { RouterModule } from '@angular/router';
import { AuthService } from './auth.service';
import { Subscription, interval } from 'rxjs';

interface Match {
  week: number;
  player1: string;
  player2: string;
}

interface Player {
  id: number;
  name: string;
  wins: number;
  losses: number;
  notPlayed: number;
  points: number;
}

interface Game {
  id: number;
  name: string;
  week?: number;
}

interface ScheduleWeek {
  number: number;
  matches: Match[];
  game?: Game | undefined;
  // Pre-resolved cover image url for bg (optional)
  coverUrl?: string;
}

@Component({
  selector: "app-public-page",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './public-page.component.html',
  styleUrls: ['./public-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PublicPageComponent implements OnInit, OnDestroy {
  isAdmin = false;
  players: Player[] = [];
  matches: Match[] = [];
  games: Game[] = [];
  playersLoaded = false;
  matchesLoaded = false;
  gamesLoaded = false;
  currentWeek = 1;
  maxWeeks = 14;
  activeTab = 'matchups';
  showStatsModal = false;
  selectedPlayerStats = '';
  isMobile = false;
  currentGame: Game | undefined;
  currentGameImages: { cover: string; cart: string } | null = null;
  // Cached sorted players with ranks
  private sortedPlayersWithRank: (Player & { rank: number })[] = [];
  // Cached schedule weeks with game ref
  private weeksCache: ScheduleWeek[] = [];
  
  // Track players whose images failed to load
  private imageErrors = new Set<string>();
  // Track games whose cart image is missing (after trying webp then png)
  private missingCartGames = new Set<string>();
  // Track which cart images have already attempted png fallback
  private cartTriedPng = new Set<string>();
  // Track rules images that attempted png fallback
  private rulesTriedPng = new Set<number>();
  
  // Tooltip state
  currentTooltip = {
    visible: false,
    playerName: '',
    content: ''
  };
  
  private authSubscription?: Subscription;
  private weekCheckSubscription?: Subscription;

  // Cached fairness metrics per player (recomputed on matches load)
  private fairnessCache: { [player: string]: { uniqueOppPct: number; repeatPenalty: number; streakPenalty: number; score: number } } = {};

  // Portal for hover preview images
  private portalRoot: HTMLElement | null = null;
  private portalBound = false;
  private portalObserver: MutationObserver | null = null;
  private resizeHandlerRef: (() => void) | null = null;
  private portalClones: HTMLImageElement[] = [];
  private delegatedEnterHandler?: (e: Event) => void;
  private delegatedLeaveHandler?: (e: Event) => void;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.checkMobile();
  }

  ngOnInit() {
    this.loadActiveWeek();
    this.loadPlayers();
    this.loadMatches();
    this.loadGames();
    
    // Check auth status
    this.authSubscription = this.authService.admin$.subscribe(
      isAuth => this.isAdmin = isAuth
    );

    // Start periodic check for active week updates
    this.weekCheckSubscription = interval(30000).subscribe(() => {
      this.loadActiveWeek();
    });

  // Handle window resize (store ref so we can properly remove it)
  this.resizeHandlerRef = () => this.checkMobile();
  window.addEventListener('resize', this.resizeHandlerRef);

    // Setup portal after a short delay so template renders
    setTimeout(() => this.initHoverPortal(), 0);
  }

  ngOnDestroy() {
    this.authSubscription?.unsubscribe();
    this.weekCheckSubscription?.unsubscribe();
    if (this.resizeHandlerRef) {
      window.removeEventListener('resize', this.resizeHandlerRef);
      this.resizeHandlerRef = null;
    }
    if (this.portalObserver) {
      this.portalObserver.disconnect();
      this.portalObserver = null;
    }
    this.cleanupPortal();
  }

  checkMobile() {
    this.isMobile = window.innerWidth <= 768;
  }

  loadActiveWeek() {
    // Ensure we use apiBaseUrl (not apiUrl) - earlier regression used wrong key
    this.http.get<{week: number}>(`${environment.apiBaseUrl}/active-week`).subscribe({
      next: (response) => {
        this.currentWeek = response.week;
        this.updateCurrentGame();
      },
      error: (error) => {
        console.error('Error loading active week:', error);
      }
    });
  }

  loadPlayers() {
    console.log('[PublicPage] loadPlayers start');
    console.time('[PublicPage] loadPlayers');
    this.http.get<Player[]>(`${environment.apiBaseUrl}/players`).subscribe({
      next: (players) => {
        console.log('[PublicPage] players loaded', players);
        this.players = players;
        this.playersLoaded = true;
        this.recomputeSortedPlayers();
        console.timeEnd('[PublicPage] loadPlayers');
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading players:', error);
        this.playersLoaded = true;
        console.timeEnd('[PublicPage] loadPlayers');
        this.cdr.markForCheck();
      }
    });
  }

  loadMatches() {
    console.log('[PublicPage] loadMatches start');
    console.time('[PublicPage] loadMatches');
    this.http.get<Match[]>(`${environment.apiBaseUrl}/matches`).subscribe({
      next: (matches) => {
        console.log('[PublicPage] matches loaded', matches);
        this.matches = matches;
        this.matchesLoaded = true;
        this.fairnessCache = {};
        this.rebuildWeeksCache();
        console.timeEnd('[PublicPage] loadMatches');
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading matches:', error);
        this.matchesLoaded = true;
        console.timeEnd('[PublicPage] loadMatches');
        this.cdr.markForCheck();
      }
    });
  }

  loadGames() {
    console.log('[PublicPage] loadGames start');
    console.time('[PublicPage] loadGames');
    this.http.get<Game[]>(`${environment.apiBaseUrl}/games`).subscribe({
      next: (games) => {
        console.log('[PublicPage] games loaded', games);
        this.games = games;
        this.gamesLoaded = true;
        this.updateCurrentGame();
        this.rebuildWeeksCache();
        console.timeEnd('[PublicPage] loadGames');
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading games:', error);
        this.gamesLoaded = true;
        this.updateCurrentGame();
        this.rebuildWeeksCache();
        console.timeEnd('[PublicPage] loadGames');
        this.cdr.markForCheck();
      }
    });
  }

  getMatchupGrid() {
    // NOTE: This is invoked from the template multiple times during change detection.
    // Keep it pure/fast (no side effects). If it becomes expensive, cache per currentWeek
    // and invalidate only when matches/currentWeek changes.
    const weekMatches = this.matches.filter(match => match.week === this.currentWeek);
    return weekMatches.map(match => ({
      player1: match.player1,
      player2: match.player2
    }));
  }

  // trackBy functions to reduce DOM churn
  trackByPlayerIndex = (_: number, p: Player & { rank?: number }) => p.id ?? p.name;
  trackByMatch = (_: number, m: Match) => `${m.week}:${m.player1}:${m.player2}`;
  trackByWeek = (_: number, w: ScheduleWeek) => w.number;

  getGameForWeek(week: number): Game | undefined {
    // Called frequently in template (several bindings). Could memoize if games list grows.
    const game = this.games.find(g => (g as any).assignedWeek === week || (g as any).week === week || (g as any).assignedWeek === week);
    // Debug log
    if (week === this.currentWeek) {
      console.log('[PublicPage] getGameForWeek', { week, game });
    }
    return game;
  }

  getSortedPlayers() {
    return this.sortedPlayersWithRank;
  }

  getPlayerRank(player: Player): number {
    const found = this.sortedPlayersWithRank.find(p => p === player || p.name === player.name);
    return found ? found.rank : 0;
  }

  getWeeksWithMatches(): ScheduleWeek[] {
    return this.weeksCache;
  }

  // Style helper for schedule week background (Full Schedule tab)
  getWeekBackgroundStyle(week: ScheduleWeek) {
    if (!week.coverUrl) return {};
    return {
      'background-image': `linear-gradient(rgba(15,17,17,0.78), rgba(15,17,17,0.9)), url(${week.coverUrl})`
    } as const;
  }

  // Secondary (cart/rules) image override: for week 3 show rules sheet
  getSecondaryWeekImage(weekNumber: number, gameName?: string): { src: string; alt: string; kind: 'rules' | 'cart'; } | null {
    if (weekNumber === 3) {
      return { src: 'assets/week-3-rules.webp', alt: 'Week 3 Rules', kind: 'rules' };
    }
    if (!gameName) return null;
    const imgs = this.getGameImages(gameName);
    if (!imgs) return null;
    return { src: imgs.cart, alt: `${gameName} Cartridge`, kind: 'cart' };
  }

  // Dedicated rules image accessor for weeks that have both cart + rules (weeks 1 & 2 for now)
  getWeekRulesImage(weekNumber: number): { src: string; alt: string } | null {
    if (weekNumber === 1) return { src: 'assets/week-1-rules.webp', alt: 'Week 1 Rules' };
    if (weekNumber === 2) return { src: 'assets/week-2-rules.webp', alt: 'Week 2 Rules' };
    if (weekNumber === 3) return { src: 'assets/week-3-rules.webp', alt: 'Week 3 Rules' };
    return null;
  }

  // Determine if cart should be shown (hide cart for the active week if rules exist or if week 3 where rules replace cart)
  shouldShowCart(weekNumber: number, gameName?: string): boolean {
    if (!gameName) return false;
    // Hide for current week if we have a rules image (weeks 1-2) or week 3 special case
    if (weekNumber === this.currentWeek && (weekNumber === 1 || weekNumber === 2 || weekNumber === 3)) {
      return false;
    }
    return !this.isCartMissing(gameName);
  }

  // Schedule-specific logic: show cart alongside rules for weeks 1-2 (not active week constraint), hide cart when week === 3 (rules replace cart), otherwise show cart if not missing
  shouldShowCartInSchedule(weekNumber: number, gameName?: string): boolean {
    if (!gameName) return false;
    if (weekNumber === 3) return false; // rules only
    // weeks 1 & 2: show cart (even though header hides it for current week)
    if (weekNumber === 1 || weekNumber === 2) return !this.isCartMissing(gameName);
    return !this.isCartMissing(gameName);
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  prevWeek() {
    if (this.currentWeek > 1) {
      this.currentWeek--;
    }
  }

  nextWeek() {
    if (this.currentWeek < this.maxWeeks) {
      this.currentWeek++;
    }
  }

  openStatsModal(playerName: string) {
    this.selectedPlayerStats = this.getPlayerMatchStats(playerName);
    this.showStatsModal = true;
  }

  closeStatsModal() {
    this.showStatsModal = false;
    this.selectedPlayerStats = '';
  }

  getPlayerMatchStats(playerName: string): string {
    const playerMatches = this.matches.filter(match => 
      match.player1 === playerName || match.player2 === playerName
    );
    
    if (playerMatches.length === 0) {
      return `No matches found for ${playerName}`;
    }

    let stats = `Match History for ${playerName}:\n\n`;
    playerMatches.forEach(match => {
      const opponent = match.player1 === playerName ? match.player2 : match.player1;
      const game = this.getGameForWeek(match.week);
      stats += `Week ${match.week}: vs ${opponent}`;
      if (game) {
        stats += ` (${game.name})`;
      }
      stats += '\n';
    });

    return stats;
  }

  // --- Fairness + matchup helpers ---
  private recomputeFairnessMetrics() {
    if (!this.players || this.players.length === 0) return;
    const activePlayers = [...this.players.map(p => p.name)];
    const totalPossibleUnique = activePlayers.length - 1; // each player can face others once for 100%

    // Build per-player opponent history and streak checks
    const matchesNoBye = this.matches.filter(m => m.player2 !== 'Bye');
    // Pre-group matches by week for streak analysis
    const matchesByWeek = new Map<number, Match[]>();
    for (const m of matchesNoBye) {
      if (!matchesByWeek.has(m.week)) matchesByWeek.set(m.week, []);
      matchesByWeek.get(m.week)!.push(m);
    }

    this.fairnessCache = {};
    for (const player of activePlayers) {
      const faced: string[] = [];
      for (const m of matchesNoBye) {
        if (m.player1 === player) faced.push(m.player2);
        else if (m.player2 === player) faced.push(m.player1);
      }
      const uniqueOpponents = new Set(faced);
      const uniqueOppPct = totalPossibleUnique > 0 ? uniqueOpponents.size / totalPossibleUnique : 0;

      // Repeat penalty: sum over opponents (timesPlayed - 1); favors breadth
      const repeatCounts: { [opp: string]: number } = {};
      faced.forEach(o => repeatCounts[o] = (repeatCounts[o] || 0) + 1);
      let repeatPenalty = 0;
      Object.values(repeatCounts).forEach(cnt => { if (cnt > 1) repeatPenalty += (cnt - 1); });

      // Streak penalty: count occurrences where same opponent appears in 2 consecutive prior weeks (or longer chains)
      // Build week->opponent for player
      const opponentByWeek: { [week: number]: string } = {};
      for (const [week, weekMatches] of matchesByWeek.entries()) {
        const found = weekMatches.find(m => m.player1 === player || m.player2 === player);
        if (found) {
          opponentByWeek[week] = found.player1 === player ? found.player2 : found.player1;
        }
      }
      let streakPenalty = 0;
      let currentStreakOpponent: string | null = null;
      let currentStreakLength = 0;
      const sortedWeeks = Object.keys(opponentByWeek).map(n => +n).sort((a,b)=>a-b);
      for (const w of sortedWeeks) {
        const opp = opponentByWeek[w];
        if (opp === currentStreakOpponent) {
          currentStreakLength++;
          if (currentStreakLength >= 2) {
            // penalize additional week in a row beyond first occurrence
            streakPenalty += 1;
          }
        } else {
          currentStreakOpponent = opp;
          currentStreakLength = 1;
        }
      }

      // Composite fairness score (0-100): base on uniqueOpp %, subtract weighted penalties
      // weight choices: repeatPenalty * 8, streakPenalty * 12 (tunable)
      let score = uniqueOppPct * 100 - repeatPenalty * 8 - streakPenalty * 12;
      if (score < 0) score = 0;
      if (score > 100) score = 100;

      this.fairnessCache[player] = { uniqueOppPct, repeatPenalty, streakPenalty, score };
    }
  }

  private ensureFairnessComputed() {
    if (Object.keys(this.fairnessCache).length === 0) {
      this.recomputeFairnessMetrics();
    }
  }

  getPlayerFairnessScore(playerName: string): number {
    this.ensureFairnessComputed();
    return this.fairnessCache[playerName]?.score ?? 0;
  }

  getPlayerUniqueOppPct(playerName: string): number {
    this.ensureFairnessComputed();
    return this.fairnessCache[playerName]?.uniqueOppPct ?? 0;
  }

  // Build Kick profile URL from player name (underscores -> hyphens, lowercase)
  getKickProfileUrl(playerName: string): string {
    if (!playerName) return 'https://kick.com';
    const slug = playerName.trim().toLowerCase().replace(/_/g, '-');
    return `https://kick.com/${slug}`;
  }

  // Win percentage helper
  getPlayerWinPct(player: Player): number {
    const total = player.wins + player.losses;
    if (total === 0) return 0;
    return player.wins / total;
  }

  // Current opponent (for active week)
  getCurrentOpponent(playerName: string): string | null {
    const match = this.matches.find(m => m.week === this.currentWeek && (m.player1 === playerName || m.player2 === playerName));
    if (!match) return null;
    return match.player1 === playerName ? match.player2 : match.player1;
  }

  // Next opponent (next scheduled week after currentWeek)
  getNextOpponent(playerName: string): string | null {
    for (let w = this.currentWeek + 1; w <= this.maxWeeks; w++) {
      const match = this.matches.find(m => m.week === w && (m.player1 === playerName || m.player2 === playerName));
      if (match) return match.player1 === playerName ? match.player2 : match.player1;
    }
    return null;
  }

  // Enhanced stats text for hover/tooltip
  getEnhancedPlayerStats(playerName: string): string {
    const player = this.players.find(p => p.name === playerName);
    if (!player) return `No data for ${playerName}`;
    const fairness = this.getPlayerFairnessScore(playerName).toFixed(1);
    const uniquePct = (this.getPlayerUniqueOppPct(playerName) * 100).toFixed(0);
    const winPct = (this.getPlayerWinPct(player) * 100).toFixed(1);
    const currOpp = this.getCurrentOpponent(playerName) || 'TBD';
    const nextOpp = this.getNextOpponent(playerName) || 'TBD';

    // Reuse existing match list for historical context
    const history = this.getPlayerMatchStats(playerName)
      .split('\n')
      .filter(line => line.startsWith('Week'))
      .slice(-5) // last 5 lines for brevity
      .join('\n');

    return `Stats for ${playerName}\n` +
      `Win %: ${winPct}%  (W:${player.wins} L:${player.losses})\n` +
      `Fairness Score: ${fairness} / 100\n` +
      `Unique Opponents Coverage: ${uniquePct}%\n` +
      `Current Opponent: ${currOpp}\n` +
      `Next Opponent: ${nextOpp}\n` +
      (history ? `Recent Matches:\n${history}` : '');
  }

  showPlayerTooltip(event: any, playerName: string) {
    // Use enhanced stats instead of simple history
    const stats = this.getEnhancedPlayerStats(playerName);
    this.currentTooltip = {
      visible: true,
      playerName: playerName,
      content: stats.replace(/\n/g, '<br>')
    };
  }

  hidePlayerTooltip() {
    this.currentTooltip = {
      visible: false,
      playerName: '',
      content: ''
    };
  }

  logout() {
    this.authService.logout();
  }

  onImageError(playerName: string) {
    this.imageErrors.add(playerName.toLowerCase());
  }

  isImageError(playerName: string): boolean {
    return this.imageErrors.has(playerName.toLowerCase());
  }

  isCartMissing(gameName: string): boolean {
    return this.missingCartGames.has(gameName.toLowerCase());
  }

  onCartImageError(event: Event, gameName: string) {
    const img = event.target as HTMLImageElement;
    const lower = gameName.toLowerCase();
    // If we have not yet tried png fallback and current is webp, swap to png
    if (img.src.endsWith('.webp') && !this.cartTriedPng.has(lower)) {
      this.cartTriedPng.add(lower);
      img.src = img.src.replace(/\.webp($|\?)/, '.png$1');
      return;
    }
    // Both webp and png failed; mark missing so template hides container
    this.missingCartGames.add(lower);
  }

  onRulesImageError(event: Event, weekNumber: number) {
    const img = event.target as HTMLImageElement;
    if (img.src.endsWith('.webp') && !this.rulesTriedPng.has(weekNumber)) {
      this.rulesTriedPng.add(weekNumber);
      img.src = img.src.replace(/\.webp($|\?)/, '.png$1');
      return;
    }
    // give up – hide image to avoid broken icon
    img.style.display = 'none';
  }

  // Get game image paths based on game name
  getGameImages(gameName: string): { cover: string, cart: string } | null {
    const gameImageMap: { [key: string]: string } = {
      'Donkey Kong': 'dk',
      'Street Fighter 2010': '2010',
      'Ninja Gaiden': 'ng',
      'Mario 3': 'm3',
      'Stinger': 'stinger'
    };
    const prefix = gameImageMap[gameName];
    if (!prefix) {
      console.log('[PublicPage] No image prefix for game', gameName);
      return null;
    }
    // Allow png for new Stinger cover asset that was added as stinger-cover.png
    const coverExt = gameName === 'Stinger' ? 'png' : 'webp';
    const paths = { cover: `assets/${prefix}-cover.${coverExt}`, cart: `assets/${prefix}-cart.webp` };
    console.log('[PublicPage] Resolved game images', { gameName, paths });
    return paths;
  }

  updateCurrentGame() {
    if (!this.gamesLoaded || !this.games || this.games.length === 0) {
      this.currentGame = undefined;
      this.currentGameImages = null;
      this.cdr.markForCheck();
      return;
    }
    const found = this.games.find(g => (g as any).assignedWeek === this.currentWeek || (g as any).week === this.currentWeek);
    // Only log / assign if changed to avoid unnecessary change detection churn
    if (found !== this.currentGame) {
      this.currentGame = found;
      console.log('[PublicPage] updateCurrentGame', { currentWeek: this.currentWeek, currentGame: this.currentGame });
      this.currentGameImages = this.currentGame ? this.getGameImages(this.currentGame.name) : null;
      this.cdr.markForCheck();
    }
  }

  private initHoverPortal() {
    if (this.portalBound) return;
    console.time('[PublicPage] initHoverPortal');
    this.portalRoot = document.getElementById('hover-preview-portal');
    if (!this.portalRoot) return;

    const MAX_CLONES = 40; // defensive cap
    let cloneCount = 0;

    const relocate = (img: HTMLImageElement) => {
      if (img.dataset.portalized === '1') return;
      if (cloneCount >= MAX_CLONES) return;
      const original = img;
      const clone = img.cloneNode(true) as HTMLImageElement;
      clone.dataset.portalized = '1';
      clone.style.position = 'fixed';
      clone.style.pointerEvents = 'none';
      clone.style.transformOrigin = 'center center';
      clone.style.willChange = 'transform, opacity';
      clone.style.opacity = '0';
      original.style.opacity = '0';
      original.style.transform = 'translate(-50%, -50%) scale(.001)';
      this.portalRoot!.appendChild(clone);
      this.portalClones.push(clone);
      cloneCount++;
    };

    // Initial scan
    document.querySelectorAll('.game-image-hover-preview, .schedule-hover-preview').forEach(el => relocate(el as HTMLImageElement));

    // Observe future additions (tab switches)
    // Keep reference so we can disconnect on destroy. Filter mutations to avoid heavy reprocessing
    this.portalObserver = new MutationObserver(muts => {
      muts.forEach(m => {
        m.addedNodes.forEach(n => {
          if (!(n instanceof HTMLElement)) return;
            if (n.matches && (n.matches('.game-image-hover-preview') || n.matches('.schedule-hover-preview'))) {
              relocate(n as HTMLImageElement);
            }
            n.querySelectorAll?.('.game-image-hover-preview, .schedule-hover-preview').forEach(inner => relocate(inner as HTMLImageElement));
        });
      });
    });
    // Scope observer to the tab content container instead of entire body to reduce noise
    const scopeEl = document.querySelector('.tab-content') || document.body;
    this.portalObserver.observe(scopeEl, { childList: true, subtree: true });

    // Delegated hover behavior instead of per-container listeners
    this.delegatedEnterHandler = (e: Event) => {
      const target = (e.target as HTMLElement).closest('.game-image-container, .schedule-game-image-container');
      if (!target) return;
      // match original preview inside target (hidden original)
      const original = target.querySelector('img.game-image-hover-preview, img.schedule-hover-preview') as HTMLImageElement | null;
      if (!original) return;
      const clone = this.portalClones.find(c => c.alt === original.alt);
      if (!clone) return;
      const baseRect = target.getBoundingClientRect();
      let targetWidth = 360;
      // Enlarge rules sheets further for readability
      if (original.alt.toLowerCase().includes('rules')) {
        // Larger width; adjust if viewport small
        const vw = Math.min(window.innerWidth, window.innerHeight);
        targetWidth = vw < 600 ? 380 : vw < 900 ? 440 : 500;
      }
      const centerX = baseRect.left + baseRect.width / 2;
      const centerY = baseRect.top + baseRect.height / 2;
      clone.style.left = centerX + 'px';
      clone.style.top = centerY + 'px';
      clone.style.width = targetWidth + 'px';
      clone.style.height = 'auto';
      clone.style.transform = 'translate(-50%, -50%) scale(1)';
      clone.style.transition = 'opacity .22s ease, transform .28s cubic-bezier(.34,1.56,.64,1)';
      clone.style.opacity = '1';
    };
    this.delegatedLeaveHandler = (e: Event) => {
      const target = (e.target as HTMLElement).closest('.game-image-container, .schedule-game-image-container');
      if (!target) return;
      const original = target.querySelector('img.game-image-hover-preview, img.schedule-hover-preview') as HTMLImageElement | null;
      if (!original) return;
      const clone = this.portalClones.find(c => c.alt === original.alt);
      if (!clone) return;
      clone.style.opacity = '0';
      clone.style.transform = 'translate(-50%, -50%) scale(.001)';
    };
    scopeEl.addEventListener('mouseenter', this.delegatedEnterHandler, true);
    scopeEl.addEventListener('mouseleave', this.delegatedLeaveHandler, true);
    this.portalBound = true;
    console.timeEnd('[PublicPage] initHoverPortal');
  }

  private cleanupPortal() {
    if (this.portalClones.length && this.portalRoot) {
      this.portalClones.forEach(c => { if (c.parentNode) c.parentNode.removeChild(c); });
    }
    this.portalClones = [];
    const scopeEl = document.querySelector('.tab-content') || document.body;
    if (this.delegatedEnterHandler) scopeEl.removeEventListener('mouseenter', this.delegatedEnterHandler, true);
    if (this.delegatedLeaveHandler) scopeEl.removeEventListener('mouseleave', this.delegatedLeaveHandler, true);
    this.delegatedEnterHandler = undefined;
    this.delegatedLeaveHandler = undefined;
  }

  // --- Caching helpers ---
  private recomputeSortedPlayers() {
    const sorted = [...this.players].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (a.losses !== b.losses) return a.losses - b.losses;
      return a.name.localeCompare(b.name);
    });
    const withRanks: (Player & { rank: number })[] = [];
    let currentRank = 1;
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0) {
        const prev = sorted[i - 1];
        const cur = sorted[i];
        if (cur.points !== prev.points || cur.wins !== prev.wins || cur.losses !== prev.losses) {
          currentRank = i + 1;
        }
      }
      withRanks.push({ ...(sorted[i]), rank: currentRank });
    }
    this.sortedPlayersWithRank = withRanks;
  }

  private rebuildWeeksCache() {
    const weeks: ScheduleWeek[] = [];
    for (let i = 1; i <= this.maxWeeks; i++) {
      const weekMatches = this.matches.filter(m => m.week === i);
      const game = this.getGameForWeek(i);
      let coverUrl: string | undefined;
      if (game) {
        const imgs = this.getGameImages(game.name);
        if (imgs?.cover) coverUrl = imgs.cover;
      }
      weeks.push({ number: i, matches: weekMatches, game, coverUrl });
    }
    this.weeksCache = weeks;
  }
}
