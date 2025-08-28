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
    <header class="header">
      <div class="container">
        <nav class="nav">
          <div class="logo">
            <a routerLink="/home" class="logo-link">
              <img src="assets/edwards.png" alt="Edwards Web Development" class="logo-image">
            </a>
          </div>
          
          <div class="nav-links" [class.active]="isMenuOpen">
            <a routerLink="/home" routerLinkActive="active" class="nav-link nav-underline" (click)="closeMenu()">Home</a>
            <a routerLink="/about" routerLinkActive="active" class="nav-link nav-underline" (click)="closeMenu()">About</a>
            <a routerLink="/services" routerLinkActive="active" class="nav-link nav-underline" (click)="closeMenu()">Services</a>
            <a routerLink="/contact" routerLinkActive="active" class="nav-link nav-underline" (click)="closeMenu()">Contact</a>
            <a routerLink="/projects" routerLinkActive="active" class="nav-link nav-underline" (click)="closeMenu()">Projects</a>
          </div>
          
          <button class="menu-toggle" (click)="toggleMenu()">
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