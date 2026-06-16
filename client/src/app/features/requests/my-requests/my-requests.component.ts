import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RequestsService, HelpRequest } from '../requests.service';
import { RequestCardComponent } from '../request-card/request-card.component';

@Component({
  selector: 'app-my-requests',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, RequestCardComponent],
  template: `
    <h2 style="color:#1a237e;margin-bottom:16px">הבקשות שלי</h2>
    <mat-spinner *ngIf="loading" diameter="40" style="margin:60px auto;display:block"></mat-spinner>
    <div *ngIf="!loading">
      <app-request-card *ngFor="let r of requests" [request]="r" />
      <p *ngIf="requests.length === 0" style="text-align:center;color:#999;padding:40px">לא פתחת בקשות עדיין</p>
    </div>
  `,
})
export class MyRequestsComponent implements OnInit {
  requests: HelpRequest[] = [];
  loading = true;
  constructor(private svc: RequestsService) {}
  ngOnInit() { this.svc.getMy().subscribe({ next: (r) => { this.requests = r; this.loading = false; }, error: () => this.loading = false }); }
}
