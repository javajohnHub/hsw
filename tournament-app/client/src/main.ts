import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, RouterOutlet } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { PublicPageComponent } from './app/public-page.component';
import { AdminPageComponent } from './app/admin-page.component';
import { DataService } from './app/data.service';
import { AdminGuard } from './app/admin.guard';
import { AuthService } from './app/auth.service';

// During local development, ensure lazy-loaded chunks are requested from the dev server
// (ng serve) to avoid the backend (eg. port 4000) returning HTML for chunk URLs.
try {
  // Use the current origin (protocol + host + port) so dynamic chunks are loaded
  // from the same server that served the index.html. This avoids hardcoding
  // a dev port (4300) which breaks when the app is embedded at a different
  // origin/port (for example when main app runs on 3000 and tournament on 4000).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__webpack_public_path__ = `${location.protocol}//${location.host}/`;
  console.log('__webpack_public_path__ set to', (window as any).__webpack_public_path__);
} catch (e) {
  // ignore if not supported
}

const routes = [
  { path: '', component: PublicPageComponent },
  { path: 'public', component: PublicPageComponent },
  { 
    path: 'admin', 
    component: AdminPageComponent,
    canActivate: [AdminGuard]
  },
  { 
    path: 'wheel', 
    loadComponent: () => import('./app/select-matches.component').then(m => m.SelectMatchesComponent),
    canActivate: [AdminGuard]
  },
  { 
    path: 'games', 
    loadComponent: () => import('./app/games-wheel.component').then(m => m.GamesWheelComponent),
    canActivate: [AdminGuard]
  },
  { 
    path: 'history', 
    loadComponent: () => import('./app/history-page.component').then(m => m.HistoryPageComponent),
    canActivate: [AdminGuard]
  },
  { path: '**', redirectTo: '' }
];

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    DataService,
    AuthService,
    AdminGuard
  ]
})
  .catch(err => console.error(err));
