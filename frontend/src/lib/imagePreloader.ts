/*
 * IMAGE PRELOADING UTILITY
 * 
 * This utility handles preloading of critical images to improve perceived performance
 * and reduce layout shifts. It uses various strategies including:
 * - Link preload for critical above-the-fold images
 * - Intersection Observer for lazy loading
 * - Priority-based loading
 * - Memory management for preloaded images
 */

export interface PreloadOptions {
  priority?: 'high' | 'low' | 'auto';
  strategy?: 'preload' | 'lazy' | 'eager';
  timeout?: number;
  retries?: number;
  onLoad?: (url: string) => void;
  onError?: (url: string, error: Error) => void;
  onProgress?: (url: string, progress: number) => void;
}

export interface PreloadResult {
  url: string;
  success: boolean;
  loadedAt?: Date;
  error?: Error;
  size?: number;
}

class ImagePreloader {
  private preloadedImages = new Map<string, HTMLImageElement>();
  private loadingPromises = new Map<string, Promise<PreloadResult>>();
  private observer: IntersectionObserver | null = null;
  private linkElements = new Set<HTMLLinkElement>();

  constructor() {
    this.setupIntersectionObserver();
  }

  /**
   * Preload a single image with options
   */
  async preloadImage(url: string, options: PreloadOptions = {}): Promise<PreloadResult> {
    const {
      priority = 'auto',
      strategy = 'preload',
      timeout = 10000,
      retries = 2,
      onLoad,
      onError,
      onProgress
    } = options;

    // Check if already preloaded
    if (this.preloadedImages.has(url)) {
      return {
        url,
        success: true,
        loadedAt: new Date(),
        size: this.preloadedImages.get(url)?.naturalWidth
      };
    }

    // Check if already loading
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!;
    }

    const loadPromise = this.loadImage(url, {
      priority,
      strategy,
      timeout,
      retries,
      onLoad,
      onError,
      onProgress
    });

    this.loadingPromises.set(url, loadPromise);
    
    try {
      const result = await loadPromise;
      return result;
    } finally {
      this.loadingPromises.delete(url);
    }
  }

  /**
   * Preload multiple images
   */
  async preloadImages(urls: string[], options: PreloadOptions = {}): Promise<PreloadResult[]> {
    const { priority = 'auto' } = options;
    
    // Sort by priority if specified
    let sortedUrls = urls;
    if (priority === 'high') {
      sortedUrls = [...urls];
    } else if (priority === 'low') {
      sortedUrls = [...urls].reverse();
    }

    // Load images with concurrency control
    const concurrency = priority === 'high' ? 3 : 1;
    const results: PreloadResult[] = [];
    
    for (let i = 0; i < sortedUrls.length; i += concurrency) {
      const batch = sortedUrls.slice(i, i + concurrency);
      const batchPromises = batch.map(url => this.preloadImage(url, options));
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            url: batch[index],
            success: false,
            error: result.reason
          });
        }
      });
    }

    return results;
  }

  /**
   * Preload critical images for above-the-fold content
   */
  async preloadCriticalImages(urls: string[]): Promise<PreloadResult[]> {
    // Use link preload for critical images
    urls.forEach(url => this.createPreloadLink(url));
    
    // Also preload normally for fallback
    return this.preloadImages(urls, { priority: 'high', strategy: 'preload' });
  }

  /**
   * Create a link preload element for critical images
   */
  private createPreloadLink(url: string): void {
    // Remove existing preload link if it exists
    this.removePreloadLink(url);

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    link.crossOrigin = 'anonymous';
    
    document.head.appendChild(link);
    this.linkElements.add(link);
  }

  /**
   * Remove a preload link element
   */
  private removePreloadLink(url: string): void {
    this.linkElements.forEach(link => {
      if (link.href === url) {
        link.remove();
        this.linkElements.delete(link);
      }
    });
  }

  /**
   * Load a single image with retry logic
   */
  private async loadImage(
    url: string, 
    options: PreloadOptions
  ): Promise<PreloadResult> {
    const { timeout, retries = 2, onLoad, onError, onProgress } = options;
    
    let lastError: Error;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await this.loadImageWithTimeout(url, timeout, onProgress);
        
        // Store the preloaded image
        this.preloadedImages.set(url, result.image);
        
        // Call onLoad callback
        onLoad?.(url);
        
        return {
          url,
          success: true,
          loadedAt: new Date(),
          size: result.image.naturalWidth
        };
        
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < retries) {
          // Wait before retry with exponential backoff
          await this.delay(Math.pow(2, attempt) * 1000);
          continue;
        }
      }
    }

    // All retries failed
    const result: PreloadResult = {
      url,
      success: false,
      error: lastError!
    };

    onError?.(url, lastError!);
    return result;
  }

  /**
   * Load image with timeout and progress tracking
   */
  private loadImageWithTimeout(
    url: string, 
    timeout: number = 10000,
    onProgress?: (url: string, progress: number) => void
  ): Promise<{ image: HTMLImageElement }> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      let timeoutId: NodeJS.Timeout;
      
      const cleanup = () => {
        clearTimeout(timeoutId);
        image.onload = null;
        image.onerror = null;
      };

      // Set timeout
      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error(`Image load timeout: ${url}`));
      }, timeout);

      // Track progress for large images
      if (onProgress) {
        // Simulate progress for images (since we can't track actual bytes)
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += Math.random() * 20;
          if (progress >= 100) {
            progress = 100;
            clearInterval(progressInterval);
          }
          onProgress(url, Math.min(progress, 100));
        }, 100);
      }

      image.onload = () => {
        cleanup();
        resolve({ image });
      };

      image.onerror = () => {
        cleanup();
        reject(new Error(`Failed to load image: ${url}`));
      };

      image.crossOrigin = 'anonymous';
      image.src = url;
    });
  }

  /**
   * Setup intersection observer for lazy loading
   */
  private setupIntersectionObserver(): void {
    if (typeof IntersectionObserver === 'undefined') return;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const url = img.dataset.src || img.src;
            
            if (url && !this.preloadedImages.has(url)) {
              this.preloadImage(url, { strategy: 'lazy' });
            }
            
            this.observer?.unobserve(img);
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.1
      }
    );
  }

  /**
   * Observe an image for lazy loading
   */
  observeImage(img: HTMLImageElement): void {
    if (this.observer && img.dataset.src) {
      this.observer.observe(img);
    }
  }

  /**
   * Get preloaded image element
   */
  getPreloadedImage(url: string): HTMLImageElement | undefined {
    return this.preloadedImages.get(url);
  }

  /**
   * Check if image is preloaded
   */
  isPreloaded(url: string): boolean {
    return this.preloadedImages.has(url);
  }

  /**
   * Check if image is currently loading
   */
  isLoading(url: string): boolean {
    return this.loadingPromises.has(url);
  }

  /**
   * Clear preloaded images to free memory
   */
  clearPreloadedImages(urls?: string[]): void {
    if (urls) {
      urls.forEach(url => {
        this.preloadedImages.delete(url);
        this.removePreloadLink(url);
      });
    } else {
      this.preloadedImages.clear();
      this.linkElements.forEach(link => link.remove());
      this.linkElements.clear();
    }
  }

  /**
   * Get memory usage statistics
   */
  getMemoryStats(): { 
    preloadedCount: number; 
    loadingCount: number; 
    linkCount: number 
  } {
    return {
      preloadedCount: this.preloadedImages.size,
      loadingCount: this.loadingPromises.size,
      linkCount: this.linkElements.size
    };
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.clearPreloadedImages();
    this.observer?.disconnect();
    this.observer = null;
  }
}

// Create singleton instance
export const imagePreloader = new ImagePreloader();

// Export utility functions
export const preloadImage = (url: string, options?: PreloadOptions) => 
  imagePreloader.preloadImage(url, options);

export const preloadImages = (urls: string[], options?: PreloadOptions) => 
  imagePreloader.preloadImages(urls, options);

export const preloadCriticalImages = (urls: string[]) => 
  imagePreloader.preloadCriticalImages(urls);

export const getPreloadedImage = (url: string) => 
  imagePreloader.getPreloadedImage(url);

export const isPreloaded = (url: string) => 
  imagePreloader.isPreloaded(url);

export const isLoading = (url: string) => 
  imagePreloader.isLoading(url);

export const clearPreloadedImages = (urls?: string[]) => 
  imagePreloader.clearPreloadedImages(urls);

export const getMemoryStats = () => 
  imagePreloader.getMemoryStats();

export const destroyPreloader = () => 
  imagePreloader.destroy();

export default imagePreloader; 