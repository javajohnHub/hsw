import { Component, AfterViewInit, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';

interface Game {
  id: number;
  name: string;
  category?: string;
  isChosen?: boolean;
}

@Component({
  selector: 'app-games-wheel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="games-bg">
      <h1 class="games-title">Available Games: {{ availableGames.length }} | Chosen Games: {{ chosenGames.length }}</h1>
      <div class="games-main-layout">
        <!-- Left Column: Wheel and Available Games -->
        <div class="games-left-column">
          <div class="games-image-wheel-row">
            <div class="games-container">
              <canvas #gamesCanvas (click)="spinGamesWheel()" width="350" height="350" class="games-canvas"></canvas>
            </div>
          </div>
          
          <!-- Available Games in Left Column -->
          <div class="games-panel-compact">
            <h2>Available Games ({{ availableGames.length }})</h2>
            <div class="available-games-compact">
              <div *ngFor="let game of availableGames" class="available-game-compact">
                {{ game.name }}
              </div>
              <div *ngIf="availableGames.length === 0" class="no-games">All games have been chosen!</div>
            </div>
          </div>
        </div>
        
        <!-- Right Column: Selected and Chosen Games -->
        <div class="games-right-column">
          <div class="selected-game animate-pop">
            <h2>Selected Game:</h2>
            <div class="selected-name">{{ selectedGame || 'No selection yet' }}</div>
            <div *ngIf="gamesFeedback" class="games-feedback">{{ gamesFeedback }}</div>
          </div>
          
          <div class="games-panel">
            <h2>Chosen Games</h2>
            <div class="chosen-games-list">
              <div *ngFor="let game of chosenGames" class="chosen-game-item">
                <span class="game-name">{{ game.name }}</span>
                <button (click)="returnGameToWheel(game)" class="return-btn">Return to Wheel</button>
              </div>
              <div *ngIf="chosenGames.length === 0" class="no-games">No games chosen yet</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .games-bg {
      min-height: 100vh;
      background: #181a1b;
      font-family: 'Orbitron', 'Arial Black', Arial, sans-serif;
      color: #fff;
      padding: 20px;
    }
    .games-title {
      text-align: center;
      font-size: 2.5rem;
      font-weight: 900;
      color: #ddd;
      text-shadow: 2px 2px 0 #181a1b, 0 0 12px #53fc19;
      margin: 0 0 16px 0;
    }
    .games-main-layout {
      display: flex;
      gap: 20px;
      max-width: 1400px;
      margin: 0 auto;
      align-items: flex-start;
    }
    .games-left-column {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      max-width: 600px;
    }
    .games-right-column {
      display: flex;
      flex-direction: column;
      flex: 1;
      max-width: 600px;
    }
    .games-image-wheel-row {
      display: flex;
      gap: 20px;
      align-items: center;
      margin-bottom: 16px;
    }
    .games-banner {
      margin-bottom: 0;
    }
    .games-banner {
      margin-bottom: 0;
    }
    .games-img {
      max-width: 400px;
      height: auto;
    }
    .games-container {
      width: 350px;
      height: 350px;
      margin-bottom: 16px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .games-canvas {
      border-radius: 50%;
      box-shadow: 0 0 24px #53fc19, 0 0 32px #181a1b inset;
      background: #fff;
    }
    .games-btn-row {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin: 16px 0;
      flex-wrap: wrap;
    }
    .games-btn {
      background: linear-gradient(135deg, #53fc19, #48e017);
      color: #181a1b;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 900;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(83, 252, 25, 0.3);
    }
    .games-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(83, 252, 25, 0.5);
    }
    .games-btn:disabled {
      background: #333;
      color: #666;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
    .selected-game {
      background: rgba(83, 252, 25, 0.15);
      border: 2px solid #53fc19;
      border-radius: 12px;
      padding: 20px 24px;
      margin: 16px 0;
      text-align: center;
    }
    .selected-game h3 {
      margin: 0 0 8px 0;
      color: #ddd;
      font-size: 1.4rem;
    }
    .selected-game p {
      margin: 0;
      font-size: 1.1rem;
      color: #ddd;
    }
    .games-lists {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }
    .games-section {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 20px;
      border: 1px solid rgba(83, 252, 25, 0.3);
    }
    .games-section h3 {
      margin: 0 0 16px 0;
      color: #ddd;
      font-size: 1.3rem;
      text-align: center;
    }
    .games-list {
      list-style: none;
      padding: 0;
      margin: 0;
      max-height: 400px;
      overflow-y: auto;
    }
    .games-list li {
      padding: 8px 12px;
      margin-bottom: 4px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      font-size: 0.95rem;
      border-left: 3px solid #53fc19;
    }
    .games-img-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .games-wheel-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      left: -200px;
      top: 150px;
    }
    .games-panel {
      background: rgba(24,26,27,0.95);
      border-radius: 18px;
      box-shadow: 0 0 24px #53fc19, 0 0 32px #181a1b inset;
      padding: 20px 24px;
      margin: 16px 0;
      color: #fff;
    }
    .games-panel-compact {
      background: rgba(24,26,27,0.95);
      border-radius: 18px;
      box-shadow: 0 0 24px #53fc19, 0 0 32px #181a1b inset;
      padding: 16px 20px;
      margin: 16px 0;
      color: #fff;
    }
    .chosen-games-list, .available-games-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 12px;
      margin-top: 16px;
    }
    .chosen-game-item, .available-game-item {
      background: rgba(83,252,25,0.1);
      border: 1px solid #53fc19;
      border-radius: 8px;
      padding: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .game-name {
      color: #ddd;
      font-weight: bold;
      flex: 1;
    }
    .return-btn {
      background: #53fc19;
      color: #181a1b;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
    }
    .return-btn:hover {
      background: #45d915;
    }
    .no-games {
      color: #666;
      font-style: italic;
      text-align: center;
      padding: 20px;
      grid-column: 1 / -1;
    }
    .available-games-full-row {
      max-width: 1400px;
      margin: 24px auto 0 auto;
    }
    .games-panel-full {
      background: rgba(24,26,27,0.95);
      border-radius: 18px;
      box-shadow: 0 0 24px #53fc19, 0 0 32px #181a1b inset;
      padding: 24px 32px;
      color: #fff;
    }
    .available-games-compact {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      margin-top: 16px;
    }
    .available-game-compact {
      background: rgba(83,252,25,0.1);
      border: 1px solid #53fc19;
      border-radius: 4px;
      padding: 6px 8px;
      color: #ddd;
      font-weight: bold;
      font-size: 0.8rem;
      text-align: center;
    }
    @media (max-width: 900px) {
      .games-flex {
        flex-direction: column;
        gap: 16px;
      }
      .games-panel { max-width: 98vw; }
      .games-container { width: 98vw; height: 98vw; max-width: 400px; max-height: 400px; }
    }
    /* Responsive adjustments for small screens */
    @media (max-width: 768px) {
      .games-main-layout {
        flex-direction: column;
        align-items: stretch;
      }
      .games-left-column, .games-right-column {
        max-width: 100% !important;
        width: 100% !important;
        flex: none !important;
        margin: 0 auto !important;
      }
      .games-container {
        width: 90vw !important;
        height: 90vw !important;
        max-width: 640px !important;
      }
      .games-canvas {
        width: 100% !important;
        height: auto !important;
        max-width: 640px !important;
      }
      .games-btn-row, .games-btn {
        width: 100% !important;
      }
      .games-btn { display:block; width:100%; box-sizing:border-box; }
      .chosen-games-list, .available-games-compact {
        grid-template-columns: 1fr !important;
      }
      .games-panel, .games-panel-compact { padding: 12px !important; }
    }
  `]
})
export class GamesWheelComponent implements AfterViewInit, OnInit {
  @ViewChild('gamesCanvas', { static: false }) gamesCanvasRef!: ElementRef<HTMLCanvasElement>;

  games: Game[] = [];
  availableGames: Game[] = [];
  chosenGames: Game[] = [];
  selectedGame: string | null = null;
  spinning: boolean = false;
  angle: number = 0;
  gamesFeedback: string = '';
  faviconImg: HTMLImageElement | null = null;

  constructor(private http: HttpClient, private authService: AuthService) {}

  ngOnInit() {
  // Admin access is enforced by AdminGuard; avoid redirecting here to prevent
  // navigation race conditions and allow guard to control access.
  }

  ngAfterViewInit() {
    this.loadFavicon();
    this.loadGames();
    // ensure canvas is sized correctly after view init
    setTimeout(() => this.resizeCanvas(), 50);
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.resizeCanvas();
  }

  resizeCanvas() {
    try {
      const canvas = this.gamesCanvasRef?.nativeElement;
      if (!canvas) return;
      const ratio = window.devicePixelRatio || 1;
  // Prefer the canvas parent container size so the canvas fits its layout box
  const parentRect = (canvas.parentElement && canvas.parentElement.getBoundingClientRect()) || canvas.getBoundingClientRect();
  // cap width to viewport minus some padding to avoid overflow when sidebars exist
  const maxAllowed = Math.max(200, Math.floor(window.innerWidth - 40));
  const w = Math.max(200, Math.min(Math.floor(parentRect.width), maxAllowed));
  const h = Math.max(200, Math.min(Math.floor(parentRect.height || parentRect.width), maxAllowed));
      canvas.width = Math.floor(w * ratio);
      canvas.height = Math.floor(h * ratio);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      // redraw the wheel to keep it crisp
      this.drawGamesWheel();
    } catch (e) {
      console.warn('resizeCanvas error', e);
    }
  }

  loadFavicon() {
    this.faviconImg = new Image();
    this.faviconImg.onload = () => {
      this.drawGamesWheel(); // Redraw once favicon is loaded
    };
    this.faviconImg.src = 'favicon.ico';
  }

  loadGames() {
    this.http.get<Game[]>('http://localhost:4000/games').subscribe({
      next: (data) => {
        console.log('Games loaded:', data);
        if (Array.isArray(data)) {
          this.games = data;
          this.updateGameLists();
          this.drawGamesWheel();
        }
      },
      error: (error) => {
        console.error('Error loading games:', error);
        // Fallback to default games if API fails
        this.games = [
          { id: 1, name: 'Street Fighter 6', category: 'Fighting' },
          { id: 2, name: 'Tekken 8', category: 'Fighting' },
          { id: 3, name: 'Guilty Gear Strive', category: 'Fighting' },
          { id: 4, name: 'Mortal Kombat 1', category: 'Fighting' },
          { id: 5, name: 'Super Smash Bros Ultimate', category: 'Platform Fighter' }
        ];
        this.updateGameLists();
        this.drawGamesWheel();
      }
    });
  }

  updateGameLists() {
    this.availableGames = this.games.filter(g => !g.isChosen);
    this.chosenGames = this.games.filter(g => g.isChosen);
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

  drawGamesWheel() {
  const canvas = (this.gamesCanvasRef && this.gamesCanvasRef.nativeElement) || document.querySelector('canvas.games-canvas') as HTMLCanvasElement;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  // Use CSS layout size for drawing coordinates. resizeCanvas() sets devicePixelRatio transform.
  const rect = canvas.getBoundingClientRect();
  const size = Math.max(0, rect.width);
  const center = size / 2;
  const radius = Math.max(10, center - 10);
    ctx.clearRect(0, 0, size, size);
    
    const gamesToDraw = this.availableGames;
    const n = gamesToDraw.length;
    
    if (n === 0) {
      // Draw empty wheel
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#666';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.textAlign = 'center';
      ctx.font = 'bold 1.5rem Orbitron, Arial';
      ctx.fillStyle = '#fff';
      ctx.fillText('No Games', center, center);
      return;
    }
    
    const angleStep = 2 * Math.PI / n;
    let selectedIdx = this.selectedGame ? gamesToDraw.findIndex(g => g.name === this.selectedGame) : -1;
    
    for (let i = 0; i < n; i++) {
      const startAngle = this.angle + i * angleStep;
      const endAngle = startAngle + angleStep;
      
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();
      
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
      
      // Draw game name with ellipses if too long
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + angleStep / 2);
      ctx.textAlign = 'right';
      ctx.font = 'bold 0.8rem Orbitron, Arial';
      ctx.fillStyle = i === selectedIdx ? '#181a1b' : '#fff';
      ctx.shadowColor = i === selectedIdx ? '#53fc19' : '#181a1b';
      ctx.shadowBlur = i === selectedIdx ? 8 : 4;
      
      const name = gamesToDraw[i].name;
      const maxTextWidth = radius - 25; // Available space for text
      
      if (name.length > 9) {
        // Try to split at word boundaries for games
        const words = name.split(' ');
        if (words.length > 1) {
          const firstLine = words.slice(0, Math.ceil(words.length / 2)).join(' ');
          const secondLine = words.slice(Math.ceil(words.length / 2)).join(' ');
          
          // Truncate each line if needed
          const truncatedFirst = this.truncateText(ctx, firstLine, maxTextWidth);
          const truncatedSecond = this.truncateText(ctx, secondLine, maxTextWidth);
          
          ctx.fillText(truncatedFirst, radius - 18, -4);
          ctx.fillText(truncatedSecond, radius - 18, 12);
        } else {
          // Single word that's too long - truncate with ellipses
          const truncatedName = this.truncateText(ctx, name, maxTextWidth);
          ctx.fillText(truncatedName, radius - 18, 4);
        }
      } else {
        // Single line - check if it needs truncation
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
    ctx.translate(center, 20);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-15, -25);
    ctx.lineTo(-5, -15);
    ctx.lineTo(5, -15);
    ctx.lineTo(15, -25);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#181a1b';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#53fc19';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  spinGamesWheel() {
    if (this.spinning || this.availableGames.length === 0) return;
    
    this.spinning = true;
    this.gamesFeedback = 'Spinning for a game...';
    
    const idx = Math.floor(Math.random() * this.availableGames.length);
    const segmentAngle = 2 * Math.PI / this.availableGames.length;
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
      this.drawGamesWheel();
      
      if (elapsed < duration) {
        requestAnimationFrame(animate);
      } else {
        this.angle = targetAngle % (2 * Math.PI);
        this.drawGamesWheel();
        
        const selectedGame = this.availableGames[idx];
        this.selectedGame = selectedGame.name;
        this.spinning = false;
        
        // Mark game as chosen
        selectedGame.isChosen = true;
        this.updateGameLists();
        
        // Save to backend
        this.http.put(`http://localhost:4000/games/${selectedGame.id}`, selectedGame).subscribe({
          next: () => {
            this.gamesFeedback = `${selectedGame.name} has been chosen!`;
            this.drawGamesWheel(); // Redraw without the chosen game
            setTimeout(() => { this.gamesFeedback = ''; }, 3000);
          },
          error: () => {
            this.gamesFeedback = 'Error saving game selection.';
          }
        });
      }
    };
    
    requestAnimationFrame(animate);
  }

  returnGameToWheel(game: Game) {
    game.isChosen = false;
    this.updateGameLists();
    
    // Save to backend
    this.http.put(`http://localhost:4000/games/${game.id}`, game).subscribe({
      next: () => {
        this.drawGamesWheel();
        this.gamesFeedback = `${game.name} returned to wheel`;
        setTimeout(() => { this.gamesFeedback = ''; }, 2000);
      },
      error: () => {
        this.gamesFeedback = 'Error returning game to wheel.';
      }
    });
  }

  resetChosenGames() {
    if (confirm('Reset all chosen games back to the wheel?')) {
      this.games.forEach(game => game.isChosen = false);
      this.updateGameLists();
      
      // Save all games to backend
      this.http.post('http://localhost:4000/games/reset', {}).subscribe({
        next: () => {
          this.drawGamesWheel();
          this.gamesFeedback = 'All games reset to wheel';
          setTimeout(() => { this.gamesFeedback = ''; }, 2000);
        },
        error: () => {
          this.gamesFeedback = 'Error resetting games.';
        }
      });
    }
  }
}
