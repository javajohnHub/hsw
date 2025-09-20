import { Component } from '@angular/core';

@Component({
  selector: 'app-tournament',
  standalone: true,
  template: `
    <div style="width:100%; height:60vh; display:flex; align-items:center; justify-content:center; padding:2rem;">
      <div style="text-align:center;">
        <h2>Retro Never Dies Tournament</h2>
        <p>The tournaments application is served separately. Click below to open it.</p>
        <a href="/tournaments" style="display:inline-block;padding:.75rem 1.25rem;background:#0d6efd;color:#fff;border-radius:.5rem;text-decoration:none;margin-top:1rem;">Open tournaments app</a>
      </div>
    </div>
  `,
})
export class TournamentComponent {}
