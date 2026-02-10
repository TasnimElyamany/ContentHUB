import { Injectable , signal} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { Router } from '@angular/router';
import { User, LoginRequest, RegisterRequest , AuthResponse } from '../../models/user.model';
import { environment } from '../../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private readonly API_URL = environment.apiUrl;
  private readonly TOKEN_KEY = 'contenthub_token';
  private readonly USER_KEY = 'contenthub_user';

  // tracking current user
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  // observable to subscribe to
  public currentUser$ = this.currentUserSubject.asObservable();

  public currentUserSignal = signal<User | null>(this.getUserFromStorage());

  constructor(
  private http: HttpClient,
  private router: Router,
  // private workspaceService: WorkspaceService
  ) {};



  get isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.currentUserSubject.value;
    return !!token && !!user;
  }

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API_URL}/auth/login`, credentials)
      .pipe(
        map(response => response.data),
        tap(data => {
          this.setSession(data);
        })
      );
  }
  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API_URL}/auth/register`, userData)
      .pipe(
        map(response => response.data),
        tap(data => {
          this.setSession(data);
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);

    this.currentUserSubject.next(null);
    this.currentUserSignal.set(null);

    // this.workspaceService.clearCache();

    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

//Refresh user data from server
  refreshUserData(): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${this.API_URL}/auth/me`)
      .pipe(
        map(response => response.data),
        tap(user => {
          localStorage.setItem(this.USER_KEY, JSON.stringify(user));
          this.currentUserSubject.next(user);
          this.currentUserSignal.set(user);
        })
      );
  }
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      return Date.now() >= exp;
    } catch (error) {
      return true;
    }
  }

  private setSession(authResult: AuthResponse): void {

    localStorage.setItem(this.TOKEN_KEY, authResult.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(authResult.user));

    // Update current user
    this.currentUserSubject.next(authResult.user);
    this.currentUserSignal.set(authResult.user);
  }

  private getUserFromStorage(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        return null;
      }
    }
    return null;
  }

  updateProfile(userData: Partial<User>): Observable<User> {
    return this.http.put<ApiResponse<User>>(`${this.API_URL}/auth/profile`, userData)
      .pipe(
        map(response => response.data),
        tap(user => {
          localStorage.setItem(this.USER_KEY, JSON.stringify(user));
          this.currentUserSubject.next(user);
          this.currentUserSignal.set(user);
        })
      );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/change-password`, {
      currentPassword,
      newPassword
    });
  }


  requestPasswordReset(email: string): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/reset-password`, {
      token,
      newPassword
    });
  }



  // DEVELOPMENT ONLY: Mock login for testing UI WITHOUT backend
  ///////////////////////////
  mockLogin(): void {
    const mockUser: User = {
      _id: 'mock-user-123',
      email: 'demo@contenthub.ai',
      name: 'Demo User',
      avatar: undefined,
      aiCredits: {
        total: 1000,
        used: 250,
        resetDate: new Date()
      },
      preferences: {
        theme: 'light',
        editorFont: 'Arial',
        defaultTone: 'professional'
      },
      createdAt: new Date(),
      lastLogin: new Date()
    };

    const mockToken = 'mock-jwt-token-for-development';

    localStorage.setItem(this.TOKEN_KEY, mockToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(mockUser));
    this.currentUserSubject.next(mockUser);
    this.currentUserSignal.set(mockUser);

    console.log('Mock login successful:', mockUser);
  }
}
