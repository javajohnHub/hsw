import { Component } from '@angular/core';

@Component({
  selector: 'app-tournament',
  standalone: true,
  template: `
    <div style="width: 100%; height: 80vh; display: grid; place-items: center; text-align: center; padding: 2rem;">
      <h2 style="margin-bottom: 1rem;">Retro Never Dies Tournament</h2>
      <p style="margin-bottom: 1.5rem;">Open the tournaments app served from this site.</p>
  <a href="/tournaments" style="display:inline-block;padding:.75rem 1.25rem;background:#0d6efd;color:#fff;border-radius:.5rem;text-decoration:none;">Go to /tournaments</a>
    </div>
  `
})
export class TournamentComponent {}