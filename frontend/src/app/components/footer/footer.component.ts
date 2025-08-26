import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
  readonly currentYear: number = new Date().getFullYear();
  readonly businessName: string = environment.business.name;
  readonly contactEmail: string = environment.contact.email;
  readonly businessHours: string = environment.contact.businessHours;
  readonly tagline: string = environment.business.tagline;
  readonly specialties: string[] = environment.business.specialties;

  readonly socialLinks = [
    {
      name: 'Email',
      url: `mailto:${this.contactEmail}`,
      icon: 'envelope',
      ariaLabel: 'Send email to Edwards Web Development'
    },
    {
      name: 'LinkedIn',
      url: '#',
      icon: 'linkedin',
      ariaLabel: 'Connect with Edwards Web Development on LinkedIn'
    },
    {
      name: 'GitHub',
      url: '#',
      icon: 'github',
      ariaLabel: 'View Edwards Web Development projects on GitHub'
    }
  ];

  readonly quickLinks = [
    { name: 'Home', route: '/' },
    { name: 'Services', route: '/services' },
    { name: 'About', route: '/about' },
    { name: 'Contact', route: '/contact' },
    { name: 'Admin', route: '/login' }
  ];

  readonly serviceLinks = this.specialties.map(specialty => ({
    name: specialty,
    route: '/services'
  }));

  onSocialLinkClick(linkName: string): void {
    console.log(`Footer: ${linkName} link clicked`);
  }
}
