import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RequestsService, HelpRequest } from '../../requests/requests.service';
import { RequestCardComponent } from '../../requests/request-card/request-card.component';
import { SocketService } from '../../../core/socket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-volunteer-dashboard',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule, RequestCardComponent],
  template: `
    <div class="dashboard-header">
      <h2>בקשות קרובות אליך</h2>
      <button mat-stroked-button (click)="load()">🔄 רענן</button>
    </div>
    <mat-spinner *ngIf="loading" diameter="40" style="margin:60px auto;display:block"></mat-spinner>
    <div *ngIf="!loading">
      <app-request-card *ngFor="let r of requests" [request]="r" [showLock]="true" (lockClicked)="onLock($event)" />
      <div *ngIf="requests.length === 0" class="empty">
        <p>אין בקשות מתאימות כרגע בסביבתך.</p>
        <p style="font-size:0.9rem;color:#999">ודא שהפרופיל שלך מוגדר ושאתה זמין.</p>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
    h2 { margin:0; color:#1a237e; font-size:1.5rem; }
    .empty { text-align:center; padding:60px; color:#555; }
  `],
})
export class VolunteerDashboardComponent implements OnInit, OnDestroy {
  requests: HelpRequest[] = [];
  loading = false;
  private sub!: Subscription;

  constructor(private svc: RequestsService, private socket: SocketService, private snack: MatSnackBar) {}

  ngOnInit() {
    this.load();
    this.sub = this.socket.onNewRequest().subscribe(() => this.load());
  }
  ngOnDestroy() { this.sub?.unsubscribe(); }

  load() {
    this.loading = true;
    this.svc.getNearby().subscribe({
      next: (r) => { this.requests = r; this.loading = false; },
      error: (err) => { this.snack.open(err.error?.message || 'שגיאה בטעינה', 'סגור', { duration: 4000 }); this.loading = false; },
    });
  }

  onLock(id: string) {
    this.svc.lock(id).subscribe({
      next: () => { this.snack.open('נרשמת בהצלחה כמתנדב!', 'סגור', { duration: 3000 }); this.load(); },
      error: (err) => this.snack.open(err.error?.message || 'שגיאה בנעילה', 'סגור', { duration: 4000 }),
    });
  }
}
