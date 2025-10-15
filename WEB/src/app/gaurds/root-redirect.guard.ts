import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class RootRedirectGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean | UrlTree {
    // Return an UrlTree to redirect during navigation (preferred over router.navigate inside guards)
    if (localStorage.getItem('otpVerified') === 'true') {
      return this.router.parseUrl('/home');
    }
    return this.router.parseUrl('/auth');
  }
}
