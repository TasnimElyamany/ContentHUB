import { Component, AfterViewInit, OnDestroy, NgZone } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatToolbarModule, MatIconModule],
  templateUrl: './landing.html',
  styleUrl: './landing.scss'
})
export class Landing implements AfterViewInit, OnDestroy {

  constructor(private zone: NgZone) {}

  features = [
    {
      icon: 'auto_awesome',
      title: 'AI-Powered Writing',
      description: 'Generate, rewrite, summarize and research — all from a floating AI panel that lives inside your editor.',
      color: '#c47c38',
      size: 7
    },
    {
      icon: 'groups',
      title: 'Real-Time Collaboration',
      description: 'Invite teammates, assign roles, leave comments and share documents with a single link.',
      color: '#8668d4',
      size: 5
    },
    {
      icon: 'workspace_premium',
      title: 'Team Workspaces',
      description: 'Organize projects into dedicated workspaces with granular permission control.',
      color: '#a06b3a',
      size: 5
    },
    {
      icon: 'analytics',
      title: 'Smart Analytics',
      description: 'Track productivity, monitor AI usage patterns, and surface insights into your workflow.',
      color: '#7a6b5a',
      size: 7
    },
    {
      icon: 'history_edu',
      title: 'Rich Text Editor',
      description: 'Slash commands, formatting, and a ghost hint that guides every keystroke.',
      color: '#9d8e80',
      size: 4
    },
    {
      icon: 'share',
      title: 'Flexible Sharing',
      description: 'Copy a viewer or editor link, invite by email, or manage collaborators — all in one dialog.',
      color: '#6b8e6b',
      size: 8
    }
  ];

  comingSoon = [
    {
      icon: 'task_alt',
      title: 'Daily Productivity Suite',
      description: 'Tasks, smart alarms, and an AI daily planner that schedules your work based on your writing goals.',
      phase: 3,
      color: '#c47c38'
    },
    {
      icon: 'view_kanban',
      title: 'Agile & Scrum Board',
      description: 'Full sprint management, story points, velocity tracking, and backlog refinement — built for content teams.',
      phase: 4,
      color: '#8668d4'
    },
    {
      icon: 'account_balance_wallet',
      title: 'Financial Tracker',
      description: 'Track freelance income, project budgets, invoices, and revenue from your content work.',
      phase: 5,
      color: '#5c8f6a'
    },
    {
      icon: 'hub',
      title: 'n8n Integrations',
      description: 'Automate your content pipeline — publish to CMS, notify Slack, sync to Notion, trigger on any event.',
      phase: 7,
      color: '#7a6b5a'
    }
  ];

  stats = [
    { value: '10K+', label: 'Active Users' },
    { value: '500K+', label: 'Documents' },
    { value: '1M+', label: 'AI Assists' },
    { value: '99.9%', label: 'Uptime' }
  ];

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => this.initAnimations());
  }

  ngOnDestroy(): void {
    ScrollTrigger.getAll().forEach(t => t.kill());
  }

  private initAnimations(): void {
    // Hero
    const hero = gsap.timeline({ delay: 0.15, defaults: { ease: 'power3.out' } });
    hero
      .from('.hero-eyebrow',  { opacity: 0, y: 18, duration: 0.55 })
      .from('.hero-title',    { opacity: 0, y: 34, duration: 0.7  }, '-=0.25')
      .from('.hero-subtitle', { opacity: 0, y: 22, duration: 0.55 }, '-=0.3')
      .from('.hero-actions',  { opacity: 0, y: 18, duration: 0.5  }, '-=0.25')
      .from('.hero-stats .stat-item', { opacity: 0, y: 14, stagger: 0.07, duration: 0.45 }, '-=0.2')
      .from('.hero-visual',   { opacity: 0, x: 48, duration: 0.75, ease: 'power2.out' }, '-=0.75');

    // Section headers
    document.querySelectorAll<HTMLElement>('.section-header').forEach(el => {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 84%' },
        opacity: 0, y: 26, duration: 0.6, ease: 'power2.out'
      });
    });

    // Feature cards
    gsap.from('.feature-card', {
      scrollTrigger: { trigger: '.features-grid', start: 'top 78%' },
      opacity: 0, y: 38, stagger: 0.08, duration: 0.65, ease: 'power2.out'
    });

    // Coming soon
    gsap.from('.coming-card', {
      scrollTrigger: { trigger: '.coming-grid', start: 'top 78%' },
      opacity: 0, y: 42, stagger: 0.1, duration: 0.7, ease: 'power2.out'
    });

    // CTA
    gsap.from('.cta-inner > *', {
      scrollTrigger: { trigger: '.cta-section', start: 'top 75%' },
      opacity: 0, y: 26, stagger: 0.12, duration: 0.6, ease: 'power2.out'
    });

    // Parallax blobs
    gsap.to('.hero-blob-1', {
      scrollTrigger: { trigger: '.hero', scrub: 1.5 },
      y: -80, ease: 'none'
    });
    gsap.to('.hero-blob-2', {
      scrollTrigger: { trigger: '.hero', scrub: 2 },
      y: -50, ease: 'none'
    });
  }
}
