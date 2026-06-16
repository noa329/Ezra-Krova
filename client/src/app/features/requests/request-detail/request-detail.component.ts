import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { RequestsService, HelpRequest } from '../requests.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-request-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule, MatDividerModule],
  template: `
    <div class="detail-wrapper">
      <mat-spinner *ngIf="loading" diameter="40" style="margin:60px auto;display:block"></mat-spinner>
      <mat-card *ngIf="request && !loading" class="detail-card">
        <mat-card-header>
          <div class="header-top">
            <span class="category-badge">{{ request.category }}</span>
            <span [class]="'urgency-' + request.urgency">{{ urgencyMap[request.urgency] }}</span>
          </div>
          <div [class]="'status-' + request.status" style="font-size:0.9rem;font-weight:600;padding:4px 0">{{ statusMap[request.status] }}</div>
        </mat-card-header>
        <mat-card-content>
          <p class="description">{{ request.description }}</p>
          <mat-divider></mat-divider>
          <div class="info-grid">
            <div *ngIf="request.city"><strong>עיר:</strong> {{ request.city }}</div>
            <div><strong>נפתח:</strong> {{ request.createdAt | date:'dd/MM/yyyy HH:mm' }}</div>
            <div *ngIf="request.requesterId?.name"><strong>מבקש:</strong> {{ request.requesterId.name }}</div>
            <div *ngIf="request.volunteerId?.name"><strong>מתנדב:</strong> {{ request.volunteerId.name }}</div>
          </div>
          <div class="confirmations" *ngIf="request.status === 'locked' || request.status === 'closed'">
            <p>אישור מבקש: {{ request.requesterConfirmed ? '✅' : '⏳' }}</p>
            <p>אישור מתנדב: {{ request.volunteerConfirmed ? '✅' : '⏳' }}</p>
          </div>
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button color="accent" *ngIf="request.status === 'open' && !isRequester" (click)="lock()">
            🤝 אני מתנדב לעזור
          </button>
          <button mat-raised-button color="primary" *ngIf="canConfirm" (click)="confirm()">
            ✅ אישור השלמה
          </button>
          <button mat-raised-button color="warn" *ngIf="request.status === 'closed' && !hasRated" (click)="showRating = !showRating">
            ⭐ דרג
          </button>
          <div *ngIf="showRating" style="display:flex;align-items:center;gap:4px;margin-top:8px">
            <span>דירוג:</span>
            <button *ngFor="let s of [1,2,3,4,5]" mat-button (click)="rate(s)">{{ s }}⭐</button>
          </div>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .detail-wrapper { max-width:640px; margin:0 auto; }
    .detail-card { padding:16px; }
    .header-top { display:flex; justify-content:space-between; align-items:center; width:100%; margin-bottom:8px; }
    .category-badge { background:#e3f2fd; color:#1565c0; padding:4px 14px; border-radius:12px; font-weight:500; }
    .description { font-size:1.05rem; line-height:1.7; margin:16px 0; }
    mat-divider { margin:12px 0; }
    .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:0.9rem; color:#555; margin-top:12px; }
    .confirmations { margin-top:12px; font-size:0.9rem; }
  `],
})
export class RequestDetailComponent implements OnInit {
  request: HelpRequest | null = null;
  loading = true;
  showRating = false;
  hasRated = false;
  urgencyMap: Record<string, string> = { high: 'דחוף', medium: 'בינוני', low: 'נמוך' };
  statusMap: Record<string, string> = { open: 'פתוח', locked: 'נעול', closed: 'הושלם', disputed: 'במחלוקת' };

  constructor(
    private route: ActivatedRoute,
    private svc: RequestsService,
    private auth: AuthService,
    private snack: MatSnackBar,
    private router: Router,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.svc.getById(id).subscribe({ next: (r) => { this.request = r; this.loading = false; }, error: () => this.loading = false });
  }

  get isRequester() { return this.request?.requesterId?._id === this.auth.currentUser?._id; }
  get canConfirm() {
    if (!this.request || this.request.status !== 'locked') return false;
    const uid = this.auth.currentUser?._id;
    if (this.isRequester && !this.request.requesterConfirmed) return true;
    if (this.request.volunteerId?._id === uid && !this.request.volunteerConfirmed) return true;
    return false;
  }

  lock() {
    this.svc.lock(this.request!._id).subscribe({
      next: (r) => { this.request = r; this.snack.open('נרשמת כמתנדב!', 'סגור', { duration: 3000 }); },
      error: (err) => this.snack.open(err.error?.message || 'שגיאה', 'סגור', { duration: 4000 }),
    });
  }

  confirm() {
    this.svc.confirm(this.request!._id).subscribe({
      next: (r) => { this.request = r; this.snack.open('אישור נשמר!', 'סגור', { duration: 3000 }); },
      error: (err) => this.snack.open(err.error?.message || 'שגיאה', 'סגור', { duration: 4000 }),
    });
  }

  rate(score: number) {
    this.svc.rate(this.request!._id, score).subscribe({
      next: () => { this.hasRated = true; this.showRating = false; this.snack.open('תודה על הדירוג!', 'סגור', { duration: 3000 }); },
      error: (err) => this.snack.open(err.error?.message || 'שגיאה', 'סגור', { duration: 4000 }),
    });
  }
}
