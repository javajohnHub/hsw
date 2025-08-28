import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";

@Component({
  selector: "app-projects",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./projects.component.html",
  styleUrls: ["./projects.component.scss"],
})
export class ProjectsComponent {
  projects = [
    {
      id: 1,
      title: "Retro Never Dies",
      description:
        "A nostalgic arcade tournament platform featuring classic games, leaderboards, and competitive gaming.",
      image: "/assets/images/AddText_08-12-04.51.33.png",
      technologies: ["Angular", "TypeScript", "Node.js", "Express"],
      status: "Live",
  demoUrl: "/tournaments",
    },
  ];

  constructor(private router: Router) {}
  openProject(project: any) {
    if (project.id === 1) {
      window.location.assign('/tournaments');
    }
  }

  viewProjectDetails(project: any) {
    // For future implementation - could route to detailed project page
    console.log("Viewing details for:", project.title);
  }

  goToLogin() {
    this.router.navigate(["/login"]);
  }
}
