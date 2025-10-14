import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MobileAuthPage } from './mobile-auth.page/mobile-auth.page';

const routes: Routes = [
  { path: 'auth', component: MobileAuthPage },
  { path: '', redirectTo: 'auth', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
