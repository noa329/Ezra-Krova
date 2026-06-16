import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-requests-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatSelectModule, MatFormFieldModule, MatProgressSpinnerModule, MatSnackBarModule, FormsModule],
  template: `
    <h2 style="color:#1a237e">ניהול בקשות</h2>
    <mat-spinner *ngIf="loading" diameter="40" style="margin:60px auto;display:block"></mat-spinner>
    <div *ngIf="!loading" class="table-wrap">
      <table mat-table [dataSource]="requests" class="mat-elevation-z2">
        <ng-container matColumnDef="category">
          <th mat-header-cell *matHeaderCellDef>קטגוריה</th>
          <td mat-cell *matCellDef="let r">{{ r.category }}</td>
        </ng-container>
        <ng-container matColumnDef="description">
          <th mat-header-cell *matHeaderCellDef>תיאור</th>
          <td mat-cell *matCellDef="let r">{{ r.description | slice:0:50 }}...</td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>סטטוס</th>
          <td mat-cell *matCellDef="let r"><span [class]="'status-' + r.status">{{ statusMap[r.status] }}</span></td>
        </ng-container>
        <ng-container matColumnDef="urgency">
          <th mat-header-cell *matHeaderCellDef>דחיפות</th>
          <td mat-cell *matCellDef="let r"><span [class]="'urgency-' + r.urgency">{{ urgencyMap[r.urgency] }}</span></td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>שינוי סטטוס</th>
          <td mat-cell *matCellDef="let r">
            <mat-select [(ngModel)]="r.status" (selectionChange)="updateStatus(r._id, r.status)" style="font-size:0.85rem;width:120px">
              <mat-option *ngFor="let s of statuses" [value]="s">{{ statusMap[s] }}</mat-option>
            </mat-select>
          </td>
        </ng-container>
        <ng-container matColumnDef="delete">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let r">
            <button mat-button color="warn" (click)="deleteRequest(r._id)">מחק</button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="cols"></tr>
        <tr mat-row *matRowDef="let row; columns: cols;"></tr>
      </table>
    </div>
  `,
  styles: [`.table-wrap { overflow-x:auto; } table { width:100%; }`],
})
export class RequestsTableComponent implements OnInit {
  requests: any[] = [];
  cols = ['category', 'description', 'status', 'urgency', 'actions', 'delete'];
  loading = true;
  statuses = ['open', 'locked', 'closed', 'disputed'];
  statusMap: Record<string, string> = { open: 'פתוח', locked: 'נעול', closed: 'סגור', disputed: 'במחלוקת' };
  urgencyMap: Record<string, string> = { high: 'דחוף', medium: 'בינוני', low: 'נמוך' };

  constructor(private http: HttpClient, private snack: MatSnackBar) {}
  ngOnInit() { this.load(); }
  load() {
    this.loading = true;
    this.http.get<any[]>(`${environment.apiUrl}/requests`).subscribe({ next: (r) => { this.requests = r; this.loading = false; }, error: () => this.loading = false });
  }
  updateStatus(id: string, status: string) {
    this.http.put(`${environment.apiUrl}/requests/${id}`, { status }).subscribe({
      next: () => this.snack.open('סטטוס עודכן', 'סגור', { duration: 2000 }),
      error: (err) => this.snack.open(err.error?.message || 'שגיאה', 'סגור', { duration: 4000 }),
    });
  }
  deleteRequest(id: string) {
    if (!confirm('למחוק בקשה זו?')) return;
    this.http.delete(`${environment.apiUrl}/requests/${id}`).subscribe({
      next: () => { this.snack.open('נמחק', 'סגור', { duration: 2000 }); this.load(); },
      error: (err) => this.snack.open(err.error?.message || 'שגיאה', 'סגור', { duration: 4000 }),
    });
  }
}
