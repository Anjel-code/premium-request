# Media Assets Management System

This system provides a centralized way to manage all media assets (images, videos, documents) used across your website. It includes security features, easy content updates, and React components for seamless integration.

## 🚀 Quick Start

### 1. Update Your Upload Service Domain

First, update the trusted domains in `src/lib/mediaConfig.ts`:

```typescript
TRUSTED_DOMAINS: [
  'your-actual-upload-service.com', // Replace this
  'cdn.yourdomain.com',
  // ... other domains
]
```

### 2. Add Your Media Assets

Edit `src/lib/mediaAssets.ts` and add your files:

```typescript
{
  id: 'my-product-image',
  name: 'My Product Image',
  description: 'Product image used in the store page',
  category: 'image',
  uploadLink: 'https://your-upload-service.com/my-image.jpg',
  altText: 'Description of the image for accessibility',
  dimensions: { width: 800, height: 600 },
  lastUpdated: '2024-01-15',
  isActive: true
}
```

### 3. Use in Your Components

```tsx
import { MediaImage } from './components/ui/MediaImage';

// Simple usage
<MediaImage assetId="my-product-image" className="w-full h-auto" />

// With fallback and error handling
<MediaImage 
  assetId="my-product-image" 
  className="w-full h-auto"
  fallbackUrl="/fallback-image.jpg"
  onError={(error) => console.error('Image failed to load:', error)}
/>
```

## 📁 File Structure

```
src/
├── lib/
│   ├── mediaAssets.ts          # Main assets database
│   └── mediaConfig.ts          # Configuration and security settings
├── hooks/
│   └── useMediaAssets.tsx      # React hooks for media assets
└── components/ui/
    └── MediaImage.tsx          # Reusable image components
```

## 🔧 How to Update Content

### Quick Content Update

When you upload a new image to your upload service, simply update the `uploadLink` in `mediaAssets.ts`:

```typescript
// Before
uploadLink: 'https://your-upload-service.com/old-image.jpg'

// After
uploadLink: 'https://your-upload-service.com/new-image.jpg'
```

### Add New Files

```typescript
// Add this to the mediaAssets array
{
  id: 'new-hero-image',
  name: 'New Hero Background',
  description: 'Updated hero section background',
  category: 'image',
  uploadLink: 'https://your-upload-service.com/new-hero.jpg',
  altText: 'New hero background image',
  dimensions: { width: 1920, height: 1080 },
  lastUpdated: '2024-01-15',
  isActive: true
}
```

### Remove Files

```typescript
// Soft delete (recommended)
removeMediaAsset('old-image-id');

// Or manually set isActive to false
{
  id: 'old-image',
  // ... other properties
  isActive: false
}
```

## 🛡️ Security Features

### Domain Validation
- Only allows files from trusted domains
- Prevents malicious file injection
- Configurable trusted domain list

### File Type Validation
- Restricts file types to safe formats
- Prevents executable file uploads
- Configurable allowed extensions

### File Size Limits
- Configurable size limits per file type
- Prevents oversized file attacks
- Automatic validation

### Content Security Policy
- Built-in CSP headers
- Prevents XSS attacks
- Configurable security policies

## 🎯 Available Components

### MediaImage
Basic image component with automatic asset loading:

```tsx
<MediaImage 
  assetId="product-image" 
  className="w-full h-auto"
  loading="lazy"
  priority={false}
/>
```

### OptimizedMediaImage
Image component with optimization features:

```tsx
<OptimizedMediaImage 
  assetId="product-image"
  quality={90}
  format="webp"
  width={800}
  height={600}
/>
```

### MediaBackground
Background image component:

```tsx
<MediaBackground 
  assetId="hero-background"
  className="min-h-screen"
  overlay={true}
  overlayOpacity={0.4}
>
  <h1>Your Content Here</h1>
</MediaBackground>
```

## 🪝 Available Hooks

### useMediaAsset
Hook for single media asset:

```tsx
const { asset, isLoading, error, url, altText } = useMediaAsset('product-image');

if (isLoading) return <div>Loading...</div>;
if (error) return <div>Error: {error.message}</div>;

return <img src={url} alt={altText} />;
```

### useMediaAssets
Hook for multiple media assets:

```tsx
const { assets, isLoading, error } = useMediaAssets('image', 'product');

if (isLoading) return <div>Loading...</div>;

return (
  <div>
    {assets.map(asset => (
      <img key={asset.id} src={asset.uploadLink} alt={asset.altText} />
    ))}
  </div>
);
```

### useMediaAssetsPaginated
Hook with pagination:

```tsx
const { 
  assets, 
  currentPage, 
  totalPages, 
  nextPage, 
  prevPage 
} = useMediaAssetsPaginated('image', 12, 'product');

return (
  <div>
    {assets.map(asset => (
      <img key={asset.id} src={asset.uploadLink} alt={asset.altText} />
    ))}
    
    <div>
      <button onClick={prevPage} disabled={currentPage === 1}>Previous</button>
      <span>{currentPage} of {totalPages}</span>
      <button onClick={nextPage} disabled={currentPage === totalPages}>Next</button>
    </div>
  </div>
);
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in your project root:

```env
# Media Assets Configuration
REACT_APP_MEDIA_TRUSTED_DOMAINS=your-domain.com,cdn.yourdomain.com
REACT_APP_MEDIA_MAX_FILE_SIZE=10485760
REACT_APP_MEDIA_ENABLE_OPTIMIZATION=true
```

### Custom Configuration

Edit `src/lib/mediaConfig.ts` to customize:

- Trusted domains
- File size limits
- Allowed file types
- Caching settings
- Performance options
- Security policies

## 🔄 Migration from Hardcoded URLs

### Before (Hardcoded)
```tsx
<img src="/images/product.jpg" alt="Product" />
```

### After (Media Assets System)
```tsx
<MediaImage assetId="product-image" className="w-full h-auto" />
```

### Update Your Existing Components

1. Replace hardcoded image paths with `MediaImage` components
2. Add your images to the `mediaAssets` array
3. Use the `assetId` to reference your images

## 🚨 Troubleshooting

### Common Issues

**Image not loading:**
- Check if the `assetId` exists in `mediaAssets`
- Verify the `uploadLink` is correct and accessible
- Check browser console for errors

**Security validation failing:**
- Ensure the domain is in `TRUSTED_DOMAINS`
- Check if the file extension is allowed
- Verify the file size is within limits

**Performance issues:**
- Use `priority={true}` for critical images
- Implement lazy loading for non-critical images
- Consider using `OptimizedMediaImage` for large images

### Debug Mode

Enable debug logging in development:

```typescript
// In mediaConfig.ts
ERROR_HANDLING: {
  logErrors: process.env.NODE_ENV === 'development'
}
```

## 📚 Examples

### Product Gallery
```tsx
const ProductGallery = () => {
  const { assets, isLoading } = useMediaAssets('image', 'product');
  
  if (isLoading) return <div>Loading gallery...</div>;
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {assets.map(asset => (
        <MediaImage 
          key={asset.id}
          assetId={asset.id}
          className="w-full h-64 object-cover rounded-lg"
        />
      ))}
    </div>
  );
};
```

### Hero Section with Background
```tsx
const HeroSection = () => {
  return (
    <MediaBackground 
      assetId="hero-background"
      className="min-h-screen flex items-center justify-center"
      overlay={true}
      overlayOpacity={0.5}
    >
      <div className="text-center text-white">
        <h1 className="text-6xl font-bold">Welcome</h1>
        <p className="text-xl">Your premium concierge service</p>
      </div>
    </MediaBackground>
  );
};
```

## 🆘 Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify your media assets are properly configured
3. Ensure your upload service URLs are accessible
4. Check the security configuration matches your setup

## 🔮 Future Enhancements

- Image optimization service integration
- Automatic image resizing
- CDN integration
- Advanced caching strategies
- Analytics and performance monitoring
- Bulk import/export functionality

---

**Remember:** Always update the `lastUpdated` field when modifying assets, and test your changes in development before deploying to production. 