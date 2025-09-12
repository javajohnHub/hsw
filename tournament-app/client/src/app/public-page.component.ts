import { Component, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HttpClient } from "@angular/common/http";
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
}

@Component({
  selector: "app-public-page",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './public-page.component.html',
  styleUrls: ['./public-page.component.scss']
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
  
  // Track players whose images failed to load
  private imageErrors = new Set<string>();
  
  // Tooltip state
  currentTooltip = {
    visible: false,
    playerName: '',
    content: ''
  };
  
  private authSubscription?: Subscription;
  private weekCheckSubscription?: Subscription;

  constructor(
    private http: HttpClient,
    private authService: AuthService
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

    // Handle window resize
    window.addEventListener('resize', () => this.checkMobile());
  }

  ngOnDestroy() {
    this.authSubscription?.unsubscribe();
    this.weekCheckSubscription?.unsubscribe();
    window.removeEventListener('resize', () => this.checkMobile());
  }

  checkMobile() {
    this.isMobile = window.innerWidth <= 768;
  }

  loadActiveWeek() {
    this.http.get<{week: number}>(`${environment.apiBaseUrl}/active-week`).subscribe({
      next: (response) => {
        this.currentWeek = response.week;
      },
      error: (error) => {
        console.error('Error loading active week:', error);
      }
    });
  }

  loadPlayers() {
    this.http.get<Player[]>(`${environment.apiBaseUrl}/players`).subscribe({
      next: (players) => {
        this.players = players;
        this.playersLoaded = true;
      },
      error: (error) => {
        console.error('Error loading players:', error);
        this.playersLoaded = true;
      }
    });
  }

  loadMatches() {
    this.http.get<Match[]>(`${environment.apiBaseUrl}/matches`).subscribe({
      next: (matches) => {
        this.matches = matches;
        this.matchesLoaded = true;
      },
      error: (error) => {
        console.error('Error loading matches:', error);
        this.matchesLoaded = true;
      }
    });
  }

  loadGames() {
    this.http.get<Game[]>(`${environment.apiBaseUrl}/games`).subscribe({
      next: (games) => {
        this.games = games;
        this.gamesLoaded = true;
      },
      error: (error) => {
        console.error('Error loading games:', error);
        this.gamesLoaded = true;
      }
    });
  }

  getMatchupGrid() {
    const weekMatches = this.matches.filter(match => match.week === this.currentWeek);
    return weekMatches.map(match => ({
      player1: match.player1,
      player2: match.player2
    }));
  }

  getGameForWeek(week: number): Game | undefined {
    return this.games.find(game => game.week === week);
  }

  getSortedPlayers() {
    return [...this.players].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (a.losses !== b.losses) return a.losses - b.losses;
      return a.name.localeCompare(b.name); // Alphabetical sort for ties
    });
  }

  getPlayerRank(player: Player): number {
    const sortedPlayers = this.getSortedPlayers();
    let rank = 1;
    
    for (let i = 0; i < sortedPlayers.length; i++) {
      if (i > 0) {
        const current = sortedPlayers[i];
        const previous = sortedPlayers[i - 1];
        
        // If current player doesn't have same stats as previous, update rank
        if (current.points !== previous.points || 
            current.wins !== previous.wins || 
            current.losses !== previous.losses) {
          rank = i + 1;
        }
      }
      
      if (sortedPlayers[i] === player) {
        return rank;
      }
    }
    
    return rank;
  }

  getWeeksWithMatches(): ScheduleWeek[] {
    const weeks: ScheduleWeek[] = [];
    for (let i = 1; i <= this.maxWeeks; i++) {
      const weekMatches = this.matches.filter(match => match.week === i);
      weeks.push({ number: i, matches: weekMatches });
    }
    return weeks;
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

  showPlayerTooltip(event: any, playerName: string) {
    const stats = this.getPlayerMatchStats(playerName);
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
}
