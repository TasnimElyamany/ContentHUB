import { Component , inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule , AbstractControl , ValidationErrors } from '@angular/forms';
import { Router , RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Auth } from '../../../../core/services/auth';

@Component({
  selector: 'app-register',
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
    MatCheckboxModule
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private fb = inject(FormBuilder);
  private authService = inject(Auth);
  private router = inject(Router);

  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  hidePassword = true;
  hideConfirmPassword = true;

  constructor() {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      agreeToTerms: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordsMatchValidator });
  }

  passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordsMismatch: true };
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';

    const { confirmPassword, agreeToTerms, ...registerData } = this.registerForm.value;

    this.authService.register(registerData).subscribe({
      next: (response) => {
        console.log('Registration successful:', response);
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.error || error.error?.message || 'Registration failed. Please try again.';
        console.error('Registration error:', error);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  getErrorMessage(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (field?.hasError('required')) {
      return `${this.capitalizeFirst(fieldName)} is required`;
    } if (field?.hasError('email')) {
      return 'Please enter a valid email';
    } if (field?.hasError('minlength')) {
      const requiredLength = field.getError('minlength').requiredLength;
      return `${this.capitalizeFirst(fieldName)} must be at least ${requiredLength} characters long`;
    } if (fieldName === 'confirmPassword' && this.registerForm.hasError('passwordsMismatch')) {
      return 'Passwords do not match';
    } if (fieldName === 'agreeToTerms' && !this.registerForm.get('agreeToTerms')?.value) {
      return 'You must agree to the terms and conditions';
    }
    return '';
  }

  private capitalizeFirst(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }



}
