import { Component, OnInit, computed, inject, signal } from '@angular/core';
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
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';

import { Auth } from '../../../../core/services/auth';
import { WorkspaceService } from '../../../workspace/services/workspace';
import { DocumentService } from '../../services/document';
import { Document } from '../../../../models/document.model';
import { Workspace } from '../../../../models/workspace.model';
import { User } from '../../../../models/user.model';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../confirm-dialog/confirm-dialog';

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
    MatDividerModule,
    MatDialogModule,
    MatSnackBarModule,
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
  private dialog = inject(MatDialog);
  private snackbar = inject(MatSnackBar);

  currentUser = signal<User | null>(null);
  workspaces = signal<Workspace[]>([]);
  documents = signal<Document[]>([]);
  selectedWorkspace = signal<Workspace | null>(null);
  isLoading = signal(true);
  loadError = signal<string | null>(null);

  searchQuery = signal('');
  filterStatus = signal('all');
  viewMode = signal<'grid' | 'list'>('grid');
  isSidenavOpen = signal(true);

  filteredDocuments = computed(() => {
    let filtered = this.documents();

    if (this.selectedWorkspace()) {
      filtered = filtered.filter(
        (doc) => doc.workspace === this.selectedWorkspace()?._id
      );
    }

    if (this.filterStatus() !== 'all') {
      filtered = filtered.filter((doc) => doc.status === this.filterStatus());
    }

    const q = this.searchQuery().trim().toLowerCase();
    if (q) {
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(q) ||
          doc.content.replace(/<[^>]*>/g, '').toLowerCase().includes(q) ||
          doc.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    return filtered;
  });

  stats = computed(() => {
    const allDocs = this.documents();
    const used = this.currentUser()?.aiCredits.used ?? 0;
    const total = this.currentUser()?.aiCredits.total ?? 1000;
    return {
      totalDocuments: allDocs.length,
      drafts: allDocs.filter((d) => d.status === 'draft').length,
      published: allDocs.filter((d) => d.status === 'published').length,
      aiCreditsUsed: used,
      aiCreditsTotal: total,
      aiCreditsPercent: Math.round((used / total) * 100),
    };
  });

  ngOnInit(): void {
    this.currentUser.set(this.authService.currentUserValue);
    this.loadWorkspaces();
  }

  loadWorkspaces(): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.workspaceService.getMyWorkspaces().subscribe({
      next: (workspaces) => {
        this.workspaces.set(workspaces);
        this.loadDocuments();
      },
      error: () => {
        this.loadError.set('Failed to load workspaces. Please try again.');
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
      error: () => {
        this.loadError.set('Failed to load documents. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  /** Set status filter and optionally clear workspace selection */
  setFilter(status: string, workspace: Workspace | null = null): void {
    this.filterStatus.set(status);
    this.selectedWorkspace.set(workspace);
  }

  selectWorkspace(workspace: Workspace): void {
    this.selectedWorkspace.set(workspace);
    this.filterStatus.set('all');
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
    const data: ConfirmDialogData = {
      title: 'Delete Document',
      message:
        'This document will be permanently deleted and cannot be recovered.',
      confirmLabel: 'Delete',
    };
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data,
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.documentService.deleteDocument(documentId).subscribe({
        next: () => {
          this.documents.update((docs) =>
            docs.filter((d) => d._id !== documentId)
          );
          this.snackbar.open('Document deleted', 'Dismiss', { duration: 3000 });
        },
        error: () => {
          this.snackbar.open('Failed to delete document', 'Dismiss', {
            duration: 4000,
          });
        },
      });
    });
  }

  toggleViewMode(): void {
    this.viewMode.update((m) => (m === 'grid' ? 'list' : 'grid'));
  }

  logout(): void {
    const data: ConfirmDialogData = {
      title: 'Sign out',
      message: 'Are you sure you want to sign out?',
      confirmLabel: 'Sign out',
    };
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '360px',
      data,
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) this.authService.logout();
    });
  }

  getInitials(name: string | null | undefined): string {
    if (!name) return '?';
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  getDocumentPreview(content: string): string {
    const plainText = content.replace(/<[^>]*>/g, '').trim();
    return plainText.substring(0, 140) + (plainText.length > 140 ? '…' : '');
  }

  getWordCount(content: string): number {
    const text = content.replace(/<[^>]*>/g, '').trim();
    return text ? text.split(/\s+/).length : 0;
  }

  getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
  }
}
