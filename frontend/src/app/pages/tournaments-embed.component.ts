import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tournaments-embed',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="tournaments-embed">
      <div class="embed-toolbar">
        <p *ngIf="loading">Loading tournaments…</p>
        <p *ngIf="blocked">This site blocked embedding. <button (click)="openFull()">Open full page</button></p>
        <p *ngIf="loadFailed">Failed to load tournaments. <button (click)="openFull()">Open full page</button></p>
      </div>

      <div class="embed-wrapper" *ngIf="!blocked && !loadFailed">
        <iframe #embedIframe
          title="Tournaments"
          class="embed-iframe"
          src="/tournaments/"
          (load)="onIframeLoad()"
          (error)="onIframeError()"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        ></iframe>
      </div>
    </section>
  `,
  styles: [
    `
    .tournaments-embed { padding: 1rem; }
    .embed-toolbar { margin-bottom: .5rem; color: #bfbfbf; }
    .embed-wrapper { width: 100%; height: calc(100vh - 160px); }
    .embed-iframe { width: 100%; height: 100%; border: 0; background: #0f1111; }
    button { background: #16a34a; color: #011; border: none; padding: .4rem .8rem; border-radius: .4rem; cursor: pointer; }
    `
  ]
})
export class TournamentsEmbedComponent {
  @ViewChild('embedIframe', { static: false }) embedIframe!: ElementRef<HTMLIFrameElement>;
  loading = true;
  blocked = false;
  loadFailed = false;

  onIframeLoad() {
    this.loading = false;
    // Try to access iframe document to detect framing restrictions.
    try {
      const win = this.embedIframe?.nativeElement?.contentWindow as Window | null;
      if (!win) {
        // No window available
        this.blocked = true;
        return;
      }
      // Accessing location.href should succeed same-origin; if it throws, framing is blocked or cross-origin
      // Wrap in try/catch to detect any access error
      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const href = win.location && win.location.href;
      } catch (e) {
        this.blocked = true;
      }
    } catch (e) {
      this.blocked = true;
    }
  }

  onIframeError() {
    this.loading = false;
    this.loadFailed = true;
  }

  openFull() {
    window.location.href = '/tournaments/';
  }
}
