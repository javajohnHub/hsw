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
  category?: string;
  assignedWeek?: number;
  assignedSeason?: number;
}

@Component({
  selector: "app-public-page",
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
  <div class="rnd-bg public-page">
      <div *ngIf="isAdmin" class="admin-banner">
        <span class="admin-pill">Admin</span>
        You are logged in. <a routerLink="/admin">Go to Admin</a>
        <button class="banner-logout" (click)="logout()">Logout</button>
      </div>
  <!-- Debug overlay removed for mobile styles -->
      <div class="rnd-title-card" [class.empty-wheel]="players.length === 0">
        <div class="banner-frame">
          <img src="assets/AddText_08-12-04.51.33.png" alt="Tournament Banner" class="rnd-img animate" />
        </div>
      </div>
      <div class="tab-container">
        <div class="tab-nav">
          <button class="tab-btn" [class.active]="activeTab === 'matchups'" (click)="setActiveTab('matchups')">This Week</button>
          <button class="tab-btn" [class.active]="activeTab === 'standings'" (click)="setActiveTab('standings')">Standings</button>
          <button class="tab-btn" [class.active]="activeTab === 'schedule'" (click)="setActiveTab('schedule')">Full Schedule</button>
        </div>

        <!-- Tab Content -->
        <div class="tab-content">
        
      <!-- Current Week Matchups Tab -->
      <div *ngIf="activeTab === 'matchups'" class="tab-panel">
        <div class="week-header">
          <div class="week-navigation">
            <button (click)="prevWeek()" [disabled]="currentWeek <= 1">
              ← Previous
            </button>
            <h2 class="week-title">
              Week {{ currentWeek }} Matchups
              <span *ngIf="getGameForWeek(currentWeek)" class="game-name">
                - {{ getGameForWeek(currentWeek)?.name }}
              </span>
            </h2>
            <button (click)="nextWeek()" [disabled]="currentWeek >= maxWeeks">
              Next →
            </button>
          </div>
        </div>
        <div *ngIf="!playersLoaded || !matchesLoaded" class="no-matches">
          Loading matchups...
        </div>
        <div *ngIf="playersLoaded && matchesLoaded">
          <div class="matchup-grid" *ngIf="getMatchupGrid().length > 0; else noMatchups">
            <div *ngFor="let matchup of getMatchupGrid()" class="matchup-card">
              <div class="player-slot">
                <span class="player-name">{{ matchup.player1 || "TBD" }}</span>
              </div>
              <div class="vs-divider">VS</div>
              <div class="player-slot">
                <span class="player-name">{{ matchup.player2 || "TBD" }}</span>
              </div>
            </div>
          </div>
          <ng-template #noMatchups>
            <div class="no-matches">No matchups scheduled for this week.</div>
          </ng-template>
        </div>
      </div>

      <!-- Player Standings Tab -->
      <div *ngIf="activeTab === 'standings'" class="tab-panel">
        <h2
          class="section-title"
          style="display: flex; align-items: center; justify-content: center; gap: 10px;"
        >
          Player Standings
          <span class="standings-info-icon" tabindex="0">
            <img src="assets/info.svg" alt="Info" width="22" height="22" />
            <span class="standings-tooltip app-help-tooltip">
              Standings are ranked by points. Hover over a player name for
              detailed stats.
            </span>
          </span>
        </h2>
        <div class="table-container">
          <table class="rnd-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Name</th>
                <th>Wins</th>
                <th>Losses</th>
                <th>Not Played</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let player of getSortedPlayers(); let i = index">
                <td class="rank" data-label="Rank">{{ player.rank }}</td>
                <td class="player-name-cell" data-label="Name">
                  <div class="player-help" tabindex="0"
                       (mouseenter)="showPlayerTooltip($event, player.name)"
                       (mouseleave)="hidePlayerTooltip()"
                       (focusin)="showPlayerTooltip($event, player.name)"
                       (focusout)="hidePlayerTooltip()">
                      <span
                        (click)="openStatsModal(player.name)"
                        class="stats-link"
                        >{{ player.name }}</span>
                    </div>
                </td>
                <td data-label="Wins">{{ player.wins }}</td>
                <td data-label="Losses">{{ player.losses }}</td>
                <td data-label="Not Played">{{ player.notPlayed }}</td>
                <td class="points" data-label="Points">{{ player.points }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Player Stats Modal -->
        <div
          class="stats-modal-backdrop"
          *ngIf="showStatsModal"
          (click)="closeStatsModal()"
        >
          <div class="stats-modal" (click)="$event.stopPropagation()">
            <button
              class="close-modal"
              (click)="closeStatsModal()"
              aria-label="Close"
            >
              ×
            </button>
            <div class="stats-modal-content">
              <h3>Player Matchup Stats</h3>
              <pre>{{ selectedPlayerStats }}</pre>
            </div>
          </div>
        </div>
      </div>

      <!-- Full Schedule Tab -->
      <div *ngIf="activeTab === 'schedule'" class="tab-panel">
        <h2 class="section-title">Tournament Schedule</h2>
  <div class="schedule-container" [class.force-schedule-column]="isMobile">
          <div *ngFor="let week of getWeeksWithMatches()" class="week-block">
            <h3 class="week-block-title">
              Week {{ week.number }}
              <span *ngIf="getGameForWeek(week.number)" class="game-name">
                - {{ getGameForWeek(week.number)?.name }}
              </span>
              <span
                *ngIf="week.number === currentWeek"
                class="current-week-badge"
                >CURRENT</span
              >
            </h3>
            <div class="week-matches">
              <div *ngFor="let match of week.matches" class="schedule-match">
                <div class="match-players">
                  <span class="player1">{{ match.player1 }}</span>
                  <span class="vs">VS</span>
                  <span class="player2">{{ match.player2 }}</span>
                </div>
                <div *ngIf="match.player2 === 'Bye'" class="bye-indicator">
                  BYE WEEK
                </div>
              </div>
              <div *ngIf="week.matches.length === 0" class="no-matches-week">
                No matches scheduled
              </div>
            </div>
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .admin-banner {
        display: flex;
        align-items: center;
        gap: 10px;
        background: rgba(83,252,25,0.12);
        border: 1px solid #53fc19;
        border-radius: 12px;
        padding: 10px 14px;
        margin: 8px auto 16px;
        max-width: 980px;
      }
      .admin-banner a { color: #a8fca1; font-weight: 700; }
      .admin-pill {
        background: #53fc19;
        color: #181a1b;
        border-radius: 999px;
        padding: 4px 10px;
        font-weight: 800;
      }
      .banner-logout {
        margin-left: auto;
        background: #8b0000;
        color: #fff;
        border: 1px solid #a40000;
        padding: 6px 12px;
        border-radius: 8px;
        cursor: pointer;
      }
      /* Global box-sizing to avoid unexpected overflow from padding/margins */
      *, *::before, *::after { box-sizing: border-box; }
      /* Flattened .rnd-bg styles to avoid nested CSS (browsers ignore nested rules) */
      .rnd-bg {
        min-height: 100vh;
        background: #181a1b;
        padding: 20px;
        font-family: "Orbitron", "Arial Black", Arial, sans-serif;
        color: #ddd;
        margin: 0;
        overflow-x: hidden;
      }
      .rnd-bg .stats-link {
        color: #ddd;
        cursor: pointer;
        text-decoration: underline dotted;
        transition: color 0.2s;
        outline: none;
      }
      .rnd-bg .stats-link:hover,
      .rnd-bg .stats-link:focus {
        color: #ddd;
        text-decoration: underline solid;
      }
      .rnd-bg .stats-modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(24, 26, 27, 0.85);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.2s;
      }
      .rnd-bg .stats-modal {
        background: #181a1b;
        border: 2px solid #53fc19;
        border-radius: 16px;
        box-shadow: 0 0 32px #53fc19, 0 0 32px #181a1b inset;
        padding: 32px 28px 24px 28px;
        min-width: 320px;
        max-width: 90vw;
        color: #ddd;
        position: relative;
        animation: popIn 0.3s;
      }
      .rnd-bg .stats-modal-content h3 {
        color: #ddd;
        margin-top: 0;
        margin-bottom: 12px;
        text-align: center;
      }
      .rnd-bg .stats-modal-content pre {
        background: none;
        color: #ddd;
        font-size: 1.05rem;
        white-space: pre-wrap;
        word-break: break-word;
        margin: 0;
        text-align: left;
      }
      .rnd-bg .close-modal {
        position: absolute;
        top: 10px;
        right: 16px;
        background: none;
        border: none;
        color: #ddd;
        font-size: 2rem;
        cursor: pointer;
        transition: color 0.2s;
        z-index: 10;
      }
      .rnd-bg .close-modal:hover { color: #ddd; }
      .rnd-bg .standings-info-icon {
        position: relative;
        display: inline-flex;
        align-items: center;
        cursor: pointer;
      }
      .rnd-bg .standings-info-icon img { filter: drop-shadow(0 0 4px #53fc19); transition: transform 0.2s; }
      .rnd-bg .standings-info-icon:hover img,
      .rnd-bg .standings-info-icon:focus img { transform: scale(1.15); }
      .rnd-bg .standings-tooltip {
        display: none;
        position: absolute;
        left: 110%;
        top: 50%;
        transform: translateY(-50%);
        z-index: 2147483647;
        white-space: pre-line;
        line-height: 1.35;
  font-size: 12px;
  max-width: min(90vw, 340px);
  padding: 6px 8px;
      }
      .rnd-bg .standings-info-icon:hover .standings-tooltip,
      .rnd-bg .standings-info-icon:focus .standings-tooltip,
      .rnd-bg .standings-info-icon:focus-within .standings-tooltip { display: block; }
      .rnd-bg .standings-tooltip::after {
        content: "";
        position: absolute;
        top: 50%;
        left: -6px;
        transform: translateY(-50%);
        width: 0;
        height: 0;
        border-top: 6px solid transparent;
        border-bottom: 6px solid transparent;
        border-right: 6px solid #181a1b;
      }

      .rnd-title-card {
        text-align: center;
        margin: 0 0 12px 0;
        padding: 0;
        background: none;
        overflow: hidden;
      }
      /* Scope the circular title banner to only the public page title card so other headers aren't affected */
      /* Template uses .banner-frame; keep selectors aligned to avoid leaking .logo-frame globally */
      .rnd-title-card .banner-frame {
        width: min(96vw, 1100px);
        /* rectangular, no circular cropping */
        margin: 16px auto 16px auto;
        border-radius: 12px;
        overflow: hidden;
        display: block;
        /* Remove green glow/border for a cleaner edge */
        box-shadow: none;
        border: none;
        background: transparent;
      }
      .rnd-title-card .banner-frame .rnd-img {
        width: 100%;
        height: auto;
        /* Make the title text image larger on desktop */
        max-height: 560px;
        object-fit: contain;
        display: block;
        margin: 0 auto;
        margin-top: -200px;
        margin-bottom: -200px;
        border-radius: 0;
        pointer-events: none;
        transform: none !important;
      }
      .rnd-title-card.empty-wheel .banner-frame .rnd-img {
        transform: none !important;
        object-position: center center;
      }
      /* DEBUG: force project cards full width and make TV overlay highly visible */
      .project-card, .projects-card, .project-item {
        width: 100% !important;
        max-width: none !important;
        margin: 0 auto !important;
      }
      .project-card::before {
        /* TV frame overlay for project cards - non-debug styling */
        content: '';
        display: block;
        position: absolute;
        top: 8px;
        left: 50%;
        transform: translateX(-50%);
        width: 240px;
        height: 240px;
  background-image: url('../assets/TV2.webp');
        background-size: contain;
        background-repeat: no-repeat;
        z-index: 1; /* sit behind the project image */
        pointer-events: none;
        border: none;
        opacity: 0.96;
      }
      .project-card img, .project-card .project-img img, .project-item img {
        position: relative !important;
        z-index: 2 !important; /* ensure images sit above the TV frame */
        width: 60% !important;
        margin: 0 auto !important;
        display: block !important;
        top: 0 !important;
        left: 0 !important;
        transform: none !important;
      }
      .animate {
        animation: popIn 0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55) both;
      }
      @keyframes popIn {
        0% {
          transform: scale(0.7) rotate(-10deg);
          opacity: 0;
        }
        80% {
          transform: scale(1.1) rotate(3deg);
          opacity: 1;
        }
        100% {
          transform: scale(1) rotate(0deg);
        }
      }
      .rnd-date {
        font-size: 1.1rem;
        color: #ddd;
        text-shadow: 0 0 8px #53fc19;
      }

      /* Status Bar */
      .status-bar {
        display: flex;
        justify-content: space-around;
        background: rgba(83, 252, 25, 0.1);
        border: 2px solid #53fc19;
        border-radius: 12px;
        padding: 12px 20px;
        margin: 16px auto;
        max-width: 800px;
        font-size: 0.9rem;
        flex-wrap: wrap;
        gap: 16px;
      }
      .season-info,
      .week-info,
      .season-status {
        color: #ddd;
        text-align: center;
        font-weight: bold;
      }
      .season-info strong,
      .week-info strong,
      .season-status strong {
        color: #ddd;
      }

      /* Tab Styles */
      .tab-container {
        max-width: 1400px;
        margin: 0 auto;
        background: rgba(24, 26, 27, 0.95);
        border-radius: 18px;
        box-shadow: 0 0 24px #53fc19, 0 0 32px #181a1b inset;
        overflow: hidden;
        width: 100%;
        padding: 0 12px;
      }
      .tab-nav {
        display: flex;
        background: rgba(83, 252, 25, 0.1);
        border-bottom: 2px solid #53fc19;
        margin: 0;
        padding: 0;
  position: relative;
  z-index: 50; /* keep tab navigation above other content/overlays */
      }
      .tab-btn {
        flex: 1;
        padding: 16px 24px;
        background: transparent;
        border: none;
        color: #ddd;
        font-size: 1.1rem;
        font-weight: bold;
        font-family: "Orbitron", Arial, sans-serif;
        cursor: pointer;
        transition: all 0.3s ease;
        border-bottom: 3px solid transparent;
        margin: 0;
      }
      /* When there's only one tab (e.g., Public only), make the single button rounded both sides */
      .tab-nav .tab-btn:only-child {
        border-radius: 12px !important;
        padding-left: 20px !important;
        padding-right: 20px !important;
      }
      .tab-btn:hover {
        background: rgba(83, 252, 25, 0.2);
        color: #ddd;
      }
      .tab-btn.active {
        background: rgba(83, 252, 25, 0.3);
        color: #ddd;
        border-bottom-color: #53fc19;
        text-shadow: 0 0 8px #53fc19;
      }
      .tab-content {
        padding: 24px;
        min-height: 400px;
        width: 100%;
      }
      .tab-panel {
        animation: fadeIn 0.3s ease-in-out;
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Week Header */
      .week-header {
        margin-bottom: 24px;
      }
      .week-navigation {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 24px;
        margin-bottom: 16px;
      }
      .week-title {
        font-size: 1.8rem;
        color: #ddd;
        margin: 0;
        text-shadow: 0 0 8px #181a1b;
      }
      .game-name {
        color: #fff !important;
        font-size: 1.2em;
        font-weight: 600;
        text-shadow: 0 0 8px #181a1b;
        opacity: 1;
        display: inline-block;
        margin-left: 8px;
      }
      .week-navigation button {
        background: #53fc19;
        color: #181a1b;
        border: none;
        padding: 10px 20px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
        font-size: 1rem;
        transition: all 0.3s ease;
      }
      .week-navigation button:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(83, 252, 25, 0.3);
      }
      .week-navigation button:disabled {
        background: #666;
        color: #999;
        cursor: not-allowed;
      }

      /* Section Titles */
      .section-title {
        font-size: 1.8rem;
        color: #ddd;
        margin-bottom: 24px;
        text-align: center;
        text-shadow: 0 0 8px #181a1b;
      }

      /* Matchup Grid */
      .matchup-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 28px;
        margin-bottom: 24px;
        width: 100%;
  max-width: 100%;
  box-sizing: border-box;
      }
      .matchup-card {
        background: rgba(83, 252, 25, 0.1);
        border: 2px solid #53fc19;
        border-radius: 12px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        width: 100%;
        align-items: center;
        justify-content: space-between;
        min-height: 100px;
        transition: all 0.3s ease;
        box-sizing: border-box;
        gap: 8px;
      }
      .matchup-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(83, 252, 25, 0.3);
      }
      .player-slot {
        flex: 1;
        text-align: center;
        padding: 8px;
        min-width: 0;
        overflow: hidden;
        max-width: 100%;
      }
      .player-name {
        font-size: 1.1rem;
        font-weight: bold;
        color: #ddd;
        text-shadow: 0 0 4px #181a1b;
        line-height: 1.2;
        hyphens: auto;
        white-space: normal;
        text-align: center;
        max-width: 100%;
        display: block;
        padding: 4px;
      }
      .vs-divider {
        font-size: 1.1rem;
        font-weight: bold;
        background: #53fc19;
        color: #ddd;
        padding: 10px 14px;
        border-radius: 50%;
        box-shadow: 0 0 8px #53fc19;
        flex-shrink: 0;
        margin: 0 8px;
        min-width: 40px;
        text-align: center;
      }

      /* Table Styles */
      .table-container {
        /* Allow visible overflow so tooltips can escape table clipping */
        overflow: visible;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }
      .rnd-table {
        width: 100%;
        border-collapse: collapse;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        overflow: hidden;
      }
      .rnd-table th,
      .rnd-table td {
        padding: 16px 20px;
        text-align: center;
        border-bottom: 1px solid rgba(83, 252, 25, 0.3);
      }
      .rnd-table th {
        background: #53fc19;
        color: #181a1b;
        font-size: 1.1rem;
        font-weight: bold;
        letter-spacing: 1px;
      }
      .rnd-table tr:hover {
        background: rgba(83, 252, 25, 0.1);
      }
      .rank {
        font-weight: bold;
        color: #ddd;
        font-size: 1.2rem;
      }
      .player-name-cell {
        font-weight: bold;
        color: #ddd;
        text-align: left;
        word-wrap: break-word;
        overflow-wrap: break-word;
        word-break: break-word;
        max-width: 200px;
        white-space: normal;
        overflow: visible; /* ensure tooltip can extend outside cell */
      }
      .points {
        font-weight: bold;
        color: #ddd;
        font-size: 1.1rem;
      }
      .player-help {
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        overflow: visible; /* avoid clipping child tooltip */
      }
      .player-help:focus-within .player-tooltip,
      .player-help:hover .player-tooltip {
        display: block;
        opacity: 1;
        transform: translateY(-50%);
      }
      .player-tooltip {
        display: none;
        position: absolute;
        left: calc(100% + 8px);
        top: 50%;
        transform: translateY(-50%);
        /* Very high z-index to guarantee tooltip floats above overlays */
        z-index: 2147483647;
        pointer-events: auto;
        min-width: 220px;
  max-width: 340px;
        /* Preserve newline characters returned by getPlayerMatchStats() so each stat appears on its own line */
        white-space: pre-line;
        line-height: 1.35;
  padding: 6px 8px; /* smaller tooltip padding */
  font-size: 12px; /* smaller tooltip text */
        box-sizing: border-box;
      }
      .player-tooltip::after {
        content: "";
        position: absolute;
        left: -6px;
        top: 50%;
        transform: translateY(-50%);
        width: 0;
        height: 0;
        border-top: 6px solid transparent;
        border-bottom: 6px solid transparent;
        border-right: 6px solid #181a1b; /* arrow matching dark tooltip background */
      }

      /* On narrow screens position tooltip below the name to avoid overflow */
      @media (max-width: 768px) {
        .player-tooltip {
          left: auto;
          right: 0;
          top: calc(100% + 8px);
          transform: none;
        }
        .player-tooltip::after {
          left: auto;
          right: 12px;
          top: -6px;
          transform: none;
          border-right: none;
          border-bottom: 6px solid #181a1b;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
        }
      }

      /* Schedule Grid */
      .schedule-container {
        display: grid;
        /* Show 3 weeks per row in the full schedule view */
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
        margin-top: 20px;
      }
      .week-block {
        background: rgba(83, 252, 25, 0.1);
        border: 2px solid #53fc19;
        border-radius: 12px;
        padding: 16px;
        transition: all 0.3s ease;
      }
      .week-block:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(83, 252, 25, 0.3);
      }
      .week-block-title {
        margin: 0 0 12px 0;
        color: #ddd;
        font-size: 1.2rem;
        text-align: center;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        font-weight: bold;
      }
      .current-week-badge {
        background: #ff6b35;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.7rem;
        font-weight: bold;
        animation: pulse 2s infinite;
      }
      .week-matches {
        /* Stack matches vertically (one per row) and center them — visually match matchup cards */
        display: flex;
        flex-direction: column;
        gap: 12px;
        align-items: center;
        width: 100%;
      }
      .schedule-match {
        background: rgba(83,252,25,0.06);
        border: 2px solid #53fc19;
        border-radius: 12px;
        padding: 12px 14px;
        position: relative;
        width: 100%;
        max-width: 420px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }
      .match-players {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        width: 100%;
      }
      .player1, .player2 {
        display: block;
        width: 100%;
        max-width: 360px;
        background: rgba(24,26,27,0.25);
        color: #ddd;
        padding: 8px 12px;
        border-radius: 8px;
        text-align: center;
        font-weight: 700;
        box-sizing: border-box;
        word-break: break-word;
      }
      .vs {
        background: #53fc19;
        color: #181a1b;
        padding: 8px 14px;
        border-radius: 20px;
        font-size: 0.95rem;
        font-weight: 800;
        box-shadow: 0 0 12px #53fc19;
        display: inline-block;
        margin: 6px 0;
      }
      .bye-indicator {
        text-align: center;
        color: #ffd700;
        font-size: 0.8rem;
        font-weight: bold;
        margin-top: 4px;
      }
      .no-matches-week {
        color: #999;
        font-style: italic;
        text-align: center;
        padding: 16px;
      }

      @media (max-width: 768px) {
        .rnd-bg {
          padding: 16px;
        }
        .tab-container {
          max-width: 100%;
          margin: 0;
        }
        .tab-nav {
          flex-direction: column;
        }
        .tab-content {
          padding: 20px;
        }
        .week-navigation {
          flex-direction: column;
          gap: 12px;
        }
        /* Use single-column matchups on narrow screens to avoid overflow */
        .matchup-grid {
          grid-template-columns: 1fr;
          gap: 16px;
        }
        /* Also collapse the full schedule to one column on mobile */
        .schedule-container {
          grid-template-columns: 1fr !important;
        }
        .matchup-card {
          padding: 12px;
          min-height: 80px;
          gap: 6px;
        }
        .player-slot {
          max-width: 100%;
          padding: 6px;
        }
        .player-name {
          font-size: 0.95rem;
          line-height: 1.1;
        }
        .vs-divider {
          font-size: 1rem;
          padding: 8px 12px;
          margin: 0 6px;
          min-width: 35px;
        }
      }
      .rnd-title {
        font-size: 2.8rem;
        font-weight: 900;
        letter-spacing: 2px;
        color: #ddd;
        text-shadow: 2px 2px 0 #181a1b, 0 0 12px #53fc19;
        margin-bottom: 0.2em;
      }
      .rnd-season {
        font-size: 1.2rem;
        color: #ddd;
        margin-left: 12px;
        text-shadow: 0 0 8px #53fc19;
      }
      .rnd-date {
        font-size: 1.1rem;
        color: #ddd;
        text-shadow: 0 0 8px #53fc19;
      }
      .rnd-panels {
        display: flex;
        flex-direction: column;
        gap: 32px;
        justify-content: center;
        align-items: center;
        margin-bottom: 48px;
      }
      .rnd-panel {
        background: rgba(24, 26, 27, 0.95);
        border-radius: 18px;
        box-shadow: 0 0 24px #53fc19, 0 0 32px #181a1b inset;
        padding: 24px 24px;
        min-width: 0;
        max-width: 720px;
        width: 100%;
        margin-bottom: 24px;
      }
      .rnd-heading {
        font-size: 1.5rem;
        color: #ddd;
        margin-bottom: 18px;
        text-shadow: 0 0 8px #181a1b;
      }
      .rnd-table {
        width: 100%;
        border-collapse: collapse;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 12px;
      }
      .rnd-table th,
      .rnd-table td {
        padding: 12px 16px;
        text-align: center;
        border-bottom: 1px solid #53fc19;
      }
      .rnd-table th {
        background: #53fc19;
        color: #181a1b;
        font-size: 1.1rem;
        letter-spacing: 1px;
      }
      /* Runtime override: when component sets .force-schedule-column (isMobile true)
         force the schedule to stack vertically and make week blocks full-width cards. */
      .schedule-container.force-schedule-column {
        display: block !important;
        width: 100% !important;
        padding: 0 8px !important;
        box-sizing: border-box !important;
      }
      .schedule-container.force-schedule-column .week-block {
        display: block !important;
        width: 95% !important;
        max-width: 520px !important;
        margin: 0 auto 18px auto !important;
        box-sizing: border-box !important;
      }
      .schedule-container.force-schedule-column .week-block .week-matches {
        display: flex !important;
        flex-direction: column !important;
        gap: 10px !important;
        align-items: stretch !important;
        width: 100% !important;
      }
      .schedule-container.force-schedule-column .week-block .week-matches .schedule-match {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
      }
  /* Duplicate matchup-grid/styles removed to preserve the earlier 2-column layout */
      .week-navigation {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 16px;
        margin-top: 16px;
      }
      .week-navigation button {
        background: #53fc19;
        color: #181a1b;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
      }
      .week-navigation button:disabled {
        background: #666;
        color: #999;
        cursor: not-allowed;
      }
      .week-navigation span {
        font-weight: bold;
        color: #ddd;
        font-size: 1.1rem;
      }
      .rnd-match-list {
        margin-top: 24px;
      }
      .rnd-match-list h3 {
        color: #ddd;
        font-size: 1.3rem;
        margin-bottom: 16px;
        font-family: Orbitron, Arial, sans-serif;
      }
      .match-item {
        background: rgba(83, 252, 25, 0.1);
        border: 1px solid #53fc19;
        border-radius: 6px;
        padding: 8px 12px;
        margin-bottom: 8px;
        color: #ddd;
      }
      .no-matches {
        color: #999;
        font-style: italic;
        text-align: center;
        padding: 24px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        border: 1px dashed #666;
      }
      .rnd-table tr:last-child td {
        border-bottom: none;
      }
      .rnd-week {
        margin-bottom: 18px;
      }
      .rnd-week-title {
        font-size: 1.1rem;
        color: #ddd;
        margin-bottom: 6px;
        text-shadow: 0 0 6px #181a1b;
      }
      .rnd-match-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .rnd-match {
        font-size: 1rem;
        color: #ddd;
        background: rgba(83, 252, 25, 0.08);
        border-radius: 6px;
        padding: 4px 10px;
        margin-bottom: 4px;
        display: inline-block;
        box-shadow: 0 0 6px #53fc19;
      }
      .rnd-vs {
        color: #ddd;
        font-weight: bold;
        margin: 0 6px;
        text-shadow: 0 0 4px #181a1b;
      }
      @media (max-width: 900px) {
        .rnd-panels {
          flex-direction: column;
          align-items: center;
        }
        .rnd-panel {
          max-width: 98vw;
        }
      }

      /* Strong mobile overrides to ensure single-column layouts and usable tables/tooltips */
      @media (max-width: 480px) {
        /* Matchups: force single column stack */
        .matchup-grid {
          display: grid !important;
          grid-template-columns: 1fr !important;
          gap: 12px !important;
          width: 100% !important;
        }
        .matchup-card {
          width: 95% !important;
          max-width: 420px !important;
          margin: 0 auto !important;
          padding: 10px !important;
          gap: 6px !important;
        }

        /* Schedule: one week per row */
        .schedule-container {
          display: block !important;
          width: 100% !important;
          padding: 0 6px !important;
        }
        .week-block {
          width: 95% !important;
          max-width: 420px !important;
          margin: 0 auto 16px auto !important;
          padding: 12px !important;
        }

        /* Standings table: allow horizontal scroll and use ellipsis for names */
        .table-container {
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch !important;
          width: 100% !important;
        }
        .rnd-table {
          min-width: auto !important;
          width: 100% !important;
        }
        .player-name-cell {
          max-width: 120px !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }

        /* Tooltips: position below and center relative to viewport on very small screens */
        .player-tooltip {
          left: 50% !important;
          right: auto !important;
          top: calc(100% + 8px) !important;
          transform: translateX(-50%) !important;
          max-width: 90vw !important;
          min-width: auto !important;
        }

        /* Allow a wider banner on small screens and remove any border/shadow */
        .rnd-title-card .banner-frame {
          width: min(96vw, 560px) !important;
          box-shadow: none !important;
          border: none !important;
          background: transparent !important;
        }

        /* Mobile stacked standings cards: convert table rows into vertical cards */
        .table-container .rnd-table thead {
          display: none !important;
        }
        .table-container .rnd-table tbody {
          display: block !important;
          width: 100% !important;
        }
        .table-container .rnd-table tbody tr {
          display: block !important;
          margin: 8px 0 !important;
          background: rgba(24,26,27,0.9) !important;
          border: 1px solid rgba(83,252,25,0.12) !important;
          padding: 12px !important;
          border-radius: 10px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.35) !important;
        }
        .table-container .rnd-table tbody tr td {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          padding: 8px 6px !important;
          border-bottom: none !important;
          width: 100% !important;
        }
        .table-container .rnd-table tbody tr td::before {
          content: attr(data-label) ":";
          font-weight: 700 !important;
          color: #a8fca1 !important;
          margin-right: 8px !important;
          white-space: nowrap !important;
        }
        .table-container .rnd-table tbody tr td.player-name-cell {
          text-align: left !important;
          max-width: 60% !important;
        }
        .table-container .rnd-table tbody tr td.points {
          font-weight: 800 !important;
          color: #fff !important;
        }
      }
      /* Immediately hide any wheel/game UI that may be injected into the public page.
         These stronger overrides ensure the public page never shows the admin 'wheel'
         UI even if a cached bundle or global stylesheet attempts to render it. Keep
         rules tightly scoped under .public-page to avoid affecting other pages. */
      .public-page .wheel-bg,
      .public-page .games-bg,
      .public-page .games-wheel-col,
      .public-page .games-container,
      .public-page .games-main-layout,
      .public-page .games-left-column,
      .public-page .games-right-column,
      .public-page .wheel-container,
      .public-page canvas.wheel-canvas,
      .public-page canvas.games-canvas,
      .public-page app-games-wheel,
      .public-page app-select-matches {
        /* completely collapse and hide any wheel/game elements */
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        width: 0 !important;
        max-height: 0 !important;
        max-width: 0 !important;
        padding: 0 !important;
        margin: 0 !important;
        overflow: hidden !important;
        clip: rect(0 0 0 0) !important;
      }

      /* Extra safety: ensure any canvas that somehow remains is forced square and hidden */
      .public-page canvas {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
        max-width: 0 !important;
        max-height: 0 !important;
        border-radius: 0 !important;
      }

      /* Reset any leaked global .rnd-img rules on the public page by scoping banner
         presentation to the .banner-frame element (prevents other .rnd-img rules from
         pulling the banner out of its container and creating odd overlays). */
      .public-page .rnd-title-card {
        margin-top: 24px !important;
        margin-bottom: 24px !important;
        overflow: visible !important;
      }
      .public-page .rnd-title-card .banner-frame {
        width: min(92vw, 920px) !important;
        margin: 16px auto !important;
        border-radius: 12px !important;
        overflow: hidden !important;
        display: block !important;
      }
      .public-page .rnd-title-card .banner-frame .rnd-img {
        margin: 0 auto !important;
        margin-top: -200px !important;
        margin-bottom:-200px !important;
        width: 100% !important;
        height: auto !important;
        max-height: 600px !important;
        object-fit: contain !important;
        transform: none !important;
        border-radius: 0 !important;
      }
    `,
  ],
})
export class PublicPageComponent implements OnInit, OnDestroy {
  isAdmin = false;
  players: Player[] = [];
  matches: Match[] = [];
  games: Game[] = [];
  playersLoaded: boolean = false;
  matchesLoaded: boolean = false;
  currentWeek: number = 1;
  maxWeeks: number = 14;
  seasonName = "Season 1";
  activeTab: string = "matchups";
  currentSeason: any = null;

  showStatsModal = false;
  selectedPlayerStats = "";
  // Debug helpers removed for production
  isMobile = false;
  private resizeHandler: any = null;
  private fastPollSub: Subscription | null = null;
  private slowPollSub: Subscription | null = null;
  openStatsModal(playerName: string) {
    this.selectedPlayerStats = this.getPlayerMatchStats(playerName);
    this.showStatsModal = true;
  }

  closeStatsModal() {
    this.showStatsModal = false;
    this.selectedPlayerStats = "";
  }

  constructor(private http: HttpClient, private auth: AuthService) {}

  // Tooltip portal node used to escape clipping/stacking contexts
  private tooltipNode: HTMLElement | null = null;
  private tooltipCleanup = () => {};

  showPlayerTooltip(evt: Event, playerName: string) {
    try {
      const content = this.getPlayerMatchStats(playerName);
      this.showTooltipPortal(evt as MouseEvent, content);
    } catch (e) {
      console.warn('Error showing player tooltip', e);
    }
  }

  hidePlayerTooltip() {
    this.removeTooltipPortal();
  }

  private showTooltipPortal(evt: MouseEvent, htmlContent: string) {
  this.removeTooltipPortal();
  const node = document.createElement('div');
    node.className = 'app-help-tooltip player-portal';
    node.style.position = 'fixed';
    node.style.zIndex = '2147483647';
    node.style.pointerEvents = 'auto';
    node.style.whiteSpace = 'pre-line';
  node.style.lineHeight = '1.35';
  node.style.padding = '6px 8px';
  node.style.fontSize = '12px';
    node.style.background = 'linear-gradient(180deg, #0f1111 0%, #181a1b 100%)';
    node.style.border = '1px solid #53fc19';
    node.style.color = '#53fc19';
    node.style.borderRadius = '8px';
    node.innerText = htmlContent;

    document.body.appendChild(node);
    this.tooltipNode = node;

  // find a stable target element to attach leave listeners to (closest .player-help)
  const targetEl = (evt.target as HTMLElement).closest('.player-help') as HTMLElement | null;

  const place = (e: MouseEvent) => {
      if (!this.tooltipNode) return;
      const pad = 8;
      const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
      const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      // default to placing to the right, but flip if outside viewport
      let left = rect.right + pad;
      let top = rect.top + (rect.height / 2) - (this.tooltipNode.offsetHeight / 2);
      if (left + this.tooltipNode.offsetWidth > vw - 12) {
        left = rect.left - pad - this.tooltipNode.offsetWidth;
      }
      if (top < 8) top = 8;
      if (top + this.tooltipNode.offsetHeight > vh - 8) top = Math.max(8, vh - this.tooltipNode.offsetHeight - 8);
      this.tooltipNode.style.left = `${Math.round(left)}px`;
      this.tooltipNode.style.top = `${Math.round(top)}px`;
    };

    // initial placement uses the event target
    place(evt as MouseEvent);

    const onScrollOrResize = () => this.removeTooltipPortal();
    const onDocClick = (ev: MouseEvent) => {
      // if click happens outside tooltip and outside target, remove
      if (!this.tooltipNode) return;
      const clicked = ev.target as Node;
      if (this.tooltipNode.contains(clicked as Node)) return;
      if (targetEl && targetEl.contains(clicked as Node)) return;
      this.removeTooltipPortal();
    };

    const onTargetLeave = (ev?: Event) => this.removeTooltipPortal();

    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    document.addEventListener('click', onDocClick, true);
    if (targetEl) targetEl.addEventListener('mouseleave', onTargetLeave);
    // also remove if mouse leaves the tooltip itself (user moved away)
    node.addEventListener('mouseleave', onTargetLeave);

    // fallback auto-remove in 10s to prevent stuck tooltips
    const autoRemoveTimer = window.setTimeout(() => this.removeTooltipPortal(), 10000);

    this.tooltipCleanup = () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
      document.removeEventListener('click', onDocClick, true);
      if (targetEl) targetEl.removeEventListener('mouseleave', onTargetLeave);
      node.removeEventListener('mouseleave', onTargetLeave);
      clearTimeout(autoRemoveTimer);
    };
  }

  private removeTooltipPortal() {
    try {
      if (this.tooltipNode && this.tooltipNode.parentNode) this.tooltipNode.parentNode.removeChild(this.tooltipNode);
      this.tooltipNode = null;
      this.tooltipCleanup();
      this.tooltipCleanup = () => {};
    } catch (e) {
      console.warn('Error removing tooltip portal', e);
    }
  }

  ngOnInit() {
  // Reflect current admin status for banner
  this.isAdmin = this.auth.isAdminUser();
  this.auth.admin$.subscribe(v => this.isAdmin = v);
    this.loadPlayers();
    this.loadMatches();
    this.loadGames();
    this.loadCurrentSeason();
    this.loadActiveWeek();
    // Setup responsive detection and metrics
    this.detectMobile();
    this.resizeHandler = () => {
      this.detectMobile();
    };
    window.addEventListener('resize', this.resizeHandler);

    // Lightweight polling: keep matchup grid fresh
    // - Fast: matches + active week every 5s
    this.fastPollSub = interval(5000).subscribe(() => {
      this.loadMatches();
      this.loadActiveWeek();
    });
    // - Slow: players/games/seasons every 60s
    this.slowPollSub = interval(60000).subscribe(() => {
      this.loadPlayers();
      this.loadGames();
      this.loadCurrentSeason();
    });
  }

  ngOnDestroy() {
    if (this.resizeHandler) window.removeEventListener('resize', this.resizeHandler);
    if (this.fastPollSub) { this.fastPollSub.unsubscribe(); this.fastPollSub = null; }
    if (this.slowPollSub) { this.slowPollSub.unsubscribe(); this.slowPollSub = null; }
    this.removeTooltipPortal();
  }

  logout() { this.auth.logout(); }

  detectMobile() {
    const w = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    this.isMobile = w <= 480;
  }

  // layout debug collection removed

  loadPlayers() {
    this.http
      .get<Player[]>(`${environment.apiBaseUrl}/players`)
      .subscribe({
        next: (data) => {
          this.players = data || [];
          this.playersLoaded = true;
        },
        error: (err) => {
          console.error('Failed to load players', err);
          this.players = [];
          this.playersLoaded = true;
        }
      });
  }

  loadMatches() {
    this.http
      .get<Match[]>(`${environment.apiBaseUrl}/matches`)
      .subscribe({
        next: (data) => {
          this.matches = data || [];
          this.matchesLoaded = true;
        },
        error: (err) => {
          console.error('Failed to load matches', err);
          this.matches = [];
          this.matchesLoaded = true;
        }
      });
  }

  loadGames() {
    this.http
      .get<Game[]>(`${environment.apiBaseUrl}/games`)
      .subscribe((data) => {
        this.games = data || [];
      });
  }

  loadCurrentSeason() {
    this.http
      .get<any[]>(`${environment.apiBaseUrl}/seasons`)
      .subscribe((seasons) => {
        const activeSeason = seasons.find((s) => s.status === "active");
        if (activeSeason) {
          this.currentSeason = activeSeason;
          this.maxWeeks = activeSeason.weeks;
          this.seasonName = activeSeason.name;
        }
      });
  }

  loadActiveWeek() {
    // Try server first, fall back to localStorage
    this.http
      .get<{ week: number }>(`${environment.apiBaseUrl}/active-week`)
      .subscribe({
        next: (data) => {
          if (data && typeof data.week === "number") {
            this.currentWeek = data.week;
          }
        },
        error: () => {
          const saved = localStorage.getItem("currentActiveWeek");
          if (saved) this.currentWeek = parseInt(saved, 10);
        },
      });
  }

  getMatchupGrid() {
    const weekMatches = this.matches.filter((m) => m.week === this.currentWeek);
    const activePlayers = this.players.filter((p) => p.name !== "Bye Week");
    const expectedMatchups = Math.floor(activePlayers.length / 2);

    // Create array with actual matches and fill with empty slots
    const grid = [];

    // Add existing matches
    weekMatches.forEach((match) => {
      grid.push({
        player1: match.player1,
        player2: match.player2,
      });
    });

    // Fill remaining slots with empty matchups
    while (grid.length < expectedMatchups) {
      grid.push({
        player1: "",
        player2: "",
      });
    }

    return grid;
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

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  getSortedPlayersWithTieHandling() {
    console.log('=== RANKING DEBUG START ===');
    console.log('Raw players data:', this.players);
    
    const sortedPlayers = [...this.players]
      .sort((a, b) => (b.points || 0) - (a.points || 0));
    
    console.log('Sorted players by points:', sortedPlayers.map(p => ({name: p.name, points: p.points})));
    
    const result = [];
    let currentRank = 1;
    
    for (let i = 0; i < sortedPlayers.length; i++) {
      const player = sortedPlayers[i];
      const currentPoints = player.points || 0;
      
      console.log(`Processing player ${i}: ${player.name}, points: ${currentPoints} (type: ${typeof currentPoints})`);
      
      // If this is not the first player, check if points are different from previous
      if (i > 0) {
        const previousPoints = sortedPlayers[i - 1].points || 0;
        console.log(`  Comparing with previous: ${previousPoints} (type: ${typeof previousPoints})`);
        console.log(`  Points equal? ${currentPoints === previousPoints}`);
        console.log(`  Points NOT equal? ${currentPoints !== previousPoints}`);
        
        if (currentPoints !== previousPoints) {
          console.log(`  RANK CHANGE: ${currentRank} -> ${i + 1}`);
          currentRank = i + 1;
        } else {
          console.log(`  RANK STAYS: ${currentRank}`);
        }
      }
      
      const playerWithRank = {
        ...player,
        rank: currentRank
      };
      
      console.log(`  Final: ${player.name} gets rank ${currentRank}`);
      result.push(playerWithRank);
    }
    
    console.log('Final result:', result.map(p => ({name: p.name, points: p.points, rank: p.rank})));
    console.log('=== RANKING DEBUG END ===');
    
    return result;
  }

  // Keep old method for compatibility but make it call the new one
  getSortedPlayers() {
    return this.getSortedPlayersWithTieHandling();
  }

  getWeeksWithMatches() {
    const weeks: any[] = [];
    for (let week = 1; week <= this.maxWeeks; week++) {
      const weekMatches = this.matches.filter((match) => match.week === week);
      weeks.push({
        number: week,
        matches: weekMatches,
      });
    }
    return weeks;
  }

  getPlayerMatchStats(playerName: string): string {
    const playerMatches = this.matches.filter(
      (match) => match.player1 === playerName || match.player2 === playerName
    );

    const totalMatches = playerMatches.length;

    // Get player stats from the players array for wins/losses
    const player = this.players.find((p) => p.name === playerName);
    const wins = player?.wins || 0;
    const losses = player?.losses || 0;
    const notPlayed = player?.notPlayed || 0;
    const points = player?.points || 0;

    const playedMatches = wins + losses;
    const upcomingMatches = totalMatches - playedMatches;
    const winRate =
      playedMatches > 0 ? ((wins / playedMatches) * 100).toFixed(1) : "0.0";

    // Get matchup details
    const opponents = playerMatches
      .map((match) =>
        match.player1 === playerName ? match.player2 : match.player1
      )
      .filter((opponent) => opponent !== "Bye Week");

    return `📊 Match Statistics for ${playerName}
    
🎮 Total Scheduled: ${totalMatches}
✅ Matches Played: ${playedMatches}
⏳ Remaining: ${upcomingMatches}
🏆 Wins: ${wins}
💔 Losses: ${losses}
📈 Win Rate: ${winRate}%
⭐ Points: ${points}
👥 Opponents: ${opponents.slice(0, 3).join(", ")}${
      opponents.length > 3 ? "..." : ""
    }`;
  }

  getGameForWeek(week: number): Game | null {
    if (!this.currentSeason) return null;
    
    return this.games.find(game => 
      game.assignedWeek === week && 
      game.assignedSeason === this.currentSeason.id
    ) || null;
  }
}
