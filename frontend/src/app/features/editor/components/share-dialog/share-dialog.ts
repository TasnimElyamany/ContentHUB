import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { DocumentService } from '../../../dashboard/services/document';
import {
  Document,
  UserInfo,
  CollaboratorResolved,
  UserSearchResult,
} from '../../../../models/document.model';

export interface ShareDialogData {
  document: Document;
  currentUserId: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'app-share-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './share-dialog.html',
  styleUrl: './share-dialog.scss',
})
export class ShareDialog {
  private dialogRef = inject(MatDialogRef<ShareDialog>);
  data: ShareDialogData = inject(MAT_DIALOG_DATA);
  private documentService = inject(DocumentService);
  private snackBar = inject(MatSnackBar);

  searchQuery = signal('');
  searchResults = signal<UserSearchResult[]>([]);
  selectedUser = signal<UserSearchResult | null>(null);
  selectedRole = signal<'editor' | 'viewer'>('viewer');
  isSearching = signal(false);
  isAdding = signal(false);
  collaborators = signal<CollaboratorResolved[]>(this.resolveCollaborators());

  // true when query looks like an email but no user was found
  canInviteByEmail = computed(() =>
    EMAIL_RE.test(this.searchQuery()) &&
    !this.selectedUser() &&
    !this.isSearching() &&
    this.searchResults().length === 0 &&
    this.searchQuery().length > 3
  );

  owner: UserInfo = this.resolveOwner();
  linkRole = signal<'editor' | 'viewer'>('viewer');
  shareLink = computed(() =>
    `${window.location.origin}/editor/${this.data.document._id}?mode=${this.linkRole()}`
  );

  private searchTimeout: any;

  private resolveOwner(): UserInfo {
    const o = this.data.document.owner as any;
    return typeof o === 'object'
      ? { _id: o._id, name: o.name, email: o.email, avatar: o.avatar }
      : { _id: o, name: 'Owner', email: '', avatar: undefined };
  }

  private resolveCollaborators(): CollaboratorResolved[] {
    return this.data.document.collaborators.map((c) => {
      const u = c.userId as any;
      return {
        userId: typeof u === 'object' ? u._id : u,
        role: c.role,
        user: typeof u === 'object'
          ? { _id: u._id, name: u.name, email: u.email, avatar: u.avatar }
          : { _id: u as string, name: u as string, email: '', avatar: undefined },
      };
    });
  }

  onSearchInput(): void {
    clearTimeout(this.searchTimeout);
    const q = this.searchQuery();
    this.selectedUser.set(null);
    this.searchResults.set([]);
    if (q.length < 2) return;
    this.searchTimeout = setTimeout(() => {
      this.isSearching.set(true);
      const existing = new Set([
        this.owner._id,
        ...this.collaborators().map((c) => c.userId),
      ]);
      this.documentService.searchUsers(q).subscribe({
        next: (users) => {
          this.searchResults.set(users.filter((u) => !existing.has(u._id)));
          this.isSearching.set(false);
        },
        error: () => this.isSearching.set(false),
      });
    }, 300);
  }

  selectUser(user: UserSearchResult): void {
    this.selectedUser.set(user);
    this.searchQuery.set(user.email);
    this.searchResults.set([]);
  }

  clearSelection(): void {
    this.selectedUser.set(null);
    this.searchQuery.set('');
    this.searchResults.set([]);
  }

  add(): void {
    const user = this.selectedUser();
    if (!user || this.isAdding()) return;
    const role = this.selectedRole();
    this.isAdding.set(true);
    this.documentService
      .addCollaborator(this.data.document._id, user._id, role)
      .subscribe({
        next: () => {
          this.collaborators.update((list) => [...list, { userId: user._id, role, user }]);
          this.clearSelection();
          this.isAdding.set(false);
          this.snackBar.open(`${user.name} added as ${role}`, '', { duration: 2500 });
        },
        error: (err) => {
          this.isAdding.set(false);
          this.snackBar.open(err?.error?.message || 'Failed to add collaborator', '', { duration: 3000 });
        },
      });
  }

  inviteByEmail(): void {
    const email = this.searchQuery().trim();
    if (!EMAIL_RE.test(email) || this.isAdding()) return;
    const role = this.selectedRole();
    this.isAdding.set(true);
    this.documentService.inviteByEmail(this.data.document._id, email, role).subscribe({
      next: (result) => {
        this.isAdding.set(false);
        this.clearSelection();
        const msg = result.added
          ? `${email} added and notified by email`
          : `Invite sent to ${email}`;
        this.snackBar.open(msg, '', { duration: 3000 });
      },
      error: () => {
        this.isAdding.set(false);
        this.snackBar.open('Failed to send invite', '', { duration: 3000 });
      },
    });
  }

  updateRole(collab: CollaboratorResolved, newRole: 'editor' | 'viewer'): void {
    this.documentService
      .updateCollaboratorRole(this.data.document._id, collab.userId, newRole)
      .subscribe({
        next: () => {
          this.collaborators.update((list) =>
            list.map((c) => (c.userId === collab.userId ? { ...c, role: newRole } : c))
          );
        },
        error: () => this.snackBar.open('Failed to update role', '', { duration: 3000 }),
      });
  }

  remove(collab: CollaboratorResolved): void {
    this.documentService.removeCollaborator(this.data.document._id, collab.userId).subscribe({
      next: () => {
        this.collaborators.update((list) => list.filter((c) => c.userId !== collab.userId));
        this.snackBar.open(`${collab.user.name} removed`, '', { duration: 2500 });
      },
      error: () => this.snackBar.open('Failed to remove collaborator', '', { duration: 3000 }),
    });
  }

  copyLink(): void {
    navigator.clipboard.writeText(this.shareLink()).then(() => {
      this.snackBar.open('Link copied to clipboard', '', { duration: 2000 });
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
