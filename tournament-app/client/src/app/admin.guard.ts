import { Injectable } from '@angular/core';
import { CanActivate, Router, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    const attemptedRoute = state.url || '/';
    this.authService.logAccessAttempt(attemptedRoute);

    console.log('Checking admin mode in AdminGuard:', this.authService.isAdminMode, 'for', attemptedRoute);

    if (this.authService.isAdminMode) {
      return true;
    }

    // Try a quick refresh in case auth cookie was just set
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (this.authService as any)['refreshAuthStatus'] === 'function') {
      await (this.authService as any)['refreshAuthStatus']();
      if (this.authService.isAdminMode) return true;
    }

    if (this.authService.isAdminRoute(attemptedRoute)) {
      console.warn(`Unauthorized access attempt to admin route: ${attemptedRoute}`);
    }

  this.router.navigateByUrl('/public');
  return false;
  }
}
