import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
   <section class="section">
      <div class="container">
        <h1>Home</h1>
        <p>Coming soon —homepage</p>
      </div>
    </section>
  `,
  styleUrl: './home.component.scss'
})
export class HomeComponent {}
