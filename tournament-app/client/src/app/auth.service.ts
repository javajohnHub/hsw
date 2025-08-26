import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private isAdmin: boolean = false;
  private adminSubject = new BehaviorSubject<boolean>(false);
  public admin$ = this.adminSubject.asObservable();

  constructor(private router: Router) {
    // Determine admin mode synchronously so route guards work during navigation
    this.checkAccessLevel();
  }

  private checkAccessLevel(): void {
    const params = new URLSearchParams(window.location.search);
    const adminParam = params.get('admin');
    const ls = localStorage.getItem('isAdmin');

    // Allow admin mode via query param or localStorage (useful for iframe/dev flows)
    this.isAdmin = adminParam === '1' || ls === '1' || ls === 'true';

  // update observable
  this.adminSubject.next(this.isAdmin);

    console.log('AuthService: adminParam=', adminParam, 'localStorage.isAdmin=', ls, '=> isAdmin=', this.isAdmin);
  }

  // Helper to toggle admin mode for debugging (persists to localStorage)
  public setAdminMode(value: boolean) {
    this.isAdmin = !!value;
    try { localStorage.setItem('isAdmin', this.isAdmin ? '1' : '0'); } catch (e) {}
  this.adminSubject.next(this.isAdmin);
    console.log('AuthService.setAdminMode ->', this.isAdmin);
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
}
