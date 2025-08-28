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
          loadComponent: () =>
            import("./app/pages/home/home.component").then(
              (m) => m.HomeComponent
            ),
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
          path: "services",
          loadComponent: () =>
            import("./app/pages/services/services.component").then(
              (m) => m.ServicesComponent
            ),
        },
        {
          path: "projects",
          loadComponent: () =>
            import("./app/pages/projects/projects.component").then(
              (m) => m.ProjectsComponent
            ),
        },
        {
          path: "contact",
          loadComponent: () =>
            import("./app/pages/contact/contact.component").then(
              (m) => m.ContactComponent
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
          path: "tournament",
          redirectTo: "/tournaments",
          pathMatch: "full",
        },
        {
          path: "**",
          redirectTo: "",
        },
      ],
      withEnabledBlockingInitialNavigation()
    ),
  ],
}).catch((err: any) => console.error(err));
