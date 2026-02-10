import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { WorkspaceService } from '../../services/workspace';
import { Workspace } from '../../../../models/workspace.model';

@Component({
  selector: 'app-invite-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './invite-modal.html',
  styleUrl: './invite-modal.scss',
})
export class InviteModal {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<InviteModal>);
  private workspaceService = inject(WorkspaceService);
  data: { workspace: Workspace } = inject(MAT_DIALOG_DATA);

  isSubmitting = false;
  error: string | null = null;
  success: string | null = null;

  roles = [
    { value: 'admin', label: 'Admin', description: 'Can manage workspace settings and members' },
    { value: 'editor', label: 'Editor', description: 'Can create and edit documents' },
    { value: 'viewer', label: 'Viewer', description: 'Can only view documents' },
  ];

  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    role: ['editor', Validators.required],
    message: ['', [Validators.maxLength(200)]],
  });

  cancel(): void {
    this.dialogRef.close();
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.error = null;
    this.success = null;

    const formValue = this.form.value;

    this.workspaceService
      .inviteMember(this.data.workspace._id, {
        email: formValue.email,
        role: formValue.role,
        message: formValue.message || undefined,
      })
      .subscribe({
        next: () => {
          this.success = `Invitation sent to ${formValue.email}`;
          this.isSubmitting = false;
          this.form.reset({ role: 'editor' });

          // Close after a short delay to show success message
          setTimeout(() => {
            this.dialogRef.close(true);
          }, 1500);
        },
        error: (err) => {
          console.error('Failed to send invitation:', err);
          this.error = err.error?.message || 'Failed to send invitation. Please try again.';
          this.isSubmitting = false;
        },
      });
  }
}
