import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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
  getById(id: string): Observable<HelpRequest> { return this.http.get<HelpRequest>(`${this.base}/${id}`); }
  getNearby(): Observable<HelpRequest[]> { return this.http.get<HelpRequest[]>(`${this.base}/nearby`); }
  create(data: Partial<HelpRequest>): Observable<HelpRequest> { return this.http.post<HelpRequest>(this.base, data); }
  update(id: string, data: Partial<HelpRequest>): Observable<HelpRequest> { return this.http.put<HelpRequest>(`${this.base}/${id}`, data); }
  delete(id: string): Observable<any> { return this.http.delete(`${this.base}/${id}`); }
  lock(id: string): Observable<HelpRequest> { return this.http.post<HelpRequest>(`${this.base}/${id}/lock`, {}); }
  confirm(id: string): Observable<HelpRequest> { return this.http.post<HelpRequest>(`${this.base}/${id}/confirm`, {}); }
  rate(id: string, score: number): Observable<any> { return this.http.post(`${this.base}/${id}/rate`, { score }); }
}
