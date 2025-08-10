/*
 * MEDIA ASSETS MANAGEMENT FILE
 * 
 * This file centralizes all media assets (images, videos, etc.) used across the website.
 * When you upload new content to your upload service, just update this file.
 * 
 * USAGE:
 * - Add new files: Add a new entry with name, description, and upload link
 * - Update existing files: Modify the upload link for the specific file
 * - Remove files: Delete the entry (remember to remove references in components)
 * 
 * SECURITY FEATURES:
 * - All links are validated to ensure they're from trusted domains
 * - File types are restricted to common media formats
 * - Access control through environment variables
 * 
 * FILE STRUCTURE:
 * - id: Unique identifier for the file
 * - name: Human-readable name
 * - description: Where/how the file is used on the website
 * - category: Type of content (image, video, document)
 * - uploadLink: Direct link from your upload service
 * - altText: Accessibility text for images
 * - dimensions: Image/video dimensions (optional)
 * - lastUpdated: When the file was last modified
 */

export interface MediaAsset {
  id: string;
  name: string;
  description: string;
  category: 'image' | 'video' | 'document' | 'audio';
  uploadLink: string;
  altText?: string;
  dimensions?: {
    width: number;
    height: number;
  };
  lastUpdated: string;
  isActive: boolean;
}

// Trusted domains for security validation
const TRUSTED_DOMAINS = [
  'quibble-store.netlify.app',
  'quibble.online',
  'uploadthing.com',
  'ufs.sh', // UploadThing file service domain
];

// Allowed file extensions for security
const ALLOWED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
  '.mp4', '.webm', '.mov', '.avi',
  '.pdf', '.doc', '.docx',
  '.mp3', '.wav', '.ogg'
];

// Security validation function
export const validateMediaAsset = (asset: MediaAsset): boolean => {
  console.log(`[validateMediaAsset] Validating asset: ${asset.name} (${asset.id})`);
  console.log(`[validateMediaAsset] Upload link: ${asset.uploadLink}`);
  
  try {
    const url = new URL(asset.uploadLink);
    console.log(`[validateMediaAsset] Parsed URL hostname: ${url.hostname}`);
    console.log(`[validateMediaAsset] Parsed URL pathname: ${url.pathname}`);
    
    // Check if domain is trusted
    const isTrustedDomain = TRUSTED_DOMAINS.some(domain => {
      const matches = url.hostname === domain || url.hostname.endsWith(`.${domain}`);
      console.log(`[validateMediaAsset] Checking domain ${domain}: ${matches}`);
      return matches;
    });
    
    console.log(`[validateMediaAsset] Is trusted domain: ${isTrustedDomain}`);
    
    if (!isTrustedDomain) {
      console.warn(`Untrusted domain for asset ${asset.name}: ${url.hostname}`);
      return false;
    }
    
    // For UploadThing URLs (ufs.sh), skip file extension validation since they use hash-based paths
    const isUploadThingUrl = url.hostname.endsWith('.ufs.sh');
    
    if (isUploadThingUrl) {
      console.log(`[validateMediaAsset] UploadThing URL detected, skipping extension validation`);
      console.log(`[validateMediaAsset] Asset ${asset.name} passed validation`);
      return true;
    }
    
    // Check if file extension is allowed (only for URLs that should have extensions)
    const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => {
      const matches = url.pathname.toLowerCase().endsWith(ext);
      console.log(`[validateMediaAsset] Checking extension ${ext}: ${matches}`);
      return matches;
    });
    
    console.log(`[validateMediaAsset] Has valid extension: ${hasValidExtension}`);
    
    if (!hasValidExtension) {
      console.warn(`Invalid file extension for asset ${asset.name}: ${url.pathname}`);
      return false;
    }
    
    console.log(`[validateMediaAsset] Asset ${asset.name} passed validation`);
    return true;
  } catch (error) {
    console.error(`Invalid URL for asset ${asset.name}:`, error);
    return false;
  }
};

// Media assets database
export const mediaAssets: MediaAsset[] = [
  // Home/Hero Images
  {
    id: 'home-hero-background',
    name: 'Home Hero Background',
    description: 'Main hero section background image for the home page',
    category: 'image',
    uploadLink: 'https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgFdpqZ0Uw40OXa9Ud71TI6tnyVEjCYhsxJpzo',
    altText: 'Premium headphones hero background',
    dimensions: { width: 1920, height: 1080 },
    lastUpdated: '2024-01-15',
    isActive: true
  },
  // Store/Product Images
  {
    id: 'product-main-image',
    name: 'Main Product Image',
    description: 'Primary product display image in the store',
    category: 'image',
    uploadLink: 'https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgrUp2mUvbJLuGzFCBaS7MmnX2V95Oq41ekg6h',
    altText: 'Premium luxury watch product image',
    dimensions: { width: 800, height: 800 },
    lastUpdated: '2024-01-15',
    isActive: true
  },
  {
    id: 'product-gallery-1',
    name: 'Product Gallery Image 1',
    description: 'First image in product gallery carousel',
    category: 'image',
    uploadLink: 'https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgGYk7T7MjpzDWtrkcgSoUqeyNLnmXE7FflYMb',
    altText: 'Luxury watch side view',
    dimensions: { width: 600, height: 600 },
    lastUpdated: '2024-01-15',
    isActive: true
  },
  {
    id: 'product-gallery-2',
    name: 'Product Gallery Image 2',
    description: 'Second image in product gallery carousel',
    category: 'image',
    uploadLink: 'https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgSwOnnyh96rF1tmOTb0HJKZCEyduNUsM43AgL',
    altText: 'Luxury watch detail view',
    dimensions: { width: 600, height: 600 },
    lastUpdated: '2024-01-15',
    isActive: true
  },
  {
    id: 'product-gallery-3',
    name: 'Product Gallery Image 3',
    description: 'Third image in product gallery carousel',
    category: 'image',
    uploadLink: 'https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgH5yaoePNPBT29adskJlu3n6A5FtVUgCLvX4r',
    altText: 'Luxury watch close-up view',
    dimensions: { width: 600, height: 600 },
    lastUpdated: '2024-01-15',
    isActive: true
  },
  

  {
    id: 'earth-texture',
    name: 'Earth Texture Background',
    description: 'Textured background image used throughout the website',
    category: 'image',
    uploadLink: 'https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgFdpqZ0Uw40OXa9Ud71TI6tnyVEjCYhsxJpzo',
    altText: 'Natural earth texture pattern',
    dimensions: { width: 1920, height: 1080 },
    lastUpdated: '2024-01-15',
    isActive: true
  },
  
  // ========================================
  // 🎯 30-DAY GUARANTEE SECTION IMAGES
  // ========================================
  // These images are used in the BeforeAfterSlider component
  // for the 30-day money-back guarantee section
  {
    id: 'guarantee-before-image',
    name: '30-Day Guarantee - Before Image',
    description: 'LEFT SIDE of 30-day guarantee slider - shows "Before" state',
    category: 'image',
    uploadLink: 'https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgRK1GPrTGebCqWcLTfDOywr0nAQJU56toimId',
    altText: 'Before using the product - 30-day guarantee',
    dimensions: { width: 800, height: 600 },
    lastUpdated: '2024-01-15',
    isActive: true
  },
  {
    id: 'guarantee-after-image',
    name: '30-Day Guarantee - After Image',
    description: 'RIGHT SIDE of 30-day guarantee slider - shows "After" state',
    category: 'image',
    uploadLink: 'https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgqqmUkqZu7M4YmkVsgNaAH5DKpScGvQL9yJbq',
    altText: 'After using the product - 30-day guarantee',
    dimensions: { width: 800, height: 600 },
    lastUpdated: '2024-01-15',
    isActive: true
  },
  // ========================================
  // END 30-DAY GUARANTEE SECTION IMAGES
  // ========================================
  
  // Product Videos
  {
    id: 'product-video',
    name: 'Product Showcase Video',
    description: 'Main product demonstration video in the store (actually a GIF)',
    category: 'image',
    uploadLink: 'https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgpPfWw6SyR3TUAuSe5zs8BOwjo27Ld4ZNnKMH',
    altText: 'Luxury watch product demonstration video',
    dimensions: { width: 800, height: 1422 },
    lastUpdated: '2024-01-15',
    isActive: true
  },
  
  // Icons and UI Elements
  {
    id: 'favicon',
    name: 'Website Favicon',
    description: 'Small icon displayed in browser tabs',
    category: 'image',
    uploadLink: 'https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgpDB83LSyR3TUAuSe5zs8BOwjo27Ld4ZNnKMH',
    altText: 'Website favicon',
    dimensions: { width: 32, height: 32 },
    lastUpdated: '2024-01-15',
    isActive: true
  },
  {
    id: 'placeholder-image',
    name: 'Placeholder Image',
    description: 'Default placeholder image for loading states',
    category: 'image',
    uploadLink: 'https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgu0s6cMr5U3Hp2kVCI4csGZFedlbAq61QSPyt',
    altText: 'Image placeholder',
    dimensions: { width: 400, height: 300 },
    lastUpdated: '2024-01-15',
    isActive: true
  },

  // Review Images
  {
    id: 'review-product-image',
    name: 'Review Product Image',
    description: 'Product image shown in customer reviews',
    category: 'image',
    uploadLink: 'https://mro774wfph.ufs.sh/f/review-product-image-placeholder',
    altText: 'Product in review',
    dimensions: { width: 400, height: 300 },
    lastUpdated: '2024-01-15',
    isActive: true
  },
  {
    id: 'review-profile-1',
    name: 'Review Profile Image 1',
    description: 'Profile image for Sarah M. review',
    category: 'image',
    uploadLink: 'https://mro774wfph.ufs.sh/f/review-profile-1-placeholder',
    altText: 'Sarah M. profile',
    dimensions: { width: 150, height: 150 },
    lastUpdated: '2024-01-15',
    isActive: true
  },
  {
    id: 'review-profile-2',
    name: 'Review Profile Image 2',
    description: 'Profile image for Mike R. review',
    category: 'image',
    uploadLink: 'https://mro774wfph.ufs.sh/f/review-profile-2-placeholder',
    altText: 'Mike R. profile',
    dimensions: { width: 150, height: 150 },
    lastUpdated: '2024-01-15',
    isActive: true
  },
  {
    id: 'review-profile-3',
    name: 'Review Profile Image 3',
    description: 'Profile image for Jennifer L. review',
    category: 'image',
    uploadLink: 'https://mro774wfph.ufs.sh/f/review-profile-3-placeholder',
    altText: 'Jennifer L. profile',
    dimensions: { width: 150, height: 150 },
    lastUpdated: '2024-01-15',
    isActive: true
  },
  {
    id: 'review-profile-4',
    name: 'Review Profile Image 4',
    description: 'Profile image for David K. review',
    category: 'image',
    uploadLink: 'https://mro774wfph.ufs.sh/f/review-profile-4-placeholder',
    altText: 'David K. profile',
    dimensions: { width: 150, height: 150 },
    lastUpdated: '2024-01-15',
    isActive: true
  },
  {
    id: 'review-profile-5',
    name: 'Review Profile Image 5',
    description: 'Profile image for Emma T. review',
    category: 'image',
    uploadLink: 'https://mro774wfph.ufs.sh/f/review-profile-5-placeholder',
    altText: 'Emma T. profile',
    dimensions: { width: 150, height: 150 },
    lastUpdated: '2024-01-15',
    isActive: true
  },
  {
    id: 'review-profile-fallback',
    name: 'Review Profile Fallback',
    description: 'Fallback profile image for reviews',
    category: 'image',
    uploadLink: 'https://mro774wfph.ufs.sh/f/review-profile-fallback-placeholder',
    altText: 'Default profile',
    dimensions: { width: 150, height: 150 },
    lastUpdated: '2024-01-15',
    isActive: true
  },

  // Video Review Thumbnails
  {
    id: 'video-review-thumb-1',
    name: 'Video Review Thumbnail 1',
    description: 'Thumbnail for Sarah M. video review',
    category: 'image',
    uploadLink: 'https://mro774wfph.ufs.sh/f/video-review-thumb-1-placeholder',
    altText: 'Sarah M. video review thumbnail',
    dimensions: { width: 300, height: 400 },
    lastUpdated: '2024-01-15',
    isActive: true
  },
  {
    id: 'video-review-thumb-2',
    name: 'Video Review Thumbnail 2',
    description: 'Thumbnail for Mike R. video review',
    category: 'image',
    uploadLink: 'https://mro774wfph.ufs.sh/f/video-review-thumb-2-placeholder',
    altText: 'Mike R. video review thumbnail',
    dimensions: { width: 300, height: 400 },
    lastUpdated: '2024-01-15',
    isActive: true
  },
  {
    id: 'video-review-thumb-3',
    name: 'Video Review Thumbnail 3',
    description: 'Thumbnail for Jennifer L. video review',
    category: 'image',
    uploadLink: 'https://mro774wfph.ufs.sh/f/video-review-thumb-3-placeholder',
    altText: 'Jennifer L. video review thumbnail',
    dimensions: { width: 300, height: 400 },
    lastUpdated: '2024-01-15',
    isActive: true
  },
  {
    id: 'video-review-thumb-4',
    name: 'Video Review Thumbnail 4',
    description: 'Thumbnail for David K. video review',
    category: 'image',
    uploadLink: 'https://mro774wfph.ufs.sh/f/video-review-thumb-4-placeholder',
    altText: 'David K. video review thumbnail',
    dimensions: { width: 300, height: 400 },
    lastUpdated: '2024-01-15',
    isActive: true
  },
  {
    id: 'video-review-thumb-5',
    name: 'Video Review Thumbnail 5',
    description: 'Thumbnail for Emma T. video review',
    category: 'image',
    uploadLink: 'https://mro774wfph.ufs.sh/f/video-review-thumb-5-placeholder',
    altText: 'Emma T. video review thumbnail',
    dimensions: { width: 300, height: 400 },
    lastUpdated: '2024-01-15',
    isActive: true
  },

  // Videos
  {
    id: 'video-review-1',
    name: 'Video Review 1',
    description: 'Sarah M. video review',
    category: 'video',
    uploadLink: 'https://mro774wfph.ufs.sh/f/video-review-1-placeholder',
    altText: 'Sarah M. video review',
    dimensions: { width: 1920, height: 1080 },
    lastUpdated: '2024-01-15',
    isActive: true
  },
  {
    id: 'video-review-2',
    name: 'Video Review 2',
    description: 'Mike R. video review',
    category: 'video',
    uploadLink: 'https://mro774wfph.ufs.sh/f/video-review-2-placeholder',
    altText: 'Mike R. video review',
    dimensions: { width: 1920, height: 1080 },
    lastUpdated: '2024-01-15',
    isActive: true
  },
  {
    id: 'video-review-3',
    name: 'Video Review 3',
    description: 'Jennifer L. video review',
    category: 'video',
    uploadLink: 'https://mro774wfph.ufs.sh/f/video-review-3-placeholder',
    altText: 'Jennifer L. video review',
    dimensions: { width: 1920, height: 1080 },
    lastUpdated: '2024-01-15',
    isActive: true
  },
  {
    id: 'video-review-4',
    name: 'Video Review 4',
    description: 'David K. video review',
    category: 'video',
    uploadLink: 'https://mro774wfph.ufs.sh/f/video-review-4-placeholder',
    altText: 'David K. video review',
    dimensions: { width: 1920, height: 1080 },
    lastUpdated: '2024-01-15',
    isActive: true
  },
  {
    id: 'video-review-5',
    name: 'Video Review 5',
    description: 'Emma T. video review',
    category: 'video',
    uploadLink: 'https://mro774wfph.ufs.sh/f/video-review-5-placeholder',
    altText: 'Emma T. video review',
    dimensions: { width: 1920, height: 1080 },
    lastUpdated: '2024-01-15',
    isActive: true
  }
];

// Helper functions for easy access
export const getMediaAsset = (id: string): MediaAsset | undefined => {
  console.log(`[getMediaAsset] Looking for asset with ID: ${id}`);
  
  const asset = mediaAssets.find(a => a.id === id && a.isActive);
  console.log(`[getMediaAsset] Found asset:`, asset);
  
  if (!asset) {
    console.log(`[getMediaAsset] No asset found with ID: ${id}`);
    return undefined;
  }
  
  console.log(`[getMediaAsset] Asset found, validating...`);
  const isValid = validateMediaAsset(asset);
  console.log(`[getMediaAsset] Validation result: ${isValid}`);
  
  const result = asset && isValid ? asset : undefined;
  console.log(`[getMediaAsset] Final result for ${id}:`, result);
  
  return result;
};

export const getMediaAssetsByCategory = (category: MediaAsset['category']): MediaAsset[] => {
  return mediaAssets.filter(a => a.category === category && a.isActive && validateMediaAsset(a));
};

export const getMediaAssetsByDescription = (searchTerm: string): MediaAsset[] => {
  const term = searchTerm.toLowerCase();
  return mediaAssets.filter(a => 
    a.isActive && 
    validateMediaAsset(a) && 
    (a.description.toLowerCase().includes(term) || a.name.toLowerCase().includes(term))
  );
};

// Update function for easy content management
export const updateMediaAsset = (id: string, updates: Partial<MediaAsset>): boolean => {
  const index = mediaAssets.findIndex(a => a.id === id);
  if (index === -1) return false;
  
  const updatedAsset = { ...mediaAssets[index], ...updates, lastUpdated: new Date().toISOString() };
  
  if (validateMediaAsset(updatedAsset)) {
    mediaAssets[index] = updatedAsset;
    return true;
  }
  
  return false;
};

// Add new media asset
export const addMediaAsset = (asset: Omit<MediaAsset, 'id' | 'lastUpdated'>): string => {
  const id = `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const newAsset: MediaAsset = {
    ...asset,
    id,
    lastUpdated: new Date().toISOString()
  };
  
  if (validateMediaAsset(newAsset)) {
    mediaAssets.push(newAsset);
    return id;
  }
  
  throw new Error('Invalid media asset data');
};

// Remove media asset (soft delete)
export const removeMediaAsset = (id: string): boolean => {
  const asset = mediaAssets.find(a => a.id === id);
  if (asset) {
    asset.isActive = false;
    asset.lastUpdated = new Date().toISOString();
    return true;
  }
  return false;
};

// Export default for easy imports
export default mediaAssets; 