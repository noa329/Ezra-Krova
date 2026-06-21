import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { RequestsService, HelpRequest } from '../requests.service';
import { RequestCardComponent } from '../request-card/request-card.component';
import { SocketService } from '../../../core/socket.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { Subscription } from 'rxjs';

const CATEGORIES = ['הכל', 'לינה', 'הסעה', 'מזון', 'תרופות', 'ילדים', 'נפשי'];

@Component({
  selector: 'app-requests-list',
  standalone: true,
  imports: [CommonModule, MatTabsModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule, RouterLink, RequestCardComponent],
  template: `
    <div class="list-header">
      <h2>בקשות פתוחות</h2>
      <button mat-raised-button color="primary" routerLink="/requests/new">
        <mat-icon>add</mat-icon> בקשה חדשה
      </button>
    </div>
    <mat-tab-group (selectedTabChange)="onTabChange($event)" animationDuration="200ms">
      <mat-tab *ngFor="let cat of categories" [label]="cat">
        <div class="tab-content">
          <mat-spinner *ngIf="loading" diameter="40" style="margin:40px auto;display:block"></mat-spinner>
          <div *ngIf="!loading">
            <app-request-card
              *ngFor="let r of requests"
              [request]="r"
              [showLock]="true"
              [showOwnerActions]="true"
              (lockClicked)="onLock($event)"
              (deleteClicked)="onDelete($event)"
            />
            <p *ngIf="requests.length === 0" class="empty-state">אין בקשות פתוחות בקטגוריה זו</p>
          </div>
        </div>
      </mat-tab>
    </mat-tab-group>
  `,
  styles: [`
    .list-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
    h2 { margin:0; font-size:1.5rem; color:#1a237e; }
    .tab-content { padding:16px 0; }
    .empty-state { text-align:center; color:#999; padding:40px; }
  `],
})
export class RequestsListComponent implements OnInit, OnDestroy {
  categories = CATEGORIES;
  requests: HelpRequest[] = [];
  loading = false;
  selectedCategory = '';
  private sub!: Subscription;

  constructor(private svc: RequestsService, private socket: SocketService, private snack: MatSnackBar, private dialog: MatDialog) {}

  ngOnInit() {
    this.load();
    this.sub = this.socket.onNewRequest().subscribe(() => {
      this.load();
      this.snack.open('בקשה חדשה התווספה!', 'סגור', { duration: 3000 });
    });
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  onTabChange(e: any) {
    const cat = this.categories[e.index];
    this.selectedCategory = cat === 'הכל' ? '' : cat;
    this.load();
  }

  load() {
    this.loading = true;
    this.svc.getAll(this.selectedCategory || undefined).subscribe({
      next: (r) => { this.requests = r; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  onLock(id: string) {
    this.svc.lock(id).subscribe({
      next: () => { this.snack.open('נרשמת בהצלחה כמתנדב!', 'סגור', { duration: 3000 }); this.load(); },
      error: (err) => this.snack.open(err.error?.message || 'שגיאה בנעילה', 'סגור', { duration: 4000 }),
    });
  }

  onDelete(id: string) {
    this.dialog.open(ConfirmDialogComponent, {
      width: '360px',
      data: {
        title: 'מחיקת בקשה',
        message: 'האם למחוק את הבקשה? פעולה זו אינה ניתנת לביטול.',
        confirmText: 'מחק',
      },
    }).afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.svc.delete(id).subscribe({
        next: () => {
          this.requests = this.requests.filter(r => r._id !== id);
          this.snack.open('הבקשה נמחקה', 'סגור', { duration: 3000 });
        },
        error: (err) => this.snack.open(err.error?.message || 'שגיאה', 'סגור', { duration: 4000 }),
      });
    });
  }
}
