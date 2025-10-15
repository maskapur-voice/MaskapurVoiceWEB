import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MobileAuthPage } from './components/mobile-auth.page/mobile-auth.page';
import { WelcomeComponent } from './components/welcome/welcome.component';
import { AuthGuard } from './gaurds/auth.guard';

const routes: Routes = [
  { path: 'auth', component: MobileAuthPage },
  { path: 'home', component: WelcomeComponent, canActivate: [AuthGuard] },
  { path: '', redirectTo: 'auth', pathMatch: 'full' },
  { path: '**', redirectTo: 'home' } // Wildcard route for a 404 page can be added here
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
