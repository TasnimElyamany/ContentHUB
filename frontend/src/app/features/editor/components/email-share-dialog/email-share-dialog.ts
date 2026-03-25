import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { DocumentService } from '../../../dashboard/services/document';
import { Document } from '../../../../models/document.model';

export interface EmailShareDialogData {
  document: Document;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'app-email-share-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './email-share-dialog.html',
  styleUrl: './email-share-dialog.scss',
})
export class EmailShareDialog {
  private dialogRef = inject(MatDialogRef<EmailShareDialog>);
  data: EmailShareDialogData = inject(MAT_DIALOG_DATA);
  private documentService = inject(DocumentService);
  private snackBar = inject(MatSnackBar);

  toField = signal('');
  role = signal<'editor' | 'viewer'>('viewer');
  isSending = signal(false);

  get emails(): string[] {
    return this.toField()
      .split(/[\s,;]+/)
      .map(e => e.trim())
      .filter(e => EMAIL_RE.test(e));
  }

  get isValid(): boolean {
    return this.emails.length > 0;
  }

  send(): void {
    const emails = this.emails;
    if (!emails.length || this.isSending()) return;
    this.isSending.set(true);

    const calls = emails.map(email =>
      this.documentService.inviteByEmail(this.data.document._id, email, this.role()).toPromise()
    );

    Promise.allSettled(calls).then(results => {
      this.isSending.set(false);
      const sent = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.length - sent;
      if (sent > 0) {
        this.snackBar.open(
          `Invite${sent > 1 ? 's' : ''} sent to ${sent} address${sent > 1 ? 'es' : ''}${failed ? `, ${failed} failed` : ''}`,
          '', { duration: 3500 }
        );
      } else {
        this.snackBar.open('Failed to send invites', '', { duration: 3000 });
      }
      if (sent > 0) this.dialogRef.close();
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
