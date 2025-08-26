// Performance Web Worker
/// <reference lib="webworker" />

interface WorkerMessage {
  id: string;
  task: string;
  data: any;
}

interface WorkerResponse {
  id: string;
  result?: any;
  error?: string;
}

self.onmessage = function(e: MessageEvent<WorkerMessage>) {
  const { id, task, data } = e.data;
  
  try {
    let result;
    
    switch (task) {
      case 'heavyCalculation':
        result = performHeavyCalculation(data);
        break;
      case 'dataProcessing':
        result = processData(data);
        break;
      case 'imageOptimization':
        result = optimizeImage(data);
        break;
      default:
        throw new Error(`Unknown task: ${task}`);
    }
    
    self.postMessage({ id, result } as WorkerResponse);
  } catch (error: any) {
    self.postMessage({ id, error: error?.message || 'Unknown error' } as WorkerResponse);
  }
};

function performHeavyCalculation(data: any): any {
  // Example heavy calculation that would block main thread
  let result = 0;
  for (let i = 0; i < data.iterations; i++) {
    result += Math.sqrt(i);
  }
  return result;
}

function processData(data: any[]): any {
  // Process large datasets without blocking UI
  return data.map(item => ({
    ...item,
    processed: true,
    timestamp: Date.now()
  }));
}

function optimizeImage(imageData: any): any {
  // Image processing operations
  return {
    optimized: true,
    originalSize: imageData.size,
    compressedSize: imageData.size * 0.7, // Simulated compression
    format: 'webp'
  };
}

// Utility functions for performance
function debounce(func: Function, wait: number): Function {
  let timeout: number;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = self.setTimeout(later, wait);
  };
}

function throttle(func: Function, limit: number): Function {
  let inThrottle: boolean;
  return function executedFunction(this: any, ...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      self.setTimeout(() => inThrottle = false, limit);
    }
  };
}
