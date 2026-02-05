import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { WorkspaceService } from '../../services/workspace';

const WORKSPACE_ICONS = ['📁', '💼', '🚀', '📊', '🎨', '📝', '💡', '🔬', '📚', '🎯', '🌟', '⚡'];

@Component({
  selector: 'app-create-workspace-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './create-workspace-modal.html',
  styleUrl: './create-workspace-modal.scss',
})
export class CreateWorkspaceModal {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CreateWorkspaceModal>);
  private workspaceService = inject(WorkspaceService);

  icons = WORKSPACE_ICONS;
  selectedIcon = '📁';
  isSubmitting = false;
  error: string | null = null;

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    description: ['', [Validators.maxLength(200)]],
    aiCreditsShared: [false],
    allowPublicSharing: [true],
    requireApproval: [false],
  });

  selectIcon(icon: string): void {
    this.selectedIcon = icon;
  }

  cancel(): void {
    this.dialogRef.close();
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.error = null;

    const formValue = this.form.value;

    this.workspaceService
      .createWorkspace({
        name: formValue.name,
        icon: this.selectedIcon,
        description: formValue.description || undefined,
        settings: {
          aiCreditsShared: formValue.aiCreditsShared,
          allowPublicSharing: formValue.allowPublicSharing,
          defaultDocumentStatus: 'draft',
          allowGuestComments: false,
          requireApproval: formValue.requireApproval,
        },
      })
      .subscribe({
        next: (workspace) => {
          this.dialogRef.close(workspace);
        },
        error: (err) => {
          console.error('Failed to create workspace:', err);
          this.error = err.error?.message || 'Failed to create workspace. Please try again.';
          this.isSubmitting = false;
        },
      });
  }
}
