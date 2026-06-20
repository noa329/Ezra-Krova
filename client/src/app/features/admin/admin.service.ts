import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface AdminStats {
  totals: {
    users: number;
    requests: number;
    open: number;
    locked: number;
    closed: number;
    disputed: number;
  };
  byCategory: { category: string; count: number }[];
  byUrgency: { urgency: string; count: number }[];
  recentRequests: any[];
  topVolunteers: { name: string; rating: { avg: number; count: number } }[];
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private base = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  getStats() {
    return this.http.get<AdminStats>(`${this.base}/stats`);
  }

  exportData() {
    return this.http.get(`${this.base}/export`);
  }
}
