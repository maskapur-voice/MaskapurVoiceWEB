import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './components/login/login.component';
import { VerifyOtpComponent } from './components/verify-otp/verify-otp.component';
import { WelcomeComponent } from './components/welcome/welcome.component';
import { AuthGuard } from './gaurds/auth.guard';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'verify', component: VerifyOtpComponent },
  { path: 'home', component: WelcomeComponent, canActivate: [AuthGuard] },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'home' } // Wildcard route for a 404 page can be added here
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
