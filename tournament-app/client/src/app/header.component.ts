import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="app-header">
      <div class="header-container">
        <div class="logo">
          <!-- Use onerror to fallback to a generic logo if asset missing -->
          <img [src]="logoSrc" alt="Tournament Logo" class="header-logo"
            (error)="onLogoError($event)">
          <span class="tagline">Tournament Management</span>
        </div>
        <nav class="nav-tabs">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-tab">
            Public
          </a>
          <a *ngIf="authService.isAdminMode" routerLink="/wheel" routerLinkActive="active" class="nav-tab">
            Wheel
          </a>
          <a *ngIf="authService.isAdminMode" routerLink="/games" routerLinkActive="active" class="nav-tab">
            Games
          </a>
          <a *ngIf="authService.isAdminMode" routerLink="/admin" routerLinkActive="active" class="nav-tab">
            Admin
          </a>
        </nav>
        
      </div>
    </header>
  `,
  styles: [`
    .app-header {
      background: linear-gradient(135deg, #181a1b 0%, #2a2d2e 100%);
      border-bottom: 3px solid #53fc19;
      box-shadow: 0 2px 8px rgba(83, 252, 25, 0.3);
      position: sticky;
      top: 0;
      z-index: 1000;
  height: 70px; /* Fixed header height */
    }
    
    .header-container {
      max-width: 1200px; /* keep content width readable */
      margin: 0 auto;     /* center the whole header block horizontally */
      display: flex;
      flex-direction: row; /* single-row layout */
      justify-content: space-between; /* logo left, nav right */
      align-items: center;
      gap: 16px;
      padding: 12px 24px;
      height: 100%;
      width: 100%;
      box-sizing: border-box;
    }
    
    .logo {
      display: flex;
      align-items: center;
  gap: 8px;
      flex-shrink: 0;
  min-width: 0;
    }
    
    .header-logo {
      height: 45px; /* Much smaller, appropriate for header */
      width: auto;
      max-width: 120px; /* Prevent extreme widths */
  border-radius: 8px;
  box-shadow: none; /* remove glow/border */
  border: none;      /* ensure no border is shown */
      object-fit: contain; /* Maintain aspect ratio */
    }
    
    .tagline {
      color: #fff;
      font-size: 0.9rem;
      opacity: 0.8;
  margin-left: 8px;
      white-space: nowrap;
    }
    
    .nav-tabs {
      display: flex;
      gap: 10px;
      flex-shrink: 0;
      justify-content: flex-end; /* align pills to the right */
      width: auto;
      margin-left: auto; /* push nav to far right in case of extra middle content */
    }
    
    .nav-tab {
      background: #333;
      color: #fff;
      text-decoration: none;
      padding: 8px 16px; /* Reduced padding for compact header */
      border: none; /* Remove borders from text header tabs */
      font-weight: bold;
      font-size: 0.9rem; /* Slightly smaller text */
      transition: all 0.3s ease;
      position: relative;
      white-space: nowrap;
      border-radius: 9999px; /* Pill shape */
    }
    
    /* No special first/last styling needed with pill tabs */
    
    .nav-tab:hover {
      background: #53fc19;
      color: #181a1b;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(83, 252, 25, 0.4);
    }
    
    .nav-tab.active {
      background: #53fc19;
      color: #181a1b;
      box-shadow: 0 0 12px rgba(83, 252, 25, 0.6);
    }
    
    .nav-tab.active:hover {
      transform: none;
    }
    
    
    
    @media (max-width: 768px) {
      .app-header {
  height: auto; /* Allow flexible height on mobile */
      }
      
      .header-container {
  flex-direction: column; /* stack on small screens */
        gap: 12px;
        padding: 12px 16px;
      }
      
      .header-logo {
        height: 35px; /* Even smaller on mobile */
        max-width: 100px;
      }
      
      .tagline {
        font-size: 0.8rem;
      }
      
      .nav-tabs {
  width: 100%;
        overflow-x: auto; /* Allow scrolling if needed */
      }
      
      .nav-tab {
        flex: 1;
        text-align: center;
        padding: 8px 12px;
        font-size: 0.8rem;
        min-width: 60px;
      }
      
      
    }
    
    @media (max-width: 480px) {
      .header-logo {
        height: 30px;
        max-width: 80px;
      }
      
      .tagline {
        display: none; /* Hide tagline on very small screens */
      }
      
      .nav-tab {
        padding: 6px 8px;
        font-size: 0.75rem;
      }
    }
  `]
})
export class HeaderComponent implements OnInit {
  // start with a guaranteed fallback so header never shows a broken icon
  logoSrc = 'assets/logo-fallback.png';
  originalLogo = 'assets/1744773341621aaaa.webp';

  onLogoError(event: Event): void {
    const target = event?.target as HTMLImageElement | null;
    if (target) {
      if (!target.src || !target.src.includes('logo-fallback.png')) {
        target.src = 'assets/logo-fallback.png';
      }
    }
  }

  constructor(public authService: AuthService) {}

  ngOnInit(): void {
    // Try to load the original logo asynchronously; if it loads, replace the fallback.
    const probe = new Image();
    probe.onload = () => {
      this.logoSrc = this.originalLogo;
    };
    probe.onerror = () => {
      // keep fallback
    };
    probe.src = this.originalLogo;
  }
}
