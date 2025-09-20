import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="admin-shell">
      <div class="admin-frame">
        <iframe src="/tournaments/admin" title="Tournaments Admin" frameborder="0"></iframe>
      </div>
    </section>
  `,
  styles: [
    `
    .admin-shell { padding: 1rem; }
    .admin-header { margin-bottom: 0.5rem; }
    .admin-header h2 { margin: 0; font-size: 1.25rem; }
    .muted { color: rgba(0,0,0,0.6); }
    .admin-frame { width: 100%; height: calc(100vh - 180px); }
    .admin-frame iframe { width: 100%; height: 100%; border: 0; }
    @media (max-width: 768px) { .admin-frame { height: calc(100vh - 220px); } }
    `,
  ],
})
export class AdminComponent {}
