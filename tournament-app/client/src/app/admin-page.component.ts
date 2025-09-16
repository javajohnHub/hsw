import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { environment } from '../environments/environment';
import { AuthService } from './auth.service';

interface Season {
  id: number;
  name: string;
  weeks: number;
  status: "active" | "completed" | "draft";
  startDate?: string;
  endDate?: string;
}

interface Player {
  id: number;
  name: string;
  wins: number;
  losses: number;
  notPlayed: number;
  points: number;
  imageUrl: string;
}

interface Match {
  id?: number;
  week: number;
  season?: number; // Season ID for organizing matches
  player1: string;
  player2: string;
  score1?: number;
  score2?: number;
  winner?: string;
  loser?: string;
  status?: "scheduled" | "completed" | "skipped" | "dq";
  dqPlayer?: string; // Player who was disqualified
  played?: boolean;
}

interface Game {
  id: number;
  name: string;
  category?: string;
  isChosen?: boolean;
  image?: string;
  assignedWeek?: number;
  assignedSeason?: number;
}

@Component({
  selector: "app-admin-page",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-area">
      <h1 class="admin-title">Admin Area</h1>
      <p class="admin-desc">
        Edit player names, match results, points, and manage seasons here.
      </p>

      <!-- Tab Navigation -->
      <div class="admin-tabs">
        <button
          *ngIf="isAdmin"
          (click)="setActiveTab('overview')"
          [class.active]="activeTab === 'overview'"
          class="tab-btn"
        >
          Overview
        </button>
        <button
          *ngIf="isAdmin"
          (click)="setActiveTab('players')"
          [class.active]="activeTab === 'players'"
          class="tab-btn"
        >
          Players
        </button>
        <button
          *ngIf="isAdmin"
          (click)="setActiveTab('matches')"
          [class.active]="activeTab === 'matches'"
          class="tab-btn"
        >
          Matches
        </button>
        <button
          *ngIf="isAdmin"
          (click)="setActiveTab('seasons')"
          [class.active]="activeTab === 'seasons'"
          class="tab-btn"
        >
          Seasons
        </button>
        <button
          *ngIf="isAdmin"
          (click)="setActiveTab('games')"
          [class.active]="activeTab === 'games'"
          class="tab-btn"
        >
          Games
        </button>
      </div>

      <!-- Overview Tab -->
      <div *ngIf="activeTab === 'overview'" class="tab-content">
        <div class="admin-actions">
          <button
            (click)="clearLocalStorage()"
            class="action-btn clear-btn"
            title="Remove all tournament data including matches, games, and seasons. This action cannot be undone."
          >
            Clear All Data
          </button>
          <button
            (click)="downloadDataZip()"
            class="action-btn download-btn"
            title="Download all tournament data as a zip archive."
          >
            Download Data
          </button>
          <form (submit)="restoreDataZip($event)" class="restore-form" enctype="multipart/form-data">
            <input type="file" accept=".zip" (change)="onZipFileSelected($event)" />
            <button type="submit" class="action-btn restore-btn" [disabled]="!selectedZipFile">Restore Data</button>
          </form>
        </div>

        <div class="overview-stats">
          <div class="stat-card">
            <h3>Players</h3>
            <div class="stat-number">{{ players.length }}</div>
          </div>
          <div class="stat-card">
            <h3>Active Matches</h3>
            <div class="stat-number">{{ getActiveMatchesCount() }}</div>
          </div>
          <div class="stat-card">
            <h3>Current Season</h3>
            <div class="stat-text">{{ currentSeason?.name || "None" }}</div>
          </div>
          <div class="stat-card">
            <h3>Available Games</h3>
            <div class="stat-number">{{ getAvailableGamesCount() }}</div>
          </div>
        </div>
      </div>

      <!-- Season Management Tab -->
      <div *ngIf="activeTab === 'seasons'" class="tab-content">
        <h2 class="panel-title">Season Management</h2>
        <div class="season-controls">
          <div class="season-subtabs">
            <button
              class="subtab-btn"
              [class.active]="seasonsTab === 'current'"
              (click)="seasonsTab = 'current'"
            >
              Current Season
            </button>
            <button
              class="subtab-btn"
              [class.active]="seasonsTab === 'history'"
              (click)="seasonsTab = 'history'"
            >
              Season History
            </button>
          </div>
          <div *ngIf="seasonsTab === 'current'">
            <div class="season-form">
              <input [(ngModel)]="newSeasonName" placeholder="Season Name" />
              <input
                [(ngModel)]="newSeasonWeeks"
                type="number"
                min="1"
                max="20"
                placeholder="Weeks"
              />
              <button (click)="createSeason()">Create Season</button>
            </div>
            <div *ngIf="currentSeason" class="current-season">
              <h3>Current Season: {{ currentSeason.name }}</h3>
              <p>
                Weeks: {{ currentSeason.weeks }} | Status:
                {{ currentSeason.status }}
              </p>

              <!-- Week Management -->
              <div class="week-management">
                <h4>Week Management</h4>
                <div class="week-controls">
                  <label>Active Week:</label>
                  <select
                    [(ngModel)]="currentActiveWeek"
                    (ngModelChange)="setActiveWeek($event)"
                    class="week-select"
                  >
                    <option *ngFor="let week of getWeekOptions()" [ngValue]="week">Week {{ week }}</option>
                  </select>
                  <span class="current-week-display"
                    >Currently showing: Week {{ currentActiveWeek }}</span
                  >
                </div>
              </div>

              <button
                class="generate-btn"
                (click)="generateRoundRobinForSeason()"
                [disabled]="generatingMatches"
              >
                <span *ngIf="!generatingMatches">Generate All Matches</span>
                <span *ngIf="generatingMatches" class="loader"
                  >Generating...</span
                >
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        class="admin-panel"
        *ngIf="activeTab === 'seasons' && seasonsTab === 'history'"
      >
        <h2 class="panel-title">Season History</h2>
        <ul class="seasons-list">
          <li *ngFor="let season of seasons">
            <span
              >{{ season.name }} ({{ season.weeks }} weeks) -
              {{ season.status }}</span
            >
            <button
              *ngIf="season.status !== 'active'"
              (click)="activateSeason(season)"
              class="activate-btn"
            >
              Activate
            </button>
            <button (click)="deleteSeason(season.id)" class="delete-btn">
              Delete
            </button>
          </li>
        </ul>
      </div>

    <!-- Players Tab -->
    <div *ngIf="activeTab === 'players'" class="tab-content">
      <div class="admin-panel players-panel">
        <h2 class="panel-title">Players ({{ players.length }} found)</h2>
        <div class="players-display">
          <div *ngFor="let player of players" class="player-item">
            <div *ngIf="editingPlayer?.id !== player.id" class="player-info">
              <div class="admin-player-display">
                <div class="admin-player-details">
                  <span class="player-name">{{ player.name }}</span>
                  <span class="player-stats"
                    >W: {{ player.wins }} | L: {{ player.losses }} | P:
                    {{ player.points }}</span
                  >
                </div>
              </div>
            </div>
            <div *ngIf="editingPlayer?.id !== player.id" class="player-actions">
              <button (click)="startEditPlayer(player)" class="edit-btn">
                Edit
              </button>
              <button (click)="deletePlayer(player.id)" class="delete-btn">
                Delete
              </button>
            </div>
            <div *ngIf="editingPlayer?.id === player.id" class="player-edit">
              <input
                [(ngModel)]="editPlayerName"
                placeholder="Player name"
                class="edit-input"
              />
              <input
                [(ngModel)]="editPlayerWins"
                type="number"
                placeholder="Wins"
                class="edit-input-small"
              />
              <input
                [(ngModel)]="editPlayerLosses"
                type="number"
                placeholder="Losses"
                class="edit-input-small"
              />
              <input
                [(ngModel)]="editPlayerPoints"
                type="number"
                placeholder="Total Points"
                class="edit-input-small"
              />
              <button (click)="saveEditedPlayer()" class="save-btn">
                Save
              </button>
              <button (click)="cancelEdit()" class="cancel-btn">Cancel</button>
            </div>
          </div>
          <div class="add-player">
            <input [(ngModel)]="newPlayerName" placeholder="New player name" />
            <input
              [(ngModel)]="newPlayerWins"
              type="number"
              placeholder="Wins"
            />
            <input
              [(ngModel)]="newPlayerLosses"
              type="number"
              placeholder="Losses"
            />
            <input
              [(ngModel)]="newPlayerNotPlayed"
              type="number"
              placeholder="Not Played"
            />
            <input [(ngModel)]="newPlayerImageUrl" placeholder="Image URL (optional)" />
            <button (click)="addPlayer()">Add Player</button>
          </div>
          <div class="admin-actions">
            <button
              (click)="resetAllPlayerScores()"
              class="reset-btn danger-btn"
            >
              Reset All Player Scores
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Matches Tab -->
    <div *ngIf="activeTab === 'matches'" class="tab-content">
      <div class="admin-panel">
        <h2 class="panel-title">Match Management</h2>

        <!-- Filters and Navigation -->
        <div class="match-filters">
          <h3>Filter Matches</h3>
          <div class="filter-controls">
            <div class="filter-group">
              <label>Season:</label>
              <div class="filter-with-help">
                <select
                  [(ngModel)]="selectedSeasonFilter"
                  (ngModelChange)="setSeasonFilter($event)"
                  class="filter-select"
                  aria-label="Season filter"
                  title="Filter matches by season (choose 'All Seasons' to show every season)"
                >
                  <option [ngValue]="null">All Seasons</option>
                  <option
                    *ngFor="let season of getAvailableSeasons()"
                    [value]="season.id"
                  >
                    {{ season.name }} ({{ season.status }})
                  </option>
                </select>
                <span
                  class="help-icon"
                  tabindex="0"
                  aria-label="Season filter help"
                  title="Select a specific season to only show matches from that season. Choose 'All Seasons' to see every season's matches."
                  >?</span
                >
                <div class="help-tooltip app-help-tooltip">
                  Select a season to filter matches. Choose "All Seasons" to
                  disable season filtering.
                </div>
              </div>
            </div>

            <div class="filter-group">
              <label>Week:</label>
              <div class="filter-with-help">
                <select
                  [(ngModel)]="selectedWeekFilter"
                  (ngModelChange)="setWeekFilter($event)"
                  class="filter-select"
                  aria-label="Week filter"
                  title="Filter matches by week (choose 'All Weeks' to show every week)"
                >
                  <option [ngValue]="null">All Weeks</option>
                  <option
                    *ngFor="let week of getAvailableWeeks()"
                    [value]="week"
                  >
                    Week {{ week }}
                  </option>
                </select>
                <span
                  class="help-icon"
                  tabindex="0"
                  aria-label="Week filter help"
                  title="Pick a specific week to show only matches scheduled for that week. Use 'All Weeks' to show all weeks."
                  >?</span
                >
                <div class="help-tooltip app-help-tooltip">
                  Choose a week to narrow displayed matches to that week only.
                </div>
              </div>
            </div>

            <div class="filter-with-help">
              <button
                (click)="clearFilters()"
                class="clear-filters-btn"
                title="Reset season and week filters to show default view"
              >
                Clear Filters
              </button>
              <span
                class="help-icon"
                tabindex="0"
                aria-label="Clear filters help"
                title="Clears current season and week filters. Useful to return to the full match list."
                >?</span
              >
              <div class="help-tooltip app-help-tooltip">
                Click to clear both Season and Week filters and show the default
                match list.
              </div>
            </div>
          </div>

          <div class="filter-summary">
            <span *ngIf="selectedSeasonFilter" class="filter-tag">
              Season: {{ getSelectedSeasonName() }}
            </span>
            <span *ngIf="selectedWeekFilter" class="filter-tag">
              Week: {{ selectedWeekFilter }}
            </span>
            <span class="match-count">
              Showing {{ getMatchesForCurrentView().length }} matches
            </span>
          </div>
        </div>

        <!-- Manual Matchup Entry -->
        <div class="manual-matchup">
          <h3>Add Manual Matchup</h3>
          <div *ngIf="currentSeason" class="current-season-info">
            Adding to: <strong>{{ currentSeason.name }}</strong> (Week
            {{ manualMatchWeek }})
          </div>
          <div class="manual-form">
            <select [(ngModel)]="manualMatchWeek" class="week-select">
              <option *ngFor="let week of getWeekOptions()" [ngValue]="week">Week {{ week }}</option>
            </select>
            <select [(ngModel)]="manualMatchPlayer1" class="player-select">
              <option value="">Select Player 1</option>
              <option value="Bye Week">Bye Week</option>
              <option *ngFor="let player of players" [value]="player.name">
                {{ player.name }}
              </option>
            </select>
            <span class="vs-text">VS</span>
            <select [(ngModel)]="manualMatchPlayer2" class="player-select">
              <option value="">Select Player 2</option>
              <option value="Bye Week">Bye Week</option>
              <option *ngFor="let player of players" [value]="player.name">
                {{ player.name }}
              </option>
            </select>
            <button
              (click)="addManualMatchup()"
              class="add-match-btn"
              [disabled]="!canAddManualMatch()"
            >
              Add Match
            </button>
          </div>
        </div>

        <div class="matches-list">
          <div
            *ngFor="let match of getMatchesForCurrentView()"
            class="match-item"
          >
            <div class="match-header">
              <span class="match-week">Week {{ match.week }}:</span>
              <span class="match-game" *ngIf="getGameForWeek(match.week, match.season)">
                {{ getGameForWeek(match.week, match.season)?.name }}
              </span>
              <span class="match-pair"
                >{{ match.player1 }} <span class="vs">vs</span>
                {{ match.player2 }}</span
              >
              <span
                class="match-status"
                [class]="match.status || 'scheduled'"
                >{{ getMatchStatusText(match) }}</span
              >
              <button (click)="deleteMatch(match)" class="delete-match-btn">
                ×
              </button>
            </div>
            <div
              class="match-controls"
              *ngIf="match.status !== 'completed' && match.status !== 'dq'"
            >
              <button
                (click)="setMatchWinner(match, match.player1)"
                class="winner-btn"
              >
                {{ match.player1 }} Wins
              </button>
              <button
                (click)="setMatchWinner(match, match.player2)"
                class="winner-btn"
              >
                {{ match.player2 }} Wins
              </button>
              <button (click)="setMatchSkipped(match)" class="skip-btn">
                Mark as Skipped
              </button>
              <button (click)="setMatchDQ(match, match.player1)" class="dq-btn">
                DQ {{ match.player1 }}
              </button>
              <button (click)="setMatchDQ(match, match.player2)" class="dq-btn">
                DQ {{ match.player2 }}
              </button>
            </div>
            <div class="match-result" *ngIf="match.status === 'completed'">
              <span class="winner">Winner: {{ match.winner }} (+2 pts)</span>
              <span class="loser">Loser: {{ match.loser }} (+1 pt)</span>
              <button (click)="resetMatch(match)" class="reset-btn">
                Reset Match
              </button>
            </div>
            <div class="match-result" *ngIf="match.status === 'dq'">
              <span class="dq-result"
                >{{ match.dqPlayer }} disqualified (0 pts)</span
              >
              <span class="winner">{{ match.winner }} wins by DQ (+2 pts)</span>
              <button (click)="resetMatch(match)" class="reset-btn">
                Reset Match
              </button>
            </div>
          </div>

          <div
            *ngIf="getMatchesForCurrentView().length === 0"
            class="no-matches"
          >
            No matches found for the selected filters.
          </div>
        </div>
      </div>
    </div>

    <!-- Games Tab -->
    <div *ngIf="activeTab === 'games'" class="tab-content">
      <div class="admin-panel full-width">
        <h2 class="panel-title">Game Management</h2>
        <div class="game-controls">
          <div class="add-game">
            <form (ngSubmit)="addGame()" #gameForm="ngForm">
              <input
                [(ngModel)]="newGameName"
                name="gameName"
                placeholder="Game name"
                class="game-input"
                (keyup.enter)="addGame()"
                [disabled]="addingGame"
                required
              />
              <input
                [(ngModel)]="newGameCategory"
                name="gameCategory"
                placeholder="Category (optional)"
                class="game-input"
                (keyup.enter)="addGame()"
                [disabled]="addingGame"
              />
              <button
                type="submit"
                class="add-btn"
                [disabled]="!newGameName?.trim() || addingGame"
              >
                {{ addingGame ? "Adding..." : "Add Game" }}
              </button>
            </form>
          </div>
          <div class="games-controls-row">
            <input
              [(ngModel)]="gameSearch"
              placeholder="Search games or category..."
              class="game-search"
            />
          </div>
          <div class="games-display">
            <div *ngFor="let game of getFilteredGames()" class="game-item">
              <div *ngIf="editingGame?.id !== game.id" class="game-display">
                <div class="game-header">
                  <div class="game-meta">
                    <span class="game-name">{{ game.name }}</span>
                    <span class="game-category" *ngIf="game.category">({{ game.category }})</span>
                  </div>
                  <span class="game-status" [class.chosen]="game.isChosen">{{
                    game.isChosen ? "Chosen" : "Available"
                  }}</span>
                </div>
                <div class="game-controls-row">
                  <div class="week-control">
                    <span *ngIf="game.assignedWeek" class="filter-tag">Week {{game.assignedWeek}}</span>
                    <select *ngIf="!game.assignedWeek" [(ngModel)]="gameWeekSelections[game.id]" (change)="assignWeekToGame(game)" class="week-dropdown" [title]="'Assign to ' + (currentSeason?.name || 'current season')">
                      <option [ngValue]="null" disabled selected>{{ currentSeason ? 'Select Week (' + currentSeason.name + ')' : 'Select Week' }}</option>
                      <option *ngFor="let week of getWeekOptions()" [ngValue]="week">Week {{ week }}</option>
                    </select>
                  </div>
                  <div class="action-buttons">
                    <button *ngIf="game.assignedWeek" (click)="unassignGame(game)" class="unassign-btn">Unassign</button>
                    <button (click)="startEditGame(game)" class="edit-btn">Edit</button>
                    <button (click)="deleteGame(game.id)" class="delete-btn">Delete</button>
                  </div>
                </div>
              </div>
              <div *ngIf="editingGame?.id === game.id" class="game-edit">
                <input
                  [(ngModel)]="editGameName"
                  placeholder="Game name"
                  class="edit-input"
                />
                <input
                  [(ngModel)]="editGameCategory"
                  placeholder="Category"
                  class="edit-input"
                />
                <button (click)="saveEditedGame()" class="save-btn">
                  Save
                </button>
                <button (click)="cancelGameEdit()" class="cancel-btn">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Confirmation modal (styled) -->
    <div
      *ngIf="confirmVisible"
      class="confirm-overlay"
      role="dialog"
      aria-modal="true"
    >
      <div class="confirm-dialog">
        <div class="confirm-title">Confirm action</div>
        <div class="confirm-text">{{ confirmMessage }}</div>
        <div class="confirm-actions">
          <button class="btn-cancel" (click)="rejectConfirm()">Cancel</button>
          <button class="btn-confirm" (click)="resolveConfirm()">
            Confirm
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .admin-area {
        background: #181a1b;
        color: #fff;
        padding: 16px 20px; /* reduce top padding to bring content closer under header */
        box-sizing: border-box;
        max-width: 1280px;
        margin: 0 auto; /* center the admin area */
        position: relative;
        overflow-x: hidden; /* prevent children escaping horizontally */
        outline: 2px solid rgba(255, 255, 255, 0.02); /* debug boundary */
      }

      /* Tab Styles */
      .admin-tabs {
        display: flex;
        gap: 8px;
        margin-bottom: 12px; /* tighten spacing below tabs */
        border-bottom: 2px solid #333;
        padding-bottom: 0;
        position: relative;
        z-index: 5;
        background: linear-gradient(90deg, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0));
      }
      .tab-btn {
        background: #333;
        color: #ccc;
        border: none;
        padding: 12px 24px;
        cursor: pointer;
        border-radius: 8px 8px 0 0;
        font-size: 16px;
        transition: all 0.3s ease;
        font-family: Orbitron, Arial, sans-serif;
      }
      .tab-btn:hover {
        background: #444;
        color: #53fc19;
      }
      .tab-btn.active {
        background: #53fc19;
        color: #000;
        box-shadow: 0 0 12px #53fc19;
      }
      .tab-content {
        animation: fadeIn 0.3s ease-in;
        /* let tab content grow/shrink inside the admin area */
        flex: 1 1 auto;
        min-height: 0; /* allow proper flexbox shrinking inside column container */
        /* debug helpers: outline tab content to find layout gaps */
        box-shadow: inset 0 0 0 1px rgba(127, 255, 127, 0.06);
      }
      /* Ensure tab content sits below the tabs and stays inside the admin-area container */
      .admin-area .tab-content {
        clear: both; /* prevent floats from overlapping */
        box-sizing: border-box;
        width: 100%;
        margin-top: 12px;
        padding-top: 6px;
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

      /* Overview Tab Styles */
      .overview-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
      }
      .stat-card {
        background: #222;
        border-radius: 8px;
        padding: 20px;
        text-align: center;
        border: 1px solid #53fc19;
        box-shadow: 0 0 8px rgba(83, 252, 25, 0.2);
      }
      .stat-card h3 {
        margin: 0 0 8px 0;
        color: #53fc19;
        font-size: 14px;
        text-transform: uppercase;
        font-family: Orbitron, Arial, sans-serif;
      }
      .stat-number {
        font-size: 32px;
        font-weight: bold;
        color: #fff;
        font-family: Orbitron, Arial, sans-serif;
      }
      .stat-text {
        font-size: 18px;
        color: #53fc19;
        font-family: Orbitron, Arial, sans-serif;
      }

      .admin-title {
        color: #53fc19;
        font-size: 2.2rem;
        margin-bottom: 8px;
        font-family: Orbitron, Arial, sans-serif;
      }
      .admin-desc {
        color: #53fc19;
        margin-bottom: 18px;
      }
      .admin-actions {
        margin-bottom: 24px;
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
      }
      .action-btn {
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
        font-family: Orbitron, Arial, sans-serif;
        text-transform: uppercase;
        letter-spacing: 1px;
        position: relative;
        overflow: hidden;
      }
      .action-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }
      .clear-btn {
        background: linear-gradient(45deg, #ff4444, #cc0000);
        color: white;
        border: 2px solid #ff6666;
      }
      .clear-btn:hover {
        background: linear-gradient(45deg, #ff6666, #ff4444);
        box-shadow: 0 4px 12px rgba(255, 68, 68, 0.4);
      }
      .new-season-btn {
        background: linear-gradient(45deg, #53fc19, #3acc00);
        color: #000;
        border: 2px solid #53fc19;
      }
      .new-season-btn:hover {
        background: linear-gradient(45deg, #6bff33, #53fc19);
        box-shadow: 0 4px 12px rgba(83, 252, 25, 0.4);
      }
      .save-btn {
        background: linear-gradient(45deg, #4caf50, #2e7d32);
        color: white;
        border: 2px solid #66bb6a;
      }
      .save-btn:hover {
        background: linear-gradient(45deg, #66bb6a, #4caf50);
        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
      }
      .season-management {
        background: #222;
        border-radius: 18px;
        box-shadow: 0 0 24px #53fc19, 0 0 32px #181a1b inset;
        padding: 24px 32px;
        margin-bottom: 24px;
      }
      .season-controls {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .season-subtabs {
        display: flex;
        gap: 8px;
        margin-bottom: 8px;
      }
      .subtab-btn {
        background: #333;
        color: #ccc;
        border: none;
        padding: 8px 12px;
        border-radius: 8px;
        cursor: pointer;
      }
      .subtab-btn.active {
        background: #53fc19;
        color: #000;
        box-shadow: 0 0 8px #53fc19;
      }
      .generate-btn {
        background: linear-gradient(45deg, #53fc19, #3acc00);
        color: #000;
        border: none;
        padding: 8px 14px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
      }
      .generate-btn[disabled] {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .loader {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      .loader:before {
        content: "";
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2px solid rgba(0, 0, 0, 0.2);
        border-top-color: #fff;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      .season-form {
        display: flex;
        gap: 12px;
        align-items: center;
      }
      .season-form input {
        padding: 8px 12px;
        border: 1px solid #53fc19;
        border-radius: 4px;
        background: #333;
        color: #fff;
      }
      .season-form button {
        background: #53fc19;
        color: #181a1b;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
      }
      .current-season {
        background: rgba(83, 252, 25, 0.1);
        border: 1px solid #53fc19;
        border-radius: 8px;
        padding: 16px;
      }
      .current-season h3 {
        color: #53fc19;
        margin: 0 0 8px 0;
      }
      .current-season p {
        margin: 0 0 12px 0;
        color: #fff;
      }
      .week-management {
        margin: 16px 0;
        padding: 12px;
        background: rgba(83, 252, 25, 0.05);
        border: 1px solid rgba(83, 252, 25, 0.2);
        border-radius: 6px;
      }
      .week-management h4 {
        color: #53fc19;
        margin: 0 0 12px 0;
        font-size: 1.1rem;
      }
      .week-controls {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      .week-controls label {
        color: #fff;
        font-weight: bold;
      }
      .week-select {
        padding: 6px 12px;
        border: 1px solid #53fc19;
        border-radius: 4px;
        background: #333;
        color: #fff;
      }
      .current-week-display {
        color: #53fc19;
        font-weight: bold;
        margin-left: 16px;
      }
      .admin-flex {
        display: flex;
        gap: 32px;
        flex-wrap: wrap;
        align-items: flex-start;
      }
      .admin-panel {
        background: #222;
        border-radius: 18px;
        box-shadow: 0 0 24px #53fc19, 0 0 32px #181a1b inset;
        padding: 18px 20px;
        width: calc(100% - 40px);
        max-width: 1100px; /* keep panels readable */
        margin: 12px auto 32px auto; /* center panels inside admin area */
        box-sizing: border-box;
        clear: both;
        position: relative;
        outline: none; /* remove debug boundary to avoid layout forcing overflow */
        /* debug: subtle dashed border to make oversized margins visible */
        border: 1px dashed rgba(127, 255, 127, 0.08);
      }
      .admin-panel.players-panel {
        max-width: 100%;
        min-width: 0; /* allow shrink */
        padding: 12px; /* slightly reduce padding on tight screens */
      }
      .panel-title {
        color: #53fc19;
        font-size: 1.3rem;
        margin-bottom: 12px;
        font-family: Orbitron, Arial, sans-serif;
      }
      .players-display {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .player-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: #333;
        border: 1px solid #53fc19;
        border-radius: 8px;
        padding: 12px 16px;
        margin-bottom: 8px;
      }
      .player-info {
        display: flex;
        align-items: center;
        gap: 16px;
        flex: 1;
      }
      .admin-player-display {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
      }
      .admin-player-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        border: 2px solid #53fc19;
        object-fit: cover;
        box-shadow: 0 2px 8px rgba(83, 252, 25, 0.3);
        flex-shrink: 0;
      }
      .admin-player-details {
        display: flex;
        flex-direction: column;
        gap: 4px;
        flex: 1;
        min-width: 0;
      }
      .player-actions {
        display: flex;
        gap: 8px;
        margin-left: auto;
      }
      .player-name {
        color: #53fc19;
        font-weight: bold;
        min-width: 180px;
        font-size: 1.1rem;
      }
      .player-stats {
        color: #fff;
        min-width: 120px;
        font-size: 0.95rem;
        background: #181a1b;
        padding: 4px 8px;
        border-radius: 4px;
        border: 1px solid #444;
      }
      .edit-btn,
      .delete-btn,
      .save-btn,
      .cancel-btn,
      .activate-btn {
        padding: 6px 12px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: bold;
        transition: all 0.2s ease;
      }
      .edit-btn {
        background: #53fc19;
        color: #181a1b;
      }
      .edit-btn:hover {
        background: #40c015;
        box-shadow: 0 0 8px #53fc19;
      }
      .delete-btn {
        background: #ff4444;
        color: #fff;
      }
      .delete-btn:hover {
        background: #cc3333;
        box-shadow: 0 0 8px #ff4444;
      }
      .save-btn {
        background: #53fc19;
        color: #181a1b;
      }
      .cancel-btn {
        background: #666;
        color: #fff;
      }
      .activate-btn {
        background: #4caf50;
        color: #fff;
      }
      .activate-btn:hover {
        background: #45a049;
        box-shadow: 0 0 8px #4caf50;
      }
      .add-player {
        display: grid;
        grid-template-columns: 2fr 80px 80px 80px 2fr auto;
        gap: 12px;
        margin-top: 16px;
        padding: 16px;
        background: #181a1b;
        border-radius: 8px;
        border: 2px solid #53fc19;
        align-items: center;
      }
      .add-player input[type="number"] {
        padding: 8px 6px;
        border: 1px solid #444;
        border-radius: 6px;
        background: #333;
        color: #fff;
        font-size: 0.95rem;
        text-align: center;
        width: 60px;
      }
      .add-player input {
        padding: 8px 12px;
        border: 1px solid #444;
        border-radius: 6px;
        background: #333;
        color: #fff;
        font-size: 0.95rem;
      }
      .add-player input:focus {
        outline: none;
        border-color: #53fc19;
        box-shadow: 0 0 8px rgba(83, 252, 25, 0.3);
      }
      .add-player button {
        padding: 8px 16px;
        background: #53fc19;
        color: #181a1b;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        font-size: 0.95rem;
        transition: all 0.2s ease;
      }
      .add-player button:hover {
        background: #40c015;
        box-shadow: 0 0 12px #53fc19;
      }
      .admin-actions {
        margin-top: 24px;
        padding: 16px;
        border-top: 1px solid #53fc19;
        text-align: center;
      }
      .reset-btn {
        padding: 12px 24px;
        border: none;
        border-radius: 6px;
        font-weight: bold;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.3s ease;
        font-family: "Orbitron", Arial, sans-serif;
      }
      .danger-btn {
        background: #ff4444;
        color: #fff;
        border: 2px solid #ff6666;
      }
      .danger-btn:hover {
        background: #ff6666;
        box-shadow: 0 0 12px #ff4444;
        transform: translateY(-2px);
      }
      .player-edit {
        display: grid;
        grid-template-columns: 3fr 80px 80px 80px auto auto;
        gap: 8px;
        align-items: center;
        width: 100%;
      }
      .edit-input {
        padding: 6px 8px;
        border: 1px solid #53fc19;
        border-radius: 4px;
        background: #181a1b;
        color: #fff;
        font-size: 0.9rem;
      }
      .edit-input-small {
        padding: 6px 4px;
        border: 1px solid #53fc19;
        border-radius: 4px;
        background: #181a1b;
        color: #fff;
        font-size: 0.9rem;
        width: 60px;
        text-align: center;
      }
      .users-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 24px;
      }
      .user-row {
        display: flex;
        align-items: center;
        gap: 12px;
        background: #222;
        border-radius: 8px;
        padding: 8px 16px;
        color: #fff;
      }
      .user-name {
        font-weight: bold;
        color: #53fc19;
        min-width: 160px;
      }
      .edit-input {
        width: 140px;
      }
      .players-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 12px;
      }
      .players-table th,
      .players-table td {
        border: 1px solid #53fc19;
        padding: 6px 10px;
        text-align: left;
        font-size: 1rem;
      }
      .players-table th {
        background: #53fc19;
        color: #181a1b;
        font-family: Orbitron, Arial, sans-serif;
      }
      .matches-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 0;
        margin: 0;
      }
      .week-group {
        background: rgba(0, 0, 0, 0.05);
        border-radius: 8px;
        padding: 8px;
        border: 1px solid rgba(83, 252, 25, 0.06);
      }
      .week-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;
      }
      .week-badge {
        background: #53fc19;
        color: #000;
        padding: 6px 12px;
        border-radius: 20px;
        font-weight: bold;
        box-shadow: 0 4px 12px rgba(83, 252, 25, 0.08);
      }
      .week-info {
        color: #ccc;
        font-size: 0.95rem;
      }
      .week-matches {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .match-item {
        background: rgba(83, 252, 25, 0.1);
        border: 1px solid #53fc19;
        border-radius: 8px;
        padding: 12px;
      }
      .match-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      .match-week {
        color: #53fc19;
        font-weight: bold;
        margin-right: 8px;
      }
      .match-game {
        color: #ffd700;
        font-style: italic;
        font-size: 14px;
        margin-right: 12px;
        background: rgba(255, 215, 0, 0.1);
        padding: 2px 6px;
        border-radius: 4px;
        border: 1px solid #ffd700;
      }
      .match-pair {
        flex: 1;
        text-align: center;
      }
      .match-status {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: bold;
      }
      .match-status.scheduled {
        background: #666;
        color: #fff;
      }
      .match-status.completed {
        background: #53fc19;
        color: #181a1b;
      }
      .match-status.dq {
        background: #ff9800;
        color: #fff;
      }
      .match-controls {
        display: flex;
        gap: 8px;
        justify-content: flex-start;
        align-items: center;
        flex-wrap: wrap;
      }
      .winner-btn,
      .skip-btn,
      .reset-btn,
      .dq-btn {
        padding: 6px 10px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.85rem;
        min-width: 74px;
      }
      .winner-btn.small,
      .skip-btn.small,
      .dq-btn.small {
        padding: 6px 8px;
        min-width: 64px;
        font-size: 0.82rem;
      }
      .winner-btn {
        background: #53fc19;
        color: #181a1b;
      }
      .winner-btn:hover {
        background: #45d915;
      }
      .skip-btn {
        background: #ff6b6b;
        color: #fff;
      }
      .skip-btn:hover {
        background: #ff5252;
      }
      .dq-btn {
        background: #ff9800;
        color: #fff;
      }
      .dq-btn:hover {
        background: #f57c00;
      }
      .dq-result {
        color: #ff9800;
        font-weight: bold;
      }
      .reset-btn {
        background: #666;
        color: #fff;
      }
      .reset-btn:hover {
        background: #555;
      }
      .match-result {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 8px;
        border-top: 1px solid #53fc19;
      }
      .winner {
        color: #53fc19;
        font-weight: bold;
      }
      .loser {
        color: #ccc;
      }
      .player-edit {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
      }
      .edit-input {
        padding: 4px 8px;
        border: 1px solid #53fc19;
        border-radius: 4px;
        background: #333;
        color: #fff;
        min-width: 120px;
      }
      .edit-input-small {
        padding: 4px 8px;
        border: 1px solid #53fc19;
        border-radius: 4px;
        background: #333;
        color: #fff;
        width: 60px;
      }
      .save-btn {
        background: #53fc19;
        color: #181a1b;
        border: none;
        padding: 4px 12px;
        border-radius: 4px;
        cursor: pointer;
      }
      .cancel-btn {
        background: #666;
        color: #fff;
        border: none;
        padding: 4px 12px;
        border-radius: 4px;
        cursor: pointer;
      }

      /* Match Filters */
      .match-filters {
        background: rgba(83, 252, 25, 0.05);
        border: 1px solid rgba(83, 252, 25, 0.3);
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 20px;
      }
      .match-filters h3 {
        color: #53fc19;
        margin-bottom: 12px;
        font-size: 1.1rem;
      }
      .filter-controls {
        display: flex;
        gap: 16px;
        align-items: center;
        flex-wrap: wrap;
        margin-bottom: 12px;
      }
      .filter-group {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .filter-group label {
        color: #ccc;
        font-weight: bold;
        min-width: 60px;
      }
      .filter-select {
        background: #333;
        color: #fff;
        border: 1px solid #53fc19;
        border-radius: 4px;
        padding: 6px 10px;
        min-width: 150px;
      }
      .filter-select:focus {
        outline: none;
        border-color: #7fff4f;
      }
      .clear-filters-btn {
        background: #666;
        color: #fff;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
      }
      .clear-filters-btn:hover {
        background: #777;
      }
      .filter-summary {
        display: flex;
        gap: 12px;
        align-items: center;
        flex-wrap: wrap;
        padding-top: 12px;
        border-top: 1px solid rgba(83, 252, 25, 0.2);
      }

      /* Help icon + tooltip */
      .filter-with-help {
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      .help-icon {
        display: inline-flex;
        width: 20px;
        height: 20px;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: #53fc19;
        color: #181a1b;
        font-weight: bold;
        cursor: help;
        box-shadow: 0 0 6px rgba(83, 252, 25, 0.3);
        border: 2px solid rgba(0, 0, 0, 0.15);
        font-size: 0.9rem;
      }
      .help-icon:focus {
        outline: 2px dashed #7fff4f;
        outline-offset: 2px;
      }
      .help-tooltip {
        display: none;
        position: absolute;
        top: 28px;
        left: 0;
        min-width: 180px;
        max-width: 360px;
        padding: 8px 10px;
        background: linear-gradient(180deg, #0f1111 0%, #181a1b 100%);
        color: #53fc19;
        border: 1px solid #53fc19;
        border-radius: 8px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
        white-space: pre-line;
        line-height: 1.35;
        z-index: 2147483647; /* ensure tooltip displays over modals and overlays */
      }
      .filter-with-help:hover .help-tooltip,
      .filter-with-help:focus-within .help-tooltip {
        display: block;
      }
      .filter-tag {
        background: rgba(83, 252, 25, 0.2);
        color: #53fc19;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.9rem;
        font-weight: bold;
      }
      .match-count {
        color: #ccc;
        font-size: 0.9rem;
        margin-left: auto;
      }
      .no-matches {
        text-align: center;
        color: #999;
        padding: 40px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        border: 2px dashed #666;
      }

      .manual-matchup {
        background: rgba(83, 252, 25, 0.1);
        border: 1px solid #53fc19;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
      }
      .manual-matchup h3 {
        color: #53fc19;
        margin-bottom: 12px;
        font-size: 1.1rem;
      }
      .current-season-info {
        background: rgba(83, 252, 25, 0.1);
        border: 1px solid rgba(83, 252, 25, 0.3);
        border-radius: 4px;
        padding: 8px 12px;
        margin-bottom: 12px;
        color: #53fc19;
        font-size: 0.9rem;
      }
      .current-season-info strong {
        color: #7fff4f;
      }
      .manual-form {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
      }
      .week-select,
      .player-select {
        padding: 6px 8px;
        border: 1px solid #53fc19;
        border-radius: 4px;
        background: #333;
        color: #fff;
        min-width: 100px;
      }
      .vs-text {
        color: #53fc19;
        font-weight: bold;
        margin: 0 4px;
      }
      .add-match-btn {
        background: #53fc19;
        color: #181a1b;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
      }
      .add-match-btn:disabled {
        background: #666;
        color: #999;
        cursor: not-allowed;
      }
      .delete-match-btn {
        background: #ff6b6b;
        color: #fff;
        border: none;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        margin-left: 8px;
      }
      .full-width {
        grid-column: 1 / -1;
      }
      .game-controls {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      .add-game {
        display: flex;
        gap: 12px;
        align-items: center;
        flex-wrap: wrap;
        padding: 16px;
        background: rgba(83, 252, 25, 0.05);
        border: 1px solid rgba(83, 252, 25, 0.2);
        border-radius: 8px;
        margin-bottom: 20px;
      }
      .add-game form {
        display: flex;
        gap: 12px;
        align-items: center;
        flex-wrap: wrap;
        width: 100%;
      }
      .game-input {
        padding: 8px 12px;
        border: 1px solid #53fc19;
        border-radius: 4px;
        background: #333;
        color: #fff;
        min-width: 150px;
        transition: border-color 0.3s ease;
      }
      .game-input:focus {
        outline: none;
        border-color: #7fff4f;
        box-shadow: 0 0 5px rgba(83, 252, 25, 0.3);
      }
      .game-input:disabled {
        background: #222;
        color: #666;
        border-color: #444;
      }
      .add-btn {
        background: #53fc19;
        color: #181a1b;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.3s ease;
        min-width: 100px;
      }
      .add-btn:hover:not(:disabled) {
        background: #7fff4f;
        transform: translateY(-1px);
      }
      .add-btn:disabled {
        background: #666;
        color: #999;
        cursor: not-allowed;
        transform: none;
      }
      .games-display {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: flex-start;
      }
      .game-item {
        background: rgba(83, 252, 25, 0.1);
        border: 1px solid #53fc19;
        border-radius: 8px;
        padding: 16px;
        transition: all 0.3s ease;
        flex: 0 0 calc(31.33% - 0px);
        max-width: calc(31.33% - 0px);
        box-sizing: border-box;
      }
      @media (max-width: 1200px) {
        .game-item {
          flex: 0 0 calc(50% - 6px);
          max-width: calc(50% - 6px);
        }
      }
      @media (max-width: 768px) {
        .game-item {
          flex: 0 0 100%;
          max-width: 100%;
        }
      }
      .game-item:hover {
        background: rgba(83, 252, 25, 0.15);
        box-shadow: 0 4px 12px rgba(83, 252, 25, 0.2);
      }
      .game-display {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .game-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        text-align: center;
        border-bottom: 1px solid rgba(83, 252, 25, 0.3);
        padding-bottom: 12px;
      }
      .game-meta {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }
      .game-name {
        font-size: 18px;
        font-weight: bold;
        color: #53fc19;
      }
      .game-category {
        font-size: 14px;
        color: #ccc;
        font-style: italic;
      }
      .game-status {
        font-size: 12px;
        font-weight: bold;
        padding: 4px 8px;
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.1);
        color: #ccc;
      }
      .game-status.chosen {
        background: rgba(83, 252, 25, 0.2);
        color: #53fc19;
      }
      .game-controls-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }
      .week-control {
        flex: 1;
        min-width: 0;
      }
      .action-buttons {
        display: flex;
        gap: 6px;
        flex-shrink: 0;
      }
      .action-buttons button {
        padding: 6px 10px;
        font-size: 12px;
        border-radius: 4px;
        border: none;
        cursor: pointer;
        transition: all 0.3s ease;
        font-weight: bold;
      }
      .edit-btn {
        background: #4CAF50;
        color: white;
      }
      .edit-btn:hover {
        background: #45a049;
      }
      .delete-btn {
        background: #f44336;
        color: white;
      }
      .delete-btn:hover {
        background: #da190b;
      }
      .unassign-btn {
        background: #ff9800;
        color: white;
      }
      .unassign-btn:hover {
        background: #e68900;
      }
      .week-dropdown {
        padding: 6px 10px;
        border-radius: 4px;
        border: 1px solid #53fc19;
        background: #222;
        color: #fff;
        font-size: 13px;
        min-width: 100px;
        transition: all 0.3s ease;
      }
      .week-dropdown:hover {
        background: #333;
        border-color: #6fff2a;
      }
      .week-dropdown:focus {
        outline: none;
        box-shadow: 0 0 8px rgba(83, 252, 25, 0.4);
        border-color: #6fff2a;
      }
      .games-controls-row {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 8px;
      }
      .game-search {
        padding: 8px 10px;
        border-radius: 6px;
        border: 1px solid #444;
        background: #222;
        color: #fff;
        min-width: 260px;
      }
      .game-display {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .game-name {
        font-weight: bold;
        color: #53fc19;
        flex: 1;
      }
      .game-category {
        color: #ccc;
        font-style: italic;
      }
      .game-status {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: bold;
        background: #666;
        color: #fff;
      }
      .game-status.chosen {
        background: #53fc19;
        color: #181a1b;
      }
      .game-edit {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
      }
      .match-pair {
        color: #fff;
      }
      .vs {
        color: #53fc19;
        font-weight: bold;
        margin: 0 6px;
        text-shadow: 0 0 4px #181a1b;
      }
      .seasons-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .seasons-list li {
        margin-bottom: 8px;
        color: #fff;
      }
      .seasons-list button {
        margin-left: 12px;
      }
      @media (max-width: 900px) {
        .admin-flex {
          flex-direction: column;
          gap: 16px;
        }
        .admin-panel {
          max-width: 98vw;
        }
      }
      /* Confirmation modal styles */
      .confirm-overlay {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.6);
        z-index: 10000;
      }
      .confirm-dialog {
        background: linear-gradient(180deg, #0f1112, #1b1d1e);
        border: 2px solid #53fc19;
        padding: 20px;
        border-radius: 12px;
        width: min(540px, 92%);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6),
          0 0 16px rgba(83, 252, 25, 0.12);
      }
      .confirm-title {
        color: #53fc19;
        font-weight: bold;
        margin-bottom: 8px;
      }
      .confirm-text {
        color: #ddd;
        white-space: pre-wrap;
        margin-bottom: 16px;
      }
      .confirm-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }
      .btn-cancel {
        background: #444;
        color: #fff;
        border: none;
        padding: 8px 14px;
        border-radius: 8px;
        cursor: pointer;
      }
      .btn-confirm {
        background: linear-gradient(45deg, #ff4444, #cc0000);
        color: #fff;
        border: none;
        padding: 8px 14px;
        border-radius: 8px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(255, 68, 68, 0.2);
      }
      .btn-confirm:hover {
        transform: translateY(-2px);
      }
    `,
  ],
})
export class AdminPageComponent implements OnInit {
  selectedZipFile: File | null = null;
  // Download the data folder as a zip
  downloadDataZip() {
    window.open(`${this.apiBaseUrl}/admin/data/download`, '_blank');
  }

  // Handle zip file selection for restore
  onZipFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedZipFile = input.files[0];
    } else {
      this.selectedZipFile = null;
    }
  }

  // Restore data from uploaded zip
  restoreDataZip(event: Event) {
    event.preventDefault();
    if (!this.selectedZipFile) return;
    const formData = new FormData();
    formData.append('zip', this.selectedZipFile);
    this.http.post(`${this.apiBaseUrl}/admin/data/restore`, formData, { withCredentials: true }).subscribe({
      next: () => {
        alert('Data restored successfully.');
        this.selectedZipFile = null;
        this.loadPlayers();
        this.loadMatches();
        this.loadSeasons();
        this.loadGames();
      },
      error: () => {
        alert('Failed to restore data.');
      }
    });
  }
  // Tab management
  activeTab: string = "overview";
  // Confirmation modal state (styled)
  confirmVisible: boolean = false;
  confirmMessage: string = "";
  private confirmResolver: ((value: boolean) => void) | null = null;

  players: Player[] = [];
  matches: Match[] = [];
  newPlayerName: string = "";
  newPlayerWins: number = 0;
  newPlayerLosses: number = 0;
  newPlayerNotPlayed: number = 0;
  newPlayerImageUrl: string = "";
  seasons: Season[] = [];
  currentSeason: Season | null = null;
  newSeasonName: string = "";
  newSeasonWeeks: number = 14;
  currentActiveWeek: number = 1;

  // Admin filters and navigation
  selectedWeekFilter: number | null = null;
  selectedSeasonFilter: number | null = null;
  gameWeekSelections: { [gameId: number]: number | null } = {};

  // Seasons UI subtabs and generation state
  seasonsTab: "current" | "history" = "current";
  generatingMatches: boolean = false;

  // Edit player state
  editingPlayer: Player | null = null;
  editPlayerName: string = "";
  editPlayerWins: number = 0;
  editPlayerLosses: number = 0;
  editPlayerNotPlayed: number = 0;
  editPlayerPoints: number = 0;

  // Manual matchup entry
  manualMatchWeek: number = 1;
  manualMatchPlayer1: string = "";
  manualMatchPlayer2: string = "";

  // Game management
  games: Game[] = [];
  newGameName: string = "";
  newGameCategory: string = "";
  addingGame: boolean = false;
  editingGame: Game | null = null;
  editGameName: string = "";
  editGameCategory: string = "";
  // Games search filter
  gameSearch: string = "";
  // Assigning game to a week UI state
  assigningGameId: number | null = null;
  assignWeekNumber: number | null = null;

  isAdmin: boolean = false;
  private apiBaseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient, private router:Router, private authService: AuthService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.isAdmin = this.authService.isAdminMode;
    if (!this.isAdmin) {
      this.authService.redirectToPublic();
    }
    this.cdr.detectChanges();

    this.loadPlayers();
    this.loadMatches();
    this.loadSeasons();
    this.loadGames();
    this.loadActiveWeek();

    // Restore persisted filter choices (if any)
    const savedSeason = localStorage.getItem("admin_selectedSeasonFilter");
    const savedWeek = localStorage.getItem("admin_selectedWeekFilter");
    if (savedSeason !== null) {
      // allow explicit 'null' string to represent All Seasons
      this.selectedSeasonFilter =
        savedSeason === "null" ? null : parseInt(savedSeason, 10);
    }
    if (savedWeek !== null) {
      this.selectedWeekFilter =
        savedWeek === "null" ? null : parseInt(savedWeek, 10);
    }

    // Initialize filters after data is loaded
    setTimeout(() => this.initializeFilters(), 100);
  }

  loadPlayers() {
    this.http.get<Player[]>(`${environment.apiBaseUrl}/players`).subscribe({
      next: (data) => {
        console.log("Players loaded:", data);
        if (Array.isArray(data)) {
          this.players = data;
          // Ensure Bye Week is present for odd-numbered rosters (client-side only)
          this.ensureByePlayer();
        }
      },
      error: (error) => {
        console.error("Error loading players:", error);
      },
    });
  }

  // Ensure a client-only 'Bye Week' player exists when player count is odd so manual add can use it.
  ensureByePlayer() {
    const hasBye = this.players.some((p) => p.name === "Bye Week");
    const nonByeCount = this.players.filter(
      (p) => p.name !== "Bye Week"
    ).length;
    if (nonByeCount % 2 === 1 && !hasBye) {
      // add a non-persistent Bye Week placeholder at end
      this.players.push({
        id: -1,
        name: "Bye Week",
        wins: 0,
        losses: 0,
        notPlayed: 0,
        points: 0,
        imageUrl: "/assets/images/players/bye-week.jpg"
      });
    } else if (nonByeCount % 2 === 0 && hasBye) {
      // remove client-side Bye if present
      this.players = this.players.filter(
        (p) => p.name !== "Bye Week" || p.id !== -1
      );
    }
  }

  loadMatches() {
    this.http
      .get<Match[]>(`${environment.apiBaseUrl}/matches`)
      .subscribe((data) => {
        if (Array.isArray(data)) {
          // Normalize numeric fields to ensure type consistency for filtering
          this.matches = data.map((m) => ({
            ...m,
            week: Number(m.week),
            season:
              m.season !== undefined ? Number((m as any).season) : undefined,
          }));
        }
      });
  }

  loadSeasons() {
    this.http.get<Season[]>(`${environment.apiBaseUrl}/seasons`).subscribe({
      next: (data) => {
        console.log("Seasons loaded:", data);
        this.seasons = data || [];
        this.currentSeason =
          this.seasons.find((s) => s.status === "active") || null;
        this.initializeFilters(); // Initialize filters after loading seasons
      },
      error: (error) => {
        console.error("Error loading seasons:", error);
        this.seasons = [];
      },
    });
  }

  createSeason() {
    if (!this.newSeasonName || !this.newSeasonWeeks) return;

    // Check if there's already an active season
    const hasActiveSeason = this.seasons.some((s) => s.status === "active");

    const newSeason: Season = {
      id: Date.now(),
      name: this.newSeasonName,
      weeks: this.newSeasonWeeks,
      status: hasActiveSeason ? "draft" : "active", // First season becomes active automatically
      startDate: new Date().toISOString(),
    };

    this.http
      .post<Season>(`${environment.apiBaseUrl}/seasons`, newSeason, { withCredentials: true })
      .subscribe(() => {
        this.loadSeasons();
        this.newSeasonName = "";
        this.newSeasonWeeks = 14;
      });
  }

  generateRoundRobinForSeason() {
    if (!this.currentSeason) return;

    const weeksInSeason = this.currentSeason.weeks;
    const matches: Match[] = [];

    // Prepare player names and add Bye Week if necessary (to make even number)
    const activeNames = this.players
      .filter((p) => p.name !== "Bye Week")
      .map((p) => p.name);
    const pool = [...activeNames];
    if (pool.length % 2 === 1) pool.push("Bye Week");

    const n = pool.length;
    const totalRounds = n - 1; // standard round-robin unique rounds

    // Allow generating for every week in the season. If the season has
    // more weeks than the number of unique rounds, we'll continue rotating
    // the pool to fill the remaining weeks (matches may repeat).
    const roundsToGenerate = Math.max(0, weeksInSeason);

    // Use a rotation array (non-destructive copies) and generate rounds
    let rotation = [...pool];
    for (let r = 0; r < roundsToGenerate; r++) {
      const weekNumber = r + 1;
      const weekMatches: Match[] = [];

      for (let i = 0; i < n / 2; i++) {
        const p1 = rotation[i];
        const p2 = rotation[n - 1 - i];
        if (p1 !== "Bye Week" && p2 !== "Bye Week") {
          weekMatches.push({
            week: weekNumber,
            season: this.currentSeason?.id || 1,
            player1: p1,
            player2: p2,
            status: "scheduled",
            played: false,
          });
        }
      }

      matches.push(...weekMatches);

      // Rotate: keep first fixed, move last to index 1, shift others right
      const first = rotation[0];
      const rest = rotation.slice(1);
      const last = rest.pop()!; // rest is non-empty because n>=2
      rotation = [first, last, ...rest];
    }

    // Send matches to backend
    this.generatingMatches = true;
  this.http.post(`${environment.apiBaseUrl}/matches`, matches, { withCredentials: true }).subscribe(
      () => {
        this.loadMatches();
        // Update season status to active
        if (this.currentSeason) {
          this.currentSeason.status = "active";
          this.http
            .put(
              `${environment.apiBaseUrl}/seasons/${this.currentSeason.id}`,
              this.currentSeason,
              { withCredentials: true }
            )
            .subscribe();
        }
        this.generatingMatches = false;
      },
      () => {
        this.generatingMatches = false;
      }
    );
  }

  savePlayer(player: Player) {
    player.points = player.wins * 2 + player.losses * 1;
    this.http
      .put(`${environment.apiBaseUrl}/players/${player.id}`, player, { withCredentials: true })
      .subscribe(() => {
        this.loadPlayers();
      });
  }

  deletePlayer(id: number) {
    const player = this.players.find((p) => p.id === id);
    const name = player ? player.name : String(id);
    this.showConfirm(
      `Delete player "${name}"? This will remove the player and their stats. This action cannot be undone.`
    ).then((confirmed) => {
      if (!confirmed) return;
  this.http.delete(`${environment.apiBaseUrl}/players/${id}`, { withCredentials: true }).subscribe(() => {
        this.loadPlayers();
        // ensure Bye Week presence updated after deletion
        setTimeout(() => this.ensureByePlayer(), 150);
      });
    });
  }

  addPlayer() {
    const defaultImageUrl = `/assets/images/players/${this.newPlayerName.toLowerCase().replace(/[^a-z0-9_]/g, '')}.jpg`;
    const newPlayer: Player = {
      id: 0,
      name: this.newPlayerName,
      wins: this.newPlayerWins,
      losses: this.newPlayerLosses,
      notPlayed: this.newPlayerNotPlayed,
      points: 0,
      imageUrl: this.newPlayerImageUrl || defaultImageUrl
    };
    this.http
      .post<Player>(`${environment.apiBaseUrl}/players`, newPlayer, { withCredentials: true })
      .subscribe(() => {
        this.loadPlayers();
        this.newPlayerName = "";
        this.newPlayerWins = 0;
        this.newPlayerLosses = 0;
        this.newPlayerNotPlayed = 0;
        this.newPlayerImageUrl = "";
        // ensure Bye Week presence updated after addition

        setTimeout(() => this.ensureByePlayer(), 150);
      });
  }

  resetAllPlayerScores() {
    this.showConfirm(
      "Are you sure you want to reset ALL player scores? This action cannot be undone and will set all wins, losses, and points to 0 for every player."
    ).then((confirmed) => {
      if (!confirmed) return;
      // Reset all players to 0 scores
      const resetPlayers = this.players.map((player) => ({
        ...player,
        wins: 0,
        losses: 0,
        notPlayed: 0,
        points: 0,
      }));

      // Send update requests for all players
      const updatePromises = resetPlayers.map((player) =>
        this.http
          .put(`${environment.apiBaseUrl}/players/${player.id}`, player, { withCredentials: true })
          .toPromise()
      );

      Promise.all(updatePromises)
        .then(() => {
          this.loadPlayers();
          alert("All player scores have been reset to 0.");
        })
        .catch((error) => {
          console.error("Error resetting player scores:", error);
          alert("Error resetting player scores. Please try again.");
        });
    });
  }

  saveMatch(match: Match) {
    this.http
      .put(`${environment.apiBaseUrl}/matches/${match.id}`, match, { withCredentials: true })
      .subscribe(() => {
        this.loadMatches();
      });
  }

  getMatchesForWeek(week: number) {
    return this.matches.filter((m) => m.week === week);
  }

  startNewSeason() {
  this.http.post(`${environment.apiBaseUrl}/season/start`, {}, { withCredentials: true }).subscribe(() => {
      this.loadSeasons();
    });
  }

  saveCurrentSeason() {
    if (this.currentSeason) {
  this.http
  .post(`${environment.apiBaseUrl}/season/save`, {
          season: this.currentSeason.id,
          players: this.players,
          matches: this.matches,
    }, { withCredentials: true })
        .subscribe({
          next: () => {
            console.log("Season saved successfully");
            this.loadSeasons();
          },
          error: (error) => {
            console.error("Error saving season:", error);
          },
        });
    }
  }

  deleteSeason(seasonId: number) {
    const season = this.seasons.find((s) => s.id === seasonId);
    const name = season ? season.name : String(seasonId);
    this.showConfirm(
      `Delete season "${name}" and ALL associated data for this season?\n\n` +
        `This will remove the season record and may orphan or remove matches related to it. This action cannot be undone.`
    ).then((confirmed) => {
      if (!confirmed) return;
      this.http
        .delete(`${environment.apiBaseUrl}/seasons/${seasonId}`, { withCredentials: true })
        .subscribe(() => {
          this.loadSeasons();
        });
    });
  }

  clearLocalStorage() {
    this.showConfirm(
      "⚠️ WARNING: This will permanently delete ALL tournament data!\n\n" +
        "This includes:\n" +
        "• All matches and results\n" +
        "• All seasons and tournaments\n" +
        "• All games in the database\n\n" +
        "This action CANNOT be undone!\n\n" +
        "Are you absolutely sure you want to continue?"
    ).then((confirmed) => {
      if (!confirmed) return;

      // Clear localStorage
      localStorage.removeItem("rnd_selectedMatches");
      localStorage.removeItem("rnd_roundRobinMatches");

      // Clear matches from backend
  this.http.delete(`${environment.apiBaseUrl}/matches/all`, { withCredentials: true }).subscribe({
        next: () => {
          console.log("All matches cleared from server");
          this.loadMatches(); // Refresh the match list
        },
        error: (error) => {
          console.error("Error clearing matches from server:", error);
        },
      });
    });

    // Optionally clear other local data if needed
  }

  editPlayer(player: Player) {
    this.newPlayerName = player.name;
    this.newPlayerWins = player.wins;
    this.newPlayerLosses = player.losses;
    this.newPlayerNotPlayed = player.notPlayed;
    // Optionally set an editing state to show save/cancel
  }

  // New edit player methods
  startEditPlayer(player: Player) {
    this.editingPlayer = player;
    this.editPlayerName = player.name;
    this.editPlayerWins = player.wins;
    this.editPlayerLosses = player.losses;
    this.editPlayerNotPlayed = player.notPlayed;
    this.editPlayerPoints = player.points;
  }

  saveEditedPlayer() {
    if (this.editingPlayer) {
      this.editingPlayer.name = this.editPlayerName;
      this.editingPlayer.wins = this.editPlayerWins;
      this.editingPlayer.losses = this.editPlayerLosses;
      this.editingPlayer.notPlayed = this.editPlayerNotPlayed;
      this.editingPlayer.points = this.editPlayerPoints; // Use manually entered points

      this.savePlayer(this.editingPlayer);
      this.cancelEdit();
    }
  }

  cancelEdit() {
    this.editingPlayer = null;
    this.editPlayerName = "";
    this.editPlayerWins = 0;
    this.editPlayerLosses = 0;
    this.editPlayerNotPlayed = 0;
    this.editPlayerPoints = 0;
  }

  // Manual matchup methods
  getWeekOptions(): number[] {
    const maxWeeks = this.currentSeason?.weeks || 14;
    return Array.from({ length: maxWeeks }, (_, i) => i + 1);
  }

  addManualMatchup() {
    if (
      this.manualMatchPlayer1 &&
      this.manualMatchPlayer2 &&
      this.manualMatchPlayer1 !== this.manualMatchPlayer2
    ) {
      const newMatch: Match = {
        week: this.manualMatchWeek,
        season: this.currentSeason?.id || 1, // Assign to current season
        player1: this.manualMatchPlayer1,
        player2: this.manualMatchPlayer2,
        status: "scheduled",
        played: false,
      };

      // Add to local matches array
      this.matches.push(newMatch);

      // Send to backend
      this.http
        .post(`${environment.apiBaseUrl}/matches`, this.matches)
        .subscribe(() => {
          this.loadMatches();
          // Reset form
          this.manualMatchPlayer1 = "";
          this.manualMatchPlayer2 = "";
        });
    }
  }

  deleteMatch(match: Match) {
    this.showConfirm(
      `Delete match: ${match.player1} vs ${match.player2}?`
    ).then((confirmed) => {
      if (!confirmed) return;
      // Remove from local array
      this.matches = this.matches.filter(
        (m) =>
          !(
            m.week === match.week &&
            m.player1 === match.player1 &&
            m.player2 === match.player2
          )
      );

      // Update backend
      this.http
        .post(`${environment.apiBaseUrl}/matches`, this.matches)
        .subscribe(() => {
          this.loadMatches();
        });
    });
  }

  // Winner/Loser functionality methods
  setMatchWinner(match: Match, winner: string) {
    match.winner = winner;
    match.loser = match.player1 === winner ? match.player2 : match.player1;
    match.status = "completed";
    match.played = true;

    // Update player stats
    this.updatePlayerStats(match.winner, "win");
    this.updatePlayerStats(match.loser, "loss");

    // Save match to backend
    this.saveMatch(match);
  }

  setMatchSkipped(match: Match) {
    match.status = "skipped";
    match.played = false;

    // Both players get 0 points for skipped match
    this.updatePlayerStats(match.player1, "skip");
    this.updatePlayerStats(match.player2, "skip");

    // Save match to backend
    this.saveMatch(match);
  }

  setMatchDQ(match: Match, dqPlayer: string) {
    match.status = "dq";
    match.dqPlayer = dqPlayer;
    match.winner = match.player1 === dqPlayer ? match.player2 : match.player1;
    match.played = true;

    // Winner gets 2 points, DQ player gets 0 points. We DO NOT assign match.loser for a DQ so it does not count as a loss.
    this.updatePlayerStats(match.winner, "win");
    this.updatePlayerStats(dqPlayer, "dq");

    // Save match to backend
    this.saveMatch(match);
  }

  resetMatch(match: Match) {
    // Revert player stats if match was completed
    if (match.status === "completed" && match.winner && match.loser) {
      this.revertPlayerStats(match.winner, "win");
      this.revertPlayerStats(match.loser, "loss");
    } else if (match.status === "skipped") {
      this.revertPlayerStats(match.player1, "skip");
      this.revertPlayerStats(match.player2, "skip");
    } else if (match.status === "dq" && match.winner && match.dqPlayer) {
      this.revertPlayerStats(match.winner, "win");
      this.revertPlayerStats(match.dqPlayer, "dq");
    }

    // Reset match properties
    match.winner = undefined;
    match.loser = undefined;
    match.dqPlayer = undefined;
    match.status = "scheduled";
    match.played = false;

    // Save match to backend
    this.saveMatch(match);
  }

  updatePlayerStats(
    playerName: string,
    result: "win" | "loss" | "skip" | "dq"
  ) {
    const player = this.players.find((p) => p.name === playerName);
    if (player) {
      switch (result) {
        case "win":
          player.wins++;
          player.points += 2;
          break;
        case "loss":
          player.losses++;
          player.points += 1;
          break;
        case "skip":
          player.notPlayed++;
          // No points for skipped matches
          break;
        case "dq":
          player.notPlayed++; // DQ counts as not played, not a loss
          // DQ gets 0 points (no points added)
          break;
      }
      this.savePlayer(player);
    }
  }

  revertPlayerStats(
    playerName: string,
    result: "win" | "loss" | "skip" | "dq"
  ) {
    const player = this.players.find((p) => p.name === playerName);
    if (player) {
      switch (result) {
        case "win":
          player.wins = Math.max(0, player.wins - 1);
          player.points = Math.max(0, player.points - 2);
          break;
        case "loss":
          player.losses = Math.max(0, player.losses - 1);
          player.points = Math.max(0, player.points - 1);
          break;
        case "skip":
          player.notPlayed = Math.max(0, player.notPlayed - 1);
          // No points to revert for skipped matches
          break;
        case "dq":
          player.notPlayed = Math.max(0, player.notPlayed - 1);
          // No points to revert for DQ (they got 0 points)
          break;
      }
      this.savePlayer(player);
    }
  }

  getMatchStatusText(match: Match): string {
    switch (match.status) {
      case "completed":
        return "Completed";
      case "skipped":
        return "Skipped";
      case "dq":
        return "DQ";
      default:
        return "Scheduled";
    }
  }

  // Game management methods
  loadGames() {
    this.http.get<Game[]>(`${environment.apiBaseUrl}/games`).subscribe({
      next: (data) => {
        console.log("Games loaded:", data);
        if (Array.isArray(data)) {
          this.games = data;
        }
      },
      error: (error) => {
        console.error("Error loading games:", error);
      },
    });
  }

  addGame() {
    if (this.addingGame) return; // Prevent double-clicking

    if (this.newGameName && this.newGameName.trim()) {
      this.addingGame = true;
      const trimmedName = this.newGameName.trim();
      const trimmedCategory = this.newGameCategory
        ? this.newGameCategory.trim()
        : "";

      // Check if game name already exists
      const existingGame = this.games.find(
        (g) => g.name.toLowerCase() === trimmedName.toLowerCase()
      );

      if (existingGame) {
        alert("A game with this name already exists!");
        this.addingGame = false;
        return;
      }

      const createAndSend = (imageUrl?: string) => {
        const newGame: Game = {
          id: 0,
          name: trimmedName,
          category: trimmedCategory || undefined,
          isChosen: false,
          image: imageUrl,
        };

        console.log("Adding new game:", newGame);

  this.http.post<Game>(`${environment.apiBaseUrl}/games`, newGame, { withCredentials: true }).subscribe({
          next: (response) => {
            console.log("Game added successfully:", response);
            this.loadGames();
            this.newGameName = "";
            this.newGameCategory = "";
            this.addingGame = false;
            alert(`Game "${trimmedName}" added successfully!`);
          },
          error: (error) => {
            console.error("Error adding game:", error);
            this.addingGame = false;

            // Parse server error message if available
            let errorMessage = "Failed to add game. Please try again.";
            if (error.error && error.error.error) {
              errorMessage = error.error.error;
            } else if (error.message) {
              errorMessage = error.message;
            }

            alert(errorMessage);
          },
        });
      };

      createAndSend(undefined);
    } else {
      alert("Please enter a valid game name.");
    }
  }

  startEditGame(game: Game) {
    this.editingGame = game;
    this.editGameName = game.name;
    this.editGameCategory = game.category || "";
  }

  saveEditedGame() {
    if (this.editingGame) {
      this.editingGame.name = this.editGameName;
      this.editingGame.category = this.editGameCategory || undefined;

      this.http
        .put(
          `${environment.apiBaseUrl}/games/${this.editingGame.id}`,
          this.editingGame,
          { withCredentials: true }
        )
        .subscribe({
          next: () => {
            this.loadGames();
            this.cancelGameEdit();
          },
          error: (error) => {
            console.error("Error updating game:", error);
          },
        });
    }
  }

  cancelGameEdit() {
    this.editingGame = null;
    this.editGameName = "";
    this.editGameCategory = "";
  }

  deleteGame(id: number) {
    const game = this.games.find((g) => g.id === id);
    const name = game ? game.name : String(id);
    this.showConfirm(
      `Delete game "${name}"? This will remove it from the available games list.`
    ).then((confirmed) => {
      if (!confirmed) return;
  this.http.delete(`${environment.apiBaseUrl}/games/${id}`, { withCredentials: true }).subscribe({
        next: () => {
          this.loadGames();
        },
        error: (error) => {
          console.error("Error deleting game:", error);
        },
      });
    });
  }

  assignWeekToGame(game: Game) {
    const selectedWeek = this.gameWeekSelections[game.id];
    if (!selectedWeek || selectedWeek === null) {
      return; // Don't assign if no week is selected
    }

    // Check if there's an active season
    if (!this.currentSeason) {
      alert('No active season found. Please activate a season first.');
      return;
    }

    // Check if the selected week is valid for the current season
    if (selectedWeek > this.currentSeason.weeks) {
      alert(`Week ${selectedWeek} is not valid for the current season. Max weeks: ${this.currentSeason.weeks}`);
      return;
    }
    
    const updated = { ...game, assignedWeek: selectedWeek, assignedSeason: this.currentSeason.id };
  this.http.put(`${environment.apiBaseUrl}/games/${game.id}`, updated, { withCredentials: true }).subscribe({
      next: () => {
        this.loadGames();
        this.gameWeekSelections[game.id] = null; // Reset the dropdown
      },
      error: (err) => {
        console.error('Error assigning game week:', err);
        alert('Failed to assign game to week. See console for details.');
      }
    });
  }

  assignWeek(game: Game) {
    if (!this.assignWeekNumber || this.assignWeekNumber === null) {
      return; // Don't assign if no week is selected
    }
    
    const updated = { ...game, assignedWeek: this.assignWeekNumber, assignedSeason: this.currentSeason?.id };
  this.http.put(`${environment.apiBaseUrl}/games/${game.id}`, updated, { withCredentials: true }).subscribe({
      next: () => {
        this.loadGames();
        alert(`Assigned ${game.name} to Week ${this.assignWeekNumber}`);
        this.assignWeekNumber = null; // Reset the dropdown
      },
      error: (err) => {
        console.error('Error assigning game week:', err);
        alert('Failed to assign game to week. See console for details.');
      }
    });
  }

  startAssignWeek(game: Game) {
    this.assigningGameId = game.id;
    this.assignWeekNumber = this.currentSeason && game.assignedWeek ? game.assignedWeek : (this.currentActiveWeek || 1);
  }

  cancelAssignWeek() {
    this.assigningGameId = null;
    this.assignWeekNumber = 1;
  }

  unassignGame(game: Game) {
    const updated = { 
      ...game, 
      assignedWeek: null, 
      assignedSeason: null 
    };
  this.http.put(`${environment.apiBaseUrl}/games/${game.id}`, updated, { withCredentials: true }).subscribe({
      next: () => {
        // Reset the dropdown selection for this game
        this.gameWeekSelections[game.id] = null;
        // Update the local game object immediately for better UX
        const gameIndex = this.games.findIndex(g => g.id === game.id);
        if (gameIndex !== -1) {
          this.games[gameIndex] = { ...this.games[gameIndex], assignedWeek: undefined, assignedSeason: undefined };
        }
        this.loadGames();
      },
      error: (err) => {
        console.error('Error unassigning game week:', err);
        alert('Failed to unassign game. See console for details.');
      }
    });
  }

  // Tab management methods
  setActiveTab(tab: string): void {
    this.activeTab = tab;
    
    // When switching to matches tab, sync Add Match week with the current week filter
    if (tab === 'matches' && this.selectedWeekFilter !== null && this.selectedWeekFilter !== undefined) {
      this.manualMatchWeek = this.selectedWeekFilter;
    }
  }

  // Show a styled confirmation dialog and return a Promise<boolean>
  showConfirm(message: string): Promise<boolean> {
    this.confirmMessage = message;
    this.confirmVisible = true;
    return new Promise<boolean>((resolve) => {
      this.confirmResolver = resolve;
    });
  }

  // Called by the template to accept
  resolveConfirm() {
    if (this.confirmResolver) this.confirmResolver(true);
    this.confirmVisible = false;
    this.confirmResolver = null;
  }

  // Called by the template to cancel
  rejectConfirm() {
    if (this.confirmResolver) this.confirmResolver(false);
    this.confirmVisible = false;
    this.confirmResolver = null;
  }

  // Helper methods for overview stats
  getActiveMatchesCount(): number {
    return this.matches.filter(
      (match) => match.status !== "completed" && match.status !== "dq"
    ).length;
  }

  getAvailableGamesCount(): number {
    return this.games.filter((game) => !game.isChosen).length;
  }

  // Week and Season filtering methods
  getFilteredMatches(): Match[] {
    let filtered = [...this.matches];

    // If a season filter is explicitly set (non-null), apply it.
    // If it's null, that means "All Seasons" so do not filter by season.
    if (
      this.selectedSeasonFilter !== null &&
      this.selectedSeasonFilter !== undefined
    ) {
      filtered = filtered.filter(
        (match) => match.season === this.selectedSeasonFilter
      );
    }

    // Filter by week if selected (null means all weeks)
    if (
      this.selectedWeekFilter !== null &&
      this.selectedWeekFilter !== undefined
    ) {
      filtered = filtered.filter(
        (match) => match.week === this.selectedWeekFilter
      );
    }

    // If no explicit season filter was set (both in-memory and persisted), default to current season
    // This happens on initial load when initializeFilters sets selectedSeasonFilter. If caller wants "All Seasons",
    // they should explicitly select the All Seasons option which sets selectedSeasonFilter to null.
    if (
      (this.selectedSeasonFilter === null ||
        this.selectedSeasonFilter === undefined) &&
      this.currentSeason &&
      filtered.length === this.matches.length
    ) {
      // No season filter applied and we haven't filtered anything yet -> default to current season
      filtered = this.matches.filter(
        (match) => match.season === this.currentSeason!.id
      );
    }

    return filtered.sort((a, b) => {
      // Sort by week first, then by matchup id (if present)
      if (a.week !== b.week) return a.week - b.week;
      return (a.id || 0) - (b.id || 0);
    });
  }

  getAvailableWeeks(): number[] {
    if (!this.currentSeason) return [];
    return Array.from({ length: this.currentSeason.weeks }, (_, i) => i + 1);
  }

  // Group matches by week for clearer display in admin
  getMatchesGroupedByWeek(): { week: number; matches: Match[] }[] {
    const grouped: Record<number, Match[]> = {};
    const matches = this.getMatchesForCurrentView();
    matches.forEach((m) => {
      const wk = Number(m.week) || 0;
      if (!grouped[wk]) grouped[wk] = [];
      grouped[wk].push(m);
    });
    const weeks = Object.keys(grouped)
      .map((k) => Number(k))
      .sort((a, b) => a - b);
    return weeks.map((w) => ({
      week: w,
      matches: grouped[w].sort((a, b) => (a.id || 0) - (b.id || 0)),
    }));
  }

  // Filter games by search term
  getFilteredGames(): Game[] {
    const q = (this.gameSearch || "").trim().toLowerCase();
    if (!q) return this.games;
    return this.games.filter(
      (g) =>
        (g.name || "").toLowerCase().includes(q) ||
        (g.category || "").toLowerCase().includes(q)
    );
  }

  getAvailableSeasons(): Season[] {
    return this.seasons; // Show all seasons, not just non-draft ones
  }

  setWeekFilter(week: any): void {
    // coerce to number|null (selects can emit strings)
    const val =
      week === null || week === "null" || week === undefined
        ? null
        : Number(week);
    this.selectedWeekFilter = Number.isNaN(val) ? null : val;
    
    // Sync the Add Match week dropdown with the week filter
    if (this.selectedWeekFilter !== null && this.selectedWeekFilter !== undefined) {
      this.manualMatchWeek = this.selectedWeekFilter;
    }
    
    // persist selection so navigation away and back retains filters
    localStorage.setItem(
      "admin_selectedWeekFilter",
      this.selectedWeekFilter === null
        ? "null"
        : String(this.selectedWeekFilter)
    );
  }

  setSeasonFilter(seasonId: any): void {
    // coerce to number|null
    const val =
      seasonId === null || seasonId === "null" || seasonId === undefined
        ? null
        : Number(seasonId);
    this.selectedSeasonFilter = Number.isNaN(val) ? null : val;
    // Reset week filter when changing seasons
    this.selectedWeekFilter = null;
    // Persist season filter selection
    localStorage.setItem(
      "admin_selectedSeasonFilter",
      this.selectedSeasonFilter === null
        ? "null"
        : String(this.selectedSeasonFilter)
    );
    // Also persist clearing week since we reset it here
    localStorage.setItem("admin_selectedWeekFilter", "null");
  }

  clearFilters(): void {
    this.selectedWeekFilter = null;
    this.selectedSeasonFilter = null;
    // Remove persisted filters
    localStorage.removeItem("admin_selectedSeasonFilter");
    localStorage.removeItem("admin_selectedWeekFilter");
  }

  getMatchesForCurrentView(): Match[] {
    return this.getFilteredMatches();
  }

  // Check if we can add a manual match
  canAddManualMatch(): boolean {
    return !!(
      this.manualMatchPlayer1 &&
      this.manualMatchPlayer2 &&
      this.manualMatchPlayer1 !== this.manualMatchPlayer2 &&
      this.currentSeason
    );
  }

  // Get selected season name for display
  getSelectedSeasonName(): string {
    if (!this.selectedSeasonFilter) return "";
    const season = this.seasons.find((s) => s.id === this.selectedSeasonFilter);
    return season ? season.name : "";
  }

  // Get the game assigned to a specific week and season
  getGameForWeek(week: number, seasonId?: number): Game | undefined {
    // First try to find with season matching, then without season restriction
    let game = this.games.find(game => 
      game.assignedWeek === week && 
      seasonId && game.assignedSeason === seasonId
    );
    
    // If no game found with season filter, try without season restriction
    if (!game) {
      game = this.games.find(game => game.assignedWeek === week);
    }
    
    return game;
  }

  // Activate a season (deactivates others)
  activateSeason(season: Season): void {
    // Deactivate all seasons first
    this.seasons.forEach(
      (s) => (s.status = s.status === "active" ? "completed" : s.status)
    );

    // Activate the selected season
    season.status = "active";

    // Update on server
    this.http
  .put<Season>(`${environment.apiBaseUrl}/seasons/${season.id}`, season, { withCredentials: true })
      .subscribe({
        next: () => {
          this.loadSeasons(); // Reload to get updated data
        },
        error: (error) => {
          console.error("Error activating season:", error);
        },
      });
  }

  // Initialize filters to current season on load
  initializeFilters(): void {
    // Only default to current season if the user has no persisted filter choice.
    // This preserves an explicit "All Seasons" selection (null) when it was saved.
    const persisted = localStorage.getItem("admin_selectedSeasonFilter");
    if (!persisted && this.currentSeason) {
      this.selectedSeasonFilter = this.currentSeason.id;
    }
  }

  // Set active week for tournament management
  setActiveWeek(week: number): void {
    this.currentActiveWeek = week;

    // Save to localStorage for persistence
    localStorage.setItem("currentActiveWeek", week.toString());

    // Also update the data service if it exists
  this.http.post(`${environment.apiBaseUrl}/active-week`, { week }, { withCredentials: true }).subscribe({
      next: () => {
        console.log("Active week updated to:", week);
      },
      error: (error) => {
        console.error("Error updating active week:", error);
      },
    });
  }

  // Load active week from storage/server
  loadActiveWeek(): void {
    // First try localStorage
    const savedWeek = localStorage.getItem("currentActiveWeek");
    if (savedWeek) {
      this.currentActiveWeek = parseInt(savedWeek);
    }

    // Then try to get from server
    this.http
      .get<{ week: number }>(`${environment.apiBaseUrl}/active-week`)
      .subscribe({
        next: (data) => {
          if (data && data.week) {
            this.currentActiveWeek = data.week;
          }
        },
        error: () => {
          // Server doesn't have active week endpoint yet, use localStorage value
          console.log(
            "Using localStorage active week:",
            this.currentActiveWeek
          );
        },
      });
  }

  onImageError(event: any, playerName: string): void {
    // Fallback to a default image or hide the image
    event.target.src = '/assets/images/players/default-player.jpg';
    // Alternative: hide the image and show just the name
    // event.target.style.display = 'none';
  }
}
