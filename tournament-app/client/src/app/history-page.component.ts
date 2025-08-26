import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-history-page',
  template: `
    <div class="history-area">
      <h1 class="history-title">Season History</h1>
      <div *ngFor="let season of seasons" class="season-block">
        <h2>Season {{ season.season }} ({{ season.weeks }} weeks)</h2>
        <h3>Players</h3>
        <table class="players-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Wins</th>
              <th>Losses</th>
              <th>Not Played</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let player of season.players">
              <td>{{ player.name }}</td>
              <td>{{ player.wins }}</td>
              <td>{{ player.losses }}</td>
              <td>{{ player.notPlayed }}</td>
              <td>{{ player.points }}</td>
            </tr>
          </tbody>
        </table>
        <h3>Matches</h3>
        <ul class="matches-list">
          <li *ngFor="let match of season.matches">
            <span class="match-week">Week {{ match.week }}:</span>
            <span class="match-pair">{{ match.player1 }} <span class="vs">vs</span> {{ match.player2 }}</span>
          </li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .history-area { background: #181a1b; color: #fff; padding: 32px; min-height: 100vh; }
    .history-title { color: #53fc19; font-size: 2.2rem; margin-bottom: 18px; font-family: Orbitron, Arial, sans-serif; }
    .season-block { background: #222; border-radius: 18px; box-shadow: 0 0 24px #53fc19, 0 0 32px #181a1b inset; padding: 24px 32px; margin-bottom: 32px; }
    .players-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    .players-table th, .players-table td { border: 1px solid #53fc19; padding: 6px 10px; text-align: left; font-size: 1rem; }
    .players-table th { background: #53fc19; color: #181a1b; font-family: Orbitron, Arial, sans-serif; }
    .matches-list { list-style: none; padding: 0; margin: 0; }
    .match-week { color: #53fc19; font-weight: bold; margin-right: 8px; }
    .match-pair { color: #fff; }
    .vs { color: #53fc19; font-weight: bold; margin: 0 6px; text-shadow: 0 0 4px #181a1b; }
    @media (max-width: 900px) { .season-block { max-width: 98vw; } }
  `]
})
export class HistoryPageComponent implements OnInit {
  seasons: any[] = [];
  constructor(private http: HttpClient) {}
  ngOnInit() {
    this.http.get<any[]>('http://localhost:4000/seasons').subscribe(data => {
      this.seasons = data;
    });
  }
}
