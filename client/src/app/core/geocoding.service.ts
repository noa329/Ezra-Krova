import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface GeocodeResult {
  label: string;
  lat: number;
  lng: number;
}

export interface ReverseGeocodeResult extends GeocodeResult {
  city: string;
}

@Injectable({ providedIn: 'root' })
export class GeocodingService {
  private base = `${environment.apiUrl}/geocode`;

  constructor(private http: HttpClient) {}

  search(query: string): Observable<GeocodeResult[]> {
    if (query.trim().length < 2) return of([]);
    const params = new HttpParams().set('q', query.trim());
    return this.http.get<GeocodeResult[]>(`${this.base}/search`, { params });
  }

  searchWithDebounce(source$: Observable<string>): Observable<GeocodeResult[]> {
    return source$.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      switchMap((q) => this.search(q).pipe(catchError(() => of([])))),
    );
  }

  reverse(lat: number, lng: number): Observable<ReverseGeocodeResult> {
    const params = new HttpParams().set('lat', lat).set('lon', lng);
    return this.http.get<ReverseGeocodeResult>(`${this.base}/reverse`, { params });
  }
}
