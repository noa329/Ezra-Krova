import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-users-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <h2 style="color:#1a237e">ניהול משתמשים</h2>
    <mat-spinner *ngIf="loading" diameter="40" style="margin:60px auto;display:block"></mat-spinner>
    <div *ngIf="!loading" class="table-wrap">
      <table mat-table [dataSource]="users" class="mat-elevation-z2">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>שם</th>
          <td mat-cell *matCellDef="let u">{{ u.name }}</td>
        </ng-container>
        <ng-container matColumnDef="phone">
          <th mat-header-cell *matHeaderCellDef>טלפון</th>
          <td mat-cell *matCellDef="let u" dir="ltr">{{ u.phone }}</td>
        </ng-container>
        <ng-container matColumnDef="role">
          <th mat-header-cell *matHeaderCellDef>תפקיד</th>
          <td mat-cell *matCellDef="let u">{{ u.role }}</td>
        </ng-container>
        <ng-container matColumnDef="rating">
          <th mat-header-cell *matHeaderCellDef>דירוג</th>
          <td mat-cell *matCellDef="let u">{{ u.rating?.count > 0 ? (u.rating.avg | number:'1.1-1') + ' ⭐' : '—' }}</td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>פעולות</th>
          <td mat-cell *matCellDef="let u">
            <button mat-button color="warn" *ngIf="u.role !== 'admin'" (click)="deleteUser(u._id)">חסום / מחק</button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="cols"></tr>
        <tr mat-row *matRowDef="let row; columns: cols;"></tr>
      </table>
    </div>
  `,
  styles: [`.table-wrap { overflow-x:auto; } table { width:100%; }`],
})
export class UsersTableComponent implements OnInit {
  users: any[] = [];
  cols = ['name', 'phone', 'role', 'rating', 'actions'];
  loading = true;
  constructor(private http: HttpClient, private snack: MatSnackBar) {}
  ngOnInit() { this.load(); }
  load() {
    this.loading = true;
    this.http.get<any[]>(`${environment.apiUrl}/users`).subscribe({ next: (u) => { this.users = u; this.loading = false; }, error: () => this.loading = false });
  }
  deleteUser(id: string) {
    if (!confirm('האם למחוק/לחסום משתמש זה?')) return;
    this.http.delete(`${environment.apiUrl}/users/${id}`).subscribe({
      next: () => { this.snack.open('משתמש נמחק', 'סגור', { duration: 3000 }); this.load(); },
      error: (err) => this.snack.open(err.error?.message || 'שגיאה', 'סגור', { duration: 4000 }),
    });
  }
}
