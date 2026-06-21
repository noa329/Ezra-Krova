import { Component, EventEmitter, forwardRef, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import { GeocodeResult, GeocodingService } from '../../../core/geocoding.service';

@Component({
  selector: 'app-location-input',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatAutocompleteModule, MatProgressSpinnerModule,
  ],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => LocationInputComponent),
    multi: true,
  }],
  template: `
    <mat-form-field appearance="outline" class="full-width">
      <mat-label>{{ label }}</mat-label>
      <input matInput [(ngModel)]="addressText" [ngModelOptions]="{standalone: true}"
             [matAutocomplete]="auto" (input)="onAddressInput()" (blur)="onTouched()"
             placeholder="הקלד עיר או כתובת מלאה">
      <mat-autocomplete #auto="matAutocomplete" (optionSelected)="onSuggestionSelected($event.option.value)">
        <mat-option *ngFor="let s of suggestions" [value]="s">{{ s.label }}</mat-option>
      </mat-autocomplete>
    </mat-form-field>
    <button mat-stroked-button type="button" (click)="detectDeviceLocation()" [disabled]="locating" class="geo-btn">
      <mat-spinner diameter="18" *ngIf="locating" style="display:inline-block;margin-left:6px"></mat-spinner>
      📍 השתמש במיקום המכשיר
    </button>
    <p class="success" *ngIf="locationSet">✅ {{ addressText || 'מיקום נקלט' }}</p>
    <p class="error" *ngIf="error">{{ error }}</p>
  `,
  styles: [`
    .full-width { width:100%; margin-bottom:8px; display:block; }
    .geo-btn { margin-bottom:8px; }
    .success { color:#388e3c; font-size:0.9rem; margin:4px 0; }
    .error { color:#d32f2f; font-size:0.9rem; margin:4px 0; }
  `],
})
export class LocationInputComponent implements ControlValueAccessor, OnInit, OnDestroy {
  @Input() label = 'מיקום';
  @Output() cityChange = new EventEmitter<string>();

  addressText = '';
  suggestions: GeocodeResult[] = [];
  locating = false;
  locationSet = false;
  error = '';

  private search$ = new Subject<string>();
  private destroy$ = new Subject<void>();
  private onChange: (v: { type: 'Point'; coordinates: [number, number] } | null) => void = () => {};
  onTouched: () => void = () => {};

  constructor(private geocoding: GeocodingService) {}

  ngOnInit() {
    this.geocoding.searchWithDebounce(this.search$).pipe(
      takeUntil(this.destroy$),
    ).subscribe((results) => { this.suggestions = results; });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  writeValue(value: { type: string; coordinates: [number, number] } | null): void {
    if (value?.coordinates?.[0] && value?.coordinates?.[1]) {
      this.locationSet = true;
      const [lng, lat] = value.coordinates;
      this.geocoding.reverse(lat, lng).subscribe({
        next: (data) => { this.addressText = data.label || this.addressText; },
      });
    }
  }

  registerOnChange(fn: (v: { type: 'Point'; coordinates: [number, number] } | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void { this.onTouched = fn; }

  setDisabledState?(_disabled: boolean): void {}

  onAddressInput() {
    this.error = '';
    this.search$.next(this.addressText);
  }

  onSuggestionSelected(result: GeocodeResult) {
    this.addressText = result.label;
    this.locationSet = true;
    this.error = '';
    const city = result.label.split(',')[0].trim();
    this.cityChange.emit(city);
    this.onChange({ type: 'Point', coordinates: [result.lng, result.lat] });
  }

  detectDeviceLocation() {
    if (!navigator.geolocation) {
      this.error = 'הדפדפן אינו תומך בזיהוי מיקום';
      return;
    }
    this.locating = true;
    this.error = '';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { longitude: lng, latitude: lat } = pos.coords;
        this.geocoding.reverse(lat, lng).subscribe({
          next: (data) => {
            this.addressText = data.label || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            this.locationSet = true;
            this.locating = false;
            this.cityChange.emit(data.city || this.addressText.split(',')[0].trim());
            this.onChange({ type: 'Point', coordinates: [lng, lat] });
          },
          error: () => {
            this.addressText = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            this.locationSet = true;
            this.locating = false;
            this.onChange({ type: 'Point', coordinates: [lng, lat] });
          },
        });
      },
      (err) => {
        this.locating = false;
        if (err.code === err.PERMISSION_DENIED) {
          this.error = 'גישה למיקום נדחתה. אפשר גישה בהגדרות הדפדפן או הקלד כתובת ידנית.';
        } else {
          this.error = 'לא ניתן לזהות מיקום. נסה להקליד כתובת ידנית.';
        }
      }
    );
  }
}
