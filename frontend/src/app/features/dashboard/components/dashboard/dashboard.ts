import { Component , OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router , RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';

import { Auth } from '../../../../core/services/auth';
import { Document } from '../../../../models/document.model';
import { Workspace } from '../../../../models/workspace.model';
import { User } from '../../../../models/user.model';



@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatCardModule,
    MatMenuModule,
    MatIconModule,
    MatChipsModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSidenavModule,
    MatListModule,
    MatBadgeModule,
    MatTooltipModule, FormsModule],
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private authService = inject(Auth);
  private router = inject(Router);

  currentUser = signal<User | null>(null);

  // Mock data signals ( to be replaced later with the api)
  workspaces = signal<Workspace[]>([]);
  documents = signal<Document[]>([]);
  selectedWorkspace = signal<Workspace | null>(null);

  searchQuery = signal<string>('');
  filterStatus = signal<string>('all');
  viewMode = signal<'grid' | 'list'>('grid');
  isSidenavOpen = true;


  ngOnInit(): void {
    this.loadUserData();
    this.loadMockData();
  }

  loadUserData(): void {
    this.currentUser.set(this.authService.currentUserValue); }

  loadMockData(): void {
    const mockWorkspaces: any[] = [
      {
        _id: '1',
        name: 'Personal',
        icon: '📁',
        owner: this.currentUser()?._id || '',
        members: [],
        settings: {
          aiCreditsShared: false,
          allowPublicSharing: true,
          defaultDocumentStatus: 'draft',
          allowGuestComments: false,
          requireApproval: false
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: '2',
        name: 'Work Projects',
        icon: '💼',
        owner: this.currentUser()?._id || '',
        members: [],
        settings: {
          aiCreditsShared: true,
          allowPublicSharing: false,
          defaultDocumentStatus: 'draft',
          allowGuestComments: false,
          requireApproval: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const mockDocuments: any[] = [
      {
        _id: '1',
        title: 'Getting Started with AI Writing',
        content: 'This is a guide on how to use AI for content creation...',
        owner: this.currentUser()?._id || '',
        workspace: '1',
        collaborators: [],
        status: 'published',
        tags: ['guide', 'ai', 'tutorial'],
        aiUsage: {
          generateCalls: 5,
          improveCalls: 3,
          totalTokens: 1200
        },
        version: 1,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20')
      },
      {
        _id: '2',
        title: 'Marketing Campaign Ideas',
        content: 'Brainstorming ideas for Q1 marketing campaign...',
        owner: this.currentUser()?._id || '',
        workspace: '2',
        collaborators: [],
        status: 'draft',
        tags: ['marketing', 'ideas'],
        aiUsage: {
          generateCalls: 10,
          improveCalls: 5,
          totalTokens: 2500
        },
        version: 1,
        createdAt: new Date('2024-01-18'),
        updatedAt: new Date('2024-01-22')
      },
      {
        _id: '3',
        title: 'Product Launch Strategy',
        content: 'Comprehensive strategy for new product launch...',
        owner: this.currentUser()?._id || '',
        workspace: '2',
        collaborators: [],
        status: 'draft',
        tags: ['product', 'strategy'],
        aiUsage: {
          generateCalls: 8,
          improveCalls: 4,
          totalTokens: 1800
        },
        version: 1,
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-25')
      },
      {
        _id: '4',
        title: 'Blog Post: Top 10 Productivity Tips',
        content: 'An engaging blog post about productivity...',
        owner: this.currentUser()?._id || '',
        workspace: '1',
        collaborators: [],
        status: 'published',
        tags: ['blog', 'productivity'],
        aiUsage: {
          generateCalls: 12,
          improveCalls: 6,
          totalTokens: 3000
        },
        version: 1,
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-12')
      },
      {
        _id: '5',
        title: 'Social Media Content Calendar',
        content: 'Monthly social media planning...',
        owner: this.currentUser()?._id || '',
        workspace: '2',
        collaborators: [],
        status: 'draft',
        tags: ['social-media', 'planning'],
        aiUsage: {
          generateCalls: 15,
          improveCalls: 7,
          totalTokens: 2200
        },
        version: 1,
        createdAt: new Date('2024-01-22'),
        updatedAt: new Date('2024-01-26')
      },
      {
        _id: '6',
        title: 'Customer Success Stories',
        content: 'Collection of customer testimonials...',
        owner: this.currentUser()?._id || '',
        workspace: '1',
        collaborators: [],
        status: 'published',
        tags: ['testimonials', 'customers'],
        aiUsage: {
          generateCalls: 6,
          improveCalls: 3,
          totalTokens: 1500
        },
        version: 1,
        createdAt: new Date('2024-01-08'),
        updatedAt: new Date('2024-01-10')
      }
    ];

    this.workspaces.set(mockWorkspaces);
    this.documents.set(mockDocuments);
    this.selectedWorkspace.set(mockWorkspaces[0]);
  }

  get filteredDocuments(): Document[] {
    let filtered = this.documents();

    if (this.selectedWorkspace()) {
      filtered = filtered.filter(doc => doc.workspace === this.selectedWorkspace()?._id);
    }

    if (this.filterStatus() !== 'all') {
      filtered = filtered.filter(doc => doc.status === this.filterStatus());
    }

    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(query) ||
        doc.content.toLowerCase().includes(query) ||
        doc.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  }

  get stats() {
    const allDocs = this.documents();
    const totalAIUsage = allDocs.reduce((sum, doc) => sum + doc.aiUsage.totalTokens, 0);

    return {
      totalDocuments: allDocs.length,
      drafts: allDocs.filter(doc => doc.status === 'draft').length,
      published: allDocs.filter(doc => doc.status === 'published').length,
      aiCreditsUsed: this.currentUser()?.aiCredits.used || 0,
      aiCreditsTotal: this.currentUser()?.aiCredits.total || 1000
    };
  }

  createDocument(): void {
    console.log('Creating new document...');
    // TODO: Implement create document
    // For now, navigate to a mock editor
    /////////////////////////// don't forget to create the editor route //////////////////////
    this.router.navigate(['/editor', 'new']);
  }

  openDocument(documentId: string): void {
    this.router.navigate(['/editor', documentId]);
  }

  deleteDocument(documentId: string, event: Event): void {
    event.stopPropagation();

    if (confirm('Are you sure you want to delete this document?')) {
      this.documents.update(docs => docs.filter(doc => doc._id !== documentId));
      console.log('Document deleted:', documentId);
    }
  }

  selectWorkspace(workspace: Workspace): void {
    this.selectedWorkspace.set(workspace);
  }

  toggleViewMode(): void {
    this.viewMode.update(mode => mode === 'grid' ? 'list' : 'grid');
  }

  logout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout();
    }
  }

  getDocumentPreview(content: string): string {
    return content.substring(0, 120) + (content.length > 120 ? '...' : '');
  }

  getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return new Date(date).toLocaleDateString();
  }

  getStatusColor(status: string): string {
    return status === 'published' ? 'primary' : 'accent';
  }


}

