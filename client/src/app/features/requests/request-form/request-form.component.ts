import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { RequestsService, HelpRequest, isRequestOwner } from '../requests.service';
import { LocationInputComponent } from '../../shared/location-input/location-input.component';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-request-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule,
    LocationInputComponent,
  ],
  template: `
    <mat-card class="form-card">
      <mat-card-header>
        <mat-card-title>{{ editId ? 'עריכת בקשת עזרה' : 'פתיחת בקשת עזרה' }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <mat-spinner *ngIf="loadingRequest" diameter="40" style="margin:40px auto;display:block"></mat-spinner>
        <form *ngIf="!loadingRequest" [formGroup]="form" (ngSubmit)="onSubmit()">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>קטגוריה</mat-label>
            <mat-select formControlName="category">
              <mat-option *ngFor="let c of categories" [value]="c">{{ c }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>תיאור הבקשה</mat-label>
            <textarea matInput formControlName="description" rows="4" placeholder="תאר את הצורך שלך..."></textarea>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>דחיפות</mat-label>
            <mat-select formControlName="urgency">
              <mat-option value="high">דחוף</mat-option>
              <mat-option value="medium">בינוני</mat-option>
              <mat-option value="low">נמוך</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>מועד מועדף (אופציונלי)</mat-label>
            <input matInput type="datetime-local" formControlName="preferredTime" />
            <mat-hint>אם לא תבחר/י מועד, הבקשה תוצג עם שעת הפתיחה שלה</mat-hint>
          </mat-form-field>
          <app-location-input formControlName="location" (cityChange)="form.patchValue({ city: $event })" />
          <p class="error" *ngIf="form.get('location')?.invalid && form.get('location')?.touched">
            יש לבחור מיקום — הקלד כתובת או השתמש במיקום המכשיר
          </p>
          <p class="error" *ngIf="error">{{ error }}</p>
          <button mat-raised-button color="primary" type="submit" [disabled]="loading || form.invalid" class="full-width" style="margin-top:16px">
            <mat-spinner diameter="20" *ngIf="loading" style="display:inline-block;margin-left:8px"></mat-spinner>
            {{ editId ? 'שמור שינויים' : 'שלח בקשה' }}
          </button>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .form-card { max-width:560px; margin:0 auto; padding:24px; }
    .full-width { width:100%; margin-bottom:12px; }
    .error { color:#d32f2f; font-size:0.9rem; }
  `],
})
export class RequestFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);

  categories = ['לינה', 'הסעה', 'מזון', 'תרופות', 'ילדים', 'נפשי'];
  editId: string | null = null;
  loadingRequest = false;
  loading = false;
  error = '';

  form = this.fb.group({
    category: ['', Validators.required],
    description: ['', [Validators.required, Validators.minLength(10)]],
    urgency: ['medium', Validators.required],
    preferredTime: [''],
    location: [null as any, Validators.required],
    city: [''],
  });

  constructor(
    private svc: RequestsService,
    private auth: AuthService,
    private router: Router,
    private snack: MatSnackBar,
  ) {}

  ngOnInit() {
    this.editId = this.route.snapshot.paramMap.get('id');
    if (!this.editId) return;

    this.loadingRequest = true;
    this.svc.getById(this.editId).subscribe({
      next: (request) => {
        if (!isRequestOwner(request, this.auth.currentUser?._id)) {
          this.snack.open('אין הרשאה לערוך בקשה זו', 'סגור', { duration: 4000 });
          this.router.navigate(['/requests']);
          return;
        }
        this.form.patchValue({
          category: request.category,
          description: request.description,
          urgency: request.urgency,
          preferredTime: request.preferredTime ? this.toDatetimeLocalValue(request.preferredTime) : '',
          location: request.location,
          city: request.city || '',
        });
        this.loadingRequest = false;
      },
      error: () => {
        this.loadingRequest = false;
        this.router.navigate(['/my-requests']);
      },
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';
    const { preferredTime, ...rest } = this.form.value;
    const payload = {
      ...rest,
      preferredTime: preferredTime ? new Date(preferredTime).toISOString() : null,
    } as Partial<HelpRequest>;
    const request$ = this.editId
      ? this.svc.update(this.editId, payload)
      : this.svc.create(payload);

    request$.subscribe({
      next: () => {
        const message = this.editId ? 'הבקשה עודכנה!' : 'הבקשה נשלחה!';
        this.snack.open(message, 'סגור', { duration: 3000 });
        this.router.navigate([this.editId ? '/my-requests' : '/requests']);
      },
      error: (err) => {
        this.error = err.error?.message || (this.editId ? 'שגיאה בעדכון הבקשה' : 'שגיאה בשליחת הבקשה');
        this.loading = false;
      },
    });
  }

  private toDatetimeLocalValue(value: string | Date): string {
    const d = new Date(value);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}
