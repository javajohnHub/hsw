import { bootstrapApplication } from "@angular/platform-browser";
import {
  provideRouter,
  withEnabledBlockingInitialNavigation,
} from "@angular/router";
import { AppComponent } from "./app/app.component";

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(
      [
        {
          path: "",
          redirectTo: "/tournaments-embed",
          pathMatch: "full",
        },
        {
          path: "about",
          loadComponent: () =>
            import("./app/pages/about/about.component").then(
              (m) => m.AboutComponent
            ),
        },
        {
          path: "eggnog",
          loadComponent: () =>
            import("./app/pages/eggnog/eggnog.component").then(
              (m) => m.EggnogComponent
            ),
        },
        {
          path: "home",
          loadComponent: () =>
            import("./app/pages/home/home.component").then(
              (m) => m.HomeComponent
            ),
        },
        {
          path: "services",
          loadComponent: () =>
            import("./app/pages/services/services.component").then(
              (m) => m.ServicesComponent
            ),
        },
        {
          path: "login",
          loadComponent: () =>
            import("./app/pages/login/login.component").then(
              (m) => m.LoginComponent
            ),
        },
        {
          path: "admin",
          loadComponent: () =>
            import("./app/pages/admin/admin.component").then(
              (m) => m.AdminComponent
            ),
        },
        {
          path: "tournament",
          loadComponent: () =>
            import("./app/pages/tournament.component").then(
              (m) => m.TournamentComponent
            ),
        },
        {
          path: "tournaments",
          // keep an explicit route to allow full-page handoff if needed
          loadComponent: () =>
            import("./app/pages/tournament.component").then(
              (m) => m.TournamentComponent
            ),
        },
        {
          path: "tournaments-embed",
          loadComponent: () =>
            import("./app/pages/tournaments-embed.component").then(
              (m) => m.TournamentsEmbedComponent
            ),
        },
        {
          path: "tournaments/admin",
          loadComponent: () =>
            import("./app/pages/admin/admin.component").then(
              (m) => m.AdminComponent
            ),
        },
        {
          path: "**",
          redirectTo: "/tournaments",
        },
      ],
      withEnabledBlockingInitialNavigation()
    ),
  ],
}).catch((err: any) => console.error(err));
