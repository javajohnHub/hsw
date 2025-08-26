import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="hero">
      <div class="container">
        <div class="hero-content">
          <h1>
            Angular Expert & Full-Stack Developer
          </h1>
          <p class="hero-subtitle">
            Specializing in Angular migrations, real-time web applications, Discord bots, 
            streaming tools, and 3rd party integrations. Transform your legacy applications 
            or build cutting-edge solutions with modern technologies.
          </p>
          <div class="hero-buttons">
            <a routerLink="/contact" class="btn btn-primary">Get Started</a>
            <a routerLink="/services" class="btn btn-secondary">View Services</a>
          </div>
        </div>
      </div>
    </section>

    <section class="features section">
      <div class="container">
        <h2 class="section-title">Why Choose Edwards Web Development?</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">🅰️</div>
            <h3>Angular Migration Expert</h3>
            <p>Seamlessly upgrade your Angular applications from legacy versions to Angular 17+ with improved performance and modern features.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">⚡</div>
            <h3>Real-time Applications</h3>
            <p>Build interactive web apps with WebSockets, live chat, real-time data sync, and collaborative features.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🤖</div>
            <h3>Bot Development</h3>
            <p>Custom Discord bots, Twitch/Kick chatbots, and streaming automation tools to enhance your community engagement.</p>
            <div class="platform-icons">
              <img src="assets/twitch.png" alt="Twitch" class="platform-icon twitch">
              <img src="assets/kick.png" alt="Kick" class="platform-icon kick">
              <img src="assets/obs.png" alt="OBS" class="platform-icon obs">
              <img src="assets/discord.png" alt="Discord" class="platform-icon discord">
            </div>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🎮</div>
            <h3>Streaming Solutions</h3>
            <p>Interactive stream overlays, viewer engagement tools, and real-time integrations for content creators.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🔗</div>
            <h3>3rd Party Integrations</h3>
            <p>Connect your applications with payment gateways, social media APIs, CRM systems, and cloud services for enhanced functionality.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="cta section">
      <div class="container">
        <div class="cta-content">
          <h2>Ready to Start Your Project?</h2>
          <p>Let's discuss how I can help bring your web development vision to life.</p>
          <a routerLink="/contact" class="btn btn-primary">Contact Me Today</a>
        </div>
      </div>
    </section>
  `,
  styleUrl: './home.component.scss'
})
export class HomeComponent {}
