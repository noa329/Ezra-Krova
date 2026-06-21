import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { RequestsService, HelpRequest } from '../requests.service';
import { RequestCardComponent } from '../request-card/request-card.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-my-requests',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatSnackBarModule, RequestCardComponent],
  template: `
    <h2 style="color:#1a237e;margin-bottom:16px">הבקשות שלי</h2>
    <mat-spinner *ngIf="loading" diameter="40" style="margin:60px auto;display:block"></mat-spinner>
    <div *ngIf="!loading">
      <app-request-card
        *ngFor="let r of requests"
        [request]="r"
        [showOwnerActions]="true"
        (deleteClicked)="onDelete($event)"
      />
      <p *ngIf="requests.length === 0" style="text-align:center;color:#999;padding:40px">לא פתחת בקשות עדיין</p>
    </div>
  `,
})
export class MyRequestsComponent implements OnInit {
  requests: HelpRequest[] = [];
  loading = true;

  constructor(
    private svc: RequestsService,
    private dialog: MatDialog,
    private snack: MatSnackBar,
  ) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.svc.getMy().subscribe({
      next: (r) => { this.requests = r; this.loading = false; },
      error: () => { this.loading = false; },
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
