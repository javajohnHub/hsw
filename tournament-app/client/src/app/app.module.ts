import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AuthService } from './auth.service';
import { AdminGuard } from './admin.guard';

@NgModule({
  imports: [AppRoutingModule],
  providers: [AuthService, AdminGuard]
})
export class AppModule {}