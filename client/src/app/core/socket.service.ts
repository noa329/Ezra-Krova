import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket!: Socket;
  private newRequest$ = new Subject<any>();
  private requestLocked$ = new Subject<any>();
  private requestCompleted$ = new Subject<any>();
  private statusUpdate$ = new Subject<any>();

  connect(): void {
    if (this.socket?.connected) return;
    this.socket = io(environment.socketUrl, { transports: ['websocket'] });
    this.socket.on('new-request', (data: any) => this.newRequest$.next(data));
    this.socket.on('request-locked', (data: any) => this.requestLocked$.next(data));
    this.socket.on('request-completed', (data: any) => this.requestCompleted$.next(data));
    this.socket.on('request-status-update', (data: any) => this.statusUpdate$.next(data));
  }

  joinRoom(userId: string): void {
    this.socket?.emit('join', userId);
  }

  onNewRequest(): Observable<any> { return this.newRequest$.asObservable(); }
  onRequestLocked(): Observable<any> { return this.requestLocked$.asObservable(); }
  onRequestCompleted(): Observable<any> { return this.requestCompleted$.asObservable(); }
  onStatusUpdate(): Observable<any> { return this.statusUpdate$.asObservable(); }

  disconnect(): void { this.socket?.disconnect(); }
}
