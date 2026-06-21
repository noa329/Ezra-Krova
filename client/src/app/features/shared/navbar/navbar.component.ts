import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../auth/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, MatIconModule, MatSlideToggleModule, MatMenuModule],
  template: `
    <mat-toolbar color="primary" class="navbar">
      <span class="brand" routerLink="/home">❤️ עזרה קרובה</span>
      <span class="spacer"></span>
      <ng-container *ngIf="auth.isLoggedIn; else notLoggedIn">
        <a mat-button routerLink="/requests" routerLinkActive="active-link">בקשות</a>
        <a mat-button routerLink="/my-requests" routerLinkActive="active-link">שלי</a>
        <a mat-button routerLink="/volunteer" routerLinkActive="active-link" *ngIf="hasVolunteerProfile">מתנדב</a>
        <a mat-button routerLink="/my-claimed" routerLinkActive="active-link" *ngIf="hasVolunteerProfile">לקחתי לעזור</a>
        <a mat-button routerLink="/admin" routerLinkActive="active-link" *ngIf="auth.isAdmin">אדמין</a>
        <mat-slide-toggle [checked]="isAvailable" (change)="toggleAvailability($event.checked)" color="accent" class="avail-toggle">
          {{ isAvailable ? 'זמין' : 'לא זמין' }}
        </mat-slide-toggle>
        <button mat-icon-button [matMenuTriggerFor]="userMenu">
          <mat-icon>account_circle</mat-icon>
        </button>
        <mat-menu #userMenu="matMenu">
          <button mat-menu-item routerLink="/profile"><mat-icon>settings</mat-icon> הגדרות</button>
          <button mat-menu-item (click)="auth.logout()"><mat-icon>logout</mat-icon> יציאה</button>
        </mat-menu>
      </ng-container>
      <ng-template #notLoggedIn>
        <a mat-button routerLink="/login">כניסה</a>
        <a mat-raised-button color="accent" routerLink="/register">הרשמה</a>
      </ng-template>
    </mat-toolbar>
  `,
  styles: [`
    .navbar { position:sticky; top:0; z-index:1000; direction:rtl; }
    .brand { font-size:1.2rem; font-weight:700; cursor:pointer; margin-left:16px; }
    .spacer { flex:1; }
    .active-link { background:rgba(255,255,255,0.15); border-radius:4px; }
    .avail-toggle { margin:0 12px; font-size:0.8rem; }
  `],
})
export class NavbarComponent implements OnInit {
  isAvailable = false;

  constructor(public auth: AuthService, private http: HttpClient) {}

  get hasVolunteerProfile() { return !!(this.auth.currentUser?.volunteerProfile?.capabilities?.length); }

  ngOnInit() {
    this.isAvailable = this.auth.currentUser?.volunteerProfile?.isAvailable || false;
    this.auth.currentUser$.subscribe(u => { this.isAvailable = u?.volunteerProfile?.isAvailable || false; });
  }

  toggleAvailability(val: boolean) {
    this.isAvailable = val;
    this.http.put(`${environment.apiUrl}/users/me`, { volunteerProfile: { isAvailable: val } }).subscribe({
      next: () => this.auth.refreshUser().subscribe(),
      error: () => { this.isAvailable = !val; },
    });
  }
}
