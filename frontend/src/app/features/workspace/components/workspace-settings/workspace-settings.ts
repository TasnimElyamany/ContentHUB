import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';

import { WorkspaceService } from '../../services/workspace';
import { Auth } from '../../../../core/services/auth';
import { Workspace } from '../../../../models/workspace.model';
import { User } from '../../../../models/user.model';

const WORKSPACE_ICONS = ['📁', '💼', '🚀', '📊', '🎨', '📝', '💡', '🔬', '📚', '🎯', '🌟', '⚡'];

@Component({
  selector: 'app-workspace-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatSnackBarModule,
    MatMenuModule,
  ],
  templateUrl: './workspace-settings.html',
  styleUrl: './workspace-settings.scss',
})
export class WorkspaceSettings implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private workspaceService = inject(WorkspaceService);
  private authService = inject(Auth);
  private snackBar = inject(MatSnackBar);

  currentUser = signal<User | null>(null);
  workspace = signal<Workspace | null>(null);
  isLoading = signal(true);
  isSaving = signal(false);
  error = signal<string | null>(null);

  icons = WORKSPACE_ICONS;
  selectedIcon = '📁';

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    description: ['', [Validators.maxLength(200)]],
    aiCreditsShared: [false],
    allowPublicSharing: [true],
    requireApproval: [false],
    allowGuestComments: [false],
  });

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
        this.selectedIcon = workspace.icon || '📁';
        this.form.patchValue({
          name: workspace.name,
          description: workspace.description || '',
          aiCreditsShared: workspace.settings.aiCreditsShared,
          allowPublicSharing: workspace.settings.allowPublicSharing,
          requireApproval: workspace.settings.requireApproval,
          allowGuestComments: workspace.settings.allowGuestComments,
        });
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load workspace:', err);
        this.error.set('Failed to load workspace settings.');
        this.isLoading.set(false);
      },
    });
  }

  selectIcon(icon: string): void {
    this.selectedIcon = icon;
  }

  save(): void {
    if (this.form.invalid || this.isSaving()) {
      return;
    }

    const workspace = this.workspace();
    if (!workspace) return;

    this.isSaving.set(true);
    const formValue = this.form.value;

    this.workspaceService
      .updateWorkspace(workspace._id, {
        name: formValue.name,
        icon: this.selectedIcon,
        description: formValue.description || undefined,
        settings: {
          aiCreditsShared: formValue.aiCreditsShared,
          allowPublicSharing: formValue.allowPublicSharing,
          defaultDocumentStatus: workspace.settings.defaultDocumentStatus,
          requireApproval: formValue.requireApproval,
          allowGuestComments: formValue.allowGuestComments,
        },
      })
      .subscribe({
        next: (updatedWorkspace) => {
          this.workspace.set(updatedWorkspace);
          this.isSaving.set(false);
          this.snackBar.open('Settings saved successfully', 'Close', {
            duration: 3000,
          });
        },
        error: (err) => {
          console.error('Failed to save settings:', err);
          this.snackBar.open('Failed to save settings', 'Close', {
            duration: 3000,
          });
          this.isSaving.set(false);
        },
      });
  }

  deleteWorkspace(): void {
    const workspace = this.workspace();
    if (!workspace) return;

    if (
      confirm(
        `Are you sure you want to delete "${workspace.name}"?\n\nThis will permanently delete all documents and data. This action cannot be undone.`
      )
    ) {
      this.workspaceService.deleteWorkspace(workspace._id).subscribe({
        next: () => {
          this.snackBar.open('Workspace deleted', 'Close', { duration: 3000 });
          this.router.navigate(['/workspace']);
        },
        error: (err) => {
          console.error('Failed to delete workspace:', err);
          this.snackBar.open('Failed to delete workspace', 'Close', {
            duration: 3000,
          });
        },
      });
    }
  }

  goBack(): void {
    const workspace = this.workspace();
    if (workspace) {
      this.router.navigate(['/workspace', workspace._id]);
    } else {
      this.router.navigate(['/workspace']);
    }
  }

  isOwner(): boolean {
    return this.workspace()?.owner === this.currentUser()?._id;
  }

  logout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout();
    }
  }
}
