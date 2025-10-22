import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: false
})
export class LoginComponent {
  loading = false;
  form; 

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router, private toastr: ToastrService) {
    this.form = this.fb.group({
      mobile: ['', [Validators.required, Validators.pattern('^(\\+?[1-9]\\d{7,14})$')]]
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    const mobile = "+91" + this.form.value.mobile!;
    this.auth.sendOtp(mobile).subscribe({
      next: (resp) => {
        this.loading = false;
        if (resp.success) {
          localStorage.setItem('pendingMobile', mobile);
          localStorage.setItem('otpLastSent', Date.now().toString());
          this.toastr.success('OTP sent', 'Success');
          this.router.navigate(['/verify']);
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
}
