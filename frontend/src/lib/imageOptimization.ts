/*
 * IMAGE OPTIMIZATION UTILITIES
 * 
 * This file provides utilities for optimizing image loading performance,
 * including preloading, caching, and performance monitoring.
 */

import { getCriticalImages, generateOptimizedImageUrl } from './mediaAssets';

// Image preloading utility
export class ImagePreloader {
  private preloadedImages = new Set<string>();
  private preloadQueue: string[] = [];
  private isProcessing = false;

  /**
   * Preload a single image
   */
  preloadImage(src: string, priority: 'high' | 'medium' | 'low' = 'medium'): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.preloadedImages.has(src)) {
        resolve();
        return;
      }

      const img = new Image();
      
      img.onload = () => {
        this.preloadedImages.add(src);
        resolve();
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to preload image: ${src}`));
      };

      // Set priority based on importance
      if (priority === 'high') {
        img.fetchPriority = 'high';
      }

      img.src = src;
    });
  }

  /**
   * Preload multiple images
   */
  async preloadImages(urls: string[], priority: 'high' | 'medium' | 'low' = 'medium'): Promise<void> {
    const promises = urls.map(url => this.preloadImage(url, priority));
    await Promise.allSettled(promises);
  }

  /**
   * Preload critical images from media assets
   */
  async preloadCriticalImages(): Promise<void> {
    const criticalImages = getCriticalImages();
    const urls = criticalImages.map(img => 
      generateOptimizedImageUrl(img.uploadLink, { quality: 80, format: 'webp' })
    );
    
    await this.preloadImages(urls, 'high');
  }

  /**
   * Check if an image is already preloaded
   */
  isPreloaded(src: string): boolean {
    return this.preloadedImages.has(src);
  }

  /**
   * Clear preloaded images cache
   */
  clearCache(): void {
    this.preloadedImages.clear();
  }
}

// Performance monitoring utility
export class ImagePerformanceMonitor {
  private metrics: Map<string, {
    startTime: number;
    loadTime?: number;
    size?: number;
    success: boolean;
  }> = new Map();

  /**
   * Start monitoring an image load
   */
  startMonitoring(imageId: string): void {
    this.metrics.set(imageId, {
      startTime: performance.now(),
      success: false
    });
  }

  /**
   * Mark image as loaded successfully
   */
  markLoaded(imageId: string, size?: number): void {
    const metric = this.metrics.get(imageId);
    if (metric) {
      metric.loadTime = performance.now() - metric.startTime;
      metric.size = size;
      metric.success = true;
    }
  }

  /**
   * Mark image as failed
   */
  markFailed(imageId: string): void {
    const metric = this.metrics.get(imageId);
    if (metric) {
      metric.loadTime = performance.now() - metric.startTime;
      metric.success = false;
    }
  }

  /**
   * Get performance metrics for an image
   */
  getMetrics(imageId: string) {
    return this.metrics.get(imageId);
  }

  /**
   * Get all performance metrics
   */
  getAllMetrics() {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Calculate average load time
   */
  getAverageLoadTime(): number {
    const successfulLoads = Array.from(this.metrics.values())
      .filter(m => m.success && m.loadTime)
      .map(m => m.loadTime!);
    
    if (successfulLoads.length === 0) return 0;
    
    return successfulLoads.reduce((sum, time) => sum + time, 0) / successfulLoads.length;
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
  }
}

// Intersection Observer utility for lazy loading
export class LazyLoadObserver {
  private observer: IntersectionObserver | null = null;
  private callbacks = new Map<Element, () => void>();

  constructor(options: IntersectionObserverInit = {}) {
    const defaultOptions: IntersectionObserverInit = {
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const callback = this.callbacks.get(entry.target);
          if (callback) {
            callback();
            this.unobserve(entry.target);
          }
        }
      });
    }, defaultOptions);
  }

  /**
   * Observe an element for lazy loading
   */
  observe(element: Element, callback: () => void): void {
    this.callbacks.set(element, callback);
    this.observer?.observe(element);
  }

  /**
   * Stop observing an element
   */
  unobserve(element: Element): void {
    this.callbacks.delete(element);
    this.observer?.unobserve(element);
  }

  /**
   * Disconnect the observer
   */
  disconnect(): void {
    this.observer?.disconnect();
    this.callbacks.clear();
  }
}

// Image format detection utility
export const detectImageFormat = (url: string): 'webp' | 'jpeg' | 'png' | 'gif' | 'svg' | 'unknown' => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    
    if (pathname.includes('.webp')) return 'webp';
    if (pathname.includes('.jpeg') || pathname.includes('.jpg')) return 'jpeg';
    if (pathname.includes('.png')) return 'png';
    if (pathname.includes('.gif')) return 'gif';
    if (pathname.includes('.svg')) return 'svg';
    
    return 'unknown';
  } catch {
    return 'unknown';
  }
};

// WebP support detection
export const supportsWebP = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

// Image compression utility
export const compressImage = async (
  file: File,
  options: {
    quality?: number;
    maxWidth?: number;
    maxHeight?: number;
    format?: 'webp' | 'jpeg' | 'png';
  } = {}
): Promise<Blob> => {
  const {
    quality = 0.8,
    maxWidth = 1920,
    maxHeight = 1080,
    format = 'webp'
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    const img = new Image();
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        `image/${format}`,
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

// Cache management utility
export class ImageCache {
  private cache = new Map<string, {
    data: string;
    timestamp: number;
    size: number;
  }>();
  private maxSize = 50 * 1024 * 1024; // 50MB
  private currentSize = 0;

  /**
   * Store an image in cache
   */
  set(key: string, data: string, size: number): void {
    // Remove old entries if cache is full
    while (this.currentSize + size > this.maxSize && this.cache.size > 0) {
      const [oldestKey] = this.cache.keys();
      const oldest = this.cache.get(oldestKey);
      if (oldest) {
        this.currentSize -= oldest.size;
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      size
    });
    this.currentSize += size;
  }

  /**
   * Get an image from cache
   */
  get(key: string): string | null {
    const item = this.cache.get(key);
    if (item) {
      // Update timestamp for LRU
      item.timestamp = Date.now();
      return item.data;
    }
    return null;
  }

  /**
   * Check if an image is cached
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Clear the cache
   */
  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.currentSize,
      maxSize: this.maxSize,
      count: this.cache.size,
      usage: (this.currentSize / this.maxSize) * 100
    };
  }
}

// Export singleton instances
export const imagePreloader = new ImagePreloader();
export const performanceMonitor = new ImagePerformanceMonitor();
export const imageCache = new ImageCache();

// Initialize critical image preloading
export const initializeImageOptimization = async (): Promise<void> => {
  try {
    // Preload critical images
    await imagePreloader.preloadCriticalImages();
    
    // Check WebP support
    const webPSupported = await supportsWebP();
    if (webPSupported) {
      console.log('[ImageOptimization] WebP is supported');
    } else {
      console.log('[ImageOptimization] WebP is not supported, falling back to JPEG');
    }
    
    console.log('[ImageOptimization] Image optimization initialized successfully');
  } catch (error) {
    console.error('[ImageOptimization] Failed to initialize:', error);
  }
}; 