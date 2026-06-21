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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
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
    MatDatepickerModule, MatNativeDateModule, MatIconModule,
    LocationInputComponent,
  ],
  providers: [provideNativeDateAdapter()],
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
          <div class="preferred-time">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>מועד מועדף (אופציונלי)</mat-label>
              <input
                matInput
                readonly
                formControlName="preferredDate"
                [matDatepicker]="preferredDatePicker"
                [matDatepickerFilter]="dateFilter"
                placeholder="בחר/י תאריך ושעה (אופציונלי)"
                (keydown)="$event.preventDefault()"
                (paste)="$event.preventDefault()"
              />
              <mat-datepicker-toggle matIconSuffix [for]="preferredDatePicker"></mat-datepicker-toggle>
              <mat-datepicker #preferredDatePicker></mat-datepicker>
              <mat-hint>אם לא תבחר/י מועד, הבקשה תוצג עם שעת הפתיחה שלה</mat-hint>
            </mat-form-field>
            <div class="preferred-time-row" *ngIf="form.get('preferredDate')?.value">
              <mat-form-field appearance="outline" class="time-field">
                <mat-label>שעה</mat-label>
                <mat-select formControlName="preferredHour">
                  <mat-option *ngFor="let hour of getAvailableHours()" [value]="hour">
                    {{ formatHour(hour) }}
                  </mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="time-field">
                <mat-label>דקות</mat-label>
                <mat-select formControlName="preferredMinute">
                  <mat-option *ngFor="let minute of getAvailableMinutes()" [value]="minute">
                    {{ formatMinute(minute) }}
                  </mat-option>
                </mat-select>
              </mat-form-field>
              <button mat-icon-button type="button" aria-label="נקה מועד מועדף" (click)="clearPreferredTime()">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          </div>
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
    .preferred-time { margin-bottom:12px; }
    .preferred-time-row { display:flex; align-items:flex-start; gap:8px; }
    .time-field { flex:1; }
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
    preferredDate: [null as Date | null],
    preferredHour: [null as number | null],
    preferredMinute: [null as number | null],
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
    this.form.get('preferredDate')?.valueChanges.subscribe(() => this.syncPreferredTimeSelections());
    this.form.get('preferredHour')?.valueChanges.subscribe(() => this.syncPreferredMinute());

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
        const preferredTimeFields = this.parsePreferredTimeFields(request.preferredTime);
        this.form.patchValue({
          category: request.category,
          description: request.description,
          urgency: request.urgency,
          ...preferredTimeFields,
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

    const preferredTime = this.buildPreferredTimeIso();
    if (preferredTime && new Date(preferredTime).getTime() < Date.now()) {
      this.error = 'מועד מועדף לא יכול להיות בעבר';
      return;
    }

    this.loading = true;
    this.error = '';
    const { preferredDate, preferredHour, preferredMinute, ...rest } = this.form.value;
    const payload = {
      ...rest,
      preferredTime,
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

  dateFilter = (date: Date | null): boolean => {
    if (!date) return true;
    return this.startOfDay(date).getTime() >= this.startOfDay(new Date()).getTime();
  };

  clearPreferredTime() {
    this.form.patchValue({
      preferredDate: null,
      preferredHour: null,
      preferredMinute: null,
    });
  }

  getAvailableHours(): number[] {
    const date = this.form.get('preferredDate')?.value as Date | null;
    if (!date) return [];
    const now = new Date();
    if (!this.isSameDay(date, now)) {
      return Array.from({ length: 24 }, (_, index) => index);
    }
    const hours: number[] = [];
    for (let hour = now.getHours(); hour < 24; hour += 1) {
      if (this.getAvailableMinutesForHour(hour).length > 0) hours.push(hour);
    }
    return hours;
  }

  getAvailableMinutes(): number[] {
    const hour = this.form.get('preferredHour')?.value as number | null;
    if (hour === null || hour === undefined) return [];
    return this.getAvailableMinutesForHour(hour);
  }

  formatHour(hour: number): string {
    return hour.toString().padStart(2, '0');
  }

  formatMinute(minute: number): string {
    return minute.toString().padStart(2, '0');
  }

  private buildPreferredTimeIso(): string | null {
    const date = this.form.get('preferredDate')?.value as Date | null;
    const hour = this.form.get('preferredHour')?.value;
    const minute = this.form.get('preferredMinute')?.value;
    if (!date || hour === null || hour === undefined || minute === null || minute === undefined) {
      return null;
    }
    const preferred = new Date(date);
    preferred.setHours(hour, minute, 0, 0);
    return preferred.toISOString();
  }

  private parsePreferredTimeFields(value: string | Date | null | undefined) {
    if (!value) {
      return { preferredDate: null, preferredHour: null, preferredMinute: null };
    }
    const preferred = new Date(value);
    return {
      preferredDate: new Date(preferred.getFullYear(), preferred.getMonth(), preferred.getDate()),
      preferredHour: preferred.getHours(),
      preferredMinute: preferred.getMinutes(),
    };
  }

  private syncPreferredTimeSelections() {
    const date = this.form.get('preferredDate')?.value as Date | null;
    if (!date) {
      this.form.patchValue({ preferredHour: null, preferredMinute: null }, { emitEvent: false });
      return;
    }
    const hour = this.form.get('preferredHour')?.value as number | null;
    if (hour === null || !this.getAvailableHours().includes(hour)) {
      this.form.patchValue({ preferredHour: null, preferredMinute: null }, { emitEvent: false });
      return;
    }
    this.syncPreferredMinute();
  }

  private syncPreferredMinute() {
    const hour = this.form.get('preferredHour')?.value as number | null;
    if (hour === null || hour === undefined) {
      this.form.patchValue({ preferredMinute: null }, { emitEvent: false });
      return;
    }
    const minute = this.form.get('preferredMinute')?.value as number | null;
    const minutes = this.getAvailableMinutesForHour(hour);
    if (minute === null || !minutes.includes(minute)) {
      this.form.patchValue({ preferredMinute: null }, { emitEvent: false });
    }
  }

  private getAvailableMinutesForHour(hour: number): number[] {
    const date = this.form.get('preferredDate')?.value as Date | null;
    if (!date) return [];
    const now = new Date();
    if (!this.isSameDay(date, now) || hour > now.getHours()) {
      return Array.from({ length: 60 }, (_, index) => index);
    }
    if (hour < now.getHours()) return [];
    const startMinute = now.getMinutes();
    return Array.from({ length: 60 - startMinute }, (_, index) => startMinute + index);
  }

  private isSameDay(a: Date, b: Date): boolean {
    return this.startOfDay(a).getTime() === this.startOfDay(b).getTime();
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
}
