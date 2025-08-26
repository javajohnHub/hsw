import { Component, OnInit } from '@angular/core';
import { PerformanceService } from '../../services/performance.service';

@Component({
  selector: 'app-performance-example',
  template: `
    <div class="performance-demo">
      <h2>Performance Optimization Demo</h2>
      
      <div class="metrics">
        <h3>Current Performance Metrics</h3>
        <div *ngFor="let metric of performanceMetrics">
          <strong>{{metric.name}}</strong>: {{metric.value | number:'1.2-2'}}ms
        </div>
      </div>
      
      <div class="actions">
        <button (click)="testHeavyCalculation()">Test Heavy Calculation (Web Worker)</button>
        <button (click)="testCaching()">Test Caching</button>
        <button (click)="testLazyLoading()">Test Lazy Loading</button>
      </div>
      
      <div class="results">
        <h3>Results</h3>
        <pre>{{results | json}}</pre>
      </div>
    </div>
  `,
  styles: [`
    .performance-demo {
      max-width: 800px;
      margin: 2rem auto;
      padding: 1rem;
      border: 1px solid #ddd;
      border-radius: 8px;
    }
    
    .metrics, .actions, .results {
      margin-bottom: 1rem;
    }
    
    button {
      margin: 0.5rem;
      padding: 0.5rem 1rem;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    button:hover {
      background: #0056b3;
    }
    
    pre {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 4px;
      overflow-x: auto;
    }
  `]
})
export class PerformanceExampleComponent implements OnInit {
  performanceMetrics: any[] = [];
  results: any = {};

  constructor(private performanceService: PerformanceService) {}

  ngOnInit() {
    // Service worker registration removed
    
    // Load performance metrics
    this.loadPerformanceMetrics();
    
    // Preload critical resources
    this.performanceService.preloadResource('/assets/logo.png', 'image');
  }

  private loadPerformanceMetrics() {
    const metrics = this.performanceService.getPerformanceMetrics();
    this.performanceMetrics = metrics.map((metric: any) => ({
      name: metric.name,
      value: metric.duration || 0
    }));
    
    // Add memory usage if available
    const memory = this.performanceService.getMemoryUsage();
    if (memory) {
      this.performanceMetrics.push({
        name: 'Memory Usage',
        value: memory.usedJSHeapSize / 1024 / 1024 // MB
      });
    }
  }

  async testHeavyCalculation() {
    console.log('Starting heavy calculation...');
    
    this.performanceService.measurePerformance('Heavy Calculation', async () => {
      try {
        const result = await this.performanceService.delegateToWorker('heavyCalculation', {
          iterations: 1000000
        });
        
        this.results = {
          ...this.results,
          heavyCalculation: result
        };
        
        console.log('Heavy calculation completed:', result);
      } catch (error: any) {
        console.error('Heavy calculation failed:', error);
        this.results = {
          ...this.results,
          heavyCalculation: { error: error?.message || 'Unknown error' }
        };
      }
    });
  }

  testCaching() {
    const cacheKey = 'test-data';
    
    // First check cache
    let cachedData = this.performanceService.getCache(cacheKey);
    
    if (cachedData) {
      console.log('Data loaded from cache:', cachedData);
      this.results = {
        ...this.results,
        caching: { source: 'cache', data: cachedData }
      };
    } else {
      // Simulate loading data
      const newData = {
        timestamp: Date.now(),
        message: 'This data was freshly loaded'
      };
      
      // Cache for 1 minute
      this.performanceService.setCache(cacheKey, newData, 60000);
      
      console.log('Data loaded fresh and cached:', newData);
      this.results = {
        ...this.results,
        caching: { source: 'fresh', data: newData }
      };
    }
  }

  async testLazyLoading() {
    try {
      // Simulate lazy loading a script
      await this.performanceService.loadScriptAsync('https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.4/moment.min.js');
      
      this.results = {
        ...this.results,
        lazyLoading: { success: true, message: 'Moment.js loaded successfully' }
      };
      
      console.log('Lazy loading completed successfully');
    } catch (error: any) {
      this.results = {
        ...this.results,
        lazyLoading: { success: false, error: error?.message || 'Unknown error' }
      };
      
      console.error('Lazy loading failed:', error);
    }
  }
}
