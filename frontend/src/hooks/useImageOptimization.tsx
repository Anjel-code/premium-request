/*
 * USE IMAGE OPTIMIZATION HOOK
 * 
 * This hook provides a clean interface for using image optimization features
 * including preloading, responsive images, and performance tracking.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  preloadImage, 
  preloadImages, 
  preloadCriticalImages,
  isPreloaded, 
  isLoading,
  getPreloadedImage,
  clearPreloadedImages,
  getMemoryStats,
  type PreloadOptions,
  type PreloadResult
} from '../lib/imagePreloader';
import { 
  generateOptimizedImageUrl, 
  generateResponsiveImageUrls,
  type MediaAsset 
} from '../lib/mediaAssets';

export interface UseImageOptimizationOptions {
  // Preloading options
  preload?: boolean;
  preloadPriority?: 'high' | 'low' | 'auto';
  preloadStrategy?: 'preload' | 'lazy' | 'eager';
  
  // Optimization options
  optimize?: boolean;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  fit?: 'cover' | 'contain' | 'fill';
  
  // Responsive options
  responsive?: boolean;
  sizes?: string;
  
  // Performance options
  lazyLoad?: boolean;
  threshold?: number;
  rootMargin?: string;
  
  // Callbacks
  onLoad?: (url: string) => void;
  onError?: (url: string, error: Error) => void;
  onProgress?: (url: string, progress: number) => void;
}

export interface OptimizedImage {
  url: string;
  optimizedUrl: string;
  responsiveUrls?: {
    thumbnail: string;
    small: string;
    medium: string;
    large: string;
    original: string;
  };
  isPreloaded: boolean;
  isLoading: boolean;
  preload: () => Promise<PreloadResult>;
  clear: () => void;
}

export interface UseImageOptimizationReturn {
  // Image optimization functions
  optimizeImage: (url: string, options?: Partial<UseImageOptimizationOptions>) => OptimizedImage;
  optimizeImages: (urls: string[], options?: Partial<UseImageOptimizationOptions>) => OptimizedImage[];
  
  // Media asset optimization
  optimizeMediaAsset: (asset: MediaAsset, options?: Partial<UseImageOptimizationOptions>) => OptimizedImage;
  optimizeMediaAssets: (assets: MediaAsset[], options?: Partial<UseImageOptimizationOptions>) => OptimizedImage[];
  
  // Preloading functions
  preloadImage: (url: string, options?: PreloadOptions) => Promise<PreloadResult>;
  preloadImages: (urls: string[], options?: PreloadOptions) => Promise<PreloadResult[]>;
  preloadCriticalImages: (urls: string[]) => Promise<PreloadResult[]>;
  
  // Status and management
  isPreloaded: (url: string) => boolean;
  isLoading: (url: string) => boolean;
  getPreloadedImage: (url: string) => HTMLImageElement | undefined;
  clearPreloadedImages: (urls?: string[]) => void;
  getMemoryStats: () => ReturnType<typeof getMemoryStats>;
  
  // Batch operations
  preloadBatch: (urls: string[], options?: PreloadOptions) => Promise<PreloadResult[]>;
  optimizeBatch: (urls: string[], options?: Partial<UseImageOptimizationOptions>) => OptimizedImage[];
  
  // Performance tracking
  performanceStats: {
    totalImages: number;
    preloadedCount: number;
    loadingCount: number;
    errorCount: number;
    averageLoadTime: number;
  };
}

export function useImageOptimization(options: UseImageOptimizationOptions = {}): UseImageOptimizationReturn {
  const [performanceStats, setPerformanceStats] = useState({
    totalImages: 0,
    preloadedCount: 0,
    loadingCount: 0,
    errorCount: 0,
    averageLoadTime: 0
  });

  const loadTimes = useRef<Map<string, number>>(new Map());
  const startTimes = useRef<Map<string, number>>(new Map());
  const errorCount = useRef(0);

  // Update performance stats
  const updateStats = useCallback(() => {
    const stats = getMemoryStats();
    const totalLoadTime = Array.from(loadTimes.current.values()).reduce((sum, time) => sum + time, 0);
    const avgLoadTime = loadTimes.current.size > 0 ? totalLoadTime / loadTimes.current.size : 0;

    setPerformanceStats({
      totalImages: stats.preloadedCount + stats.loadingCount,
      preloadedCount: stats.preloadedCount,
      loadingCount: stats.loadingCount,
      errorCount: errorCount.current,
      averageLoadTime: avgLoadTime
    });
  }, []);

  // Enhanced preload function with performance tracking
  const trackedPreloadImage = useCallback(async (url: string, preloadOptions?: PreloadOptions) => {
    const startTime = performance.now();
    startTimes.current.set(url, startTime);

    try {
      const result = await preloadImage(url, {
        ...preloadOptions,
        onLoad: (loadedUrl) => {
          const endTime = performance.now();
          const loadTime = endTime - startTime;
          loadTimes.current.set(loadedUrl, loadTime);
          
          preloadOptions?.onLoad?.(loadedUrl);
          updateStats();
        },
        onError: (errorUrl, error) => {
          errorCount.current++;
          preloadOptions?.onError?.(errorUrl, error);
          updateStats();
        },
        onProgress: preloadOptions?.onProgress
      });

      return result;
    } catch (error) {
      errorCount.current++;
      updateStats();
      throw error;
    }
  }, [updateStats]);

  // Enhanced preload images function
  const trackedPreloadImages = useCallback(async (urls: string[], preloadOptions?: PreloadOptions) => {
    const results = await Promise.allSettled(
      urls.map(url => trackedPreloadImage(url, preloadOptions))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          url: urls[index],
          success: false,
          error: result.reason
        };
      }
    });
  }, [trackedPreloadImage]);

  // Optimize a single image
  const optimizeImage = useCallback((url: string, imageOptions?: Partial<UseImageOptimizationOptions>): OptimizedImage => {
    const mergedOptions = { ...options, ...imageOptions };
    const { optimize = true, responsive = true, preload = false } = mergedOptions;

    // Generate optimized URL
    const optimizedUrl = optimize 
      ? generateOptimizedImageUrl(url, {
          quality: mergedOptions.quality,
          format: mergedOptions.format,
          fit: mergedOptions.fit
        })
      : url;

    // Generate responsive URLs if requested
    const responsiveUrls = responsive ? generateResponsiveImageUrls(url) : undefined;

    // Create optimized image object
    const optimizedImage: OptimizedImage = {
      url,
      optimizedUrl,
      responsiveUrls,
      isPreloaded: isPreloaded(url),
      isLoading: isLoading(url),
      preload: () => trackedPreloadImage(url, {
        priority: mergedOptions.preloadPriority,
        strategy: mergedOptions.preloadStrategy
      }),
      clear: () => clearPreloadedImages([url])
    };

    // Auto-preload if enabled
    if (preload && !isPreloaded(url) && !isLoading(url)) {
      optimizedImage.preload();
    }

    return optimizedImage;
  }, [options, trackedPreloadImage]);

  // Optimize multiple images
  const optimizeImages = useCallback((urls: string[], imageOptions?: Partial<UseImageOptimizationOptions>): OptimizedImage[] => {
    return urls.map(url => optimizeImage(url, imageOptions));
  }, [optimizeImage]);

  // Optimize media asset
  const optimizeMediaAsset = useCallback((asset: MediaAsset, assetOptions?: Partial<UseImageOptimizationOptions>): OptimizedImage => {
    const mergedOptions = { ...options, ...assetOptions };
    
    // Use asset dimensions for responsive images if available
    const responsiveUrls = mergedOptions.responsive && asset.dimensions
      ? generateResponsiveImageUrls(asset.uploadLink, asset.dimensions)
      : undefined;

    const optimizedImage: OptimizedImage = {
      url: asset.uploadLink,
      optimizedUrl: mergedOptions.optimize 
        ? generateOptimizedImageUrl(asset.uploadLink, {
            quality: mergedOptions.quality,
            format: mergedOptions.format,
            fit: mergedOptions.fit
          })
        : asset.uploadLink,
      responsiveUrls,
      isPreloaded: isPreloaded(asset.uploadLink),
      isLoading: isLoading(asset.uploadLink),
      preload: () => trackedPreloadImage(asset.uploadLink, {
        priority: asset.priority || mergedOptions.preloadPriority,
        strategy: mergedOptions.preloadStrategy
      }),
      clear: () => clearPreloadedImages([asset.uploadLink])
    };

    // Auto-preload high priority assets
    if (asset.priority === 'high' && !isPreloaded(asset.uploadLink) && !isLoading(asset.uploadLink)) {
      optimizedImage.preload();
    }

    return optimizedImage;
  }, [options, trackedPreloadImage]);

  // Optimize multiple media assets
  const optimizeMediaAssets = useCallback((assets: MediaAsset[], assetOptions?: Partial<UseImageOptimizationOptions>): OptimizedImage[] => {
    return assets.map(asset => optimizeMediaAsset(asset, assetOptions));
  }, [optimizeMediaAsset]);

  // Batch operations
  const preloadBatch = useCallback(async (urls: string[], batchOptions?: PreloadOptions) => {
    return trackedPreloadImages(urls, batchOptions);
  }, [trackedPreloadImages]);

  const optimizeBatch = useCallback((urls: string[], batchOptions?: Partial<UseImageOptimizationOptions>): OptimizedImage[] => {
    return optimizeImages(urls, batchOptions);
  }, [optimizeImages]);

  // Enhanced critical images preloading
  const trackedPreloadCriticalImages = useCallback(async (urls: string[]) => {
    return preloadCriticalImages(urls);
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    clearPreloadedImages();
    loadTimes.current.clear();
    startTimes.current.clear();
    errorCount.current = 0;
    updateStats();
  }, [updateStats]);

  // Update stats when component mounts/unmounts
  useEffect(() => {
    updateStats();
    
    // Set up periodic stats updates
    const interval = setInterval(updateStats, 5000);
    
    return () => {
      clearInterval(interval);
      cleanup();
    };
  }, [updateStats, cleanup]);

  return {
    // Image optimization functions
    optimizeImage,
    optimizeImages,
    
    // Media asset optimization
    optimizeMediaAsset,
    optimizeMediaAssets,
    
    // Preloading functions
    preloadImage: trackedPreloadImage,
    preloadImages: trackedPreloadImages,
    preloadCriticalImages: trackedPreloadCriticalImages,
    
    // Status and management
    isPreloaded,
    isLoading,
    getPreloadedImage,
    clearPreloadedImages,
    getMemoryStats,
    
    // Batch operations
    preloadBatch,
    optimizeBatch,
    
    // Performance tracking
    performanceStats
  };
}

// Export default hook
export default useImageOptimization; 