import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EnvironmentService } from '../../services/environment.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: false
})
export class LoginComponent {
  loading = false;
  mobileForm;
  otpForm;
  showOtpForm = false;
  mobile: string = '';
  resendLoading = false;
  cooldownSeconds = 60;
  remaining = 0;
  timer?: any;

  constructor(
    private fb: FormBuilder, 
    private auth: AuthService, 
    private router: Router, 
    private toastr: ToastrService,
    public envService: EnvironmentService
  ) {
    this.mobileForm = this.fb.group({
      mobile: ['', [Validators.required, Validators.pattern('^(\\+?[1-9]\\d{7,14})$')]]
    });
    
    this.otpForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern('^\\d{6}$')]]
    });
  }

  sendOtp() {
    if (this.mobileForm.invalid) return;
    this.loading = true;
    this.mobile = "+91" + this.mobileForm.value.mobile!;
    
    this.auth.sendOtp(this.mobile).subscribe({
      next: (resp) => {
        this.loading = false;
        if (resp.success) {
          localStorage.setItem('pendingMobile', this.mobile);
          localStorage.setItem('otpLastSent', Date.now().toString());

          this.toastr.success('OTP sent', 'Success');
          this.showOtpForm = true;
          this.startCooldown();
        } else {
          this.toastr.error(resp.error || 'Failed to send OTP', 'Error');
        }
      },
      error: (err) => {
        this.loading = false;
        this.toastr.error(err.error?.error || 'Server error', 'Error');
      }
    });
  }

  verifyOtp() {
    if (this.otpForm.invalid || !this.mobile) return;
    this.loading = true;
    const code = this.otpForm.value.code!;
    
    this.auth.verifyOtp(this.mobile, code).subscribe({
      next: (resp) => {
        this.loading = false;
        if (resp.success && resp.token) {
          localStorage.removeItem('pendingMobile');
          localStorage.removeItem('otpLastSent');
          localStorage.setItem('authToken', resp.token);
          this.toastr.success('Login successful', 'Success');
          this.router.navigate(['/home']);
        } else {
          this.toastr.error(resp.error || 'Verification failed', 'Error');
        }
      },
      error: (err) => {
        this.loading = false;
        this.toastr.error(err.error?.error || 'Server error', 'Error');
      }
    });
  }

  resendOtp() {
    if (!this.mobile || this.remaining > 0) return;
    this.resendLoading = true;
    
    this.auth.resendOtp(this.mobile).subscribe({
      next: (resp) => {
        this.resendLoading = false;
        if (resp.success) {
          localStorage.setItem('otpLastSent', Date.now().toString());
          this.startCooldown();
          this.toastr.success('OTP resent', 'Success');
        } else {
          this.toastr.error(resp.error || 'Resend failed', 'Error');
        }
      },
      error: (err) => {
        this.resendLoading = false;
        this.toastr.error(err.error?.error || 'Server error', 'Error');
      }
    });
  }

  private startCooldown() {
    this.remaining = this.cooldownSeconds;
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (this.remaining > 0) {
        this.remaining--;
      } else {
        clearInterval(this.timer);
      }
    }, 1000);
  }

  editMobile() {
    this.showOtpForm = false;
    this.otpForm.reset();
    this.mobile = '';
    clearInterval(this.timer);
    this.remaining = 0;
    localStorage.removeItem('pendingMobile');
    localStorage.removeItem('otpLastSent');
  }
}
