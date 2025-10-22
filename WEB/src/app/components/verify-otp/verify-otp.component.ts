import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-verify-otp',
  templateUrl: './verify-otp.component.html',
  styleUrls: ['./verify-otp.component.scss'],
  standalone: false
})
export class VerifyOtpComponent implements OnInit {
  loading = false;
  mobile: string | null = null;
  form;
  resendLoading = false;
  cooldownSeconds = 60;
  timer?: any;
  remaining = 0;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router, private toastr: ToastrService) {
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.pattern('^\\d{6}$')]]
    });
  }

  ngOnInit() {
    this.mobile = localStorage.getItem('pendingMobile');
    if (!this.mobile) { this.router.navigate(['/login']); return; }
    const lastSent = parseInt(localStorage.getItem('otpLastSent') || '0', 10);
    if (lastSent) {
      const elapsed = Math.floor((Date.now() - lastSent)/1000);
      if (elapsed < this.cooldownSeconds) {
        this.remaining = this.cooldownSeconds - elapsed;
        this.startTimer();
      }
    }
  }

  private startTimer() {
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (this.remaining > 0) {
        this.remaining--;
      } else {
        clearInterval(this.timer);
      }
    }, 1000);
  }

  submit() {
    if (this.form.invalid || !this.mobile) return;
    this.loading = true;
    const code = this.form.value.code!;
    this.auth.verifyOtp(this.mobile, code).subscribe({
      next: (resp) => {
        this.loading = false;
        if (resp.success && resp.token) {
          localStorage.removeItem('pendingMobile');
          localStorage.setItem('authToken', resp.token);
          this.toastr.success('Authenticated', 'Success');
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

  resend() {
    if (!this.mobile || this.remaining > 0) return;
    this.resendLoading = true;
    this.auth.resendOtp(this.mobile).subscribe({
      next: (resp) => {
        this.resendLoading = false;
        if (resp.success) {
          localStorage.setItem('otpLastSent', Date.now().toString());
          this.remaining = this.cooldownSeconds;
          this.startTimer();
          this.toastr.success(resp.reused ? 'OTP still valid, code resent.' : 'New OTP generated.', 'Resent');
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
}
