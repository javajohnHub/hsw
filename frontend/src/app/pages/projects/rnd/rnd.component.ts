import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-rnd',
  standalone: true,
  styles: [
    `
    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      overflow: hidden;
    }

    iframe {
      border: none;
      width: 100%;
      height: calc(90vh);
    }`
  ],
  template: `
    <!-- Correct iframe URL for Edwards Web Development sub-app -->
    <iframe 
      src="http://localhost:4000" 
      width="100%" 
      height="600px"
      frameborder="0"
      title="Edwards Web Development Application">
    </iframe>
  `
})
export class RNDComponent {}