import { Component, AfterViewInit, OnDestroy, ChangeDetectionStrategy, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DataService, Season, Player, Match } from './data.service';
import { Subscription } from 'rxjs';
import { AuthService } from './auth.service'; // Import AuthService

@Component({
  selector: 'app-select-matches',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wheel-bg">
      <h1 class="wheel-title">Current Week: {{ currentWeek }} / {{ maxWeeks }}</h1>
      <div class="wheel-main-layout">
        <div class="wheel-left-section">
          <div class="wheel-container">
            <canvas #wheelCanvas (click)="spinWheelAndSave()" width="350" height="350" class="wheel-canvas"></canvas>
          </div>
          <div class="wheel-btn-row">
            <button class="wheel-btn" (click)="openStatsModal()">View Matchup Stats</button>
          </div>
        </div>
        <div class="wheel-right-section">
          <div class="selected-player animate-pop">
            <h2>Selected Player:</h2>
            <div class="selected-name">{{ selectedPlayer || 'No selection yet' }}</div>
            <div *ngIf="lastMatch" class="match-feedback">Last match: {{ lastMatch.player1 }} vs {{ lastMatch.player2 }}</div>
            <div *ngIf="wheelFeedback" class="match-feedback">{{ wheelFeedback }}</div>
          </div>
          <div *ngIf="showGeneratedMsg" class="match-feedback">Round robin matches generated and saved!</div>
          <div class="matchups-panel">
            <h2>Week {{ currentWeek }} Matchup Grid</h2>
            <div class="matchup-grid">
              <div *ngFor="let matchup of getMatchupGrid()" class="matchup-card">
                <div class="player-slot">
                  <span class="player-name">{{ matchup.player1 || 'TBD' }}</span>
                </div>
                <div class="vs-divider">VS</div>
                <div class="player-slot">
                  <span class="player-name">{{ matchup.player2 || 'TBD' }}</span>
                </div>
                <div *ngIf="matchup.player1 && matchup.player2 && matchup.player2 !== 'Bye'" class="matchup-info">
                  <span *ngIf="getMatchupCount(matchup.player1, matchup.player2) === 1" class="new-matchup">NEW!</span>
                  <span *ngIf="getMatchupCount(matchup.player1, matchup.player2) > 1" class="repeat-matchup">
                    {{ getMatchupCount(matchup.player1, matchup.player2) }}{{ getOrdinalSuffix(getMatchupCount(matchup.player1, matchup.player2)) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="week-controls">
        <button (click)="prevWeek()">Previous Week</button>
        <button (click)="nextWeek()">Next Week</button>
      </div>
    </div>
    <!-- Matchup Stats Modal -->
    <div class="stats-modal-backdrop" *ngIf="showStatsModal" (click)="closeStatsModal()">
      <div class="stats-modal" (click)="$event.stopPropagation()">
        <button class="close-modal" (click)="closeStatsModal()" aria-label="Close">×</button>
        <div class="stats-modal-content">
          <h3>Matchup Statistics</h3>
          <pre class="stats-pre">{{ statsMessage }}</pre>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .wheel-bg {
      min-height: 100vh;
      background: #181a1b;
      font-family: 'Orbitron', 'Arial Black', Arial, sans-serif;
      color: #fff;
      padding: 16px;
    }
    .wheel-title {
      text-align: center;
      font-size: 2rem;
      font-weight: 900;
      color: #ddd;
      text-shadow: 2px 2px 0 #181a1b, 0 0 12px #53fc19;
      margin: 0 0 12px 0;
    }
    .week-indicator {
      text-align: center;
      font-size: 1rem;
      color: #ddd;
      margin-bottom: 16px;
    }
    .wheel-main-layout {
      display: flex;
      gap: 20px;
      max-width: 1200px;
      margin: 0 auto;
      align-items: flex-start;
    }
    /* Mobile responsive rules */
    @media (max-width: 768px) {
      .wheel-main-layout {
        flex-direction: column !important;
        gap: 12px !important;
        align-items: stretch !important;
      }
      .wheel-left-section, .wheel-right-section {
        width: 100% !important;
        max-width: 100% !important;
        flex: none !important;
      }
      .wheel-container, .wheel-canvas {
        width: 90vw !important;
        height: 90vw !important;
        max-width: 520px !important;
        max-height: 520px !important;
      }
      .matchup-grid {
        display: grid !important;
        grid-template-columns: 1fr !important;
        gap: 12px !important;
      }
      .matchup-card {
        padding: 12px !important;
      }
    }
    .wheel-left-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 0 0 380px;
    }
    .wheel-right-section {
      flex: 1;
      min-width: 350px;
    }
    
    /* TV Display Styles */
    .tv-displays {
      display: flex;
      gap: 20px;
      margin-top: 20px;
      justify-content: center;
    }
    .tv-container {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .tv-screen {
      position: relative;
      width: 150px;
      height: 120px;
    }
    .tv-frame {
      width: 100%;
      height: 100%;
      object-fit: contain;
      position: absolute;
      top: 0;
      left: 0;
      z-index: 2;
    }
    .tv-content {
      position: absolute;
      top: 15%;
      left: 15%;
      width: 70%;
      height: 70%;
      z-index: 1;
      border-radius: 8px;
      overflow: hidden;
      background: #000;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .tv-game-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .tv-placeholder {
      color: #ddd;
      font-size: 0.8rem;
      text-align: center;
      padding: 8px;
      background: rgba(24, 26, 27, 0.8);
    }
    .tv-static {
      width: 100%;
      height: 100%;
      background: 
        radial-gradient(circle at 20% 50%, white 2px, transparent 3px),
        radial-gradient(circle at 75% 25%, white 3px, transparent 4px),
        radial-gradient(circle at 90% 90%, white 1px, transparent 2px),
        radial-gradient(circle at 40% 70%, white 2px, transparent 3px),
        radial-gradient(circle at 65% 15%, white 3px, transparent 4px),
        radial-gradient(circle at 10% 90%, white 2px, transparent 3px),
        radial-gradient(circle at 30% 30%, white 1px, transparent 2px),
        radial-gradient(circle at 80% 60%, white 2px, transparent 3px);
      background-size: 40px 40px, 60px 60px, 30px 30px, 50px 50px, 45px 45px, 35px 35px, 25px 25px, 55px 55px;
      animation: staticNoise 0.5s steps(8) infinite;
      opacity: 0.8;
    }
    @keyframes staticNoise {
      0%, 100% { 
        background-position: 0 0, 20px 10px, 40px 30px, 10px 50px, 30px 20px, 50px 40px, 15px 15px, 35px 25px;
      }
      12.5% { 
        background-position: 5px 5px, 25px 15px, 45px 35px, 15px 55px, 35px 25px, 55px 45px, 20px 20px, 40px 30px;
      }
      25% { 
        background-position: 10px 10px, 30px 20px, 50px 40px, 20px 60px, 40px 30px, 60px 50px, 25px 25px, 45px 35px;
      }
      37.5% { 
        background-position: 15px 15px, 35px 25px, 55px 45px, 25px 65px, 45px 35px, 65px 55px, 30px 30px, 50px 40px;
      }
      50% { 
        background-position: 20px 20px, 40px 30px, 60px 50px, 30px 70px, 50px 40px, 70px 60px, 35px 35px, 55px 45px;
      }
      62.5% { 
        background-position: 25px 25px, 45px 35px, 65px 55px, 35px 75px, 55px 45px, 75px 65px, 40px 40px, 60px 50px;
      }
      75% { 
        background-position: 30px 30px, 50px 40px, 70px 60px, 40px 80px, 60px 50px, 80px 70px, 45px 45px, 65px 55px;
      }
      87.5% { 
        background-position: 35px 35px, 55px 45px, 75px 65px, 45px 85px, 65px 55px, 85px 75px, 50px 50px, 70px 60px;
      }
    }
    .tv-label {
      margin-top: 8px;
      font-size: 0.9rem;
      color: #ddd;
      text-align: center;
    }
    .wheel-banner {
      margin-bottom: 24px;
    }
    .wheel-img {
      max-width: 400px;
      height: auto;
      border-radius: 12px;
      box-shadow: 0 0 24px rgba(83, 252, 25, 0.5);
    }
    .wheel-container {
      width: 350px;
      height: 350px;
      margin-bottom: 16px;
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .wheel-canvas {
      border-radius: 50%;
      box-shadow: 0 0 24px #53fc19, 0 0 32px #181a1b inset;
      background: #fff;
    }
    .wheel-btn-row {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .wheel-btn {
      display: block;
      margin: 18px auto;
      background: #53fc19;
      color: #181a1b;
      border: none;
      border-radius: 8px;
      padding: 10px 32px;
      font-size: 1.2rem;
      font-weight: bold;
      box-shadow: 0 0 8px #53fc19;
      cursor: pointer;
      transition: background 0.2s, color 0.2s;
    }
    .wheel-btn:hover:not([disabled]) {
      background: #fff;
      color: #ddd;
    }
    
    /* TV Control Buttons */
    .tv-controls {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    .tv-btn {
      background: #181a1b;
      color: #ddd;
      border: 2px solid #53fc19;
      border-radius: 8px;
      padding: 8px 16px;
      font-size: 0.9rem;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .tv-btn:hover {
      background: #53fc19;
      color: #181a1b;
      transform: scale(1.05);
    }
    .selected-player {
      margin-bottom: 16px;
      padding: 16px;
      background: rgba(83,252,25,0.1);
      border-radius: 12px;
      border: 2px solid #53fc19;
      box-shadow: 0 0 16px rgba(83, 252, 25, 0.3);
    }
    .selected-player h2 {
      margin: 0 0 8px 0;
      color: #ddd;
      font-size: 1.2rem;
    }
    .selected-name {
      color: #fff;
      font-size: 1.5rem;
      font-weight: bold;
      margin-bottom: 6px;
    }
    .match-feedback {
      margin-top: 12px;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      font-size: 0.9rem;
      color: #ddd;
    }
    .matchups-panel {
      background: rgba(24, 26, 27, 0.8);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;
      border: 1px solid #53fc19;
      box-shadow: 0 0 12px rgba(83, 252, 25, 0.2);
    }
    .matchups-panel h2 {
      color: #ddd;
      font-size: 1.1rem;
      margin: 0 0 12px 0;
      text-align: center;
    }
    .selected-name {
      font-size: 2rem;
      color: #ddd;
      font-weight: bold;
      text-shadow: 0 0 8px #181a1b;
      margin-top: 8px;
      letter-spacing: 2px;
    }
    @keyframes popIn {
      0% { transform: scale(0.7) rotate(-10deg); opacity: 0; }
      80% { transform: scale(1.1) rotate(3deg); opacity: 1; }
      100% { transform: scale(1) rotate(0deg); }
    }
    .matchups-panel {
      background: rgba(24,26,27,0.95);
      border-radius: 18px;
      box-shadow: 0 0 24px #53fc19, 0 0 32px #181a1b inset;
      padding: 24px 32px;
      min-width: 400px;
      max-width: 900px;
      margin: 32px auto 0 auto;
      color: #fff;
    }
    .matchup-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
      padding: 0 20px;
      justify-items: center;
    }
    
    @media (max-width: 900px) {
      .matchup-grid {
        grid-template-columns: 1fr;
        padding: 0 10px;
      }
    }
    .matchup-card {
      background: rgba(83,252,25,0.1);
      border: 2px solid #53fc19;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 80px;
      max-width: 450px;
      width: 100%;
      box-sizing: border-box;
      position: relative;
    }
    .player-slot {
      flex: 1;
      text-align: center;
      padding: 12px 8px;
      min-width: 120px;
      max-width: 180px;
    }
    .player-name {
      font-size: 1.1rem;
      font-weight: bold;
      color: #ddd;
      text-shadow: 0 0 4px #181a1b;
      word-wrap: break-word;
      line-height: 1.3;
      overflow-wrap: break-word;
      hyphens: auto;
    }
    .vs-divider {
      font-size: 1.4rem;
      font-weight: bold;
      background: #53fc19;
      color: #181a1b;
      padding: 12px 16px;
      border-radius: 50%;
      box-shadow: 0 0 8px #53fc19;
      min-width: 50px;
      text-align: center;
    }
    .matchup-info {
      position: absolute;
      top: -8px;
      right: -8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .new-matchup {
      background: #ff6b35;
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: bold;
      box-shadow: 0 0 8px rgba(255, 107, 53, 0.5);
      animation: pulse 2s infinite;
    }
    .repeat-matchup {
      background: #ffd700;
      color: #181a1b;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: bold;
      box-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
    }
    @keyframes pulse {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.1); opacity: 0.7; }
      100% { transform: scale(1); opacity: 1; }
    }
    .matchup-week {
      margin-bottom: 18px;
    }
    .matchup-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .matchup {
      font-size: 1rem;
      color: #fff;
      background: rgba(83,252,25,0.08);
      border-radius: 6px;
      padding: 4px 10px;
      margin-bottom: 4px;
      display: inline-block;
      box-shadow: 0 0 6px #53fc19;
    }
    .vs {
      color: #ddd;
      font-weight: bold;
      margin: 0 6px;
      text-shadow: 0 0 4px #181a1b;
    }
    .week-controls {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 2px solid rgba(83, 252, 25, 0.3);
    }
    .week-controls button {
      background: #53fc19;
      color: #181a1b;
      border: none;
      border-radius: 8px;
      padding: 12px 24px;
      font-size: 1.1rem;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 0 8px rgba(83, 252, 25, 0.5);
    }
    .week-controls button:hover {
      background: #fff;
      color: #ddd;
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(83, 252, 25, 0.7);
    }
    @media (max-width: 900px) {
      .wheel-flex {
        flex-direction: column;
        gap: 16px;
      }
      .matchups-panel { max-width: 98vw; }
      .wheel-container { width: 98vw; height: 98vw; max-width: 400px; max-height: 400px; }
    }
    .stats-modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(24,26,27,0.85);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.2s;
    }
    .stats-modal {
      background: #181a1b;
      border: 2px solid #53fc19;
      border-radius: 16px;
      box-shadow: 0 0 32px #53fc19, 0 0 32px #181a1b inset;
      padding: 32px 28px 24px 28px;
  min-width: 320px;
  max-width: calc(100vw - 40px);
  overflow: hidden; /* prevent modal from causing horizontal scroll */
      max-height: 90vh;
      color: #fff;
      position: relative;
      animation: popIn 0.3s;
      display: flex;
      flex-direction: column;
    }
    .stats-modal-content {
  flex: 1 1 auto;
  overflow-y: auto;
  overflow-x: hidden; /* ensure long lines don't create horizontal scroll */
  max-height: 70vh;
  width: 100%;
    }
    .stats-modal-content h3 {
      color: #ddd;
      margin-top: 0;
      margin-bottom: 12px;
      text-align: center;
      position: sticky;
      top: 0;
      background: #181a1b;
      z-index: 2;
    }
    .stats-pre {
      background: none;
      color: #fff;
      font-size: 1.05rem;
  white-space: pre-wrap; /* preserve line breaks but allow wrapping */
  overflow-wrap: anywhere; /* break very long words/strings to avoid overflow */
  word-break: break-word;
  hyphens: auto;
      margin: 0;
      text-align: left;
      font-family: 'Fira Mono', 'Consolas', monospace;
      line-height: 1.4;
    }
    .close-modal {
      position: absolute;
      top: 10px;
      right: 16px;
      background: #181a1b;
      border: 2px solid #53fc19;
      color: #ddd;
      font-size: 2.2rem;
      font-weight: bold;
      border-radius: 50%;
      width: 44px;
      height: 44px;
      cursor: pointer;
      transition: color 0.2s, background 0.2s;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .close-modal:hover {
      color: #fff;
      background: #53fc19;
    }
    /* Mobile-specific modal adjustments */
    @media (max-width: 600px) {
      .stats-modal-backdrop {
        align-items: flex-end;
        justify-content: center;
        padding: 0;
      }
      .stats-modal {
        width: 100vw !important;
        height: 100vh !important;
        min-width: unset !important;
        max-width: 100vw !important;
        max-height: 100vh !important;
        border-radius: 0 !important;
        padding: 18px !important;
        box-sizing: border-box;
        justify-content: flex-start;
      }
      .stats-modal-content {
        max-height: calc(100vh - 120px) !important;
        overflow-y: auto !important;
      }
      .stats-pre {
        font-size: 0.95rem !important;
        line-height: 1.35 !important;
      }
      .close-modal {
        top: 12px !important;
        right: 12px !important;
        width: 52px !important;
        height: 52px !important;
        font-size: 2rem !important;
      }
      /* Make the View Matchup Stats button easier to tap */
      .wheel-btn {
        width: 100% !important;
        box-sizing: border-box !important;
        padding-left: 12px !important;
        padding-right: 12px !important;
      }
    }
  `]
})
export class SelectMatchesComponent implements AfterViewInit, OnDestroy, OnInit {
  lastMatch: Match | null = null;
  showGeneratedMsg: boolean = false;
  wheelFeedback: string = '';
  players: string[] = [];
  playersData: Player[] = [];
  selectedPlayer: string | null = null;
  spinning: boolean = false;
  angle: number = 0;
  targetAngle: number = 0;
  faviconImg: HTMLImageElement | null = null;
  shouldAnimateStatic: boolean = false;
  roundRobinMatches: Match[] = [];
  currentWeek: number = 1;
  maxWeeks: number = 14;
  currentSeason: Season | null = null;
  showStats: boolean = false;
  showStatsModal: boolean = false;
  statsMessage: string = '';
  @ViewChild('wheelCanvas', { static: false }) wheelCanvasRef!: ElementRef<HTMLCanvasElement>;
  
  // RAWG API configuration
  // To use real game images, get a free API key from https://rawg.io/apidocs
  // Replace 'your-api-key-here' with your actual key
  private readonly RAWG_API_KEY = 'your-api-key-here'; 
  private readonly RAWG_BASE_URL = 'http://localhost:4000/media';
  private readonly USE_REAL_API = false; // Set to true when you have a valid API key
  
  private subscriptions: Subscription[] = [];

  constructor(private http: HttpClient, private dataService: DataService, private authService: AuthService) {} // Add AuthService to constructor

  ngOnInit() {
    // Check admin access and redirect if necessary
    if (!this.authService.isAdminMode) {
      this.authService.redirectToPublic();
    }
  }

  ngAfterViewInit() {
    this.loadFavicon();
    this.loadActiveWeek(); // Load the active week from admin
    
    // Subscribe to data from the service
    this.subscriptions.push(
      this.dataService.players$.subscribe(players => {
        this.playersData = players;
        this.players = players.map(p => p.name);
        this.redrawWheelForCurrentWeek();
      })
    );
    
    this.subscriptions.push(
      this.dataService.matches$.subscribe(matches => {
        this.roundRobinMatches = matches;
        this.redrawWheelForCurrentWeek();
      })
    );
    
    this.subscriptions.push(
      this.dataService.seasons$.subscribe(seasons => {
        this.currentSeason = seasons.find(s => s.status === 'active') || null;
        if (this.currentSeason) {
          this.maxWeeks = this.currentSeason.weeks;
        }
      })
    );
    
    // Load all data initially
    this.dataService.loadAllData().subscribe();
    this.animateStatic();
    // Resize canvas shortly after view init to ensure proper sizing
    setTimeout(() => this.resizeWheelCanvas(), 50);
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.resizeWheelCanvas();
  }

  resizeWheelCanvas() {
    try {
  const canvas = this.wheelCanvasRef?.nativeElement;
  if (!canvas) return;
  const ratio = window.devicePixelRatio || 1;
  const parentRect = (canvas.parentElement && canvas.parentElement.getBoundingClientRect()) || canvas.getBoundingClientRect();
  const maxAllowed = Math.max(200, Math.floor(window.innerWidth - 40));
  const w = Math.max(200, Math.min(Math.floor(parentRect.width), maxAllowed));
  const h = Math.max(200, Math.min(Math.floor(parentRect.height || parentRect.width), maxAllowed));
      canvas.width = Math.floor(w * ratio);
      canvas.height = Math.floor(h * ratio);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      // Redraw wheel after resizing
      this.redrawWheelForCurrentWeek();
    } catch (e) {
      console.warn('resizeWheelCanvas error', e);
    }
  }
  
  animateStatic() {
    let lastPlayerCount = -1;
    let lastWeek = -1;
    
    const animate = () => {
      const wheelPlayers = this.getWheelPlayers();
      const currentPlayerCount = wheelPlayers.length;
      
      // Check if selection is complete for animation
      const isSelectionComplete = this.isWeekSelectionComplete(this.currentWeek);
      
      // Redraw if player count changed, week changed, or need to animate static
      if (currentPlayerCount !== lastPlayerCount || this.currentWeek !== lastWeek) {
        lastPlayerCount = currentPlayerCount;
        lastWeek = this.currentWeek;
        this.drawWheel(wheelPlayers);
      } else if (currentPlayerCount === 0 && isSelectionComplete) {
        // Continuously animate static only when selection is complete
        this.drawWheel(wheelPlayers);
      }
      
      requestAnimationFrame(animate);
    };
    animate();
  }
  
  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadFavicon() {
    this.faviconImg = new Image();
    this.faviconImg.onload = () => {
      this.redrawWheelForCurrentWeek(); // Redraw once favicon is loaded
    };
    this.faviconImg.src = 'favicon.ico';
  }

  private truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxChars: number = 9): string {
    const ellipsis = '...';
    
    // First check character limit
    if (text.length > maxChars) {
      return text.slice(0, maxChars) + ellipsis;
    }
    
    // Then check if text fits within width
    if (ctx.measureText(text).width <= maxWidth) {
      return text;
    }
    
    // Find the right length with ellipsis based on width
    let truncated = text;
    while (truncated.length > 0) {
      const testText = truncated + ellipsis;
      if (ctx.measureText(testText).width <= maxWidth) {
        return testText;
      }
      truncated = truncated.slice(0, -1);
    }
    
    return ellipsis;
  }

  drawStaticEffect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    
    // Simple random static for reliable animation
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.random() * 255;
      data[i] = gray;     // Red
      data[i + 1] = gray; // Green
      data[i + 2] = gray; // Blue
      data[i + 3] = 255;  // Alpha
    }
    
    ctx.putImageData(imageData, x, y);
  }

  drawWheel(playerList?: string[]) {
  const canvas = (this.wheelCanvasRef && this.wheelCanvasRef.nativeElement) || document.querySelector('canvas.wheel-canvas') as HTMLCanvasElement;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  // Use the CSS layout size for logical drawing coordinates because ctx has been
  // transformed by devicePixelRatio in resizeWheelCanvas (ctx.setTransform).
  const rect = canvas.getBoundingClientRect();
  const size = Math.max(0, rect.width);
  const center = size / 2;
  const radius = Math.max(10, center - 10);
    ctx.clearRect(0, 0, size, size);
    
    // Get players for wheel (either passed in or calculate available players)
    const playersToDraw = playerList || this.getWheelPlayers();
    const n = playersToDraw.length;
    
    // Check if all players are assigned for this week (selection complete)
    const isSelectionComplete = this.isWeekSelectionComplete(this.currentWeek);
    
    // If selection is complete for this week, show large favicon instead of static
    if (n === 0 && isSelectionComplete) {
      // Clear canvas with solid background
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#181a1b';
      ctx.fill();
      ctx.strokeStyle = '#53fc19';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Draw favicon at full wheel size if loaded
      if (this.faviconImg && this.faviconImg.complete) {
        ctx.save();
        ctx.translate(center, center);
        ctx.rotate(this.angle);
        
        // Calculate size to fit within wheel radius with some padding
        const iconSize = (radius - 20) * 2; // Use most of the wheel diameter
        const halfSize = iconSize / 2;
        
        ctx.drawImage(this.faviconImg, -halfSize, -halfSize, iconSize, iconSize);
        ctx.restore();
      }
      
      return;
    }
    
    // If no players but selection not complete (no players loaded yet), show loading message
    if (n === 0) {
      // Draw a solid background
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#181a1b';
      ctx.fill();
      ctx.strokeStyle = '#53fc19';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Draw loading text
      ctx.textAlign = 'center';
      ctx.font = 'bold 1.2rem Orbitron, Arial';
      ctx.fillStyle = '#53fc19';
      ctx.fillText('Loading', center, center - 10);
      ctx.fillText('Players...', center, center + 15);
      
      // Still draw favicon in center circle
      const centerRadius = 40;
      ctx.save();
      ctx.translate(center, center + 50);
      ctx.rotate(this.angle);
      
      // Draw center circle
      ctx.beginPath();
      ctx.arc(0, 0, centerRadius, 0, 2 * Math.PI);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = '#53fc19';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Draw favicon image if loaded
      if (this.faviconImg && this.faviconImg.complete) {
        ctx.drawImage(this.faviconImg, -25, -25, 50, 50);
      }
      ctx.restore();
      
      return;
    }
    
    const angleStep = 2 * Math.PI / n;
    let selectedIdx = this.selectedPlayer ? playersToDraw.indexOf(this.selectedPlayer) : -1;
    for (let i = 0; i < n; i++) {
      const startAngle = this.angle + i * angleStep;
      const endAngle = startAngle + angleStep;
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();
      // Highlight selected segment with bold border and background
      if (i === selectedIdx) {
        ctx.fillStyle = '#53fc19';
        ctx.globalAlpha = 0.95;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 8;
        ctx.stroke();
      } else {
        ctx.fillStyle = i % 2 === 0 ? '#53fc19' : '#181a1b';
        ctx.globalAlpha = 0.85;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      // Draw player name with ellipses if too long
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + angleStep / 2);
      ctx.textAlign = 'right';
      ctx.font = 'bold 0.85rem Orbitron, Arial';
      ctx.fillStyle = i === selectedIdx ? '#181a1b' : '#fff';
      ctx.shadowColor = i === selectedIdx ? '#53fc19' : '#181a1b';
      ctx.shadowBlur = i === selectedIdx ? 8 : 4;
      
      const name = playersToDraw[i];
      const maxTextWidth = radius - 25; // Available space for text
      
      // Check if name fits in two lines
      if (name.length > 9) {
        // Try to split at a reasonable point
        const firstLine = name.slice(0, 9);
        const secondLine = name.slice(9);
        
        // Truncate each line if needed
        const truncatedFirst = this.truncateText(ctx, firstLine, maxTextWidth);
        const truncatedSecond = this.truncateText(ctx, secondLine, maxTextWidth);
        
        ctx.fillText(truncatedFirst, radius - 18, -4);
        ctx.fillText(truncatedSecond, radius - 18, 12);
      } else {
        // Single line - truncate if needed
        const truncatedName = this.truncateText(ctx, name, maxTextWidth);
        ctx.fillText(truncatedName, radius - 18, 4);
      }
      ctx.restore();
    }
    
    // Draw favicon in center circle (rotated with wheel)
    const centerRadius = 40; // Size of center circle
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(this.angle); // Rotate with the wheel
    
    // Draw center circle
    ctx.beginPath();
    ctx.arc(0, 0, centerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#53fc19';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Draw favicon image if loaded
    if (this.faviconImg && this.faviconImg.complete) {
      ctx.drawImage(this.faviconImg, -25, -25, 50, 50);
    }
    ctx.restore();
    
    // Draw arrow at top, pointing downward
    ctx.save();
    ctx.translate(center, 20); // top center, slightly lower
    ctx.beginPath();
    ctx.moveTo(0, 0);           // tip of arrow pointing down
    ctx.lineTo(-15, -25);       // left wing
    ctx.lineTo(-5, -15);        // left inner
    ctx.lineTo(5, -15);         // right inner
    ctx.lineTo(15, -25);        // right wing
    ctx.lineTo(0, 0);           // back to tip
    ctx.closePath();
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#181a1b';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#53fc19';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    // Clicking animation
    if (this.spinning) {
      const clickCount = Math.floor((performance.now() / 80) % 2);
      if (clickCount === 1) {
        ctx.save();
        ctx.translate(center, 18);
        ctx.rotate(Math.PI);
        ctx.beginPath();
        ctx.arc(0, -24, 8, 0, 2 * Math.PI);
        ctx.fillStyle = '#53fc19';
        ctx.globalAlpha = 0.7;
        ctx.fill();
        ctx.restore();
      }
    }
  }

  spinWheelAndSave() {
    const wheelPlayers = this.getWheelPlayers();
    if (this.spinning) return;
    if (wheelPlayers.length < 2) {
      this.wheelFeedback = 'All players matched for this week.';
      return;
    }
    this.spinning = true;
    this.wheelFeedback = 'Spinning the wheel...';
    const idx = Math.floor(Math.random() * wheelPlayers.length);
    // Calculate the angle so the selected player lands at the top (arrow points up)
    const segmentAngle = 2 * Math.PI / wheelPlayers.length;
    const finalAngle = (3 * Math.PI / 2) - (segmentAngle * idx + segmentAngle / 2);
    let start = this.angle;
    let startTime = performance.now();
    let spinRevs = 3;
    let targetAngle = spinRevs * 2 * Math.PI + finalAngle;
    const duration = 3000;
    const animate = (now: number) => {
      let elapsed = now - startTime;
      if (elapsed > duration) elapsed = duration;
      this.angle = start + (targetAngle - start) * (elapsed / duration);
      this.drawWheel(wheelPlayers);
      if (elapsed < duration) {
        requestAnimationFrame(animate);
      } else {
        this.angle = targetAngle % (2 * Math.PI);
        this.drawWheel(wheelPlayers);
        this.selectedPlayer = wheelPlayers[idx];
        this.spinning = false;
        if (this.selectedPlayer === 'Bye') {
          // Use fair bye distribution to select the appropriate player
          const availablePlayers = wheelPlayers.filter(p => p !== 'Bye');
          const fairByePlayer = this.getFairByeFromAvailable(availablePlayers);
          
          this.wheelFeedback = `Selected: ${fairByePlayer} gets bye week!`;
          // Save bye week match with the fair selection
          const match: Match = { 
            week: this.currentWeek, 
            player1: fairByePlayer, 
            player2: 'Bye',
            status: 'scheduled',
            played: false
          };
          this.lastMatch = match;
          // Send to backend using data service only
          this.dataService.addMatch(match).subscribe({
            next: () => {
              this.wheelFeedback = `Bye week saved for ${fairByePlayer}.`;
              setTimeout(() => { this.wheelFeedback = ''; }, 2500);
            },
            error: () => {
              this.wheelFeedback = 'Error saving bye week to server.';
            }
          });
        } else {
          // Save selected player as a match (vs smart opponent selection)
          const availableOpponents = wheelPlayers.filter(p => p !== this.selectedPlayer && p !== 'Bye');
          let opponent: string;
          
          // Use smart opponent selection
          const unplayedOpponents = this.getUnplayedOpponents(this.selectedPlayer!, availableOpponents);
          
          if (unplayedOpponents.length > 0) {
            // Choose from opponents they haven't faced yet
            opponent = unplayedOpponents[Math.floor(Math.random() * unplayedOpponents.length)];
          } else if (availableOpponents.length > 0) {
            // If all have been faced, choose the one faced least
            opponent = availableOpponents.reduce((best, current) => {
              const bestMatchupCount = this.getMatchupCount(this.selectedPlayer!, best);
              const currentMatchupCount = this.getMatchupCount(this.selectedPlayer!, current);
              return currentMatchupCount < bestMatchupCount ? current : best;
            });
          } else {
            // Fallback (shouldn't happen)
            opponent = 'TBD';
          }
          
          const match: Match = { 
            week: this.currentWeek, 
            player1: this.selectedPlayer!, 
            player2: opponent,
            status: 'scheduled',
            played: false
          };
          this.lastMatch = match;
          
          // Show if this is a new matchup
          const matchupCount = this.getMatchupCount(this.selectedPlayer!, opponent);
          const isNewMatchup = matchupCount === 0;
          const matchupInfo = isNewMatchup ? ' (NEW MATCHUP!)' : ` (${matchupCount + 1}${this.getOrdinalSuffix(matchupCount + 1)} time)`;
          
          this.wheelFeedback = `Selected: ${match.player1} vs ${match.player2}${matchupInfo}. Saving...`;
          // Send to backend using data service only
          this.dataService.addMatch(match).subscribe({
            next: () => {
              this.wheelFeedback = `Match saved: ${match.player1} vs ${match.player2}${matchupInfo}`;
              setTimeout(() => { this.wheelFeedback = ''; }, 2500);
            },
            error: () => {
              this.wheelFeedback = 'Error saving match to server.';
            }
          });
        }
      }
    };
    requestAnimationFrame(animate);
  }

  generateWeeklyMatches() {
    // Generate matchups for the current week with fair opponent distribution
    const activePlayers = this.players.filter(p => p !== 'Bye Week');
    const weeklyMatches: Match[] = [];
    
    // If even number of players, no bye needed
    if (activePlayers.length % 2 === 0) {
      const optimalPairs = this.generateOptimalMatchups(activePlayers);
      
      // Create pairs for this week using optimal matchmaking
      for (const pair of optimalPairs) {
        weeklyMatches.push({
          week: this.currentWeek,
          player1: pair[0],
          player2: pair[1],
          status: 'scheduled',
          played: false
        });
      }
    } else {
      // Odd number - need to assign bye fairly
      const playerWithBye = this.getPlayerForBye();
      const playersForMatches = activePlayers.filter(p => p !== playerWithBye);
      const optimalPairs = this.generateOptimalMatchups(playersForMatches);
      
      // Create bye match
      weeklyMatches.push({
        week: this.currentWeek,
        player1: playerWithBye,
        player2: 'Bye',
        status: 'scheduled',
        played: false
      });
      
      // Create regular matches with optimal opponent selection
      for (const pair of optimalPairs) {
        weeklyMatches.push({
          week: this.currentWeek,
          player1: pair[0],
          player2: pair[1],
          status: 'scheduled',
          played: false
        });
      }
    }
    
    // Replace any existing matches for this week and add new ones
    const otherWeekMatches = this.roundRobinMatches.filter(m => m.week !== this.currentWeek);
    const allMatches = [...otherWeekMatches, ...weeklyMatches];
    
    // Send updated matches to backend using the data service
    this.dataService.saveMatches(allMatches).subscribe({
      next: () => {
        this.showGeneratedMsg = true;
        setTimeout(() => { this.showGeneratedMsg = false; }, 2500);
      },
      error: () => {
        this.showGeneratedMsg = true;
        setTimeout(() => { this.showGeneratedMsg = false; }, 2500);
      }
    });
  }
  
  getPlayerForBye(): string {
    // Count how many bye weeks each player has had
    const activePlayers = this.players.filter(p => p !== 'Bye Week');
    const byeCounts: { [player: string]: number } = {};
    
    // Initialize all players with 0 byes
    activePlayers.forEach(player => {
      byeCounts[player] = 0;
    });
    
    // Count existing byes across all weeks
    this.roundRobinMatches.forEach(match => {
      if (match.player2 === 'Bye' && match.player1 !== 'Bye') {
        byeCounts[match.player1] = (byeCounts[match.player1] || 0) + 1;
      }
    });
    
    // Find players with minimum bye count
    const minByes = Math.min(...Object.values(byeCounts));
    const playersWithMinByes = activePlayers.filter(player => byeCounts[player] === minByes);
    
    // Return random player from those with minimum byes
    return playersWithMinByes[Math.floor(Math.random() * playersWithMinByes.length)];
  }

  // NEW: Get match history for a specific player
  getPlayerMatchHistory(playerName: string): string[] {
    return this.roundRobinMatches
      .filter(m => (m.player1 === playerName || m.player2 === playerName) && m.player2 !== 'Bye')
      .map(m => m.player1 === playerName ? m.player2 : m.player1);
  }

  // NEW: Get opponents a player hasn't faced yet
  getUnplayedOpponents(playerName: string, availablePlayers: string[]): string[] {
    const playedAgainst = this.getPlayerMatchHistory(playerName);
    return availablePlayers.filter(p => 
      p !== playerName && 
      !playedAgainst.includes(p)
    );
  }

  // NEW: Calculate how many times two players have faced each other
  getMatchupCount(player1: string, player2: string): number {
    return this.roundRobinMatches.filter(m => 
      (m.player1 === player1 && m.player2 === player2) ||
      (m.player1 === player2 && m.player2 === player1)
    ).length;
  }

  // NEW: Generate optimal matchups prioritizing unplayed opponents
  generateOptimalMatchups(players: string[]): string[][] {
    const pairs: string[][] = [];
    const availablePlayers = [...players];
    
    // Sort players by how many different opponents they've faced (fewer = higher priority)
    availablePlayers.sort((a, b) => {
      const aOpponents = this.getPlayerMatchHistory(a).length;
      const bOpponents = this.getPlayerMatchHistory(b).length;
      return aOpponents - bOpponents;
    });
    
    while (availablePlayers.length >= 2) {
      const player1 = availablePlayers.shift()!;
      
      // Find the best opponent for player1
      const unplayedOpponents = this.getUnplayedOpponents(player1, availablePlayers);
      
      let opponent: string;
      
      if (unplayedOpponents.length > 0) {
        // Prioritize opponents they haven't faced
        // Among unplayed, choose the one with fewest total matches
        opponent = unplayedOpponents.reduce((best, current) => {
          const bestMatchCount = this.getPlayerMatchHistory(best).length;
          const currentMatchCount = this.getPlayerMatchHistory(current).length;
          return currentMatchCount < bestMatchCount ? current : best;
        });
      } else {
        // If all available players have been faced, choose the one faced least
        opponent = availablePlayers.reduce((best, current) => {
          const bestMatchupCount = this.getMatchupCount(player1, best);
          const currentMatchupCount = this.getMatchupCount(player1, current);
          return currentMatchupCount < bestMatchupCount ? current : best;
        });
      }
      
      // Remove the chosen opponent from available players
      const opponentIndex = availablePlayers.indexOf(opponent);
      availablePlayers.splice(opponentIndex, 1);
      
      pairs.push([player1, opponent]);
    }
    
    return pairs;
  }

  // NEW: Helper method for ordinal numbers (1st, 2nd, 3rd, etc.)
  getOrdinalSuffix(num: number): string {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const value = num % 100;
    return suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0];
  }

  // NEW: Show matchup statistics
  openStatsModal() {
    const activePlayers = this.players.filter(p => p !== 'Bye Week');
    let statsMessage = '=== MATCHUP STATISTICS ===\n\n';
    // For each player, show their opponents and how many times they've played
    activePlayers.forEach(player => {
      const opponents = this.getPlayerMatchHistory(player);
      const uniqueOpponents = [...new Set(opponents)];
      const unplayedOpponents = this.getUnplayedOpponents(player, activePlayers);
      statsMessage += `${player}:\n`;
      statsMessage += `  Total matches: ${opponents.length}\n`;
      statsMessage += `  Unique opponents: ${uniqueOpponents.length}/${activePlayers.length - 1}\n`;
      if (uniqueOpponents.length > 0) {
        statsMessage += `  Played against:\n`;
        uniqueOpponents.forEach(opponent => {
          const matchCount = this.getMatchupCount(player, opponent);
          statsMessage += `    ${opponent}: ${matchCount} time${matchCount > 1 ? 's' : ''}\n`;
        });
      }
      if (unplayedOpponents.length > 0) {
        statsMessage += `  Not yet played: ${unplayedOpponents.join(', ')}\n`;
      }
      statsMessage += '\n';
    });
    // Show overall fairness metrics
    const totalPossibleMatchups = (activePlayers.length * (activePlayers.length - 1)) / 2;
    const actualUniqueMatchups = new Set(
      this.roundRobinMatches
        .filter(m => m.player2 !== 'Bye')
        .map(m => [m.player1, m.player2].sort().join(' vs '))
    ).size;
    statsMessage += `=== FAIRNESS METRICS ===\n`;
    statsMessage += `Unique matchups played: ${actualUniqueMatchups}/${totalPossibleMatchups}\n`;
    statsMessage += `Fairness: ${Math.round((actualUniqueMatchups / totalPossibleMatchups) * 100)}%\n`;
    this.statsMessage = statsMessage;
    this.showStatsModal = true;
  }

  closeStatsModal() {
    this.showStatsModal = false;
    this.statsMessage = '';
  }

  getMatchesForWeek(week: number): Match[] {
    // Get matches from the data service (already subscribed)
    return this.roundRobinMatches.filter(m => m.week === week);
  }

  getMatchupGrid() {
    const weekMatches = this.getMatchesForWeek(this.currentWeek);
    const activePlayers = this.players.filter(p => p !== 'Bye Week');
    const expectedMatchups = Math.floor(activePlayers.length / 2);
    
    // Create array with actual matches and fill with empty slots
    const grid = [];
    
    // Add existing matches
    weekMatches.forEach(match => {
      grid.push({
        player1: match.player1,
        player2: match.player2
      });
    });
    
    // Fill remaining slots with empty matchups
    while (grid.length < expectedMatchups) {
      grid.push({
        player1: '',
        player2: ''
      });
    }
    
    return grid;
  }

  saveMatches() {
    localStorage.setItem('rnd_roundRobinMatches', JSON.stringify(this.roundRobinMatches));
  }

  // NEW: Check if week selection is complete
  isWeekSelectionComplete(week: number): boolean {
    const activePlayers = this.players.filter(p => p !== 'Bye Week');
    if (activePlayers.length === 0) return false;
    
    const weekMatches = this.getMatchesForWeek(week);
    const expectedMatches = Math.floor(activePlayers.length / 2);
    
    // If odd number, add 1 for bye match
    const expectedMatchCount = activePlayers.length % 2 === 1 ? expectedMatches + 1 : expectedMatches;
    
    return weekMatches.length >= expectedMatchCount;
  }

  getWheelPlayers() {
    // Get available players for this week
    const weekMatches = this.getMatchesForWeek(this.currentWeek);
    const assignedPlayers = weekMatches.reduce(function(arr, m) { return arr.concat([m.player1, m.player2]); }, [] as string[]);
    const availablePlayers = this.players.filter(p => !assignedPlayers.includes(p) && p !== 'Bye Week');
    const players = [...availablePlayers];
    
    // If odd number of available players, add the fair bye candidate to the wheel
    if (players.length % 2 === 1) {
      // Check if there are any players who deserve a bye based on fair distribution
      const allActivePlayers = this.players.filter(p => p !== 'Bye Week');
      const playersNeedingBye = this.getPlayersNeedingBye(allActivePlayers, availablePlayers);
      
      if (playersNeedingBye.length > 0) {
        // Add a special "Fair Bye" option that will select the appropriate player
        players.push('Bye');
      } else {
        players.push('Bye');
      }
    }
    return players;
  }
  
  getPlayersNeedingBye(allPlayers: string[], availablePlayers: string[]): string[] {
    // Count bye weeks for all players
    const byeCounts: { [player: string]: number } = {};
    allPlayers.forEach(player => {
      byeCounts[player] = 0;
    });
    
    this.roundRobinMatches.forEach(match => {
      if (match.player2 === 'Bye' && match.player1 !== 'Bye') {
        byeCounts[match.player1] = (byeCounts[match.player1] || 0) + 1;
      }
    });
    
    // Find minimum bye count among available players
    const availableByeCounts = availablePlayers.map(p => byeCounts[p] || 0);
    if (availableByeCounts.length === 0) return [];
    
    const minByes = Math.min(...availableByeCounts);
    return availablePlayers.filter(player => byeCounts[player] === minByes);
  }
  
  getFairByeFromAvailable(availablePlayers: string[]): string {
    // Count bye weeks for available players only
    const byeCounts: { [player: string]: number } = {};
    availablePlayers.forEach(player => {
      byeCounts[player] = 0;
    });
    
    this.roundRobinMatches.forEach(match => {
      if (match.player2 === 'Bye' && match.player1 !== 'Bye' && availablePlayers.includes(match.player1)) {
        byeCounts[match.player1] = (byeCounts[match.player1] || 0) + 1;
      }
    });
    
    // Find players with minimum bye count
    const minByes = Math.min(...Object.values(byeCounts));
    const playersWithMinByes = availablePlayers.filter(player => byeCounts[player] === minByes);
    
    // Return random player from those with minimum byes
    return playersWithMinByes[Math.floor(Math.random() * playersWithMinByes.length)];
  }

  // Add helper methods for week navigation:
  prevWeek() {
    this.currentWeek = this.currentWeek > 1 ? this.currentWeek - 1 : 1;
    this.selectedPlayer = null; // Clear selection when changing weeks
    this.shouldAnimateStatic = false; // Stop static animation
    this.wheelFeedback = ''; // Clear feedback messages
    this.redrawWheelForCurrentWeek(); // Redraw wheel with available players
  }
  
  nextWeek() {
    this.currentWeek = this.currentWeek < this.maxWeeks ? this.currentWeek + 1 : this.maxWeeks;
    this.selectedPlayer = null; // Clear selection when changing weeks
    this.shouldAnimateStatic = false; // Stop static animation
    this.wheelFeedback = ''; // Clear feedback messages
    this.redrawWheelForCurrentWeek(); // Redraw wheel with available players
  }

  redrawWheelForCurrentWeek() {
    // Reset wheel state for new week
    this.selectedPlayer = null;
    this.shouldAnimateStatic = false;
    this.wheelFeedback = '';
    
    const wheelPlayers = this.getWheelPlayers();
    this.drawWheel(wheelPlayers);
  }

  // Load active week from admin panel (localStorage sync)
  loadActiveWeek() {
    const savedWeek = localStorage.getItem('currentActiveWeek');
    if (savedWeek) {
      const week = parseInt(savedWeek);
      if (week >= 1 && week <= this.maxWeeks) {
        this.currentWeek = week;
        this.selectedPlayer = null; // Clear selection
        this.shouldAnimateStatic = false; // Stop static animation
        this.redrawWheelForCurrentWeek();
      }
    }
    
    // Listen for storage changes (when admin updates active week)
    window.addEventListener('storage', (e) => {
      if (e.key === 'currentActiveWeek' && e.newValue) {
        const week = parseInt(e.newValue);
        if (week >= 1 && week <= this.maxWeeks) {
          this.currentWeek = week;
          this.selectedPlayer = null; // Clear selection
          this.shouldAnimateStatic = false; // Stop static animation
          this.wheelFeedback = ''; // Clear feedback messages
          this.redrawWheelForCurrentWeek();
        }
      }
    });
  }
}
