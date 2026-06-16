import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './features/shared/navbar/navbar.component';
import { SocketService } from './core/socket.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <div dir="rtl">
      <app-navbar />
      <main class="main-content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .main-content {
      padding: 24px 16px;
      max-width: 1200px;
      margin: 0 auto;
    }
  `],
})
export class AppComponent implements OnInit {
  constructor(private socketService: SocketService) {}
  ngOnInit() {
    this.socketService.connect();
  }
}
