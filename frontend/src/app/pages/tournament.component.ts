import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-tournament',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section style="width:100%; padding:2rem; display:flex; align-items:center; justify-content:center;">
      <div style="text-align:center; max-width:800px;">
        <h2>Retro Never Dies Tournament</h2>
        <p>The tournaments application is available at <strong>/tournaments</strong>. Use the link below to open the tournaments app.</p>
        <a routerLink="/tournaments" class="btn" style="display:inline-block;padding:.75rem 1.25rem;background:#0d6efd;color:#fff;border-radius:.5rem;text-decoration:none;margin-top:1rem;">Open tournaments app</a>
      </div>
    </section>
  `,
})
export class TournamentComponent {}
