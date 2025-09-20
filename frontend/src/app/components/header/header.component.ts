import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <header class="hsw-header" role="banner">
      <div class="hsw-container">
        <nav class="hsw-nav" role="navigation" aria-label="Main navigation">
          <div class="hsw-brand">
            <a href="/tournaments" class="hsw-logo" (click)="closeMenu()">
              <span class="hsw-site">highscorewins.com</span>
            </a>
          </div>

          <div class="hsw-links" [class.active]="isMenuOpen">
            <a routerLink="/home" routerLinkActive="active" class="hsw-link" (click)="closeMenu()">Home</a>
            <a routerLink="/eggnog" routerLinkActive="active" class="hsw-link" (click)="closeMenu()">Eggnog Challenge</a>
            <a routerLink="/tournaments-embed" routerLinkActive="active" class="hsw-link" (click)="closeMenu()">Tournaments</a>
          </div>

          <button class="hsw-toggle" (click)="toggleMenu()" aria-label="Toggle navigation">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </nav>
      </div>
    </header>
  `,
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  isMenuOpen = false;
  private routerSubscription: Subscription = new Subscription();

  constructor(private router: Router) {}

  ngOnInit() {
    // Subscribe to route changes to close menu on navigation
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.closeMenu();
      });
  }

  ngOnDestroy() {
    this.routerSubscription.unsubscribe();
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }
}