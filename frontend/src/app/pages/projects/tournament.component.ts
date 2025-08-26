import { Component } from '@angular/core';

@Component({
  selector: 'app-tournament',
  standalone: true,
  template: `
    <div style="width: 100%; height: 100vh;">
      <iframe 
        src="http://localhost:4000" 
        width="100%" 
        height="100%" 
        frameborder="0">
      </iframe>
    </div>
  `
})
export class TournamentComponent {}