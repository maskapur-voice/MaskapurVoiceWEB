import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { NavigationService } from './navigation.service';

@Injectable({ providedIn: 'root' })
export class UnknownRouteGuard implements CanActivate {
  constructor(private nav: NavigationService, private router: Router) {}

  canActivate(): boolean {
    const prev = this.nav.getPreviousUrl();
    if (prev) {
      // Use browser history to go back to previous entry so the router preserves state
      try {
        window.history.back();
      } catch (e) {
        // fallback to router navigation
        this.router.navigateByUrl(prev);
      }
      return false;
    }
    // no previous URL - redirect to auth
    this.router.navigate(['/auth']);
    return false;
  }
}
