import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, Subscription } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SocketService } from '../../../core/socket.service';
import { AuthService } from '../../auth/auth.service';
import { MatchedRequest, VolunteerDashboardService, VolunteerProfile } from './volunteer-dashboard.service';
import { LocationMapComponent, MapMarker } from '../../shared/location-map/location-map.component';
import { PushNotificationService } from '../../../core/push-notification.service';

const SKILLS = ['לינה', 'הסעה', 'מזון', 'תרופות', 'ילדים', 'נפשי'];
const URGENCY_LABELS: Record<MatchedRequest['urgency'], string> = {
  high: 'דחוף',
  medium: 'בינוני',
  low: 'רגיל',
};

@Component({
  selector: 'app-volunteer-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    LocationMapComponent,
    RouterLink,
  ],
  templateUrl: './volunteer-dashboard.component.html',
  styleUrl: './volunteer-dashboard.component.scss',
})
export class VolunteerDashboardComponent implements OnInit, OnDestroy {
  volunteer: VolunteerProfile | null = null;
  requests: MatchedRequest[] = [];
  allSkills = SKILLS;
  loading = false;
  savingFilters = false;
  volunteerId = '';
  private socketSub?: Subscription;
  private authSub?: Subscription;

  constructor(
    private auth: AuthService,
    private dashboard: VolunteerDashboardService,
    private socket: SocketService,
    private snack: MatSnackBar,
    private push: PushNotificationService,
  ) {}

  ngOnInit() {
    const userId = this.auth.currentUser?._id;
    if (!userId) {
      this.snack.open('נדרשת התחברות כדי לצפות בדשבורד', 'סגור', { duration: 4000 });
      return;
    }
    this.volunteerId = userId;
    this.load();
    this.authSub = this.auth.currentUser$.subscribe((user) => {
      if (!this.volunteer || !user) return;
      const isAvailable = Boolean(user.volunteerProfile?.isAvailable);
      const changed = this.volunteer.availableNow !== isAvailable;
      this.volunteer.availableNow = isAvailable;
      if (!isAvailable) {
        this.requests = [];
      } else if (changed) {
        this.loadMatches();
      }
    });
    this.socketSub = this.socket.onNewRequest().subscribe(() => this.loadMatches());
    this.push.subscribe().then((ok) => {
      if (ok) this.snack.open('התראות push הופעלו', 'סגור', { duration: 2500 });
    });
  }

  ngOnDestroy() {
    this.socketSub?.unsubscribe();
    this.authSub?.unsubscribe();
  }

  load() {
    this.loading = true;
    forkJoin({
      volunteer: this.dashboard.getVolunteer(this.volunteerId),
      requests: this.dashboard.getMatches(this.volunteerId),
    }).subscribe({
      next: ({ volunteer, requests }) => {
        this.volunteer = volunteer;
        this.requests = this.excludeOwnRequests(requests);
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.snack.open(err.error?.message || 'שגיאה בטעינת הדשבורד', 'סגור', { duration: 4000 });
      },
    });
  }

  loadMatches() {
    if (!this.volunteerId) return;
    this.dashboard.getMatches(this.volunteerId).subscribe({
      next: (requests) => { this.requests = this.excludeOwnRequests(requests); },
      error: (err) => this.snack.open(err.error?.message || 'שגיאה בטעינת התאמות', 'סגור', { duration: 4000 }),
    });
  }

  volunteerFor(request: MatchedRequest) {
    this.dashboard.volunteerForRequest(request._id).subscribe({
      next: () => {
        this.snack.open('נרשמת להתנדבות בהצלחה!', 'סגור', { duration: 3000 });
        this.requests = this.requests.filter(item => item._id !== request._id);
        this.refreshVolunteer();
      },
      error: (err) => this.snack.open(err.error?.message || 'שגיאה בהרשמה להתנדבות', 'סגור', { duration: 4000 }),
    });
  }

  skip(request: MatchedRequest) {
    this.requests = this.requests.filter(item => item._id !== request._id);
  }

  toggleAvailability(availableNow: boolean) {
    if (!this.volunteer) return;
    const previous = this.volunteer.availableNow;
    this.volunteer.availableNow = availableNow;
    this.savingFilters = true;
    this.dashboard.updateAvailability(this.volunteerId, availableNow).subscribe({
      next: (volunteer) => {
        this.afterFilterSaved(volunteer);
        this.auth.refreshUser().subscribe();
      },
      error: (err) => {
        if (this.volunteer) this.volunteer.availableNow = previous;
        this.handleFilterError(err);
      },
    });
  }

  toggleSkill(skill: string, checked: boolean) {
    if (!this.volunteer) return;
    const previous = [...this.volunteer.skills];
    this.volunteer.skills = checked
      ? Array.from(new Set([...this.volunteer.skills, skill]))
      : this.volunteer.skills.filter(item => item !== skill);
    this.savingFilters = true;
    this.dashboard.updateSkills(this.volunteerId, this.volunteer.skills).subscribe({
      next: (volunteer) => this.afterFilterSaved(volunteer),
      error: (err) => {
        if (this.volunteer) this.volunteer.skills = previous;
        this.handleFilterError(err);
      },
    });
  }

  updateRadius(helpRadius: number) {
    if (!this.volunteer || this.volunteer.helpRadius === helpRadius) return;
    const previous = this.volunteer.helpRadius;
    this.volunteer.helpRadius = helpRadius;
    this.savingFilters = true;
    this.dashboard.updateRadius(this.volunteerId, helpRadius).subscribe({
      next: (volunteer) => this.afterFilterSaved(volunteer),
      error: (err) => {
        if (this.volunteer) this.volunteer.helpRadius = previous;
        this.handleFilterError(err);
      },
    });
  }

  urgencyLabel(urgency: MatchedRequest['urgency']): string {
    return URGENCY_LABELS[urgency];
  }

  trackRequest(index: number, request: MatchedRequest): string {
    return request._id;
  }

  get mapMarkers(): MapMarker[] {
    const markers: MapMarker[] = [];
    if (this.volunteer?.lat != null && this.volunteer?.lng != null) {
      markers.push({ lat: this.volunteer.lat, lng: this.volunteer.lng, label: 'המיקום שלך', color: '#388e3c' });
    }
    for (const r of this.requests) {
      if (r.lat != null && r.lng != null) {
        markers.push({ lat: r.lat, lng: r.lng, label: r.requesterName, color: '#1976d2' });
      }
    }
    return markers;
  }

  private afterFilterSaved(volunteer: VolunteerProfile) {
    this.volunteer = volunteer;
    this.savingFilters = false;
    this.loadMatches();
  }

  private refreshVolunteer() {
    this.dashboard.getVolunteer(this.volunteerId).subscribe({
      next: (volunteer) => { this.volunteer = volunteer; },
    });
  }

  private handleFilterError(err: any) {
    this.savingFilters = false;
    this.snack.open(err.error?.message || 'שגיאה בעדכון הסינון', 'סגור', { duration: 4000 });
  }

  private excludeOwnRequests(requests: MatchedRequest[]): MatchedRequest[] {
    return requests.filter(r => r.requesterId !== this.volunteerId);
  }
}
