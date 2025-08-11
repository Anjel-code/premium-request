/*
 * IMAGE OPTIMIZATION EXAMPLE COMPONENT
 * 
 * This component demonstrates how to use the image optimization and preloading utilities
 * for better performance and user experience.
 */

import { useState, useEffect } from 'react';
import { useImageOptimization } from '../../hooks/useImageOptimization';
import { getMediaAsset, getCriticalImages } from '../../lib/mediaAssets';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

export default function ImageOptimizationExample() {
  const [selectedAssetId, setSelectedAssetId] = useState('home-hero-background');
  const [preloadProgress, setPreloadProgress] = useState<Record<string, number>>({});
  
  const {
    optimizeImage,
    optimizeMediaAsset,
    preloadImage,
    preloadCriticalImages,
    isPreloaded,
    isLoading,
    getMemoryStats,
    performanceStats
  } = useImageOptimization({
    preload: true,
    preloadPriority: 'high',
    optimize: true,
    quality: 85,
    format: 'webp',
    responsive: true
  });

  // Get the selected media asset
  const selectedAsset = getMediaAsset(selectedAssetId);
  
  // Get critical images for preloading
  const criticalImages = getCriticalImages();
  
  // Optimize the selected asset
  const optimizedAsset = selectedAsset ? optimizeMediaAsset(selectedAsset) : null;
  
  // Optimize critical images
  const optimizedCriticalImages = criticalImages.map(asset => optimizeMediaAsset(asset));

  // Handle preloading with progress tracking
  const handlePreloadWithProgress = async (url: string) => {
    try {
      await preloadImage(url, {
        onProgress: (progressUrl, progress) => {
          setPreloadProgress(prev => ({ ...prev, [progressUrl]: progress }));
        },
        onLoad: (loadedUrl) => {
          console.log(`Image loaded: ${loadedUrl}`);
          setPreloadProgress(prev => ({ ...prev, [loadedUrl]: 100 }));
        },
        onError: (errorUrl, error) => {
          console.error(`Failed to load image: ${errorUrl}`, error);
          setPreloadProgress(prev => ({ ...prev, [errorUrl]: 0 }));
        }
      });
    } catch (error) {
      console.error('Preload failed:', error);
    }
  };

  // Preload all critical images
  const handlePreloadCritical = async () => {
    try {
      const results = await preloadCriticalImages(
        criticalImages.map(asset => asset.uploadLink)
      );
      
      console.log('Critical images preload results:', results);
      
      // Update progress for all critical images
      const progressUpdates: Record<string, number> = {};
      results.forEach(result => {
        progressUpdates[result.url] = result.success ? 100 : 0;
      });
      setPreloadProgress(prev => ({ ...prev, ...progressUpdates }));
      
    } catch (error) {
      console.error('Critical images preload failed:', error);
    }
  };

  // Clear preloaded images
  const handleClearPreloaded = () => {
    // This would clear all preloaded images
    // For demo purposes, we'll just reset progress
    setPreloadProgress({});
  };

  // Get memory statistics
  const memoryStats = getMemoryStats();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Image Optimization Example</h1>
        <p className="text-muted-foreground">
          Demonstrating image optimization, preloading, and performance tracking
        </p>
      </div>

      {/* Performance Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Statistics</CardTitle>
          <CardDescription>Real-time performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {performanceStats.totalImages}
              </div>
              <div className="text-sm text-muted-foreground">Total Images</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {performanceStats.preloadedCount}
              </div>
              <div className="text-sm text-muted-foreground">Preloaded</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {performanceStats.loadingCount}
              </div>
              <div className="text-sm text-muted-foreground">Loading</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {performanceStats.errorCount}
              </div>
              <div className="text-sm text-muted-foreground">Errors</div>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="text-center">
            <div className="text-lg font-semibold">
              Average Load Time: {performanceStats.averageLoadTime.toFixed(2)}ms
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Memory Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Memory Statistics</CardTitle>
          <CardDescription>Current memory usage and cache status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {memoryStats.preloadedCount}
              </div>
              <div className="text-sm text-muted-foreground">Preloaded</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {memoryStats.loadingCount}
              </div>
              <div className="text-sm text-muted-foreground">Loading</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {memoryStats.linkCount}
              </div>
              <div className="text-sm text-muted-foreground">Preload Links</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Asset Selection and Optimization */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Optimization</CardTitle>
          <CardDescription>Select and optimize media assets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Select Media Asset
              </label>
              <select
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="home-hero-background">Home Hero Background</option>
                <option value="product-main-image">Product Main Image</option>
                <option value="product-gallery-1">Product Gallery 1</option>
                <option value="earth-texture">Earth Texture</option>
              </select>
            </div>

            {optimizedAsset && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Status:</span>
                  <Badge variant={isPreloaded(optimizedAsset.url) ? "default" : "secondary"}>
                    {isPreloaded(optimizedAsset.url) ? "Preloaded" : "Not Preloaded"}
                  </Badge>
                  {isLoading(optimizedAsset.url) && (
                    <Badge variant="outline">Loading...</Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Original URL</h4>
                    <div className="text-sm text-muted-foreground break-all">
                      {optimizedAsset.url}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Optimized URL</h4>
                    <div className="text-sm text-muted-foreground break-all">
                      {optimizedAsset.optimizedUrl}
                    </div>
                  </div>
                </div>

                {optimizedAsset.responsiveUrls && (
                  <div>
                    <h4 className="font-medium mb-2">Responsive URLs</h4>
                    <div className="space-y-2">
                      {Object.entries(optimizedAsset.responsiveUrls).map(([size, url]) => (
                        <div key={size} className="flex justify-between items-center">
                          <span className="text-sm font-medium capitalize">{size}:</span>
                          <span className="text-xs text-muted-foreground truncate max-w-48">
                            {url}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => optimizedAsset.preload()}
                    disabled={isLoading(optimizedAsset.url)}
                  >
                    {isLoading(optimizedAsset.url) ? "Loading..." : "Preload Image"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => optimizedAsset.clear()}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Critical Images Preloading */}
      <Card>
        <CardHeader>
          <CardTitle>Critical Images Preloading</CardTitle>
          <CardDescription>Preload high-priority images for better performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={handlePreloadCritical}>
                Preload All Critical Images
              </Button>
              <Button variant="outline" onClick={handleClearPreloaded}>
                Clear All
              </Button>
            </div>

            <div className="space-y-3">
              {optimizedCriticalImages.map((optimizedAsset) => (
                <div key={optimizedAsset.url} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">
                      {criticalImages.find(a => a.uploadLink === optimizedAsset.url)?.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant={isPreloaded(optimizedAsset.url) ? "default" : "secondary"}>
                        {isPreloaded(optimizedAsset.url) ? "Preloaded" : "Not Preloaded"}
                      </Badge>
                      {isLoading(optimizedAsset.url) && (
                        <Badge variant="outline">Loading</Badge>
                      )}
                    </div>
                  </div>
                  
                  <Progress 
                    value={preloadProgress[optimizedAsset.url] || 0} 
                    className="h-2"
                  />
                  
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      onClick={() => handlePreloadWithProgress(optimizedAsset.url)}
                      disabled={isLoading(optimizedAsset.url)}
                    >
                      Preload
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => optimizedAsset.clear()}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Instructions</CardTitle>
          <CardDescription>How to use the image optimization utilities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <h4 className="font-medium">1. Basic Image Optimization</h4>
              <code className="block bg-muted p-2 rounded mt-1">
                {`const { optimizeImage } = useImageOptimization();
const optimized = optimizeImage(url, { quality: 85, format: 'webp' });`}
              </code>
            </div>
            
            <div>
              <h4 className="font-medium">2. Media Asset Optimization</h4>
              <code className="block bg-muted p-2 rounded mt-1">
                {`const { optimizeMediaAsset } = useImageOptimization();
const optimized = optimizeMediaAsset(mediaAsset, { responsive: true });`}
              </code>
            </div>
            
            <div>
              <h4 className="font-medium">3. Image Preloading</h4>
              <code className="block bg-muted p-2 rounded mt-1">
                {`const { preloadImage } = useImageOptimization();
await preloadImage(url, { priority: 'high' });`}
              </code>
            </div>
            
            <div>
              <h4 className="font-medium">4. Critical Images Preloading</h4>
              <code className="block bg-muted p-2 rounded mt-1">
                {`const { preloadCriticalImages } = useImageOptimization();
await preloadCriticalImages(criticalImageUrls);`}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 