import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, firstValueFrom, timer } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private isAdmin = false;
  private adminSubject = new BehaviorSubject<boolean>(false);
  public admin$ = this.adminSubject.asObservable();

  constructor(private router: Router) {
    // Initial auth check and periodic refresh (lightweight)
    this.refreshAuthStatus();
    // Re-check periodically in case cookie expires or logout occurs in another tab
    timer(0, 60_000).subscribe(() => this.refreshAuthStatus());
  }
  private async refreshAuthStatus(): Promise<void> {
    try {
      const resp = await fetch('/api/auth/status', { credentials: 'include' });
      if (!resp.ok) throw new Error('status not ok');
      const json = await resp.json();
      const next = !!json?.success;
      if (this.isAdmin !== next) {
        this.isAdmin = next;
        this.adminSubject.next(this.isAdmin);
      }
    } catch (e) {
      if (this.isAdmin !== false) {
        this.isAdmin = false;
        this.adminSubject.next(false);
      }
    }
  }

  public canAccess(route: string): boolean {
    if (this.isAdmin) {
      return true;
    }
    // Only allow access to the public page (root and /public) for unauthenticated users
    return route === '/' || route === '/public' || route === '';
  }

  public get isAdminMode(): boolean {
    return this.isAdmin;
  }

  public redirectToPublic(): void {
    console.log('Redirecting to public route...');
    // Navigate to root (/) which maps to public page
    this.router.navigateByUrl('/').catch(err => {
      console.error('Navigation to root failed:', err);
    });
  }

  public logAccessAttempt(route: string): void {
    console.log(`Access attempt to route: ${route}, Admin mode: ${this.isAdmin}`);
  }

  public isAdminRoute(route: string): boolean {
    const adminRoutes = ['/admin', '/wheel', '/history'];
    return adminRoutes.includes(route);
  }

  public isAdminUser(): boolean {
    return this.isAdmin;
  }

  // Optional: call logout endpoint and update state
  public async logout(): Promise<void> {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch {}
    this.isAdmin = false;
    this.adminSubject.next(false);
    this.redirectToPublic();
  }
}
