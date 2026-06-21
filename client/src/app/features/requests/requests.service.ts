import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export function getRequesterId(request: HelpRequest): string | null {
  const rid = request.requesterId;
  if (!rid) return null;
  if (typeof rid === 'string') return rid;
  return rid._id?.toString?.() ?? rid.toString?.() ?? null;
}

export function isRequestOwner(request: HelpRequest, userId?: string | null): boolean {
  if (!userId) return false;
  return getRequesterId(request) === userId;
}

export function formatPreferredTime(value: string | Date): string {
  const d = new Date(value);
  return d.toLocaleString('he-IL', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export interface HelpRequest {
  _id: string;
  requesterId: any;
  category: string;
  description: string;
  location: { type: string; coordinates: [number, number] };
  city?: string;
  urgency: 'high' | 'medium' | 'low';
  status: 'open' | 'locked' | 'closed' | 'disputed';
  volunteerId?: any;
  requesterConfirmed: boolean;
  volunteerConfirmed: boolean;
  preferredTime?: string | Date | null;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class RequestsService {
  private base = `${environment.apiUrl}/requests`;
  constructor(private http: HttpClient) {}

  getAll(category?: string): Observable<HelpRequest[]> {
    let params = new HttpParams();
    if (category) params = params.set('category', category);
    return this.http.get<HelpRequest[]>(this.base, { params });
  }

  getMy(): Observable<HelpRequest[]> { return this.http.get<HelpRequest[]>(`${this.base}/my`); }
  getMyClaimed(): Observable<HelpRequest[]> { return this.http.get<HelpRequest[]>(`${this.base}/my-claimed`); }
  getById(id: string): Observable<HelpRequest> { return this.http.get<HelpRequest>(`${this.base}/${id}`); }
  getNearby(): Observable<HelpRequest[]> { return this.http.get<HelpRequest[]>(`${this.base}/nearby`); }
  create(data: Partial<HelpRequest>): Observable<HelpRequest> { return this.http.post<HelpRequest>(this.base, data); }
  update(id: string, data: Partial<HelpRequest>): Observable<HelpRequest> { return this.http.put<HelpRequest>(`${this.base}/${id}`, data); }
  delete(id: string): Observable<any> { return this.http.delete(`${this.base}/${id}`); }
  lock(id: string): Observable<HelpRequest> { return this.http.post<HelpRequest>(`${this.base}/${id}/lock`, {}); }
  confirm(id: string): Observable<HelpRequest> { return this.http.post<HelpRequest>(`${this.base}/${id}/confirm`, {}); }
  rate(id: string, score: number): Observable<any> { return this.http.post(`${this.base}/${id}/rate`, { score }); }
  dispute(id: string): Observable<HelpRequest> { return this.http.post<HelpRequest>(`${this.base}/${id}/dispute`, {}); }
  resolveDispute(id: string, resolution: 'closed' | 'open'): Observable<HelpRequest> {
    return this.http.post<HelpRequest>(`${this.base}/${id}/resolve-dispute`, { resolution });
  }
  getAllAdmin(): Observable<HelpRequest[]> { return this.http.get<HelpRequest[]>(`${this.base}/admin/all`); }
  adminUpdateStatus(id: string, status: string): Observable<HelpRequest> {
    return this.http.put<HelpRequest>(`${this.base}/${id}/status`, { status });
  }
}
