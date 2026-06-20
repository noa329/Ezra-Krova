import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

export interface RatingDialogData {
  targetName: string;
  requestCategory: string;
}

@Component({
  selector: 'app-rating-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>דרג את {{ data.targetName }}</h2>
    <mat-dialog-content>
      <p class="subtitle">איך הייתה החוויה ב{{ data.requestCategory }}?</p>
      <div class="stars" role="group" aria-label="בחירת דירוג">
        <button
          type="button"
          mat-icon-button
          *ngFor="let s of stars"
          (click)="select(s)"
          (mouseenter)="hover = s"
          (mouseleave)="hover = 0"
          [attr.aria-label]="s + ' כוכבים'">
          <mat-icon>{{ (hover || selected) >= s ? 'star' : 'star_border' }}</mat-icon>
        </button>
      </div>
      <p class="hint" *ngIf="selected">{{ selected }} מתוך 5</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">דלג</button>
      <button mat-raised-button color="primary" [disabled]="!selected" (click)="dialogRef.close(selected)">
        שלח דירוג
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .subtitle { color: #555; margin-bottom: 8px; }
    .stars { display: flex; justify-content: center; gap: 4px; padding: 12px 0; }
    .stars mat-icon { font-size: 36px; width: 36px; height: 36px; color: #ffb300; }
    .hint { text-align: center; font-size: 0.9rem; color: #666; }
  `],
})
export class RatingDialogComponent {
  stars = [1, 2, 3, 4, 5];
  selected = 0;
  hover = 0;

  constructor(
    public dialogRef: MatDialogRef<RatingDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RatingDialogData,
  ) {}

  select(score: number) {
    this.selected = score;
  }
}
