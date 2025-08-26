import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';

interface AuthRequest {
  readonly username: string;
  readonly password: string;
}

interface AuthResponse {
  readonly ok: boolean;
  readonly admin?: boolean;
  readonly error?: string;
  readonly success?: boolean;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="login">
      <div class="login__container">
        <!-- Login Form -->
        <div class="login__card" *ngIf="!iframeLoaded">
          <div class="login__header">
            <h1 class="login__title">Admin Access</h1>
            <p class="login__subtitle">
              Sign in to access administrative features and project management tools
            </p>
          </div>

          <form class="login__form" (submit)="onSubmit($event)">
            <div class="login__field">
              <label for="username" class="login__label">Username</label>
              <input 
                id="username"
                name="username" 
                type="text"
                class="login__input"
                placeholder="Enter your username" 
                [(ngModel)]="username" 
                required 
                [disabled]="isLoading"
                autocomplete="username"
              />
            </div>
            
            <div class="login__field">
              <label for="password" class="login__label">Password</label>
              <input 
                id="password"
                name="password" 
                type="password"
                class="login__input"
                placeholder="Enter your password"
                [(ngModel)]="password" 
                required 
                [disabled]="isLoading"
                autocomplete="current-password"
              />
            </div>
            
            <div class="login__actions">
              <button 
                type="submit" 
                class="login__button login__button--primary"
                [disabled]="isLoading || !username.trim() || !password.trim()">
                <span *ngIf="isLoading">Authenticating...</span>
                <span *ngIf="!isLoading">Sign In to Admin Panel</span>
              </button>
              
              <button 
                type="button" 
                class="login__button login__button--secondary" 
                (click)="goToProjects()"
                [disabled]="isLoading">
                View Public Demo Instead
              </button>
            </div>
          </form>
          
          <div class="login__error" *ngIf="errorMessage">
            <strong>Authentication Failed:</strong> {{ errorMessage }}
          </div>

          <div class="login__info">
            <h3 class="login__info-title">Admin Features Include:</h3>
            <ul class="login__info-list">
              <li>Full project management access</li>
              <li>Data editing and modification</li>
              <li>Administrative controls</li>
              <li>Advanced configuration options</li>
            </ul>
          </div>
        </div>

        <!-- Admin Panel iframe -->
        <div class="login__admin-panel" *ngIf="iframeLoaded">
          <div class="login__admin-controls">
            <div class="login__status-indicator">
              🔐 Admin Access Active
            </div>
            
            <button 
              class="login__logout-button" 
              (click)="logout()"
              title="Sign Out">
              🚪 Sign Out
            </button>
          </div>
          
          <iframe 
            class="login__admin-iframe"
            [src]="adminIframeUrl" 
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-top-navigation"
            title="Admin Project Management Panel">
          </iframe>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      padding: 2rem;
    }

    .login__container {
      width: 100%;
      max-width: 450px;
      position: relative;
    }

    .login__card {
      background: white;
      border-radius: 1rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      padding: 2.5rem;
      border: 1px solid #e1e5e9;
    }

    .login__header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .login__title {
      color: #007acc;
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      letter-spacing: -0.025em;
    }

    .login__subtitle {
      color: #6c757d;
      font-size: 0.95rem;
      margin: 0;
      line-height: 1.4;
    }

    .login__form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .login__field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .login__label {
      color: #374151;
      font-weight: 600;
      font-size: 0.875rem;
      letter-spacing: 0.025em;
    }

    .login__input {
      padding: 0.875rem 1rem;
      border: 2px solid #e5e7eb;
      border-radius: 0.5rem;
      font-size: 1rem;
      transition: all 0.2s ease;
      background: #fafbfc;
    }

    .login__input:focus {
      outline: none;
      border-color: #007acc;
      background: white;
      box-shadow: 0 0 0 3px rgba(0, 122, 204, 0.1);
    }

    .login__input:disabled {
      background: #f3f4f6;
      cursor: not-allowed;
      opacity: 0.7;
    }

    .login__actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }

    .login__button {
      padding: 0.875rem 1.5rem;
      border-radius: 0.5rem;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 2px solid transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 48px;
    }

    .login__button--primary {
      background: #007acc;
      color: white;
      border-color: #007acc;
    }

    .login__button--primary:hover:not(:disabled) {
      background: #005a9e;
      border-color: #005a9e;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 122, 204, 0.3);
    }

    .login__button--secondary {
      background: transparent;
      color: #6c757d;
      border-color: #dee2e6;
    }

    .login__button--secondary:hover:not(:disabled) {
      background: #f8f9fa;
      border-color: #adb5bd;
      color: #495057;
    }

    .login__button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .login__error {
      color: #dc3545;
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 1.5rem;
      font-size: 0.875rem;
      line-height: 1.4;
    }

    .login__info {
      border-top: 1px solid #e9ecef;
      padding-top: 1.5rem;
    }

    .login__info-title {
      color: #495057;
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
    }

    .login__info-list {
      margin: 0;
      padding-left: 1.25rem;
      color: #6c757d;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .login__info-list li {
      margin-bottom: 0.25rem;
    }

    /* Admin Panel Styles */
    .login__admin-panel {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 9998;
    }

    .login__admin-controls {
      position: fixed;
      top: 1.25rem;
      left: 1.25rem;
      z-index: 10001;
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .login__status-indicator {
      padding: 0.5rem 1rem;
      background: #28a745;
      color: white;
      border-radius: 0.5rem;
      font-weight: 600;
      font-size: 0.875rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .login__logout-button {
      padding: 0.5rem 1rem;
      background: #dc3545;
      color: white;
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.875rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      transition: all 0.3s ease;
    }

    .login__logout-button:hover {
      background: #c82333;
      transform: translateY(-2px);
    }

    .login__admin-iframe {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      border: none;
      z-index: 10000;
      background: white;
    }

    @media (max-width: 768px) {
      .login {
        padding: 1rem;
      }

      .login__card {
        padding: 2rem;
      }

      .login__title {
        font-size: 1.75rem;
      }

      .login__admin-controls {
        top: 1rem;
        left: 1rem;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .login__status-indicator,
      .login__logout-button {
        font-size: 0.8rem;
        padding: 0.5rem 0.75rem;
      }
    }
  `]
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;
  iframeLoaded: boolean = false;
  adminIframeUrl: SafeResourceUrl | null = null;

  private readonly iframeHost: string = 'http://localhost:4000';

  constructor(
    private readonly router: Router,
    private readonly sanitizer: DomSanitizer,
    private readonly cdr: ChangeDetectorRef
  ) {}

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.errorMessage = '';
    this.isLoading = true;
    this.cdr.markForCheck();

    if (!this.username.trim() || !this.password.trim()) {
      this.errorMessage = 'Please enter both username and password';
      this.isLoading = false;
      this.cdr.markForCheck();
      return;
    }

    try {
      const requestBody: AuthRequest = {
        username: this.username.trim(),
        password: this.password
      };

      const response: Response = await fetch(`${environment.apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      console.log("response", response)
      if (!response?.ok) {
        if (response.status === 401) {
          this.errorMessage = 'Invalid username or password';
        } else if (response.status === 404) {
          this.errorMessage = 'Authentication service not found. Please ensure the backend server is running on port 3000.';
        } else if (response.status === 429) {
          this.errorMessage = 'Too many authentication attempts. Please try again later.';
        } else if (response.status === 500) {
          this.errorMessage = 'Authentication service error. Please try again.';
        } else {
          this.errorMessage = `Authentication failed (${response.status})`;
        }
        this.cdr.markForCheck();
        return;
      }

      const body: AuthResponse = await response.json();
      console.log("body", body)
      if (body?.["success"]) {
        this.loadAdminPanel();
      } else {
        this.errorMessage = body.error || 'Access denied. Admin privileges required.';
        this.cdr.markForCheck();
      }
    } catch (error) {
      console.error('Authentication error:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        this.errorMessage = 'Cannot connect to authentication server. Please ensure the backend is running on port 3000.';
      } else {
        this.errorMessage = 'Connection error. Please check your network and try again.';
      }
      this.cdr.markForCheck();
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  private loadAdminPanel(): void {
    try {
      const url = `${this.iframeHost}?admin=1`;
      this.adminIframeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      this.iframeLoaded = true;
      this.cdr.markForCheck();
    } catch (error) {
      console.error('Error loading admin panel:', error);
      this.errorMessage = 'Failed to load admin panel. Please try again.';
      this.cdr.markForCheck();
    }
  }

  logout(): void {
    this.iframeLoaded = false;
    this.adminIframeUrl = null;
    this.username = '';
    this.password = '';
    this.errorMessage = '';
    this.cdr.markForCheck();
  }

  goToProjects(): void {
    this.router.navigate(['/projects']);
  }
}