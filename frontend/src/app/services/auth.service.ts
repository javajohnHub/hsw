import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  service?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiBaseUrl = environment.apiUrl;
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient) {
    this.checkInitialAuthStatus();
  }

  /**
   * highscorewins admin login
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    const loginEndpoint = `${this.apiBaseUrl}/auth/login`;
    
  console.log('🔐 highscorewins - Attempting login to:', loginEndpoint);
    
    return this.http.post<AuthResponse>(loginEndpoint, credentials, {
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      withCredentials: true
    }).pipe(
      tap(response => {
        if (response.success && response.token) {
          this.setAuthToken(response.token);
          this.isAuthenticatedSubject.next(true);
          console.log('✅ highscorewins - Authentication successful');
        }
      }),
      catchError(this.handleAuthError.bind(this))
    );
  }

  /**
   * highscorewins admin logout
   */
  logout(): Observable<AuthResponse> {
    const logoutEndpoint = `${this.apiBaseUrl}/auth/logout`;
    
    return this.http.post<AuthResponse>(logoutEndpoint, {}, {
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true
    }).pipe(
      tap(() => {
  this.clearAuthToken();
  this.isAuthenticatedSubject.next(false);
  console.log('👋 highscorewins - Logout successful');
      }),
      catchError(this.handleAuthError.bind(this))
    );
  }

  /**
   * Check highscorewins admin authentication status
   */
  checkAuthStatus(): Observable<AuthResponse> {
    const statusEndpoint = `${this.apiBaseUrl}/auth/status`;
    const token = this.getAuthToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return this.http.get<AuthResponse>(statusEndpoint, {
      headers,
      withCredentials: true
    }).pipe(
      tap(response => {
        this.isAuthenticatedSubject.next(response.success);
      }),
      catchError(error => {
        this.isAuthenticatedSubject.next(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Verify authentication token
   */
  verifyToken(): Observable<AuthResponse> {
    const verifyEndpoint = `${this.apiBaseUrl}/auth/verify`;
    const token = this.getAuthToken();
    
    if (!token) {
      return throwError(() => new Error('No authentication token found'));
    }
    
    return this.http.get<AuthResponse>(verifyEndpoint, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      withCredentials: true
    }).pipe(
      tap(response => {
        this.isAuthenticatedSubject.next(response.success);
      }),
      catchError(this.handleAuthError.bind(this))
    );
  }

  /**
   * Get current authentication status synchronously
   */
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Get stored auth token
   */
  getAuthToken(): string | null {
    return localStorage.getItem('highscorewins_auth_token');
  }

  /**
   * Get current user information
   */
  getCurrentUser(): { id: string; email: string; name: string; role: string } | null {
    const token = this.getAuthToken();
    if (!token || !this.isAuthenticated()) {
      return null;
    }
    
    // Return highscorewins admin user for development
    return {
      id: '1',
      email: 'admin@highscorewins.com',
      name: 'highscorewins Admin',
      role: 'administrator'
    };
  }

  /**
   * Check initial authentication status on service initialization
   */
  private checkInitialAuthStatus(): void {
    const token = this.getAuthToken();
    if (token) {
      this.checkAuthStatus().subscribe({
        next: (response) => {
          console.log('🔍 highscorewins - Initial auth check:', response.success);
        },
        error: (error) => {
          console.warn('⚠️ highscorewins - Initial auth check failed:', error);
          this.clearAuthToken();
        }
      });
    }
  }

  /**
   * Store auth token securely
   */
  private setAuthToken(token: string): void {
  localStorage.setItem('highscorewins_auth_token', token);
  }

  /**
   * Clear stored auth token
   */
  private clearAuthToken(): void {
  localStorage.removeItem('highscorewins_auth_token');
  }

  /**
   * Handle HTTP authentication errors with proper business context
   */
  private handleAuthError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Authentication service unavailable';
    
  console.error('🚨 highscorewins Auth Error:', {
      status: error.status,
      message: error.message,
      url: error.url,
      timestamp: new Date().toISOString()
    });

    if (error.error instanceof ErrorEvent) {
      // Client-side network error
  errorMessage = 'Network Error: Unable to connect to highscorewins authentication service. Please check your internet connection.';
    } else {
      // Server-side error response
      switch (error.status) {
        case 0:
          errorMessage = 'Authentication Failed: Authentication service not found. Please ensure the backend server is running on port 3000.';
          break;
        case 400:
          errorMessage = error.error?.message || 'Invalid request data. Please check your input and try again.';
          break;
        case 401:
          errorMessage = 'Invalid credentials. Please check your email and password for highscorewins admin access.';
          this.clearAuthToken();
          this.isAuthenticatedSubject.next(false);
          break;
        case 403:
          errorMessage = 'Access denied. You do not have permission to access highscorewins admin panel.';
          break;
        case 404:
          errorMessage = 'Authentication endpoint not found. Please contact highscorewins support.';
          break;
        case 429:
          errorMessage = 'Too many login attempts. Please wait 15 minutes before trying again.';
          break;
        case 500:
          errorMessage = 'Internal server error. highscorewins authentication service is temporarily unavailable.';
          break;
        default:
          errorMessage = `Authentication Failed: Server Error ${error.status}. Please try again or contact highscorewins support.`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}