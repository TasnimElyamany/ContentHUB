import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

import {
  AnalyticsService,
  UserActivity,
  AIUsageStats,
} from '../../services/analytics';
import { Auth } from '../../../../core/services/auth';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule,
  ],
  templateUrl: './analytics-dashboard.html',
  styleUrl: './analytics-dashboard.scss',
})
export class AnalyticsDashboard implements OnInit {
  private analyticsService = inject(AnalyticsService);
  private authService = inject(Auth);
  private router = inject(Router);

  isLoading = signal(true);
  error = signal<string | null>(null);
  activity = signal<UserActivity | null>(null);
  aiStats = signal<AIUsageStats | null>(null);

  aiActionLabels: Record<string, string> = {
    generate: 'Generate',
    enhance: 'Enhance',
    improve: 'Improve',
    grammar: 'Grammar',
    shorten: 'Shorten',
    expand: 'Expand',
    tone: 'Tone',
    research: 'Research',
  };

  aiByDay = computed(() => {
    const days = this.aiStats()?.byDay ?? [];
    const max = Math.max(...days.map((d) => d.count), 1);
    return days.slice(-14).map((d) => ({
      ...d,
      pct: Math.round((d.count / max) * 100),
      label: new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    }));
  });

  aiByAction = computed(() => {
    const byAction = this.aiStats()?.byAction ?? {};
    return Object.entries(byAction)
      .map(([key, count]) => ({ key, label: this.aiActionLabels[key] ?? key, count }))
      .sort((a, b) => b.count - a.count);
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.error.set(null);

    let loaded = 0;
    const done = () => { if (++loaded === 2) this.isLoading.set(false); };

    this.analyticsService.getUserActivity().subscribe({
      next: (data) => { this.activity.set(data); done(); },
      error: () => { this.error.set('Failed to load activity data.'); this.isLoading.set(false); },
    });

    this.analyticsService.getAIUsageStats().subscribe({
      next: (data) => { this.aiStats.set(data); done(); },
      error: () => { this.error.set('Failed to load AI usage data.'); this.isLoading.set(false); },
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
