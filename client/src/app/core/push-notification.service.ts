import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private swPath = '/push-sw.js';

  constructor(private http: HttpClient) {}

  async subscribe(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;

    try {
      const { publicKey } = await firstValueFrom(
        this.http.get<{ publicKey: string }>(`${environment.apiUrl}/notifications/vapid-public-key`)
      );

      const registration = await navigator.serviceWorker.register(this.swPath);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(publicKey),
      });

      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/notifications/subscribe`, subscription.toJSON())
      );
      return true;
    } catch {
      return false;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(base64);
    return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
  }
}
