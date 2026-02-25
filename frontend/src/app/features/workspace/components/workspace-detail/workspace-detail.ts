import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';

import { WorkspaceService } from '../../services/workspace';
import { DocumentService } from '../../../dashboard/services/document';
import { Auth } from '../../../../core/services/auth';
import { Workspace } from '../../../../models/workspace.model';
import { Document } from '../../../../models/document.model';
import { User } from '../../../../models/user.model';
import { InviteModal } from '../invite-modal/invite-modal';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-workspace-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatCardModule,
    MatMenuModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    MatDialogModule,
    MatDivider,
  ],
  templateUrl: './workspace-detail.html',
  styleUrl: './workspace-detail.scss',
})
export class WorkspaceDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private workspaceService = inject(WorkspaceService);
  private documentService = inject(DocumentService);
  private authService = inject(Auth);
  private dialog = inject(MatDialog);

  currentUser = signal<User | null>(null);
  workspace = signal<Workspace | null>(null);
  documents = signal<Document[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  activeTab = signal(0);

  ngOnInit(): void {
    this.currentUser.set(this.authService.currentUserValue);
    const workspaceId = this.route.snapshot.paramMap.get('id');

    if (workspaceId) {
      this.loadWorkspace(workspaceId);
    }
  }

  loadWorkspace(id: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.workspaceService.getWorkspace(id).subscribe({
      next: (workspace) => {
        this.workspace.set(workspace);
        this.workspaceService.setCurrentWorkspace(workspace);
        this.loadDocuments(id);
      },
      error: (err) => {
        console.error('Failed to load workspace:', err);
        this.error.set('Failed to load workspace. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  loadDocuments(workspaceId: string): void {
    this.documentService.getDocuments({ workspaceId: workspaceId }).subscribe({
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

  createDocument(): void {
    const workspace = this.workspace();
    if (workspace) {
      this.router.navigate(['/editor', 'new'], {
        queryParams: { workspace: workspace._id },
      });
    }
  }

  openDocument(documentId: string): void {
    this.router.navigate(['/editor', documentId]);
  }

  openSettings(): void {
    const workspace = this.workspace();
    if (workspace) {
      this.router.navigate(['/workspace', workspace._id, 'settings']);
    }
  }

  openInviteModal(): void {
    const workspace = this.workspace();
    if (!workspace) return;

    const dialogRef = this.dialog.open(InviteModal, {
      width: '500px',
      data: { workspace },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadWorkspace(workspace._id);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/workspace']);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  isOwner(): boolean {
    return this.workspace()?.owner === this.currentUser()?._id;
  }

  canManage(): boolean {
    const workspace = this.workspace();
    if (!workspace) return false;
    return this.workspaceService.canManage(workspace._id);
  }

  canEdit(): boolean {
    const workspace = this.workspace();
    if (!workspace) return false;
    return this.workspaceService.canEdit(workspace._id);
  }

  getMemberCount(): number {
    const workspace = this.workspace();
    return workspace ? workspace.members.length + 1 : 0;
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

  getDocumentPreview(content: string): string {
    const plainText = content.replace(/<[^>]*>/g, '');
    return plainText.substring(0, 120) + (plainText.length > 120 ? '...' : '');
  }

  logout(): void {
    const data: ConfirmDialogData = {
      title: 'Sign out',
      message: 'Are you sure you want to sign out?',
      confirmLabel: 'Sign out',
    };
    this.dialog.open(ConfirmDialogComponent, { width: '360px', data })
      .afterClosed().subscribe((confirmed) => { if (confirmed) this.authService.logout(); });
  }
}
