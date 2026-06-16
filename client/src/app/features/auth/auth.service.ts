import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';

export interface User {
  _id: string;
  name: string;
  phone: string;
  role: 'user' | 'admin';
  profileImage?: string;
  location?: { type: string; coordinates: [number, number] };
  volunteerProfile?: { capabilities: string[]; radius: number; isAvailable: boolean };
  rating?: { avg: number; count: number };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    const stored = localStorage.getItem('user');
    if (stored) this.currentUserSubject.next(JSON.parse(stored));
  }

  get currentUser(): User | null { return this.currentUserSubject.value; }
  get isLoggedIn(): boolean { return !!this.currentUser; }
  get isAdmin(): boolean { return this.currentUser?.role === 'admin'; }

  register(data: { name: string; phone: string; password: string }): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/register`, data).pipe(
      tap((res: any) => this.saveSession(res))
    );
  }

  login(data: { phone: string; password: string }): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/login`, data).pipe(
      tap((res: any) => this.saveSession(res))
    );
  }

  private saveSession(res: { token: string; user: User }): void {
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
    this.currentUserSubject.next(res.user);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  refreshUser(): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/users/me`).pipe(
      tap(user => {
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }
}
