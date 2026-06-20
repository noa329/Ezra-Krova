import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface VolunteerProfile {
  name: string;
  city: string;
  isVerified: boolean;
  rating: number;
  completedHelps: number;
  availableNow: boolean;
  skills: string[];
  availabilitySlots: string[];
  helpRadius: number;
  lat?: number | null;
  lng?: number | null;
}

export interface MatchedRequest {
  _id: string;
  requesterName: string;
  category: string;
  description: string;
  distance: number;
  matchPercent: number;
  requiredSkills: string[];
  urgency: 'high' | 'medium' | 'low';
  lat?: number;
  lng?: number;
}

@Injectable({ providedIn: 'root' })
export class VolunteerDashboardService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getVolunteer(id: string): Observable<VolunteerProfile> {
    return this.http.get<VolunteerProfile>(`${this.base}/volunteers/${id}`);
  }

  getMatches(volunteerId: string): Observable<MatchedRequest[]> {
    const params = new HttpParams().set('volunteerId', volunteerId);
    return this.http.get<MatchedRequest[]>(`${this.base}/requests/matches`, { params });
  }

  volunteerForRequest(id: string): Observable<unknown> {
    return this.http.post(`${this.base}/requests/${id}/volunteer`, {});
  }

  updateAvailability(id: string, availableNow: boolean): Observable<VolunteerProfile> {
    return this.http.patch<VolunteerProfile>(`${this.base}/volunteers/${id}/availability`, { availableNow });
  }

  updateSkills(id: string, skills: string[]): Observable<VolunteerProfile> {
    return this.http.patch<VolunteerProfile>(`${this.base}/volunteers/${id}/skills`, { skills });
  }

  updateRadius(id: string, helpRadius: number): Observable<VolunteerProfile> {
    return this.http.patch<VolunteerProfile>(`${this.base}/volunteers/${id}/radius`, { helpRadius });
  }
}
