import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-eggnog',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="section">
      <div class="container">
        <h1>Eggnog Challenge</h1>
        <p>Coming soon — the Eggnog Challenge page is under construction. Check back later for rules, signups, and leaderboards.</p>
      </div>
    </section>
  `,
  styleUrl: '../home/home.component.scss'
})
export class EggnogComponent {}
