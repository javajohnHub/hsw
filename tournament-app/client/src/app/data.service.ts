import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, forkJoin } from 'rxjs';
import { tap, map } from 'rxjs/operators';

export interface Season {
  id: number;
  name: string;
  weeks: number;
  status: 'active' | 'completed' | 'draft';
  startDate?: string;
  endDate?: string;
}

export interface Player {
  id: number;
  name: string;
  wins: number;
  losses: number;
  notPlayed: number;
  points: number;
}

export interface Match {
  id?: number;
  week: number;
  player1: string;
  player2: string;
  winner?: string;
  loser?: string;
  status?: 'scheduled' | 'completed' | 'skipped' | 'dq';
  dqPlayer?: string;
  played?: boolean;
  season?: number; // Season ID for organizing matches
}

export interface Game {
  id: number;
  name: string;
  category: string;
  isChosen: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  // Determine base URL dynamically so the app can run under a subpath like /tournaments
  private readonly baseUrl: string;
  
  // BehaviorSubjects for reactive data
  private playersSubject = new BehaviorSubject<Player[]>([]);
  private matchesSubject = new BehaviorSubject<Match[]>([]);
  private seasonsSubject = new BehaviorSubject<Season[]>([]);
  private gamesSubject = new BehaviorSubject<Game[]>([]);
  
  // Observable streams
  public players$ = this.playersSubject.asObservable();
  public matches$ = this.matchesSubject.asObservable();
  public seasons$ = this.seasonsSubject.asObservable();
  public games$ = this.gamesSubject.asObservable();
  
  constructor(private http: HttpClient) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    // Always hit the backend API namespace; served same-origin by Express
    this.baseUrl = `${origin}/api/tournaments`;
    this.loadAllData();
  }
  
  // Load all data on service initialization
  loadAllData(): Observable<any> {
    return forkJoin({
  players: this.http.get<Player[]>(`${this.baseUrl}/players`, { withCredentials: true }),
  matches: this.http.get<Match[]>(`${this.baseUrl}/matches`, { withCredentials: true }),
  seasons: this.http.get<Season[]>(`${this.baseUrl}/seasons`, { withCredentials: true }),
  games: this.http.get<Game[]>(`${this.baseUrl}/games`, { withCredentials: true })
    }).pipe(
      tap(data => {
        this.playersSubject.next(data.players || []);
        this.matchesSubject.next(data.matches || []);
        this.seasonsSubject.next(data.seasons || []);
        this.gamesSubject.next(data.games || []);
      })
    );
  }
  
  // Players methods
  getPlayers(): Player[] {
    return this.playersSubject.value;
  }
  
  updatePlayer(player: Player): Observable<Player> {
  return this.http.put<Player>(`${this.baseUrl}/players/${player.id}`, player, { withCredentials: true }).pipe(
      tap(() => {
        const players = this.playersSubject.value;
        const index = players.findIndex(p => p.id === player.id);
        if (index !== -1) {
          players[index] = player;
          this.playersSubject.next([...players]);
        }
      })
    );
  }
  
  addPlayer(player: Omit<Player, 'id'>): Observable<Player> {
  return this.http.post<Player>(`${this.baseUrl}/players`, player, { withCredentials: true }).pipe(
      tap(newPlayer => {
        const players = this.playersSubject.value;
        this.playersSubject.next([...players, newPlayer]);
      })
    );
  }
  
  deletePlayer(id: number): Observable<any> {
  return this.http.delete(`${this.baseUrl}/players/${id}`, { withCredentials: true }).pipe(
      tap(() => {
        const players = this.playersSubject.value.filter(p => p.id !== id);
        this.playersSubject.next(players);
      })
    );
  }
  
  // Matches methods
  getMatches(): Match[] {
    return this.matchesSubject.value;
  }
  
  saveMatches(matches: Match[]): Observable<any> {
  return this.http.post(`${this.baseUrl}/matches`, matches, { withCredentials: true }).pipe(
      tap(() => {
        this.matchesSubject.next([...matches]);
      })
    );
  }
  
  updateMatch(match: Match): Observable<any> {
  return this.http.put(`${this.baseUrl}/matches/${match.id}`, match, { withCredentials: true }).pipe(
      tap(() => {
        const matches = this.matchesSubject.value;
        const index = matches.findIndex(m => m.id === match.id);
        if (index !== -1) {
          matches[index] = match;
          this.matchesSubject.next([...matches]);
        }
      })
    );
  }
  
  addMatch(match: Match): Observable<any> {
  return this.http.post(`${this.baseUrl}/matches`, [match], { withCredentials: true }).pipe(
      tap(() => {
        // Reload matches from server to get the updated list with proper IDs
        this.loadMatches();
      })
    );
  }
  
  private loadMatches(): void {
  this.http.get<Match[]>(`${this.baseUrl}/matches`, { withCredentials: true }).subscribe(matches => {
      this.matchesSubject.next(matches || []);
    });
  }
  
  clearMatches(): Observable<any> {
  return this.http.delete(`${this.baseUrl}/matches/all`, { withCredentials: true }).pipe(
      tap(() => {
        this.matchesSubject.next([]);
      })
    );
  }
  
  // Seasons methods
  getSeasons(): Season[] {
    return this.seasonsSubject.value;
  }
  
  getCurrentSeason(): Season | null {
    return this.seasonsSubject.value.find(s => s.status === 'active') || null;
  }
  
  addSeason(season: Omit<Season, 'id'>): Observable<Season> {
  return this.http.post<Season>(`${this.baseUrl}/seasons`, season, { withCredentials: true }).pipe(
      tap(newSeason => {
        const seasons = this.seasonsSubject.value;
        this.seasonsSubject.next([...seasons, newSeason]);
      })
    );
  }
  
  updateSeason(season: Season): Observable<Season> {
  return this.http.put<Season>(`${this.baseUrl}/seasons/${season.id}`, season, { withCredentials: true }).pipe(
      tap(() => {
        const seasons = this.seasonsSubject.value;
        const index = seasons.findIndex(s => s.id === season.id);
        if (index !== -1) {
          seasons[index] = season;
          this.seasonsSubject.next([...seasons]);
        }
      })
    );
  }
  
  deleteSeason(id: number): Observable<any> {
  return this.http.delete(`${this.baseUrl}/seasons/${id}`, { withCredentials: true }).pipe(
      tap(() => {
        const seasons = this.seasonsSubject.value.filter(s => s.id !== id);
        this.seasonsSubject.next(seasons);
      })
    );
  }
  
  // Games methods
  getGames(): Game[] {
    return this.gamesSubject.value;
  }
  
  updateGame(game: Game): Observable<Game> {
  return this.http.put<Game>(`${this.baseUrl}/games/${game.id}`, game, { withCredentials: true }).pipe(
      tap(() => {
        const games = this.gamesSubject.value;
        const index = games.findIndex(g => g.id === game.id);
        if (index !== -1) {
          games[index] = game;
          this.gamesSubject.next([...games]);
        }
      })
    );
  }
  
  addGame(game: Omit<Game, 'id'>): Observable<Game> {
  return this.http.post<Game>(`${this.baseUrl}/games`, game, { withCredentials: true }).pipe(
      tap(newGame => {
        const games = this.gamesSubject.value;
        this.gamesSubject.next([...games, newGame]);
      })
    );
  }
  
  deleteGame(id: number): Observable<any> {
  return this.http.delete(`${this.baseUrl}/games/${id}`, { withCredentials: true }).pipe(
      tap(() => {
        const games = this.gamesSubject.value.filter(g => g.id !== id);
        this.gamesSubject.next(games);
      })
    );
  }
  
  resetGames(): Observable<any> {
  return this.http.post(`${this.baseUrl}/games/reset`, {}, { withCredentials: true }).pipe(
      tap(() => {
        const games = this.gamesSubject.value.map(g => ({ ...g, isChosen: false }));
        this.gamesSubject.next(games);
      })
    );
  }
  
  // Utility method to refresh all data
  refreshData(): Observable<any> {
    return this.loadAllData();
  }
}
