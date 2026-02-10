import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';

import { Auth } from '../../../../core/services/auth';
import { WorkspaceService } from '../../../workspace/services/workspace';
import { DocumentService } from '../../services/document';
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
    MatTooltipModule,
    MatProgressSpinnerModule,
    FormsModule,
  ],
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private authService = inject(Auth);
  private workspaceService = inject(WorkspaceService);
  private documentService = inject(DocumentService);
  private router = inject(Router);

  currentUser = signal<User | null>(null);

  workspaces = signal<Workspace[]>([]);
  documents = signal<Document[]>([]);
  selectedWorkspace = signal<Workspace | null>(null);
  isLoading = signal(true);

  searchQuery = signal<string>('');
  filterStatus = signal<string>('all');
  viewMode = signal<'grid' | 'list'>('grid');
  isSidenavOpen = true;

  ngOnInit(): void {
    this.loadUserData();
    this.loadWorkspaces();
  }

  loadUserData(): void {
    this.currentUser.set(this.authService.currentUserValue);
  }

  loadWorkspaces(): void {
    this.isLoading.set(true);
    this.workspaceService.getMyWorkspaces().subscribe({
      next: (workspaces) => {
        this.workspaces.set(workspaces);
        if (workspaces.length > 0) {
          this.selectedWorkspace.set(workspaces[0]);
        }
        this.loadDocuments();
      },
      error: (err) => {
        console.error('Failed to load workspaces:', err);
        this.isLoading.set(false);
      },
    });
  }

  loadDocuments(): void {
    this.documentService.getDocuments().subscribe({
      next: (response) => {
        this.documents.set(response.documents);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load documents:', err);
        this.isLoading.set(false);
      },
    });
  }

  get filteredDocuments(): Document[] {
    let filtered = this.documents();

    if (this.selectedWorkspace()) {
      filtered = filtered.filter(
        (doc) => doc.workspace === this.selectedWorkspace()?._id
      );
    }

    if (this.filterStatus() !== 'all') {
      filtered = filtered.filter((doc) => doc.status === this.filterStatus());
    }

    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(query) ||
          doc.content.toLowerCase().includes(query) ||
          doc.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  }

  get stats() {
    const allDocs = this.documents();
    return {
      totalDocuments: allDocs.length,
      drafts: allDocs.filter((doc) => doc.status === 'draft').length,
      published: allDocs.filter((doc) => doc.status === 'published').length,
      aiCreditsUsed: this.currentUser()?.aiCredits.used || 0,
      aiCreditsTotal: this.currentUser()?.aiCredits.total || 1000,
    };
  }

  createDocument(): void {
    const workspace = this.selectedWorkspace();
    if (workspace) {
      this.router.navigate(['/editor', 'new'], {
        queryParams: { workspace: workspace._id },
      });
    } else {
      this.router.navigate(['/editor', 'new']);
    }
  }

  openDocument(documentId: string): void {
    this.router.navigate(['/editor', documentId]);
  }

  deleteDocument(documentId: string, event: Event): void {
    event.stopPropagation();

    if (confirm('Are you sure you want to delete this document?')) {
      this.documentService.deleteDocument(documentId).subscribe({
        next: () => {
          this.documents.update((docs) =>
            docs.filter((doc) => doc._id !== documentId)
          );
        },
        error: (err) => {
          console.error('Failed to delete document:', err);
          alert('Failed to delete document. Please try again.');
        },
      });
    }
  }

  selectWorkspace(workspace: Workspace): void {
    this.selectedWorkspace.set(workspace);
  }

  toggleViewMode(): void {
    this.viewMode.update((mode) => (mode === 'grid' ? 'list' : 'grid'));
  }

  logout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout();
    }
  }

  getDocumentPreview(content: string): string {
    const plainText = content.replace(/<[^>]*>/g, '');
    return (
      plainText.substring(0, 120) + (plainText.length > 120 ? '...' : '')
    );
  }

  getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return new Date(date).toLocaleDateString();
  }

  getStatusColor(status: string): string {
    return status === 'published' ? 'primary' : 'accent';
  }
}
