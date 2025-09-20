import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-redirect-to-tournaments',
  standalone: true,
  template: `
    <div style="padding:2rem;text-align:center;">
      <p>Redirecting to tournaments...</p>
    </div>
  `,
})
export class RedirectToTournamentsComponent implements OnInit {
  ngOnInit(): void {
    // Force a full-page navigation to the tournaments app served at /tournaments
    window.location.replace('/tournaments');
  }
}
