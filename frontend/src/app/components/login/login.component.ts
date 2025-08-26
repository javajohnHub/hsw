import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService, LoginCredentials } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1>Edwards Web Development</h1>
          <p class="login-subtitle">Admin Portal</p>
        </div>
        
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form" novalidate>
          <div class="form-group">
            <label for="email" class="form-label">Email Address</label>
            <input 
              type="email" 
              id="email" 
              formControlName="email"
              class="form-input"
              [class.form-input--error]="isFieldInvalid('email')"
              placeholder="admin@edwardswebdevelopment.com"
              autocomplete="email">
            <div class="error-message" *ngIf="isFieldInvalid('email')">
              <span *ngIf="loginForm.get('email')?.errors?.['required']">Email address is required</span>
              <span *ngIf="loginForm.get('email')?.errors?.['email']">Please enter a valid email address</span>
            </div>
          </div>
          
          <div class="form-group">
            <label for="password" class="form-label">Password</label>
            <input 
              type="password" 
              id="password" 
              formControlName="password"
              class="form-input"
              [class.form-input--error]="isFieldInvalid('password')"
              placeholder="Enter your password"
              autocomplete="current-password">
            <div class="error-message" *ngIf="isFieldInvalid('password')">
              <span *ngIf="loginForm.get('password')?.errors?.['required']">Password is required</span>
              <span *ngIf="loginForm.get('password')?.errors?.['minlength']">Password must be at least 6 characters</span>
            </div>
          </div>
          
          <button 
            type="submit" 
            [disabled]="loginForm.invalid || isLoading"
            class="login-btn"
            [class.login-btn--loading]="isLoading">
            <span *ngIf="!isLoading">Sign In to Admin Portal</span>
            <span *ngIf="isLoading" class="loading-content">
              <span class="loading-spinner"></span>
              Authenticating...
            </span>
          </button>
          
          <div class="alert alert--error" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>
          
          <div class="alert alert--success" *ngIf="successMessage">
            {{ successMessage }}
          </div>
        </form>
        
        <div class="login-footer">
          <p class="footer-title">Edwards Web Development</p>
          <p class="footer-subtitle">Professional Web Development Services</p>
          <div class="dev-credentials" *ngIf="isDevelopment">
            <p class="dev-note">Development Environment</p>
            <p class="dev-creds">Email: admin@edwardswebdevelopment.com</p>
            <p class="dev-creds">Password: Edwards2024!</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  isDevelopment = true; // Set based on environment
  
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Check if already authenticated
    this.authService.isAuthenticated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAuthenticated => {
        if (isAuthenticated) {
          this.router.navigate(['/admin/dashboard']);
        }
      });

    // Pre-fill development credentials if in development mode
    if (this.isDevelopment) {
      this.loginForm.patchValue({
        email: 'admin@edwardswebdevelopment.com',
        password: 'Edwards2024!'
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Handle form submission for Edwards Web Development admin login
   */
  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const credentials: LoginCredentials = {
      email: this.loginForm.value.email.trim(),
      password: this.loginForm.value.password
    };

    console.log('🔐 Edwards Web Development - Submitting admin login credentials');

    this.authService.login(credentials)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Edwards Web Development - Login response:', response);
          
          if (response.success) {
            this.successMessage = 'Authentication successful! Redirecting to admin dashboard...';
            
            setTimeout(() => {
              this.router.navigate(['/admin/dashboard']);
            }, 1500);
          } else {
            this.errorMessage = response.message || 'Login failed. Please try again.';
          }
          
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Edwards Web Development - Login error:', error);
          this.errorMessage = error.message || 'Authentication failed. Please check your credentials and try again.';
          this.isLoading = false;
        }
      });
  }

  /**
   * Check if a form field is invalid and has been touched
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Mark all form fields as touched to trigger validation display
   */
  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }
}