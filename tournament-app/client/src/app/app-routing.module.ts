import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { PublicPageComponent } from "./public-page.component";
import { AdminPageComponent } from "./admin-page.component";
import { AdminGuard } from "./admin.guard";
import { GamesWheelComponent } from "./games-wheel.component";
import { SelectMatchesComponent } from "./select-matches.component";
import { HistoryPageComponent } from "./history-page.component";
import { AuthService } from "./auth.service";

const routes: Routes = [
  { path: "", component: PublicPageComponent }, // Root path goes to public
  { path: "public", component: PublicPageComponent },
  {
    path: "admin",
    component: AdminPageComponent,
    canActivate: [AdminGuard],
    data: { log: true },
  },
  {
    path: "wheel",
    component: SelectMatchesComponent,
    canActivate: [AdminGuard],
    data: { log: true },
  },
  {
    path: "games",
    component: GamesWheelComponent,
    canActivate: [AdminGuard],
    data: { log: true },
  },
  {
    path: "history",
    component: HistoryPageComponent,
    canActivate: [AdminGuard],
    data: { log: true },
  },
  { path: "**", redirectTo: "" }, // Redirect all unknown routes to root (public)
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  // AuthService is providedIn: 'root' in the service — do not re-provide here (causes multiple instances)
})
export class AppRoutingModule {
  constructor(private authService: AuthService) {
    console.log("Initializing routes with AdminGuard...");
    routes.forEach((route) => {
      if (route.data?.log) {
        console.log(`Route initialized: ${route.path}`);
        this.authService.logAccessAttempt(route.path || "unknown");
      }
    });
  }
}
