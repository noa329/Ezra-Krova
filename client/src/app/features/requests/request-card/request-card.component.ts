import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { HelpRequest, isRequestOwner, formatPreferredTime } from '../requests.service';
import { AuthService } from '../../auth/auth.service';

const URGENCY_LABEL: Record<string, string> = { high: 'דחוף', medium: 'בינוני', low: 'נמוך' };
const STATUS_LABEL: Record<string, string> = { open: 'פתוח', locked: 'נעול', closed: 'סגור', disputed: 'במחלוקת' };

@Component({
  selector: 'app-request-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, RouterLink],
  template: `
    <mat-card class="request-card">
      <mat-card-header>
        <div class="header-row">
          <span class="category-badge">{{ request.category }}</span>
          <span [class]="'urgency-' + request.urgency">{{ urgencyLabel }}</span>
        </div>
      </mat-card-header>
      <mat-card-content>
        <p class="description">{{ request.description }}</p>
        <div class="meta">
          <span *ngIf="request.city"><mat-icon inline>location_on</mat-icon> {{ request.city }}</span>
          <span *ngIf="request.preferredTime">מועד מועדף: {{ formatPreferredTime(request.preferredTime) }}</span>
          <span [class]="'status-' + request.status">{{ statusLabel }}</span>
        </div>
        <div class="requester" *ngIf="request.requesterId?.name">
          <mat-icon inline>person</mat-icon> {{ request.requesterId.name }}
          <span *ngIf="request.requesterId?.rating?.count > 0"> · ⭐ {{ request.requesterId.rating.avg | number:'1.1-1' }}</span>
        </div>
      </mat-card-content>
      <mat-card-actions>
        <button mat-button color="primary" [routerLink]="['/requests', request._id]">פרטים</button>
        <button mat-button color="primary" *ngIf="showOwnerActions && isOwner" [routerLink]="['/requests', request._id, 'edit']">
          ✏️ עריכה
        </button>
        <button mat-button color="warn" *ngIf="showOwnerActions && isOwner" (click)="deleteClicked.emit(request._id)">
          🗑️ מחיקה
        </button>
        <button mat-raised-button color="accent" *ngIf="showLock && request.status === 'open'" (click)="lockClicked.emit(request._id)">
          <mat-icon>lock</mat-icon> אני מתנדב
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .request-card { margin-bottom: 16px; transition: box-shadow 0.2s; }
    .request-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.12); }
    .header-row { display:flex; justify-content:space-between; align-items:center; width:100%; padding:8px 0; }
    .category-badge { background:#e3f2fd; color:#1565c0; padding:4px 12px; border-radius:12px; font-weight:500; font-size:0.85rem; }
    .description { color:#333; line-height:1.6; margin:8px 0; }
    .meta { display:flex; gap:16px; align-items:center; font-size:0.85rem; color:#666; }
    .requester { font-size:0.85rem; color:#777; margin-top:4px; display:flex; align-items:center; gap:4px; }
    mat-card-actions { display:flex; flex-wrap:wrap; gap:4px; }
  `],
})
export class RequestCardComponent {
  @Input() request!: HelpRequest;
  @Input() showLock = false;
  @Input() showOwnerActions = false;
  @Output() lockClicked = new EventEmitter<string>();
  @Output() deleteClicked = new EventEmitter<string>();
  formatPreferredTime = formatPreferredTime;

  constructor(private auth: AuthService) {}

  get isOwner() { return isRequestOwner(this.request, this.auth.currentUser?._id); }
  get urgencyLabel() { return URGENCY_LABEL[this.request.urgency] || ''; }
  get statusLabel() { return STATUS_LABEL[this.request.status] || ''; }
}
