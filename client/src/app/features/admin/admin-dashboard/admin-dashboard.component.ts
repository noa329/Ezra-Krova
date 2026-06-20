import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService, AdminStats } from '../admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="dashboard" dir="rtl">
      <div class="header">
        <h1>לוח בקרה — מנהל</h1>
        <div class="actions">
          <button mat-stroked-button routerLink="/admin/users">משתמשים</button>
          <button mat-stroked-button routerLink="/admin/requests">בקשות</button>
          <button mat-raised-button color="primary" (click)="exportJson()" [disabled]="!stats">ייצוא JSON</button>
        </div>
      </div>

      <mat-spinner *ngIf="loading" diameter="44" class="spinner"></mat-spinner>

      <ng-container *ngIf="stats && !loading">
        <div class="stat-grid">
          <mat-card *ngFor="let item of statCards" class="stat-card">
            <strong>{{ item.value }}</strong>
            <span>{{ item.label }}</span>
          </mat-card>
        </div>

        <div class="charts-row">
          <mat-card class="chart-card">
            <h2>בקשות לפי קטגוריה</h2>
            <div class="bar-row" *ngFor="let row of stats.byCategory">
              <span class="bar-label">{{ row.category }}</span>
              <div class="bar-track"><div class="bar-fill" [style.width.%]="barWidth(row.count, maxCategory)"></div></div>
              <span class="bar-count">{{ row.count }}</span>
            </div>
          </mat-card>

          <mat-card class="chart-card">
            <h2>בקשות לפי דחיפות</h2>
            <div class="bar-row" *ngFor="let row of stats.byUrgency">
              <span class="bar-label">{{ urgencyMap[row.urgency] || row.urgency }}</span>
              <div class="bar-track"><div class="bar-fill urgency" [style.width.%]="barWidth(row.count, maxUrgency)"></div></div>
              <span class="bar-count">{{ row.count }}</span>
            </div>
          </mat-card>
        </div>

        <mat-card class="list-card">
          <h2>מתנדבים מובילים</h2>
          <p *ngFor="let v of stats.topVolunteers">
            {{ v.name }} — {{ v.rating.avg | number:'1.1-1' }} ⭐ ({{ v.rating.count }})
          </p>
          <p *ngIf="!stats.topVolunteers.length">אין דירוגים עדיין</p>
        </mat-card>
      </ng-container>
    </div>
  `,
  styles: [`
    .dashboard { max-width: 960px; margin: 0 auto; padding: 16px; }
    .header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .spinner { margin: 60px auto; display: block; }
    .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; margin-bottom: 20px; }
    .stat-card { padding: 16px; text-align: center; }
    .stat-card strong { display: block; font-size: 1.8rem; color: #1a237e; }
    .stat-card span { color: #666; font-size: 0.85rem; }
    .charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    @media (max-width: 700px) { .charts-row { grid-template-columns: 1fr; } }
    .chart-card, .list-card { padding: 16px; }
    .bar-row { display: grid; grid-template-columns: 80px 1fr 32px; gap: 8px; align-items: center; margin: 8px 0; font-size: 0.9rem; }
    .bar-track { background: #eee; border-radius: 4px; height: 10px; overflow: hidden; }
    .bar-fill { background: #1976d2; height: 100%; border-radius: 4px; }
    .bar-fill.urgency { background: #f57c00; }
  `],
})
export class AdminDashboardComponent implements OnInit {
  stats: AdminStats | null = null;
  loading = true;
  statCards: { label: string; value: number }[] = [];
  maxCategory = 1;
  maxUrgency = 1;
  urgencyMap: Record<string, string> = { high: 'דחוף', medium: 'בינוני', low: 'נמוך' };

  constructor(private admin: AdminService, private snack: MatSnackBar) {}

  ngOnInit() {
    this.admin.getStats().subscribe({
      next: (s) => {
        this.stats = s;
        this.statCards = [
          { label: 'משתמשים', value: s.totals.users },
          { label: 'בקשות', value: s.totals.requests },
          { label: 'פתוחות', value: s.totals.open },
          { label: 'נעולות', value: s.totals.locked },
          { label: 'הושלמו', value: s.totals.closed },
          { label: 'מחלוקות', value: s.totals.disputed },
        ];
        this.maxCategory = Math.max(1, ...s.byCategory.map((r) => r.count));
        this.maxUrgency = Math.max(1, ...s.byUrgency.map((r) => r.count));
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  barWidth(count: number, max: number) {
    return Math.round((count / max) * 100);
  }

  exportJson() {
    this.admin.exportData().subscribe({
      next: (data) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ezrakrova-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.snack.open('הקובץ הורד', 'סגור', { duration: 2000 });
      },
      error: (err) => this.snack.open(err.error?.message || 'שגיאה בייצוא', 'סגור', { duration: 4000 }),
    });
  }
}
