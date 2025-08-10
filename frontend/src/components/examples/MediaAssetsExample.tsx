import * as React from 'react';
import { MediaImage, MediaBackground, OptimizedMediaImage } from '../ui/MediaImage';
import { useMediaAssets, useMediaAssetsPaginated } from '../../hooks/useMediaAssets';

/**
 * Example component demonstrating the Media Assets system
 * This shows various ways to use the system in your components
 */
export const MediaAssetsExample: React.FC = () => {
  // Example: Get all product images
  const { assets: productImages, isLoading: imagesLoading } = useMediaAssets('image', 'product');
  
  // Example: Get paginated assets
  const { 
    assets: paginatedAssets, 
    currentPage, 
    totalPages, 
    nextPage, 
    prevPage 
  } = useMediaAssetsPaginated('image', 6);

  return (
    <div className="space-y-8 p-6">
      <h1 className="text-3xl font-bold text-center">Media Assets System Demo</h1>
      
      {/* Example 1: Simple MediaImage usage */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">1. Basic Image Usage</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Product Main Image</h3>
            <MediaImage 
              assetId="product-main-image" 
              className="w-full h-64 object-cover rounded-lg border"
              fallbackUrl="placeholder-image"
            />
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Store Hero Background</h3>
            <MediaImage 
              assetId="store-hero-image" 
              className="w-full h-64 object-cover rounded-lg border"
            />
          </div>
        </div>
      </section>

      {/* Example 2: Optimized Image with custom settings */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">2. Optimized Image</h2>
        <div className="flex justify-center">
          <OptimizedMediaImage 
            assetId="product-main-image"
            quality={90}
            format="webp"
            width={400}
            height={400}
            className="rounded-lg border shadow-lg"
          />
        </div>
      </section>

      {/* Example 3: Background Image with overlay */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">3. Background Image with Overlay</h2>
        <MediaBackground 
          assetId="home-hero-background"
          className="min-h-[400px] rounded-lg flex items-center justify-center"
          overlay={true}
          overlayOpacity={0.6}
        >
          <div className="text-center text-white z-10">
            <h3 className="text-4xl font-bold mb-2">Hero Section</h3>
            <p className="text-xl">This text is overlaid on the background image</p>
          </div>
        </MediaBackground>
      </section>

      {/* Example 4: Product Gallery using useMediaAssets */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">4. Product Gallery (Dynamic)</h2>
        {imagesLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2">Loading product images...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {productImages.map(asset => (
              <div key={asset.id} className="space-y-2">
                <MediaImage 
                  assetId={asset.id}
                  className="w-full h-32 object-cover rounded-lg border"
                />
                <p className="text-sm font-medium text-center">{asset.name}</p>
                <p className="text-xs text-muted-foreground text-center">
                  {asset.dimensions?.width} × {asset.dimensions?.height}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Example 5: Paginated Gallery */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">5. Paginated Gallery</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {paginatedAssets.map(asset => (
            <div key={asset.id} className="space-y-2">
              <MediaImage 
                assetId={asset.id}
                className="w-full h-24 object-cover rounded-lg border"
              />
              <p className="text-xs text-center truncate">{asset.name}</p>
            </div>
          ))}
        </div>
        
        {/* Pagination Controls */}
        <div className="flex items-center justify-center space-x-4">
          <button 
            onClick={prevPage}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-primary text-primary-foreground rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          
          <button 
            onClick={nextPage}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-primary text-primary-foreground rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </section>

      {/* Example 6: Error Handling */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">6. Error Handling</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Non-existent Asset (Shows Error)</h3>
            <MediaImage 
              assetId="non-existent-asset" 
              className="w-full h-32 object-cover rounded-lg border"
              errorFallback={<div className="text-red-500 text-center p-4">Custom Error Message</div>}
            />
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">With Fallback URL</h3>
            <MediaImage 
              assetId="non-existent-asset" 
              className="w-full h-32 object-cover rounded-lg border"
              fallbackUrl="placeholder-image"
            />
          </div>
        </div>
      </section>

      {/* Example 7: Loading States */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">7. Loading States</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="text-lg font-medium mb-2">With Custom Placeholder</h3>
            <MediaImage 
              assetId="product-main-image" 
              className="w-full h-32 object-cover rounded-lg border"
              placeholder={
                <div className="w-full h-32 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                  <span className="text-primary font-medium">Loading...</span>
                </div>
              }
            />
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Default Loading Skeleton</h3>
            <MediaImage 
              assetId="product-gallery-1" 
              className="w-full h-32 object-cover rounded-lg border"
            />
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Priority Loading</h3>
            <MediaImage 
              assetId="favicon" 
              className="w-16 h-16 object-cover rounded-lg border"
              priority={true}
            />
          </div>
        </div>
      </section>

      {/* Example 8: Video Assets */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">8. Video Assets</h2>
        <div className="flex justify-center">
          <div className="w-full max-w-2xl">
            <h3 className="text-lg font-medium mb-2">Product Showcase Video</h3>
            <video 
              className="w-full h-auto rounded-lg border"
              controls
              preload="metadata"
            >
              <source src="/path-to-your-video.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Note: Video assets are managed in the same system but require HTML video tags
            </p>
          </div>
        </div>
      </section>

      {/* Usage Instructions */}
      <section className="bg-muted p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">How to Use This System</h2>
        <div className="space-y-2 text-sm">
          <p><strong>1.</strong> Add your media assets to <code>src/lib/mediaAssets.ts</code></p>
          <p><strong>2.</strong> Update the <code>uploadLink</code> when you upload new files</p>
          <p><strong>3.</strong> Use <code>MediaImage</code> components with <code>assetId</code> props</p>
          <p><strong>4.</strong> The system automatically handles loading, errors, and fallbacks</p>
          <p><strong>5.</strong> Check the README for advanced features and configuration</p>
        </div>
      </section>
    </div>
  );
};

export default MediaAssetsExample; 