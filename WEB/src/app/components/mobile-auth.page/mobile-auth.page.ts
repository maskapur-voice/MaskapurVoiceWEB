import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';


@Component({
  selector: 'app-mobile-auth',
  templateUrl: './mobile-auth.page.html',
  styleUrls: ['./mobile-auth.page.scss'],
  standalone: false
})
export class MobileAuthPage {
  authForm: FormGroup;
  otpSent = false;
  // store each OTP digit
  otpValue: string[] = ['', '', '', ''];

  // Use the served assets path (relative to the app root) so Angular serves the file at /assets/...
  logoPath = 'assets/verification-logo.svg';

  constructor(private fb: FormBuilder, private router: Router, public toastr: ToastrService) {
    this.authForm = this.fb.group({
      mobile: [
      '',
      [
        Validators.required,
        Validators.pattern('^(\\+91\\s?)?[6-9][0-9]{9}$')
      ]
      ],
      otp: ['']
    });
  }

  sendOtp() {
    // Simulate sending OTP
    this.otpSent = true;
    // TODO: Integrate with backend or Firebase for real OTP
  }

  onMobileInput(event: any) {
    let value = event.target.value;
    // Always start with '+91 '
    if (!value.startsWith('+91 ')) {
      value = '+91 ' + value.replace(/^\+91\s?/, '');
    }
    // Only allow 10 digits after '+91 '
    value = value.substring(0, 4) + value.substring(4).replace(/[^0-9]/g, '').substring(0, 10);
    this.authForm.controls['mobile'].setValue(value, { emitEvent: false });
  }

  verifyOtp() {
    const otp = this.otpValue.join('');
    // For demo accept 4-digit OTP '1234'
    if (otp === '1234') {
      // Show success toast then navigate
      this.toastr.success('Logged in successfully', 'Success', {
        timeOut: 1800,
        closeButton: false,
        positionClass: 'toast-top-center'
      });
      localStorage.setItem('otpVerified', 'true');
      setTimeout(() => this.router.navigate(['/home']), 900);
    } else {
      // Use ToastrService to show toast notifications for invalid OTP
      this.toastr.error('Invalid OTP!', 'Error', {
        timeOut: 2500,
        closeButton: false,
        positionClass: 'toast-top-center'
      });
    }
  }

  onOtpInput(index: number, ev: any) {
    const val = (ev.target.value || '').slice(-1).replace(/[^0-9]/g, '');
    this.otpValue[index] = val;
    ev.target.value = val;
    if (val && index < this.otpValue.length - 1) {
      const next = document.querySelectorAll('.otp-box input')[index + 1] as HTMLInputElement | undefined;
      if (next) next.focus();
    }
    if (!val && index > 0) {
      const prev = document.querySelectorAll('.otp-box input')[index - 1] as HTMLInputElement | undefined;
      if (prev) prev.focus();
    }
  }
}
