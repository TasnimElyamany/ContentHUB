import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

import { WorkspaceService } from '../../services/workspace';
import { Auth } from '../../../../core/services/auth';
import { Workspace } from '../../../../models/workspace.model';
import { User } from '../../../../models/user.model';
import { CreateWorkspaceModal } from '../create-workspace-modal/create-workspace-modal';

@Component({
  selector: 'app-workspace-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatCardModule,
    MatMenuModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    MatDividerModule,
  ],
  templateUrl: './workspace-list.html',
  styleUrl: './workspace-list.scss',
})
export class WorkspaceList implements OnInit {
  private workspaceService = inject(WorkspaceService);
  private authService = inject(Auth);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  currentUser = signal<User | null>(null);
  workspaces = signal<Workspace[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.currentUser.set(this.authService.currentUserValue);
    this.loadWorkspaces();
  }

  loadWorkspaces(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.workspaceService.getMyWorkspaces().subscribe({
      next: (workspaces) => {
        this.workspaces.set(workspaces);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load workspaces:', err);
        this.error.set('Failed to load workspaces. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  openCreateModal(): void {
    const dialogRef = this.dialog.open(CreateWorkspaceModal, {
      width: '500px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadWorkspaces();
      }
    });
  }

  openWorkspace(workspace: Workspace): void {
    this.workspaceService.setCurrentWorkspace(workspace);
    this.router.navigate(['/workspace', workspace._id]);
  }

  openSettings(workspace: Workspace, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/workspace', workspace._id, 'settings']);
  }

  deleteWorkspace(workspace: Workspace, event: Event): void {
    event.stopPropagation();

    if (!this.isOwner(workspace)) {
      return;
    }

    if (confirm(`Are you sure you want to delete "${workspace.name}"? This action cannot be undone.`)) {
      this.workspaceService.deleteWorkspace(workspace._id).subscribe({
        next: () => {
          this.workspaces.update((ws) => ws.filter((w) => w._id !== workspace._id));
        },
        error: (err) => {
          console.error('Failed to delete workspace:', err);
          alert('Failed to delete workspace. Please try again.');
        },
      });
    }
  }

  leaveWorkspace(workspace: Workspace, event: Event): void {
    event.stopPropagation();

    if (confirm(`Are you sure you want to leave "${workspace.name}"?`)) {
      this.workspaceService.leaveWorkspace(workspace._id).subscribe({
        next: () => {
          this.workspaces.update((ws) => ws.filter((w) => w._id !== workspace._id));
        },
        error: (err) => {
          console.error('Failed to leave workspace:', err);
          alert('Failed to leave workspace. Please try again.');
        },
      });
    }
  }

  isOwner(workspace: Workspace): boolean {
    return workspace.owner === this.currentUser()?._id;
  }

  getMemberCount(workspace: Workspace): number {
    return workspace.members.length + 1; // +1 for owner
  }

  getWorkspaceRole(workspace: Workspace): string {
    if (this.isOwner(workspace)) {
      return 'Owner';
    }
    const member = workspace.members.find((m) => m.userId === this.currentUser()?._id);
    return member?.role ? member.role.charAt(0).toUpperCase() + member.role.slice(1) : 'Member';
  }

  getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays < 1) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

    return new Date(date).toLocaleDateString();
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout();
    }
  }
}
