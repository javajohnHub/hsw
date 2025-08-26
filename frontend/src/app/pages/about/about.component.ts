import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="hero-about">
      <div class="container">
        <div class="hero-content">
          <h1>About Edwards Web Development</h1>
          <p class="hero-subtitle">
            Professional web development services with a focus on quality, 
            innovation, and client satisfaction.
          </p>
        </div>
      </div>
    </section>

    <section class="about-content section">
      <div class="container">
        <div class="about-grid">
          <div class="about-text">
            <h2>Full-Stack Developer & Angular Expert</h2>
            <p>
              I'm John Edwards, a seasoned full-stack developer with extensive experience in 
              Angular development, real-time web applications, and bot development. Currently 
              working as a Software Engineer at Crown Equipment Corp, I specialize in Angular 
              migrations, performance optimization, and modern web technologies.
            </p>
            <p>
              My expertise spans from upgrading legacy Angular applications to the latest versions, 
              building real-time chat systems with WebSockets, to creating Discord bots and 
              streaming tools for content creators. I have a proven track record of delivering 
              high-quality solutions for both enterprise and independent clients.
            </p>
            <p>
              With experience at companies like CI&T, NTERSOL, KUMANU, and BASF, I bring enterprise-level 
              knowledge to every project. Whether you need to modernize an existing application, 
              build a real-time web app, or create custom automation tools, I have the skills 
              to deliver exceptional results.
            </p>
          </div>
          
          <div class="about-stats">
            <div class="stat-card">
              <div class="stat-number">100+</div>
              <div class="stat-label">Projects Completed</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">10+</div>
              <div class="stat-label">Years Experience</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">100%</div>
              <div class="stat-label">Client Satisfaction</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="skills section">
      <div class="container">
        <h2 class="section-title">Technical Expertise</h2>
        <div class="skills-grid">
          <div class="skill-category">
            <h3>Frontend Development</h3>
            <ul>
              <li>Angular 2+ to 17+ (Expert)</li>
              <li>TypeScript & JavaScript</li>
              <li>HTML5 & CSS3/SCSS</li>
              <li>Responsive Design</li>
              <li>WebSockets & Real-time Apps</li>
            </ul>
          </div>
          
          <div class="skill-category">
            <h3>Backend & Real-time</h3>
            <ul>
              <li>Node.js & Express</li>
              <li>WebSocket Integration</li>
              <li>RESTful APIs</li>
              <li>Database Design (MySQL, MongoDB)</li>
              <li>Real-time Communication</li>
            </ul>
          </div>
          
          <div class="skill-category">
            <h3>Bot Development & Streaming</h3>
            <ul>
              <li>Discord Bot Development</li>
              <li>Twitch/Kick Chat Bots</li>
              <li>Stream Overlays & Tools</li>
              <li>OBS Integration</li>
              <li>Automation & Scripting</li>
            </ul>
          </div>
          
          <div class="skill-category">
            <h3>Tools & Technologies</h3>
            <ul>
              <li>Git & Version Control</li>
              <li>Docker & Cloud Deployment</li>
              <li>Performance Optimization</li>
              <li>Legacy System Migration</li>
              <li>Agile Development</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <section class="cta section">
      <div class="container">
        <div class="cta-content">
          <h2>Ready to Work Together?</h2>
          <p>Let's discuss your project and how I can help bring your vision to life.</p>
          <a routerLink="/contact" class="btn btn-primary">Get In Touch</a>
        </div>
      </div>
    </section>
  `,
  styleUrl: './about.component.scss'
})
export class AboutComponent {}
