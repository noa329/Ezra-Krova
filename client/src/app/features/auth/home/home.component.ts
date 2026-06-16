import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="hero">
      <div class="hero-content">
        <mat-icon class="hero-icon">favorite</mat-icon>
        <h1>עזרה קרובה</h1>
        <p class="subtitle">פלטפורמת עזרה הדדית בחירום — מחברים בין אנשים שצריכים עזרה לבין מתנדבים, בזמן אמת, לפי מיקום וקטגוריה.</p>
        <div class="categories">
          <span *ngFor="let cat of categories" class="cat-chip">{{ cat }}</span>
        </div>
        <div class="actions">
          <button mat-raised-button color="primary" (click)="router.navigate(['/register'])">הצטרפות חינמית</button>
          <button mat-stroked-button color="primary" (click)="router.navigate(['/login'])">כניסה למערכת</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .hero { min-height: calc(100vh - 80px); display: flex; align-items: center; justify-content: center; text-align: center; padding: 40px 16px; }
    .hero-content { max-width: 600px; }
    .hero-icon { font-size: 64px; width: 64px; height: 64px; color: #1976d2; margin-bottom: 16px; }
    h1 { font-size: 3rem; margin: 0 0 16px; color: #1a237e; font-weight: 700; }
    .subtitle { font-size: 1.2rem; color: #555; line-height: 1.8; margin-bottom: 32px; }
    .categories { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-bottom: 40px; }
    .cat-chip { background: #e3f2fd; color: #1976d2; padding: 6px 16px; border-radius: 20px; font-size: 0.9rem; font-weight: 500; }
    .actions { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
  `],
})
export class HomeComponent {
  categories = ['לינה', 'הסעה', 'מזון', 'תרופות', 'ילדים', 'נפשי'];
  constructor(public router: Router) {}
}
