import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../auth/auth.service';
import { environment } from '../../../../environments/environment';
import { resolveProfileImageUrl } from '../../../core/image.util';
import { LocationInputComponent } from '../../shared/location-input/location-input.component';

const CAPABILITIES = ['לינה', 'הסעה', 'מזון', 'תרופות', 'ילדים', 'נפשי'];

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatCheckboxModule, MatSliderModule,
    MatSlideToggleModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule,
    MatDividerModule, LocationInputComponent,
  ],
  template: `
    <div class="settings-wrapper">
      <mat-card>
        <mat-card-header><mat-card-title>הגדרות פרופיל מתנדב</mat-card-title></mat-card-header>
        <mat-card-content>
          <div class="avatar-section">
            <img *ngIf="imageUrl" [src]="imageUrl" class="avatar" alt="תמונת פרופיל">
            <div *ngIf="!imageUrl" class="avatar-placeholder">📷</div>
            <label class="upload-btn">
              שנה תמונה
              <input type="file" accept="image/*" (change)="onFileChange($event)" hidden>
            </label>
          </div>
          <mat-divider style="margin:20px 0"></mat-divider>
          <h3>מיקום</h3>
          <app-location-input [(ngModel)]="userLocation" label="מיקום לחיפוש בקשות קרובות" />
          <mat-slide-toggle [(ngModel)]="isAvailable" color="primary">
            {{ isAvailable ? '🟢 זמין לעזרה' : '🔴 לא זמין כרגע' }}
          </mat-slide-toggle>
          <h3>יכולות</h3>
          <div class="capabilities-grid">
            <mat-checkbox *ngFor="let cap of allCaps" [checked]="capabilities.includes(cap)" (change)="toggleCap(cap, $event.checked)">
              {{ cap }}
            </mat-checkbox>
          </div>
          <h3>רדיוס עזרה: {{ radius }} ק"מ</h3>
          <mat-slider min="1" max="50" step="1" style="width:100%">
            <input matSliderThumb [(ngModel)]="radius">
          </mat-slider>
          <div style="margin-top:24px">
            <button mat-raised-button color="primary" (click)="save()" [disabled]="saving">
              <mat-spinner diameter="18" *ngIf="saving" style="display:inline-block;margin-left:6px"></mat-spinner>
              שמור הגדרות
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .settings-wrapper { max-width:560px; margin:0 auto; }
    mat-card { padding:24px; }
    .avatar-section { display:flex; align-items:center; gap:16px; margin-bottom:8px; }
    .avatar { width:80px; height:80px; border-radius:50%; object-fit:cover; border:2px solid #1976d2; }
    .avatar-placeholder { width:80px; height:80px; border-radius:50%; background:#e0e0e0; display:flex; align-items:center; justify-content:center; font-size:2rem; }
    .upload-btn { cursor:pointer; background:#e3f2fd; color:#1976d2; padding:8px 16px; border-radius:8px; font-size:0.9rem; font-weight:500; }
    .capabilities-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin:12px 0; }
    h3 { margin:16px 0 8px; color:#333; font-size:1rem; }
  `],
})
export class ProfileSettingsComponent implements OnInit {
  allCaps = CAPABILITIES;
  capabilities: string[] = [];
  radius = 10;
  isAvailable = false;
  saving = false;
  imageUrl = '';
  userLocation: { type: 'Point'; coordinates: [number, number] } | null = null;

  constructor(private auth: AuthService, private http: HttpClient, private snack: MatSnackBar) {}

  ngOnInit() {
    const u = this.auth.currentUser;
    if (u) {
      this.capabilities = u.volunteerProfile?.capabilities || [];
      this.radius = u.volunteerProfile?.radius || 10;
      this.isAvailable = u.volunteerProfile?.isAvailable || false;
      this.imageUrl = resolveProfileImageUrl(u.profileImage);
      if (u.location?.coordinates?.[0] && u.location?.coordinates?.[1]) {
        this.userLocation = { type: 'Point', coordinates: u.location.coordinates };
      }
    }
  }

  toggleCap(cap: string, checked: boolean) {
    this.capabilities = checked ? [...this.capabilities, cap] : this.capabilities.filter(c => c !== cap);
  }

  save() {
    this.saving = true;
    const payload: any = {
      volunteerProfile: { capabilities: this.capabilities, radius: this.radius, isAvailable: this.isAvailable },
    };
    if (this.userLocation) payload.location = this.userLocation;
    this.http.put(`${environment.apiUrl}/users/me`, payload).subscribe({
      next: () => { this.auth.refreshUser().subscribe(); this.snack.open('ההגדרות נשמרו!', 'סגור', { duration: 3000 }); this.saving = false; },
      error: (err) => { this.snack.open(err.error?.message || 'שגיאה', 'סגור', { duration: 4000 }); this.saving = false; },
    });
  }

  onFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('profileImage', file);
    this.http.post(`${environment.apiUrl}/users/me/image`, fd).subscribe({
      next: (res: any) => {
        this.imageUrl = resolveProfileImageUrl(res.profileImage);
        this.auth.refreshUser().subscribe();
        this.snack.open('תמונה הועלתה!', 'סגור', { duration: 3000 });
      },
      error: (err) => this.snack.open(err.error?.message || 'שגיאה בהעלאת תמונה', 'סגור', { duration: 4000 }),
    });
  }
}
