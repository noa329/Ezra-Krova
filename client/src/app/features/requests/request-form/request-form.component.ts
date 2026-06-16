import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { RequestsService } from '../requests.service';

@Component({
  selector: 'app-request-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <mat-card class="form-card">
      <mat-card-header><mat-card-title>פתיחת בקשת עזרה</mat-card-title></mat-card-header>
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>קטגוריה</mat-label>
            <mat-select formControlName="category">
              <mat-option *ngFor="let c of categories" [value]="c">{{ c }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>תיאור הבקשה</mat-label>
            <textarea matInput formControlName="description" rows="4" placeholder="תאר את הצורך שלך..."></textarea>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>דחיפות</mat-label>
            <mat-select formControlName="urgency">
              <mat-option value="high">דחוף</mat-option>
              <mat-option value="medium">בינוני</mat-option>
              <mat-option value="low">נמוך</mat-option>
            </mat-select>
          </mat-form-field>
          <button mat-button type="button" (click)="detectLocation()" [disabled]="locating">
            <mat-spinner diameter="18" *ngIf="locating" style="display:inline-block;margin-left:6px"></mat-spinner>
            📍 זהה מיקום אוטומטי
          </button>
          <p style="color:#388e3c;font-size:0.9rem" *ngIf="locationSet">✅ מיקום נקלט</p>
          <p class="error" *ngIf="error">{{ error }}</p>
          <button mat-raised-button color="primary" type="submit" [disabled]="loading || form.invalid" class="full-width" style="margin-top:16px">
            <mat-spinner diameter="20" *ngIf="loading" style="display:inline-block;margin-left:8px"></mat-spinner>
            שלח בקשה
          </button>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .form-card { max-width:560px; margin:0 auto; padding:24px; }
    .full-width { width:100%; margin-bottom:12px; }
    .error { color:#d32f2f; font-size:0.9rem; }
  `],
})
export class RequestFormComponent {
  categories = ['לינה', 'הסעה', 'מזון', 'תרופות', 'ילדים', 'נפשי'];
  form = this.fb.group({
    category: ['', Validators.required],
    description: ['', [Validators.required, Validators.minLength(10)]],
    urgency: ['medium', Validators.required],
    location: [null as any],
  });
  loading = false;
  locating = false;
  locationSet = false;
  error = '';

  constructor(private fb: FormBuilder, private svc: RequestsService, private router: Router, private snack: MatSnackBar) {}

  detectLocation() {
    this.locating = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.form.patchValue({ location: { type: 'Point', coordinates: [pos.coords.longitude, pos.coords.latitude] } });
        this.locationSet = true;
        this.locating = false;
      },
      () => { this.error = 'לא ניתן לזהות מיקום'; this.locating = false; }
    );
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true; this.error = '';
    this.svc.create(this.form.value as any).subscribe({
      next: () => { this.snack.open('הבקשה נשלחה!', 'סגור', { duration: 3000 }); this.router.navigate(['/requests']); },
      error: (err) => { this.error = err.error?.message || 'שגיאה בשליחת הבקשה'; this.loading = false; },
    });
  }
}
