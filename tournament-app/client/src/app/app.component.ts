import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header.component';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent],
  template: `
    <app-header></app-header>
    <div class="access-mode">
      Current Mode: {{ authService.isAdminMode ? 'Admin' : 'Viewer' }}
    </div>
    <router-outlet></router-outlet>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
    }
    .access-mode {
      text-align: center;
      margin: 10px 0;
      font-weight: bold;
    }
  `]
})
export class AppComponent {
  constructor(public authService: AuthService) {}
}
