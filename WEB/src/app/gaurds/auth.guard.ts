import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    // Check localStorage/sessionStorage for OTP flag
    if (localStorage.getItem('otpVerified') === 'true') {
      return true;
    }
    // Not verified, redirect to OTP page
    this.router.navigate(['/auth']);
    return false;
  }
}
