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
          <h1>About highscorewins</h1>
          <p class="hero-subtitle">
            Streamer, speedrunner, and retro gaming enthusiast. Bringing community-driven
            events, highscore challenges, and entertaining runs to the stream.
          </p>
        </div>
      </div>
    </section>

    <section class="about-content section">
      <div class="container">
        <div class="about-grid">
          <div class="about-text">
            <h2>Streamer & Community Host</h2>
            <p>
              I'm Highscore Wins — I stream retro games, speedruns, and community challenge events.
              Expect a mix of highscore hunts, entertaining commentary, and community-run tournaments.
            </p>
            <p>
              The Eggnog Challenge and seasonal tournaments bring the community together to compete,
              share highlights, and win prizes. Follow along on Twitch/Kick and join the Discord to
              take part.
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
