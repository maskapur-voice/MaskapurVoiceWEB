import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-mobile-auth',
  templateUrl: './mobile-auth.page.html',
  styleUrls: ['./mobile-auth.page.scss'],
  standalone: false
})
export class MobileAuthPage {
  authForm: FormGroup;
  otpSent = false;
  otpValue = '';

  logoPath = 'src/assets/verification-logo.svg';

  constructor(private fb: FormBuilder) {
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
    // Simulate OTP verification

  }
}
