import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { RequestsService, HelpRequest, isRequestOwner, formatPreferredTime } from '../requests.service';
import { AuthService } from '../../auth/auth.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { RatingDialogComponent } from '../../shared/rating-dialog/rating-dialog.component';
import { LocationMapComponent } from '../../shared/location-map/location-map.component';

@Component({
  selector: 'app-request-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule, MatDividerModule, RouterLink, LocationMapComponent],
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
            <div *ngIf="request.preferredTime"><strong>מועד מועדף:</strong> {{ formatPreferredTime(request.preferredTime) }}</div>
            <div *ngIf="request.requesterId?.name"><strong>מבקש:</strong> {{ request.requesterId.name }}</div>
            <div *ngIf="request.volunteerId?.name"><strong>מתנדב:</strong> {{ request.volunteerId.name }}</div>
          </div>
          <app-location-map
            *ngIf="request.location?.coordinates"
            [markers]="mapMarkers"
            height="220px"
            class="map-block">
          </app-location-map>
          <div class="confirmations" *ngIf="request.status === 'locked' || request.status === 'closed'">
            <p>אישור מבקש: {{ request.requesterConfirmed ? '✅' : '⏳' }}</p>
            <p>אישור מתנדב: {{ request.volunteerConfirmed ? '✅' : '⏳' }}</p>
          </div>
        </mat-card-content>
        <mat-card-actions>
          <button mat-stroked-button color="primary" *ngIf="isRequester" [routerLink]="['/requests', request._id, 'edit']">
            ✏️ עריכה
          </button>
          <button mat-stroked-button color="warn" *ngIf="isRequester" (click)="deleteRequest()">
            🗑️ מחיקה
          </button>
          <button mat-stroked-button color="warn" *ngIf="canDispute" (click)="dispute()">
            ⚠️ דיווח מחלוקת
          </button>
          <button mat-raised-button color="accent" *ngIf="request.status === 'open' && !isRequester" (click)="lock()">
            🤝 אני מתנדב לעזור
          </button>
          <button mat-raised-button color="primary" *ngIf="canConfirm" (click)="confirm()">
            ✅ אישור השלמה
          </button>
          <button mat-raised-button color="primary" *ngIf="request.status === 'closed' && canRate && !hasRated" (click)="openRatingDialog()">
            ⭐ דרג
          </button>
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
    .map-block { display:block; margin-top:16px; border-radius:8px; overflow:hidden; }
    mat-card-actions { display:flex; flex-wrap:wrap; gap:8px; }
  `],
})
export class RequestDetailComponent implements OnInit {
  request: HelpRequest | null = null;
  loading = true;
  hasRated = false;
  formatPreferredTime = formatPreferredTime;
  urgencyMap: Record<string, string> = { high: 'דחוף', medium: 'בינוני', low: 'נמוך' };
  statusMap: Record<string, string> = { open: 'פתוח', locked: 'נעול', closed: 'הושלם', disputed: 'במחלוקת' };

  constructor(
    private route: ActivatedRoute,
    private svc: RequestsService,
    private auth: AuthService,
    private snack: MatSnackBar,
    private router: Router,
    private dialog: MatDialog,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.svc.getById(id).subscribe({
      next: (r) => {
        this.request = r;
        this.loading = false;
        this.hasRated = this.loadRatedFlag(r._id);
        if (r.status === 'closed' && this.canRate && !this.hasRated) {
          setTimeout(() => this.openRatingDialog(), 400);
        }
      },
      error: () => this.loading = false,
    });
  }

  get isRequester() { return this.request ? isRequestOwner(this.request, this.auth.currentUser?._id) : false; }

  get canConfirm() {
    if (!this.request || this.request.status !== 'locked') return false;
    const uid = this.auth.currentUser?._id;
    if (this.isRequester && !this.request.requesterConfirmed) return true;
    if (this.request.volunteerId?._id === uid && !this.request.volunteerConfirmed) return true;
    return false;
  }

  get canRate() {
    if (!this.request || this.request.status !== 'closed') return false;
    const uid = this.auth.currentUser?._id;
    return this.isRequester || this.request.volunteerId?._id === uid;
  }

  get canDispute() {
    if (!this.request || this.request.status !== 'locked') return false;
    const uid = this.auth.currentUser?._id;
    return this.isRequester || this.request.volunteerId?._id === uid;
  }

  get mapMarkers() {
    if (!this.request?.location?.coordinates) return [];
    const [lng, lat] = this.request.location.coordinates;
    const markers = [{ lat, lng, label: 'מיקום הבקשה', color: '#1976d2' }];
    const vol = this.request.volunteerId;
    if (vol?.location?.coordinates) {
      const [vLng, vLat] = vol.location.coordinates;
      if (vLng || vLat) {
        markers.push({ lat: vLat, lng: vLng, label: vol.name || 'מתנדב', color: '#388e3c' });
      }
    }
    return markers;
  }

  private loadRatedFlag(requestId: string): boolean {
    const key = `rated_${requestId}_${this.auth.currentUser?._id}`;
    return localStorage.getItem(key) === '1';
  }

  private saveRatedFlag(requestId: string) {
    const key = `rated_${requestId}_${this.auth.currentUser?._id}`;
    localStorage.setItem(key, '1');
  }

  openRatingDialog() {
    if (!this.request || !this.canRate || this.hasRated) return;
    const targetName = this.isRequester
      ? (this.request.volunteerId?.name || 'המתנדב')
      : (this.request.requesterId?.name || 'המבקש');
    this.dialog.open(RatingDialogComponent, {
      width: '360px',
      disableClose: false,
      data: { targetName, requestCategory: this.request.category },
    }).afterClosed().subscribe((score) => {
      if (!score || !this.request) return;
      this.svc.rate(this.request._id, score).subscribe({
        next: () => {
          this.hasRated = true;
          this.saveRatedFlag(this.request!._id);
          this.snack.open('תודה על הדירוג!', 'סגור', { duration: 3000 });
        },
        error: (err) => this.snack.open(err.error?.message || 'שגיאה', 'סגור', { duration: 4000 }),
      });
    });
  }

  deleteRequest() {
    if (!this.request) return;
    this.dialog.open(ConfirmDialogComponent, {
      width: '360px',
      data: {
        title: 'מחיקת בקשה',
        message: 'האם למחוק את הבקשה? פעולה זו אינה ניתנת לביטול.',
        confirmText: 'מחק',
      },
    }).afterClosed().subscribe((confirmed) => {
      if (!confirmed || !this.request) return;
      this.svc.delete(this.request._id).subscribe({
        next: () => {
          this.snack.open('הבקשה נמחקה', 'סגור', { duration: 3000 });
          this.router.navigate(['/my-requests']);
        },
        error: (err) => this.snack.open(err.error?.message || 'שגיאה', 'סגור', { duration: 4000 }),
      });
    });
  }

  lock() {
    this.svc.lock(this.request!._id).subscribe({
      next: (r) => { this.request = r; this.snack.open('נרשמת כמתנדב!', 'סגור', { duration: 3000 }); },
      error: (err) => this.snack.open(err.error?.message || 'שגיאה', 'סגור', { duration: 4000 }),
    });
  }

  confirm() {
    this.svc.confirm(this.request!._id).subscribe({
      next: (r) => {
        this.request = r;
        this.snack.open('אישור נשמר!', 'סגור', { duration: 3000 });
        if (r.status === 'closed' && this.canRate && !this.hasRated) {
          this.openRatingDialog();
        }
      },
      error: (err) => this.snack.open(err.error?.message || 'שגיאה', 'סגור', { duration: 4000 }),
    });
  }

  dispute() {
    if (!this.request) return;
    this.dialog.open(ConfirmDialogComponent, {
      width: '380px',
      data: {
        title: 'דיווח מחלוקת',
        message: 'האם לדווח על מחלוקת בבקשה זו? מנהל יבדוק את המקרה.',
        confirmText: 'דווח',
      },
    }).afterClosed().subscribe((confirmed) => {
      if (!confirmed || !this.request) return;
      this.svc.dispute(this.request._id).subscribe({
        next: (r) => {
          this.request = r;
          this.snack.open('הדיווח נשלח למנהל', 'סגור', { duration: 3000 });
        },
        error: (err) => this.snack.open(err.error?.message || 'שגיאה', 'סגור', { duration: 4000 }),
      });
    });
  }
}
