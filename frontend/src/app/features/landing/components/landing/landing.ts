import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatToolbarModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule
  ],
  templateUrl: './landing.html',
  styleUrl: './landing.scss'
})
export class Landing {
  features = [
    {
      icon: 'auto_awesome',
      title: 'AI-Powered Writing',
      description: 'Generate high-quality content instantly with advanced AI. Get suggestions, improvements, and creative ideas on demand.',
      color: '#6366f1'
    },
    {
      icon: 'groups',
      title: 'Real-Time Collaboration',
      description: 'Work together seamlessly with your team. See changes in real-time, add comments, and collaborate effortlessly.',
      color: '#8b5cf6'
    },
    {
      icon: 'analytics',
      title: 'Smart Analytics',
      description: 'Track your productivity, monitor AI usage, and gain insights into your content creation workflow.',
      color: '#ec4899'
    },
    {
      icon: 'workspace_premium',
      title: 'Team Workspaces',
      description: 'Organize your projects with dedicated workspaces. Manage permissions and keep everything organized.',
      color: '#14b8a6'
    },
    {
      icon: 'edit_note',
      title: 'Rich Text Editor',
      description: 'Professional editing tools with formatting, images, links, and more. Everything you need to create beautiful content.',
      color: '#f59e0b'
    },
    {
      icon: 'speed',
      title: 'Lightning Fast',
      description: 'Built with modern technology for blazing-fast performance. Auto-save ensures you never lose your work.',
      color: '#10b981'
    }
  ];

  useCases = [
    { title: 'Content Creators', icon: 'create' },
    { title: 'Marketing Teams', icon: 'campaign' },
    { title: 'Bloggers', icon: 'article' },
    { title: 'Writers', icon: 'menu_book' },
    { title: 'Students', icon: 'school' },
    { title: 'Businesses', icon: 'business' }
  ];

  stats = [
    { value: '10K+', label: 'Active Users' },
    { value: '500K+', label: 'Documents Created' },
    { value: '1M+', label: 'AI Assists' },
    { value: '99.9%', label: 'Uptime' }
  ];
}
