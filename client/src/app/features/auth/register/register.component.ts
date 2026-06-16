import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule, RouterLink],
  template: `
    <div class="auth-page">
      <mat-card class="auth-card">
        <mat-card-header><mat-card-title>הרשמה לעזרה קרובה</mat-card-title></mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>שם מלא</mat-label>
              <input matInput formControlName="name">
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>מספר טלפון</mat-label>
              <input matInput formControlName="phone" placeholder="050-1234567" dir="ltr">
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>סיסמה</mat-label>
              <input matInput type="password" formControlName="password">
              <mat-hint>לפחות 6 תווים</mat-hint>
            </mat-form-field>
            <p class="error" *ngIf="error">{{ error }}</p>
            <button mat-raised-button color="primary" type="submit" [disabled]="loading || form.invalid" class="full-width" style="margin-top:8px">
              <mat-spinner diameter="20" *ngIf="loading" style="display:inline-block;margin-left:8px"></mat-spinner>
              הרשמה
            </button>
          </form>
          <p class="link-text">כבר יש לך חשבון? <a routerLink="/login">כניסה</a></p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-page { display:flex; justify-content:center; align-items:center; min-height:calc(100vh - 120px); }
    .auth-card { width:100%; max-width:420px; padding:24px; }
    .full-width { width:100%; margin-bottom:12px; }
    .error { color:#d32f2f; font-size:0.9rem; }
    .link-text { text-align:center; margin-top:16px; font-size:0.9rem; }
    a { color:#1976d2; text-decoration:none; font-weight:500; }
  `],
})
export class RegisterComponent {
  form = this.fb.group({
    name: ['', Validators.required],
    phone: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });
  loading = false;
  error = '';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true; this.error = '';
    this.auth.register(this.form.value as any).subscribe({
      next: () => this.router.navigate(['/requests']),
      error: (err) => { this.error = err.error?.message || 'שגיאה בהרשמה'; this.loading = false; },
    });
  }
}
