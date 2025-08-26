import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private cache = new Map<string, any>();
  private worker?: Worker;

  constructor() {
    // Initialize web worker if supported
    if (typeof Worker !== 'undefined') {
      this.initializeWorker();
    }
  }

  private initializeWorker(): void {
    try {
      this.worker = new Worker(new URL('../workers/performance.worker', import.meta.url));
      this.worker.onmessage = ({ data }) => {
        console.log('Worker result:', data);
      };
    } catch (error) {
      console.warn('Web Worker not supported or failed to initialize:', error);
    }
  }

  // Cache management
  setCache(key: string, data: any, ttl: number = 300000): void { // 5 minutes default
    const expires = Date.now() + ttl;
    this.cache.set(key, { data, expires });
  }

  getCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  clearCache(): void {
    this.cache.clear();
  }

  // Performance monitoring
  measurePerformance(name: string, fn: () => void): void {
    const start = performance.now();
    fn();
    const end = performance.now();
    console.log(`${name} took ${end - start} milliseconds`);
  }

  // Lazy loading utilities
  loadScriptAsync(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
  }

  // Critical resource hints
  preloadResource(href: string, as: string): void {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    document.head.appendChild(link);
  }

  // Intersection Observer for lazy loading
  createIntersectionObserver(callback: IntersectionObserverCallback): IntersectionObserver {
    return new IntersectionObserver(callback, {
      rootMargin: '50px',
      threshold: 0.1
    });
  }

  // Service Worker registration removed

  // Web Worker task delegation
  delegateToWorker(task: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Web Worker not available'));
        return;
      }

      const messageId = Date.now().toString();
      
      const messageHandler = (event: MessageEvent) => {
        if (event.data.id === messageId) {
          this.worker!.removeEventListener('message', messageHandler);
          resolve(event.data.result);
        }
      };

      this.worker.addEventListener('message', messageHandler);
      this.worker.postMessage({ id: messageId, task, data });
    });
  }

  // Critical CSS inlining
  inlineCriticalCSS(css: string): void {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  // Performance metrics
  getPerformanceMetrics(): PerformanceEntry[] {
    return performance.getEntriesByType('navigation');
  }

  // Memory usage monitoring
  getMemoryUsage(): any {
    return (performance as any).memory;
  }
}
