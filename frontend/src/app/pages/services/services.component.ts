import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="hero-services">
      <div class="container">
        <div class="hero-content">
          <h1>Web Development Services</h1>
          <p class="hero-subtitle">
            Comprehensive web solutions to help your business grow and succeed online.
          </p>
        </div>
      </div>
    </section>

    <section class="services section">
      <div class="container">
        <div class="services-grid">
          <div class="service-card">
            <div class="service-icon">🅰️</div>
            <h3>Angular Development & Migration</h3>
            <p>
              Expert Angular development with specialization in migrating legacy applications 
              from older versions to Angular 17+. Performance optimization and modern architecture.
            </p>
            <ul class="service-features">
              <li>Angular 2+ to 17+ Migration</li>
              <li>Component Architecture</li>
              <li>Performance Optimization</li>
              <li>Modern Angular Features</li>
            </ul>
          </div>

          <div class="service-card">
            <div class="service-icon">⚡</div>
            <h3>Real-time Web Applications</h3>
            <p>
              Interactive web applications with WebSockets, live chat systems, real-time data 
              synchronization, and collaborative features for enhanced user engagement.
            </p>
            <ul class="service-features">
              <li>WebSocket Integration</li>
              <li>Live Chat Systems</li>
              <li>Real-time Data Updates</li>
              <li>Collaborative Tools</li>
            </ul>
          </div>

          <div class="service-card">
            <div class="service-icon">🤖</div>
            <h3>Discord & Twitch Bots</h3>
            <p>
              Custom Discord bots, Twitch/Kick chatbots, and streaming automation tools. 
              Enhance your community engagement and automate streaming workflows.
            </p>
            <ul class="service-features">
              <li>Discord Bot Development</li>
              <li>Twitch/Kick Chat Bots</li>
              <li>Custom Commands</li>
              <li>Stream Automation</li>
            </ul>
          </div>

          <div class="service-card">
            <div class="service-icon">🎮</div>
            <h3>Streamer Overlays & Tools</h3>
            <p>
              Interactive streaming overlays, viewer engagement tools, donation alerts, 
              and real-time streaming integrations for content creators.
            </p>
            <ul class="service-features">
              <li>Custom Stream Overlays</li>
              <li>Viewer Interaction Tools</li>
              <li>Real-time Alerts</li>
              <li>OBS Integration</li>
            </ul>
          </div>

          <div class="service-card">
            <div class="service-icon">🔄</div>
            <h3>Legacy System Modernization</h3>
            <p>
              Transform outdated applications with modern frameworks, improved performance, 
              enhanced security, and better user experience.
            </p>
            <ul class="service-features">
              <li>Code Refactoring</li>
              <li>Framework Upgrades</li>
              <li>Security Improvements</li>
              <li>Performance Enhancement</li>
            </ul>
          </div>

          <div class="service-card">
            <div class="service-icon">🏗️</div>
            <h3>Full-Stack Development</h3>
            <p>
              Complete web solutions using Node.js, Express, Angular, and modern databases. 
              From concept to deployment with scalable architecture.
            </p>
            <ul class="service-features">
              <li>Node.js/Express Backend</li>
              <li>Angular Frontend</li>
              <li>Database Design</li>
              <li>API Development</li>
            </ul>
          </div>

          <div class="service-card">
            <div class="service-icon">🔗</div>
            <h3>3rd Party Integrations</h3>
            <p>
              Seamless integration with external services, APIs, and platforms to extend your 
              application's functionality and connect with essential business tools.
            </p>
            <ul class="service-features">
              <li>Payment Gateway Integration</li>
              <li>Social Media APIs</li>
              <li>CRM & Marketing Tools</li>
              <li>Cloud Service Connections</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <section class="process section">
      <div class="container">
        <h2 class="section-title">My Development Process</h2>
        <div class="process-grid">
          <div class="process-step">
            <div class="step-number">1</div>
            <h3>Discovery & Planning</h3>
            <p>Understanding your requirements, goals, and target audience to create a comprehensive project plan.</p>
          </div>
          
          <div class="process-step">
            <div class="step-number">2</div>
            <h3>Design & Prototype</h3>
            <p>Creating wireframes and prototypes to visualize the user experience and interface design.</p>
          </div>
          
          <div class="process-step">
            <div class="step-number">3</div>
            <h3>Development</h3>
            <p>Building your website or application using modern technologies and best practices.</p>
          </div>
          
          <div class="process-step">
            <div class="step-number">4</div>
            <h3>Testing & Launch</h3>
            <p>Thorough testing across devices and browsers, followed by deployment and launch.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="cta section">
      <div class="container">
        <div class="cta-content">
          <h2>Ready to Start Your Project?</h2>
          <p>Let's discuss your requirements and create a solution that fits your needs.</p>
          <a routerLink="/contact" class="btn btn-primary">Get Started</a>
        </div>
      </div>
    </section>
  `,
  styleUrl: './services.component.scss'
})
export class ServicesComponent {}
