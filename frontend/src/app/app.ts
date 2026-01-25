import { Component, inject, signal } from '@angular/core';
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
export class App {
  title = 'ContentHUB';

  loadingService = inject(LoadingService);
  private authService = inject(Auth);

  ngOnInit(){
    this.checkAuthentication();
  }

  private checkAuthentication(): void {
    if (this.authService.isAuthenticated) {
      this.authService.refreshUserData().subscribe();
      console.log('User is authenticated, data refreshed.');
    }
    else {
      console.log('User is not authenticated.');
    }
  }

  // protected readonly title = signal('ContentHUB');
}
