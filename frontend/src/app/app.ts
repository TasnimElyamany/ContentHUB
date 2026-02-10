import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LoadingService } from './core/services/loading-service';
import { Auth } from './core/services/auth';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressBarModule,
    RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements  OnInit {
  title = 'ContentHUB';

  loadingService = inject(LoadingService);
  private authService = inject(Auth);

  ngOnInit(){
    this.checkAuthentication();
  }

  private checkAuthentication(): void {
    if (this.authService.isAuthenticated && !this.authService.isTokenExpired()) {
      this.authService.refreshUserData().subscribe({
        error: () => {
          console.warn('Could not refresh user data. Using cached session.');
        }
      });
    }
  }

  // protected readonly title = signal('ContentHUB');
}
