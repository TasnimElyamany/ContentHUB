import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Auth } from '../../../../core/services/auth';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPassword {
  private fb = inject(FormBuilder);
  private authService = inject(Auth);

  forgotForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  submitted = false;

  constructor() {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit(): void {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.requestPasswordReset(this.forgotForm.value.email).subscribe({
      next: () => {
        this.isLoading = false;
        this.submitted = true;
        this.successMessage = 'If an account exists with that email, a password reset link has been sent.';
      },
      error: (error: any) => {
        this.isLoading = false;
        this.errorMessage = error.error?.error || error.error?.message || 'Something went wrong. Please try again.';
      },
    });
  }

  getErrorMessage(fieldName: string): string {
    const field = this.forgotForm.get(fieldName);

    if (field?.hasError('required')) {
      return 'Email is required';
    }

    if (field?.hasError('email')) {
      return 'Please enter a valid email';
    }

    return '';
  }
}
