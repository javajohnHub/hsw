import { Component } from '@angular/core';

@Component({
  selector: 'app-rnd',
  standalone: true,
  template: `
    <div style="padding:2rem;text-align:center;">
      <h2>Retro Never Dies Tournament</h2>
      <p>Open the tournaments app served from this site.</p>
  <a href="/tournaments" style="display:inline-block;padding:.75rem 1.25rem;background:#0d6efd;color:#fff;border-radius:.5rem;text-decoration:none;">Go to /tournaments</a>
    </div>
  `
})
export class RNDComponent {}