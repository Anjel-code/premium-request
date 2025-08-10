/*
 * MEDIA ASSETS CONFIGURATION
 * 
 * This file contains configuration settings for the media assets system.
 * Update these values based on your environment and requirements.
 */

export const MEDIA_CONFIG = {
  // Trusted domains for security validation
  TRUSTED_DOMAINS: [
    // Replace with your actual upload service domains
    'your-upload-service.com',
    'cdn.yourdomain.com',
    'images.yourdomain.com',
    
    // Common trusted CDNs (add/remove as needed)
    'images.unsplash.com',
    'via.placeholder.com',
    'picsum.photos',
    
    // Development/testing domains
    'localhost',
    '127.0.0.1'
  ],

  // Allowed file extensions for security
  ALLOWED_EXTENSIONS: {
    images: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico'],
    videos: ['.mp4', '.webm', '.mov', '.avi', '.mkv'],
    documents: ['.pdf', '.doc', '.docx', '.txt'],
    audio: ['.mp3', '.wav', '.ogg', '.aac']
  },

  // File size limits (in bytes)
  MAX_FILE_SIZES: {
    images: 10 * 1024 * 1024, // 10MB
    videos: 100 * 1024 * 1024, // 100MB
    documents: 25 * 1024 * 1024, // 25MB
    audio: 50 * 1024 * 1024 // 50MB
  },

  // Image optimization settings
  IMAGE_OPTIMIZATION: {
    defaultQuality: 80,
    defaultFormat: 'webp' as const,
    supportedFormats: ['webp', 'jpeg', 'png'] as const,
    maxWidth: 1920,
    maxHeight: 1080,
    thumbnailSizes: [
      { name: 'xs', width: 150, height: 150 },
      { name: 'sm', width: 300, height: 300 },
      { name: 'md', width: 600, height: 600 },
      { name: 'lg', width: 1200, height: 1200 },
      { name: 'xl', width: 1920, height: 1080 }
    ]
  },

  // Caching settings
  CACHE: {
    // Browser cache duration (in seconds)
    browserCache: 60 * 60 * 24 * 7, // 7 days
    
    // CDN cache duration (in seconds)
    cdnCache: 60 * 60 * 24 * 30, // 30 days
    
    // Local storage cache duration (in seconds)
    localCache: 60 * 60 * 24 // 1 day
  },

  // Error handling
  ERROR_HANDLING: {
    // Show errors in console
    logErrors: process.env.NODE_ENV === 'development',
    
    // Fallback image for broken images
    fallbackImage: '/placeholder.svg',
    
    // Retry attempts for failed loads
    maxRetries: 3,
    
    // Retry delay (in milliseconds)
    retryDelay: 1000
  },

  // Performance settings
  PERFORMANCE: {
    // Lazy loading threshold (in pixels)
    lazyLoadThreshold: 100,
    
    // Preload critical images
    preloadCritical: true,
    
    // Critical image IDs (load immediately)
    criticalImages: [
      'home-hero-background',
      'product-main-image',
      'favicon'
    ],
    
    // Progressive loading
    progressiveLoading: true
  },

  // Security settings
  SECURITY: {
    // Validate URLs
    validateUrls: true,
    
    // Check file types
    validateFileTypes: true,
    
    // Check file sizes
    validateFileSizes: true,
    
    // Content Security Policy
    csp: {
      'img-src': ["'self'", 'data:', 'https:'],
      'media-src': ["'self'", 'https:'],
      'object-src': ["'none'"]
    }
  }
};

// Environment-specific overrides
export const getMediaConfig = () => {
  const config = { ...MEDIA_CONFIG };
  
  if (process.env.NODE_ENV === 'development') {
    // Development overrides
    config.ERROR_HANDLING.logErrors = true;
    config.SECURITY.validateUrls = false; // Allow localhost in development
  }
  
  if (process.env.NODE_ENV === 'production') {
    // Production overrides
    config.ERROR_HANDLING.logErrors = false;
    config.PERFORMANCE.preloadCritical = true;
  }
  
  return config;
};

// Helper function to check if a domain is trusted
export const isTrustedDomain = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return MEDIA_CONFIG.TRUSTED_DOMAINS.some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
};

// Helper function to check if a file type is allowed
export const isAllowedFileType = (url: string, category: keyof typeof MEDIA_CONFIG.ALLOWED_EXTENSIONS): boolean => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    return MEDIA_CONFIG.ALLOWED_EXTENSIONS[category].some(ext => 
      pathname.endsWith(ext)
    );
  } catch {
    return false;
  }
};

// Helper function to get file size from URL (if available)
export const getFileSize = async (url: string): Promise<number | null> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentLength = response.headers.get('content-length');
    return contentLength ? parseInt(contentLength, 10) : null;
  } catch {
    return null;
  }
};

// Helper function to validate file size
export const isValidFileSize = (size: number, category: keyof typeof MEDIA_CONFIG.MAX_FILE_SIZES): boolean => {
  return size <= MEDIA_CONFIG.MAX_FILE_SIZES[category];
};

export default MEDIA_CONFIG; 