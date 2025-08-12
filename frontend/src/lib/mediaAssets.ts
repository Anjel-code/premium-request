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
 * OPTIMIZATION FEATURES:
 * - Progressive image loading with blur-up effect
 * - Responsive image sizes for different devices
 * - WebP format support for modern browsers
 * - Lazy loading with intersection observer
 * - Image preloading for critical content
 * - Caching strategies for better performance
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
 * - isActive: Whether the asset is currently active
 * - priority: Loading priority (high, medium, low)
 * - responsiveSizes: Available responsive image sizes
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
  priority?: 'high' | 'medium' | 'low';
  responsiveSizes?: {
    thumbnail: string;
    small: string;
    medium: string;
    large: string;
    original: string;
  };
  // Text content associated with this media asset
  textContent?: {
    title?: string;
    subtitle?: string;
    description?: string;
    testimonial?: string;
    customerName?: string;
    name?: string;
    comment?: string;
    date?: string;
    rating?: number;
    verified?: boolean;
    ctaText?: string;
    benefits?: string[];
    features?: string[];
    loadMoreButton?: string;
    loadMoreRemaining?: string;
    productImage?: string;
    profileImage?: string;
    storeName?: string;
    brandName?: string;
    specifications?: Record<string, string>;
    faqs?: Array<{
      question: string;
      answer: string;
    }>;
    shippingInfo?: string;
    guarantee?: string;
    returnPolicy?: string;
    navigation?: {
      home: string;
      store: string;
      about: string;
      contact: string;
      dashboard: string;
    };
    phrases?: string[];
    verifiedReviews?: string;
    verifiedPurchase?: string;
    selectModel?: string;
    securePayment?: string;
    freeShipping?: string;
    thirtyDayReturns?: string;
    saveText?: string;
    offText?: string;
    extraOffText?: string;
    rankText?: string;
    remainingText?: string;
    headerText?: string;
    benefitsIcons?: string[];
  };
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

// Image optimization configuration
export const IMAGE_OPTIMIZATION_CONFIG = {
  // Quality settings for different use cases
  qualities: {
    thumbnail: 60,
    small: 70,
    medium: 80,
    large: 85,
    original: 90
  },
  
  // Format preferences (in order of preference)
  formats: ['webp', 'jpeg', 'png'],
  
  // Responsive breakpoints
  breakpoints: {
    mobile: 480,
    tablet: 768,
    desktop: 1024,
    large: 1440
  },
  
  // Thumbnail dimensions
  thumbnailSizes: {
    xs: { width: 150, height: 150 },
    sm: { width: 300, height: 300 },
    md: { width: 600, height: 600 },
    lg: { width: 1200, height: 1200 }
  }
};

// Generate optimized image URLs for UploadThing
export const generateOptimizedImageUrl = (
  originalUrl: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
    fit?: 'cover' | 'contain' | 'fill';
  } = {}
): string => {
  // Handle invalid or empty URLs
  if (!originalUrl || originalUrl.trim() === '') {
    return 'https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgu0s6cMr5U3Hp2kVCI4csGZFedlbAq61QSPyt';
  }
  
  // Handle relative paths that aren't valid URLs
  if (originalUrl.startsWith('/') && !originalUrl.startsWith('//')) {
    return 'https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgu0s6cMr5U3Hp2kVCI4csGZFedlbAq61QSPyt';
  }
  
  // Handle placeholder strings that aren't valid URLs
  if (originalUrl === 'placeholder-image' || originalUrl === 'placeholder.svg') {
    return 'https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgu0s6cMr5U3Hp2kVCI4csGZFedlbAq61QSPyt';
  }
  
  try {
    const url = new URL(originalUrl);
    
    // Check if this is an UploadThing URL
    if (url.hostname.endsWith('.ufs.sh')) {
      // UploadThing supports query parameters for optimization
      const params = new URLSearchParams();
      
      if (options.width) params.append('w', options.width.toString());
      if (options.height) params.append('h', options.height.toString());
      if (options.quality) params.append('q', options.quality.toString());
      if (options.format) params.append('f', options.format);
      if (options.fit) params.append('fit', options.fit);
      
      // Add optimization parameters
      params.append('optimize', 'true');
      params.append('auto', 'format');
      
      const queryString = params.toString();
      return queryString ? `${originalUrl}?${queryString}` : originalUrl;
    }
    
    // For non-UploadThing URLs, return original
    return originalUrl;
  } catch (error) {
    // Return the fallback URL for any URL parsing errors
    return 'https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgu0s6cMr5U3Hp2kVCI4csGZFedlbAq61QSPyt';
  }
};

// Generate responsive image URLs
export const generateResponsiveImageUrls = (originalUrl: string, dimensions?: { width: number; height: number }) => {
  // Handle invalid or empty URLs
  if (!originalUrl || originalUrl.trim() === '') {
    const fallbackUrl = 'https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgu0s6cMr5U3Hp2kVCI4csGZFedlbAq61QSPyt';
    return {
      thumbnail: fallbackUrl,
      small: fallbackUrl,
      medium: fallbackUrl,
      large: fallbackUrl,
      original: fallbackUrl
    };
  }
  
  if (!dimensions) {
    return {
      thumbnail: originalUrl,
      small: originalUrl,
      medium: originalUrl,
      large: originalUrl,
      original: originalUrl
    };
  }
  
  const { width, height } = dimensions;
  const aspectRatio = width / height;
  
  return {
    thumbnail: generateOptimizedImageUrl(originalUrl, {
      width: Math.min(300, width),
      height: Math.min(300, height),
      quality: IMAGE_OPTIMIZATION_CONFIG.qualities.thumbnail,
      format: 'webp'
    }),
    small: generateOptimizedImageUrl(originalUrl, {
      width: Math.min(600, width),
      height: Math.min(600, height),
      quality: IMAGE_OPTIMIZATION_CONFIG.qualities.small,
      format: 'webp'
    }),
    medium: generateOptimizedImageUrl(originalUrl, {
      width: Math.min(1200, width),
      height: Math.min(1200, height),
      quality: IMAGE_OPTIMIZATION_CONFIG.qualities.medium,
      format: 'webp'
    }),
    large: generateOptimizedImageUrl(originalUrl, {
      width: Math.min(1920, width),
      height: Math.min(1920, height),
      quality: IMAGE_OPTIMIZATION_CONFIG.qualities.large,
      format: 'webp'
    }),
    original: generateOptimizedImageUrl(originalUrl, {
      quality: IMAGE_OPTIMIZATION_CONFIG.qualities.original,
      format: 'webp'
    })
  };
};

// Security validation function
export const validateMediaAsset = (asset: MediaAsset): boolean => {
  try {
    const url = new URL(asset.uploadLink);
    
    // Check if domain is trusted
    const isTrustedDomain = TRUSTED_DOMAINS.some(domain => {
      return url.hostname === domain || url.hostname.endsWith(`.${domain}`);
    });
    
    if (!isTrustedDomain) {
      return false;
    }
    
    // For UploadThing URLs (ufs.sh), skip file extension validation since they use hash-based paths
    const isUploadThingUrl = url.hostname.endsWith('.ufs.sh');
    
    if (isUploadThingUrl) {
      return true;
    }
    
    // Check if file extension is allowed (only for URLs that should have extensions)
    const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => {
      return url.pathname.toLowerCase().endsWith(ext);
    });
    
    if (!hasValidExtension) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

// Media assets database
export const mediaAssets: MediaAsset[] = [
  // ========================================
  // 🏠 HOME PAGE & HERO SECTION IMAGES
  // ========================================
  // These images are used on the main home page for hero sections and key visuals
  {
    id: 'home-hero-background',
    name: 'Home Hero Background',
    description: 'Main hero section background image for the home page - large banner behind the main headline',
    category: 'image',
    uploadLink: 'https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgFdpqZ0Uw40OXa9Ud71TI6tnyVEjCYhsxJpzo',
    altText: 'Premium headphones hero background',
    dimensions: { width: 1920, height: 1080 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'high'
  },
  // ========================================
  // END HOME PAGE & HERO SECTION IMAGES
  // ========================================
  
  // ========================================
  // 🛍️ STORE & PRODUCT GALLERY IMAGES
  // ========================================
  // These images are used in the product store page for showcasing products
  {
    id: 'product-main-image',
    name: 'Main Product Image',
    description: 'Primary product display image in the store - main product photo',
    category: 'image',
    uploadLink: 'https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgrUp2mUvbJLuGzFCBaS7MmnX2V95Oq41ekg6h',
    altText: 'Premium luxury watch product image',
    dimensions: { width: 800, height: 800 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'high',
    textContent: {
      title: "The RICEGGO 'Azure' Arabic Dial Watch",
      subtitle: "Experience Luxury Like Never Before",
      description: "A masterpiece of design, where classic style meets unique heritage",
      benefits: [
        "Premium Arabic Dial Design",
        "Stainless Steel Construction", 
        "Quartz Movement Precision",
        "Elegant Bracelet Style"
      ]
    }
  },
  {
    id: 'product-gallery-1',
    name: 'Product Gallery Image 1',
    description: 'First image in product gallery carousel - side view of product',
    category: 'image',
    uploadLink: 'https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgGYk7T7MjpzDWtrkcgSoUqeyNLnmXE7FflYMb',
    altText: 'Luxury watch side view',
    dimensions: { width: 600, height: 600 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'medium'
  },
  {
    id: 'product-gallery-2',
    name: 'Product Gallery Image 2',
    description: 'Second image in product gallery carousel - detail view of product',
    category: 'image',
    uploadLink: 'https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgSwOnnyh96rF1tmOTb0HJKZCEyduNUsM43AgL',
    altText: 'Luxury watch detail view',
    dimensions: { width: 600, height: 600 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'medium'
  },
  {
    id: 'product-gallery-3',
    name: 'Product Gallery Image 3',
    description: 'Third image in product gallery carousel - close-up view of product',
    category: 'image',
    uploadLink: 'https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgH5yaoePNPBT29adskJlu3n6A5FtVUgCLvX4r',
    altText: 'Luxury watch close-up view',
    dimensions: { width: 600, height: 600 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'medium'
  },
  // ========================================
  // END STORE & PRODUCT GALLERY IMAGES
  // ========================================
  
  // ========================================
  // 🎨 BACKGROUND & TEXTURE IMAGES
  // ========================================
  // These images are used throughout the website as backgrounds and textures
  {
    id: 'earth-texture',
    name: 'Earth Texture Background',
    description: 'Textured background image used throughout the website - natural earth pattern',
    category: 'image',
    uploadLink: 'https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgu0s6cMr5U3Hp2kVCI4csGZFedlbAq61QSPyt',
    altText: 'Natural earth texture pattern',
    dimensions: { width: 1920, height: 1080 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'medium'
  },
  // ========================================
  // END BACKGROUND & TEXTURE IMAGES
  // ========================================
  
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
    isActive: true,
    priority: 'medium',
    textContent: {
      title: "Before",
      description: "Experience the transformation",
      ctaText: "See the difference"
    }
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
    isActive: true,
    priority: 'medium',
    textContent: {
      title: "After",
      description: "The amazing results",
      ctaText: "Get yours today"
    }
  },
  // ========================================
  // END 30-DAY GUARANTEE SECTION IMAGES
  // ========================================
  
  // ========================================
  // 🎬 PRODUCT DEMONSTRATION VIDEOS
  // ========================================
  // These videos are used in various sections to showcase product functionality
  {
    id: 'bundle-demonstration-video',
    name: 'Bundle Product Demonstration Video',
    description: 'Main video for "WITH THE BUNDLE" section - shows how the watch bundle transforms your style',
    category: 'video',
    uploadLink: 'https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgXsVp0dxjTa3UiRg5JFzwpI79lWnLoKcSGmfC',
    altText: 'Product demonstration showing watch bundle style transformation',
    dimensions: { width: 1920, height: 1080 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'high',
    textContent: {
      title: "WITH THE BUNDLE",
      subtitle: "The Watch That Demands a Second Look",
      description: "Stand out from the crowd with the [Brand Name] Aurora, a watch that blends classic design with modern flair. The mesmerizing, iridescent dial shifts its color with the light, creating a dynamic and eye-catching effect. Paired with a comfortable, jubilee-style bracelet, this watch is as striking as it is comfortable to wear.",
      benefits: [
        "Dynamic Dial",
        "Iconic Look", 
        "Comfortable Fit",
        "Versatile Style",
        "Gifts",
        "Casual Wear",
        "Watch Collectors",
        "Daily Use"
      ],
      features: [
        "Precision quartz movement for accurate timekeeping",
        "Durable stainless steel case and bracelet",
        "Fluted bezel for a classic, luxurious aesthetic",
        "Unique dial with distinct Arabic numerals",
        "Date display window at the 3 o'clock position",
        "Water-resistant construction for everyday wear"
      ],
      ctaText: "And much more!"
    }
  },
  {
    id: 'feel-the-difference-section',
    name: 'A Statement of Elegance',
    description: 'Text content for the Feel The Difference section - explains product benefits and features',
    category: 'document',
    uploadLink: 'https://mro774wfph.ufs.sh/f/feel-the-difference-placeholder',
    altText: 'Feel The Difference section content',
    dimensions: { width: 800, height: 600 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'medium',
    textContent: {
      title: "A Statement of Elegance",
      description: "Discover how the right timepiece can elevate your entire presence. The RICEGGO 'Azure' combines meticulous engineering with a bold, unique aesthetic. The polished steel case, iconic fluted bezel, and comfortable Jubilee bracelet are designed to make a lasting impression.",
      benefits: [
        "Premium Build",
        "Unique Design",
        "Trusted by Watch Enthusiasts"
      ],
      features: [
        "Whether you are closing a deal in the boardroom, attending a formal event, or simply enjoying a weekend out, this watch is your perfect companion. It speaks of confidence, sophistication, and an appreciation for detail.",
        "Built with premium materials and powered by a reliable quartz movement, it's designed to be both beautiful and dependable. And with our 30‑day money‑back guarantee, trying it on is completely risk‑free."
      ]
    }
  },
  {
    id: 'reviews-section',
    name: 'Reviews Section',
    description: 'Text content for the Customer Reviews section - section header and description',
    category: 'document',
    uploadLink: 'https://mro774wfph.ufs.sh/f/reviews-section-placeholder',
    altText: 'Reviews section content',
    dimensions: { width: 800, height: 600 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'medium',
    textContent: {
      title: "Reviews",
      subtitle: "Customer Reviews Section",
      description: "See what our customers are saying about their new watch",
      loadMoreButton: "Load More Reviews",
      loadMoreRemaining: "remaining"
    }
  },
  {
    id: 'bundle-section-header',
    name: 'Bundle Section Header',
    description: 'Text content for the bundle section header and benefits display',
    category: 'document',
    uploadLink: 'https://mro774wfph.ufs.sh/f/bundle-section-header-placeholder',
    altText: 'Bundle section header content',
    dimensions: { width: 800, height: 600 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'medium',
    textContent: {
      headerText: "Designed to impress:",
      benefitsIcons: ["watch", "sparkles", "gem", "star", "target", "flame", "zap", "trophy", "star"]
    }
  },
  {
    id: 'product-video',
    name: 'Product Showcase Video',
    description: 'Main product demonstration video in the store (actually a GIF)',
    category: 'image',
    uploadLink: 'https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgpPfWw6SyR3TUAuSe5zs8BOwjo27Ld4ZNnKMH',
    altText: 'Luxury watch product demonstration video',
    dimensions: { width: 800, height: 1422 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'medium'
  },
  // ========================================
  // END PRODUCT DEMONSTRATION VIDEOS
  // ========================================
  
  // ========================================
  // 🔧 ICONS & UI ELEMENTS
  // ========================================
  // These are small images used for icons, favicons, and UI elements
  {
    id: 'favicon',
    name: 'Website Favicon',
    description: 'Small icon displayed in browser tabs - website branding',
    category: 'image',
    uploadLink: 'https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgpDB83LSyR3TUAuSe5zs8BOwjo27Ld4ZNnKMH',
    altText: 'Website favicon',
    dimensions: { width: 32, height: 32 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'high'
  },
  // ========================================
  // END ICONS & UI ELEMENTS
  // ========================================
  
  // ========================================
  // 🖼️ PLACEHOLDER & FALLBACK IMAGES
  // ========================================
  // These images are used when other images fail to load or as default placeholders
  {
    id: 'placeholder-image',
    name: 'Placeholder Image',
    description: 'Default placeholder image for loading states and fallback scenarios - used throughout the app',
    category: 'image',
    uploadLink: 'https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgu0s6cMr5U3Hp2kVCI4csGZFedlbAq61QSPyt',
    altText: 'Image placeholder',
    dimensions: { width: 400, height: 300 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'low'
  },
  // ========================================
  // END PLACEHOLDER & FALLBACK IMAGES
  // ========================================
  
  // ========================================
  // 🖼️ REVIEW & TESTIMONIAL IMAGES
  // ========================================
  // These images are used in customer review sections throughout the website
  {
    id: 'review-product-image',
    name: 'Review Product Image',
    description: 'Product image shown in customer reviews - product being reviewed',
    category: 'image',
    uploadLink: 'https://mro774wfph.ufs.sh/f/review-product-image-placeholder',
    altText: 'Product in review',
    dimensions: { width: 400, height: 300 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'low'
  },
  {
    id: 'review-profile-fallback',
    name: 'Review Profile Fallback',
    description: 'Fallback profile image for reviews when customer has no profile photo',
    category: 'image',
    uploadLink: 'https://mro774wfph.ufs.sh/f/review-profile-fallback-placeholder',
    altText: 'Default profile',
    dimensions: { width: 150, height: 150 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'low'
  },
  // ========================================
  // END REVIEW & TESTIMONIAL IMAGES
  // ========================================
  
  // ========================================
  // 👤 REVIEW PROFILE IMAGES
  // ========================================
  // These are profile images for customer reviews in the store page
  {
    id: 'review-profile-1',
    name: 'Review Profile Image 1',
    description: 'Profile image for Sarah M. customer review',
    category: 'image',
    uploadLink: 'https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgkJww7b9BXVHEL8QzmI3k9SJo7ahqUdictDKF',
    altText: 'Sarah M. profile picture',
    dimensions: { width: 100, height: 100 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'low'
  },
  {
    id: 'review-profile-2',
    name: 'Review Profile Image 2',
    description: 'Profile image for Mike R. customer review',
    category: 'image',
    uploadLink: 'https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgNTwB3uaEZ19uoaI0bJTnxYe2wtzvKXgsfhj4',
    altText: 'Mike R. profile picture',
    dimensions: { width: 100, height: 100 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'low'
  },
  {
    id: 'review-profile-3',
    name: 'Review Profile Image 3',
    description: 'Profile image for Jennifer L. customer review',
    category: 'image',
    uploadLink: 'https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgDqxuhJk98uOFclKwJsbixRLVYftA3oUXgdPj',
    altText: 'Jennifer L. profile picture',
    dimensions: { width: 100, height: 100 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'low'
  },
  {
    id: 'review-profile-4',
    name: 'Review Profile Image 4',
    description: 'Profile image for David K. customer review',
    category: 'image',
    uploadLink: 'https://mro774wfph.ufs.sh/f/bwRfX2qUMqkg9bF3OqwtrYXnKUvWeVb24mcpxBdqMNCs0iDg',
    altText: 'David K. profile picture',
    dimensions: { width: 100, height: 100 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'low'
  },
  {
    id: 'review-profile-5',
    name: 'Review Profile Image 5',
    description: 'Profile image for Emma T. customer review',
    category: 'image',
    uploadLink: 'https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgV0emrm34KDdoWtwxNHTBYmMuSlPnGj8Z9csf',
    altText: 'Emma T. profile picture',
    dimensions: { width: 100, height: 100 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'low'
  },
  {
    id: 'review-profile-fallback',
    name: 'Review Profile Fallback',
    description: 'Fallback profile image for customer reviews when specific profile image is not available',
    category: 'image',
    uploadLink: 'https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgkJww7b9BXVHEL8QzmI3k9SJo7ahqUdictDKF',
    altText: 'Default profile picture',
    dimensions: { width: 100, height: 100 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'low'
  },
  // ========================================
  // END REVIEW PROFILE IMAGES
  // ========================================
  
  // ========================================
  // 🎥 VIDEO REVIEW THUMBNAILS
  // ========================================
  // These are thumbnail images for video reviews in the store page
  {
    id: 'video-review-thumb-1',
    name: 'Video Review Thumbnail 1',
    description: 'Thumbnail for Sarah M. video review - preview image for video player',
    category: 'image',
    uploadLink: 'https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgkJww7b9BXVHEL8QzmI3k9SJo7ahqUdictDKF',
    altText: 'Sarah M. video review thumbnail',
    dimensions: { width: 300, height: 400 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'low'
  },
  {
    id: 'video-review-thumb-2',
    name: 'Video Review Thumbnail 2',
    description: 'Thumbnail for Mike R. video review - preview image for video player',
    category: 'image',
    uploadLink: 'https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgNTwB3uaEZ19uoaI0bJTnxYe2wtzvKXgsfhj4',
    altText: 'Mike R. video review thumbnail',
    dimensions: { width: 300, height: 400 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'low'
  },
  {
    id: 'video-review-thumb-3',
    name: 'Video Review Thumbnail 3',
    description: 'Thumbnail for Jennifer L. video review - preview image for video player',
    category: 'image',
    uploadLink: 'https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgDqxuhJk98uOFclKwJsbixRLVYftA3oUXgdPj',
    altText: 'Jennifer L. video review thumbnail',
    dimensions: { width: 300, height: 400 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'low'
  },
  {
    id: 'video-review-thumb-4',
    name: 'Video Review Thumbnail 4',
    description: 'Thumbnail for David K. video review - preview image for video player',
    category: 'image',
    uploadLink: 'https://mro774wfph.ufs.sh/f/bwRfX2qUMqkg9bF3OqwtrYXnKUvWeVb24mcpxBdqMNCs0iDg',
    altText: 'David K. video review thumbnail',
    dimensions: { width: 300, height: 400 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'low'
  },
  {
    id: 'video-review-thumb-5',
    name: 'Video Review Thumbnail 5',
    description: 'Thumbnail for Emma T. video review - preview image for video player',
    category: 'image',
    uploadLink: 'https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgV0emrm34KDdoWtwxNHTBYmMuSlPnGj8Z9csf',
    altText: 'Emma T. video review thumbnail',
    dimensions: { width: 300, height: 400 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'low'
  },
  // ========================================
  // END VIDEO REVIEW THUMBNAILS
  // ========================================
  
  // ========================================
  // 🎬 CUSTOMER VIDEO REVIEWS
  // ========================================
  // These are actual video files of customer reviews used in the store page
  {
    id: 'video-review-1',
    name: 'Video Review 1',
    description: 'Andrew M. video review - full video testimonial from customer',
    category: 'video',
    uploadLink: 'https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgfHNwEuDUJFvZAYCDOQPG4fkKoI6gH1rLXp2e',
    altText: 'Andrew M. video review',
    dimensions: { width: 1920, height: 1080 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'low',
    textContent: {
      testimonial: "This is my new favorite watch. The build quality is solid, the weight is perfect, and the blue dial is beautiful. It keeps perfect time. 10/10.",
      customerName: "Andrew M.",
      date: "1/14/2024",
      rating: 5,
      verified: true
    }
  },
  {
    id: 'video-review-2',
    name: 'Video Review 2',
    description: 'Mike R. video review - full video testimonial from customer',
    category: 'video',
    uploadLink: 'https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgp2r4hGmSyR3TUAuSe5zs8BOwjo27Ld4ZNnKM',
    altText: 'Mike R. video review',
    dimensions: { width: 1920, height: 1080 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'low',
    textContent: {
      testimonial: "I was looking for a unique but classic watch, and this is it. It's very well made. Had to remove a few links from the bracelet for a perfect fit, which was easy to do at a local jeweler.",
      customerName: "Mike R.",
      date: "1/9/2024",
      rating: 5,
      verified: true
    }
  },
  {
    id: 'video-review-3',
    name: 'Video Review 3',
    description: 'Jennifer L. video review - full video testimonial from customer',
    category: 'video',
    uploadLink: 'https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgUPcL6jc0BkEZHINJTsV9z50tapuC4GmQiSoc',
    altText: 'Jennifer L. video review',
    dimensions: { width: 1920, height: 1080 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'low',
    textContent: {
      testimonial: "The perfect gift. I bought this for my Yasmin K.husband and he was blown away. The fluted bezel and the Arabic numerals look incredible in person. Fast shipping, too.",
      customerName: "Yasmin K.",
      date: "1/7/2024",
      rating: 4,
      verified: true
    }
  },
  {
    id: 'video-review-4',
    name: 'Video Review 4',
    description: 'David K. video review - full video testimonial from customer',
    category: 'video',
    uploadLink: 'https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgubO1lRMr5U3Hp2kVCI4csGZFedlbAq61QSPy',
    altText: 'David K. video review',
    dimensions: { width: 1920, height: 1080 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'low',
    textContent: {
      testimonial: "This is my new favorite watch. The build quality is solid, the weight is perfect, and the blue dial is beautiful. It keeps perfect time. 10/10.",
      customerName: "David K.",
      date: "1/5/2024",
      rating: 5,
      verified: true
    }
  },
  {
    id: 'video-review-5',
    name: 'Video Review 5',
    description: 'Samuel T. video review - full video testimonial from customer',
    category: 'video',
    uploadLink: 'https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgHZLvj0PNPBT29adskJlu3n6A5FtVUgCLvX4r',
    altText: 'Emma T. video review',
    dimensions: { width: 1920, height: 1080 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'low',
    textContent: {
      testimonial: "An incredible value. You're getting the look of a multi-thousand dollar watch for a fraction of the price. The quality has genuinely surprised me. Highly recommend.",
      customerName: "Samuel T.",
      date: "1/3/2024",
      rating: 5,
      verified: true
    }
  },
  // ========================================
  // END CUSTOMER VIDEO REVIEWS
  // ========================================
  
  // ========================================
  // 📝 INDIVIDUAL REVIEW CONTENT
  // ========================================
  // These contain the text content for individual customer reviews
  {
    id: 'review-1',
    name: 'Review 1 - Michael V.',
    description: 'Individual review content for Michael V. - 5-star review',
    category: 'document',
    uploadLink: 'https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgWmBX4LIfrhg3ucJpYFZVEmAR9TBn0NvzI8G2',
    altText: 'Michael V. review content',
    dimensions: { width: 0, height: 0 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'low',
    textContent: {
      name: "Michael V.",
      rating: 5,
      comment: "The best men's watch in terms of cost-effectiveness and quality, I highly recommend it for those looking for an accessory with great value for money.",
      date: "2024-01-15",
      verified: true,
      productImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgWmBX4LIfrhg3ucJpYFZVEmAR9TBn0NvzI8G2",
      profileImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgOdmWi9AjGtxSsF04i6TAraH8qcbfnEQW3yKY"
    }
  },
  {
    id: 'review-2',
    name: 'Review 2 - Mike R.',
    description: 'Individual review content for Mike R. - 5-star review',
    category: 'document',
    uploadLink: 'https://example.com/review-2',
    altText: 'Mike R. review content',
    dimensions: { width: 0, height: 0 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'low',
    textContent: {
      name: "Mike R.",
      rating: 5,
      comment: "The product is good quality i liked it It also came with safety enclosure and i appreciated it I really recommend it.",
      
      verified: true,
      productImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgq8XK3rzZu7M4YmkVsgNaAH5DKpScGvQL9yJb",
      profileImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgWsrsGwZIfrhg3ucJpYFZVEmAR9TBn0NvzI8G"
    }
  },
  {
    id: 'review-3',
    name: 'Review 3 - Paul L.',
    description: 'Individual review content for Paul L. - 4-star review',
    category: 'document',
    uploadLink: 'https://example.com/review-3',
    altText: 'Pual L. review content',
    dimensions: { width: 0, height: 0 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'low',
    textContent: {
      name: "Paul L.",
      rating: 4,
      comment: "Good fit, beautiful and elegant, highly recommended, withstands impacts, but if you don't take care of it, the color might fade a bit, but I use it while working for that reason.",
      date: "2024-01-08",
      verified: true,
      productImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgTC2aL8Goibx1mQyha8fW4IRUP6MYKZ7t0n9H",
      profileImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkg1eGYsLVlBEfAQ2r93Vp1NHX4yxbD8UcZnWY5"
    }
  },
  {
    id: 'review-4',
    name: 'Review 4 - Aditya K.',
    description: 'Individual review content for Aditya K. - 5-star review',
    category: 'document',
    uploadLink: 'https://example.com/review-4',
    altText: 'Aditya K. review content',
    dimensions: { width: 0, height: 0 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'low',
    textContent: {
      name: "Aditya K.",
      rating: 5,
      comment: "Absolutely stunning watch. The Arabic dial is a true conversation starter, and I get compliments every time I wear it. It looks and feels so much more expensive than it is!",
      date: "2024-01-05",
      verified: true,
      productImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgbojAeoqUMqkgQy1APTmpx76ciWLDeI0ZhCdw",
      profileImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkg6nDdGJ13LnBfd8cNqKHPpbAFj7miR9SWUTsw"
    }
  },
  {
    id: 'review-5',
    name: 'Review 5 - Xuan T.',
    description: 'Individual review content for Xuan T. - 5-star review',
    category: 'document',
    uploadLink: 'https://example.com/review-5',
    altText: 'Xuan T. review content',
    dimensions: { width: 0, height: 0 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'low',
    textContent: {
      name: "Xuan T.",
      rating: 5,
      comment: "This is my new favorite watch. The build quality is solid, the weight is perfect, and the dial is beautiful. It keeps perfect time. 10/10.",
      date: "2024-01-03",
      verified: true,
      productImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgYZfkH48MrlHTg0PRAt5J3NyaFSOpGxLQidE9",
      profileImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgD2qjTuk98uOFclKwJsbixRLVYftA3oUXgdPj"
    }
  },
  {
    id: 'review-6',
    name: 'Review 6 - David T.',
    description: 'Individual review content for David T. - 5-star review',
    category: 'document',
    uploadLink: 'https://example.com/review-5',
    altText: 'David T. review content',
    dimensions: { width: 0, height: 0 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'low',
    textContent: {
      name: "David T.",
      rating: 5,
      comment: "I was looking for a unique but classic watch, and this is it. It's very well made. Had to remove a few links from the bracelet for a perfect fit, which was easy to do at a local jeweler.",
      date: "2024-01-03",
      verified: true,
      productImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgFtqpqYUw40OXa9Ud71TI6tnyVEjCYhsxJpzo",
      profileImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgq8XnUmRZu7M4YmkVsgNaAH5DKpScGvQL9yJb"
    }
  },
  {
    id: 'review-7',
    name: 'Review 7 - Emma T.',
    description: 'Individual review content for Emma T. - 5-star review',
    category: 'document',
    uploadLink: 'https://example.com/review-7',
    altText: 'Emma T. review content',
    dimensions: { width: 0, height: 0 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'low',
    textContent: {
      name: "Emma T.",
      rating: 5,
      comment: "The perfect gift. I bought this for my husband and he was blown away. The fluted bezel and the Arabic numerals look incredible in person. Fast shipping, too.",
      date: "2024-01-03",
      verified: true,
      productImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgpjy5LASyR3TUAuSe5zs8BOwjo27Ld4ZNnKMH",
      profileImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgYFUaur8MrlHTg0PRAt5J3NyaFSOpGxLQidE9"
    }
  },
  {
    id: 'review-8',
    name: 'Review 8 - Austin T.',
    description: 'Individual review content for Emma T. - 5-star review',
    category: 'document',
    uploadLink: 'https://example.com/review-8',
    altText: 'Austin T. review content',
    dimensions: { width: 0, height: 0 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'low',
    textContent: {
      name: "Autstin T.",
      rating: 5,
      comment: "The watch has a satisfying weight to it, and the Jubilee bracelet is surprisingly comfortable. Very pleased with this purchase.",
      date: "2024-01-03",
      verified: true,
      productImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgZXQwDEEYsaGHiOoQjxJeRX4ITmt7bgq5fMd3",
      profileImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkg9k9JfcwtrYXnKUvWeVb24mcpxBdqMNCs0iDg"
    }
  },
  {
    id: 'review-9',
    name: 'Review 9 - Michael R.',
    description: 'Individual review content for Michael R. - 5-star review',
    category: 'document',
    uploadLink: 'https://example.com/review-8',
    altText: 'Michael R. review content',
    dimensions: { width: 0, height: 0 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'low',
    textContent: {
      name: "Michael R.",
      rating: 5,
      comment: "This watch looks incredible. The fluted bezel catches the light perfectly. It's my new daily wear and it's versatile enough for both casual and formal occasions.",
      date: "2024-01-03",
      verified: true,
      productImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgXvvUiYxjTa3UiRg5JFzwpI79lWnLoKcSGmfC",
      profileImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgIu8fcLmKQ6awEBKHUxTFfWs9hm24RSnv7JDq"
    }
  },
  {
    id: 'review-10',
    name: 'Review 10 - David L.',
    description: 'Individual review content for David L. - 5-star review',
    category: 'document',
    uploadLink: 'https://example.com/review-8',
    altText: 'David L. review content',
    dimensions: { width: 0, height: 0 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'low',
    textContent: {
      name: "David L.",
      rating: 5,
      comment: "Exceeded all my expectations. The finish is flawless and the Arabic numerals are cleanly printed. For this price, it's an absolute steal. Shipped faster than expected.",
      date: "2024-01-03",
      verified: true,
      productImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgJugz17BYfqCwV3nQUzD7OSBEvac2mXjZhyFA",
      profileImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgLy4WoOfjqoyOZWV60GmUNM83vuRaQ1gTJPhi"
    }
  },
  {
    id: 'review-11',
    name: 'Review 11 - James K.',
    description: 'Individual review content for James K. - 5-star review',
    category: 'document',
    uploadLink: 'https://example.com/review-8',
    altText: 'James K. review content',
    dimensions: { width: 0, height: 0 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'low',
    textContent: {
      name: "James K.",
      rating: 5,
      comment: "The watch is even more beautiful in person. The light blue dial is unique and I've received several compliments already. It feels substantial and well-made.",
      date: "2024-01-03",
      verified: true,
      productImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgGibn9fMjpzDWtrkcgSoUqeyNLnmXE7FflYMb",
      profileImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgHytagmiPNPBT29adskJlu3n6A5FtVUgCLvX4"
    }
  },
  {
    id: 'review-12',
    name: 'Review 12 - Robert M.',
    description: 'Individual review content for Robert M. - 5-star review',
    category: 'document',
    uploadLink: 'https://example.com/review-8',
    altText: 'Robert M. review content',
    dimensions: { width: 0, height: 0 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'low',
    textContent: {
      name: "Robert M.",
      rating: 5,
      comment: "Great looking watch. My only minor issue is the clasp can be a little tricky at first, but you get used to it. Overall, very happy with the style and quality for the price.",
      date: "2024-01-03",
      verified: true,
      productImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgoDl79gmnHKfA0vVTLCJYOw8iUFbDa5u6Iqym",
      profileImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkg4nUHrUWyO2eTtkFgq9hZnDKm5VzCMPf7d0aB"
    }
  },
  {
    id: 'review-13',
    name: 'Review 13 - Owen H.',
    description: 'Individual review content for Jennifer A. - 5-star review',
    category: 'document',
    uploadLink: 'https://example.com/review-8',
    altText: 'Owen H. review content',
    dimensions: { width: 0, height: 0 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'low',
    textContent: {
      name: "Owen H.",
      rating: 5,
      comment: "I've been wearing this watch for a week straight and it's been perfect. The quartz movement is accurate, and the date function is a nice touch. Looks like it should cost way more.",
      date: "2024-01-03",
      verified: true,
      productImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgaX16KsdolWhqRfeCXYtM9dVSKOiZQGrPs5yk",
      profileImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgDMgK66k98uOFclKwJsbixRLVYftA3oUXgdPj"
    }
  },
  {
    id: 'review-14',
    name: 'Review 14 - Thomas B.',
    description: 'Individual review content for Thomas B. - 5-star review',
    category: 'document',
    uploadLink: 'https://example.com/review-8',
    altText: 'Thomas B. review content',
    dimensions: { width: 0, height: 0 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'low',
    textContent: {
      name: "Thomas B.",
      rating: 5,
      comment: "Bought this as a graduation gift for my brother and he absolutely loved it. The packaging was very nice and the watch itself feels premium. The Arabic dial makes it feel special.",
      date: "2024-01-03",
      verified: true,
      productImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgRWyfe4TGebCqWcLTfDOywr0nAQJU56toimId",
      profileImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgK0Z6gfsblMycASPNxBtEm3siX5WfFC7LHkYJ"
    }
  },
  {
    id: 'review-15',
    name: 'Review 15 - Christopher W.',
    description: 'Individual review content for Christopher W. - 5-star review',
    category: 'document',
    uploadLink: 'https://example.com/review-8',
    altText: 'Christopher W. review content',
    dimensions: { width: 0, height: 0 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'low',
    textContent: {
      name: "Christopher W.",
      rating: 5,
      comment: "Solid, dependable, and stylish. It's that simple. It has become my go-to watch for daily wear. You won't regret buying this.",
      date: "2024-01-03",
      verified: true,
      productImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkg6Mc68y13LnBfd8cNqKHPpbAFj7miR9SWUTsw",
      profileImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgYT4c9z8MrlHTg0PRAt5J3NyaFSOpGxLQidE9"
    }
  },
  {
    id: 'review-16',
    name: 'Review 16 - Daniel H.',
    description: 'Individual review content for Daniel H. - 5-star review',
    category: 'document',
    uploadLink: 'https://example.com/review-8',
    altText: 'Daniel H. review content',
    dimensions: { width: 0, height: 0 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'low',
    textContent: {
      name: "Daniel H.",
      rating: 5,
      comment: "The build quality is exceptional for the price. The stainless steel has a nice polish, and the fluted bezel really makes it stand out. A fantastic piece.",
      date: "2024-01-03",
      verified: true,
      productImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgWZrN1GIfrhg3ucJpYFZVEmAR9TBn0NvzI8G2",
      profileImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgbFCrHkqUMqkgQy1APTmpx76ciWLDeI0ZhCdw"
    }
  },
  {
    id: 'review-17',
    name: 'Review 17 - Josh M.',
    description: 'Individual review content for Josh M. - 5-star review',
    category: 'document',
    uploadLink: 'https://example.com/review-8',
    altText: 'Josh M. review content',
    dimensions: { width: 0, height: 0 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'low',
    textContent: {
      name: "Josh M.",
      rating: 5,
      comment: "This watch looks even better on the wrist. The size is perfect for my taste, not too big or small. The Arabic numerals are a great touch that makes it different from everything else.",
      date: "2024-01-03",
      verified: true,
      productImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgbYHoyCqUMqkgQy1APTmpx76ciWLDeI0ZhCdw",
      profileImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgaEqwZ6dolWhqRfeCXYtM9dVSKOiZQGrPs5yk"
    }
  },
  {
    id: 'review-18',
    name: 'Review 18 - William T.',
    description: 'Individual review content for William T. - 5-star review',
    category: 'document',
    uploadLink: 'https://example.com/review-8',
    altText: 'William T. review content',
    dimensions: { width: 0, height: 0 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'low',
    textContent: {
      name: "William T.",
      rating: 4,
      comment: "I purchased this for my dad's birthday and he was thrilled. It looks very distinguished and classy. He says he gets compliments on it at work all the time!",
      date: "2024-01-03",
      verified: true,
      productImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgsR8d2KuKqQZUhcTVNtRlYJBxCD6WHkfsGIgL",
      profileImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgrRc0JDvbJLuGzFCBaS7MmnX2V95Oq41ekg6h"
    }
  },
  {
    id: 'review-19',
    name: 'Review 19 - Richard F.',
    description: 'Individual review content for Richard F. - 5-star review',
    category: 'document',
    uploadLink: 'https://example.com/review-8',
    altText: 'Richard F. review content',
    dimensions: { width: 0, height: 0 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'low',
    textContent: {
      name: "Richard F.",
      rating: 5,
      comment: "A very handsome watch. The lume on the hands isn't the brightest, but that's a minor point. For a stylish, everyday watch it's fantastic. The accuracy is spot on.",
      date: "2024-01-03",
      verified: true,
      productImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgyyadq9tQwTX5sJ1dZHhrLyMq3v0nCgxBamu4",
      profileImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgPACAoUjjghCns50T21kSrzGMQcdYmpOIWoX8"
    }
  },
  {
    id: 'review-20',
    name: 'Review 20 - Joseph P.',
    description: 'Individual review content for Joseph P. - 5-star review',
    category: 'document',
    uploadLink: 'https://example.com/review-8',
    altText: 'Joseph P. review content',
    dimensions: { width: 0, height: 0 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'low',
    textContent: {
      name: "Joseph P.",
      rating: 5,
      comment: "Great customer service and a great product. Arrived well-packaged. The watch has a premium feel that you wouldn't expect at this price point. Very satisfied.",
      date: "2024-01-03",
      verified: true,
      productImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgdM4G3Nc2ylsVjfYgUAbnLqzFCGPND4kocZm0",
      profileImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgssqLdIuKqQZUhcTVNtRlYJBxCD6WHkfsGIgL"
    }
  },
  {
    id: 'review-21',
    name: 'Review 21 - Andrew S.',
    description: 'Individual review content for Andrew S. - 5-star review',
    category: 'document',
    uploadLink: 'https://example.com/review-8',
    altText: 'Andrew S. review content',
    dimensions: { width: 0, height: 0 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'low',
    textContent: {
      name: "Andrew S.",
      rating: 5,
      comment: "The pictures don't do the dial justice. In the sun, the white color really pops. It's a solid, well-built timepiece that I'm happy to have in my collection.",
      date: "2024-01-03",
      verified: true,
      productImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkg9z3qljwtrYXnKUvWeVb24mcpxBdqMNCs0iDg",
      profileImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgIu1Z16bKQ6awEBKHUxTFfWs9hm24RSnv7JDq"
    }
  },
  {
    id: 'review-22',
    name: 'Review 22 - Kevin J.',
    description: 'Individual review content for Kevin J. - 5-star review',
    category: 'document',
    uploadLink: 'https://example.com/review-8',
    altText: 'Kevin J. review content',
    dimensions: { width: 0, height: 0 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'low',
    textContent: {
      name: "Kevin J.",
      rating: 5,
      comment: "I bought this for myself and I love it. It has that classic 'boyfriend watch' style but the details make it feel unique and elegant. The quality is fantastic.",
      date: "2024-01-03",
      verified: true,
      productImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkg1d8iJ7VlBEfAQ2r93Vp1NHX4yxbD8UcZnWY5",
      profileImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgc2f4qMLt2EnZmLpHuKTf0yrXQvwaYF9dOxRb"
    }
  },
  {
    id: 'review-23',
    name: 'Review 23 - Brian L.',
    description: 'Individual review content for Brian L. - 5-star review',
    category: 'document',
    uploadLink: 'https://example.com/review-8',
    altText: 'Brian L. review content',
    dimensions: { width: 0, height: 0 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'low',
    textContent: {
      name: "Brian L.",
      rating: 5,
      comment: "Ten out of ten. If you're thinking about getting this watch, just do it. It looks, feels, and runs like a high-end luxury piece. An outstanding value.",
      date: "2024-01-03",
      verified: true,
      productImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkg1707JbBVlBEfAQ2r93Vp1NHX4yxbD8UcZnWY",
      profileImage: "https://mro774wfph.ufs.sh/f/bwRfX2qUMqkg8VUrlCX0Ey2SR9WMdiN6qlcJaAzXIthumPfg"
    }
  },
  {
    id: 'store-general-text',
    name: 'Store General Text',
    description: 'General text content for the store page including store name, brand name, and navigation',
    category: 'document',
    uploadLink: 'https://example.com/store-general-text',
    altText: 'Store general text content',
    dimensions: { width: 0, height: 0 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'high',
    textContent: {
      storeName: "Premium Request Store",
      brandName: "Quibble",
      navigation: {
        home: "Home",
        store: "Store",
        about: "About",
        contact: "Contact",
        dashboard: "Dashboard"
      }
    }
  },
  {
    id: 'reviews-section',
    name: 'Reviews Section',
    description: 'Text content for the Customer Reviews section - section header and description',
    category: 'document',
    uploadLink: 'https://mro774wfph.ufs.sh/f/reviews-section-placeholder',
    altText: 'Reviews section content',
    dimensions: { width: 800, height: 600 },
    lastUpdated: '2024-01-15',
    isActive: true,
    priority: 'medium',
    textContent: {
      title: "Reviews",
      subtitle: "Customer Reviews Section",
      description: "See what our customers are saying about their new watch",
      loadMoreButton: "Load More Reviews",
      loadMoreRemaining: "remaining"
    }
  },
  // Product Specifications
  {
    id: 'product-specifications',
    name: 'Product Specifications and Details',
    description: 'Complete product specifications, features, benefits, and FAQ information',
    category: 'document',
    uploadLink: 'https://example.com/product-specs',
    altText: 'Product specifications document',
    lastUpdated: '2024-01-01',
    isActive: true,
    textContent: {
      description: "A masterpiece of design, where classic style meets unique heritage.",
      benefits: [
        "Exclusive Arabic Dial",
        "Precision Quartz Movement",
        "316L Stainless Steel",
        "Iconic Fluted Bezel"
      ],
      features: [
        "Azure Sunray Dial",
        "Cyclops Date Magnifier",
        "Jubilee-Style Bracelet",
        "Luminous Hands",
        "Screw-Down Crown",
        "Exhibition Caseback",
        "Complete Calendar",
        "Business Style"
      ],
      specifications: {
        "Hign-concerned Chemical": "None",
        "Case Thickness": "12.2",
        "Movement origin": "CN (Origin)",
        "Movement": "Quartz",
        "Item Type": "Quartz Wristwatches",
        "Band Material Type": "Stainless Steel",
        "Case Material": "Alloy",
        "Clasp Type": "Bracelet Clasp",
        "Water Resistance Depth": "No Waterproof",
        "Display Type": "Arabic Numeral Markers"
      },
      faqs: [
        {
          "question": "Is this watch water-resistant?",
          "answer": "This watch is not waterproof and should not be submerged in water. It is designed for business and daily wear, and should be kept dry. Please avoid wearing it while swimming or showering."
        },
        {
          "question": "What kind of movement does the watch use?",
          "answer": "The watch is powered by a reliable quartz movement from Mainland China, which is known for its accuracy and low-maintenance operation."
        },
        {
          "question": "What are the dimensions of the watch?",
          "answer": "The watch features a round alloy case with a thickness of 12.2mm. The stainless steel band has a length of 9 inches."
        },
        {
          "question": "What is the band made of?",
          "answer": "The band is made of durable and high-quality stainless steel with a bracelet clasp for a secure and comfortable fit."
        },
        {
          "question": "What is the material of the dial window?",
          "answer": "The dial window is made of glass, providing a clear and classic look for the Arabic numeral markers."
        },
        {
          "question": "Does the watch have any special features?",
          "answer": "Yes, it includes a complete calendar feature for added functionality and convenience."
        },
        {
          "question": "What is the brand of this watch?",
          "answer": "The watch is a product of RICECGO, a brand specializing in stylish and functional business watches."
        }
      ],
      shippingInfo: "Free 9-14 day shipping",
      guarantee: "30-day money-back guarantee",
      returnPolicy: "Easy returns within 30 days"
    }
  },
  {
    id: 'marquee-text',
    name: 'Marquee Rotating Text',
    description: 'Rotating text phrases displayed in the marquee section',
    category: 'document',
    uploadLink: 'https://example.com/marquee-text',
    altText: 'Marquee text content',
    lastUpdated: '2024-01-01',
    isActive: true,
    textContent: {
      phrases: [
        "Define Your Style",
        "Elevate Your Look", 
        "Command Respect"
      ]
    }
  },
  {
    id: 'product-ui-text',
    name: 'Product UI Text',
    description: 'Various UI text strings used throughout the product store interface',
    category: 'document',
    uploadLink: 'https://example.com/product-ui-text',
    altText: 'Product UI text content',
    lastUpdated: '2024-01-01',
    isActive: true,
    textContent: {
      verifiedReviews: "verified reviews",
      verifiedPurchase: "Verified Purchase",
      selectModel: "Select Model",
      securePayment: "Secure payment",
      freeShipping: "Free shipping",
      thirtyDayReturns: "30-day returns",
      saveText: "Save",
      offText: "OFF",
      extraOffText: "Extra Off",
      rankText: "Rank",
      remainingText: "remaining"
    }
  }
  // ========================================
  // END INDIVIDUAL REVIEW CONTENT
  // ========================================
];

// Helper functions for easy access
export const getMediaAsset = (id: string): MediaAsset | undefined => {
  const asset = mediaAssets.find(a => a.id === id && a.isActive);
  return asset;
};

// Get text content from a media asset
export const getMediaAssetText = (id: string, textType: keyof NonNullable<MediaAsset['textContent']>): string | undefined => {
  const asset = getMediaAsset(id);
  return asset?.textContent?.[textType] as string | undefined;
};

// Get testimonial content from a media asset
export const getMediaAssetTestimonial = (id: string): {
  testimonial?: string;
  customerName?: string;
  date?: string;
  rating?: number;
  verified?: boolean;
} | undefined => {
  const asset = getMediaAsset(id);
  return asset?.textContent ? {
    testimonial: asset.textContent.testimonial,
    customerName: asset.textContent.customerName,
    date: asset.textContent.date,
    rating: asset.textContent.rating,
    verified: asset.textContent.verified
  } : undefined;
};

// Get product content from a media asset
export const getMediaAssetProductInfo = (id: string): {
  title?: string;
  subtitle?: string;
  description?: string;
  benefits?: string[];
  features?: string[];
} | undefined => {
  const asset = getMediaAsset(id);
  return asset?.textContent ? {
    title: asset.textContent.title,
    subtitle: asset.textContent.subtitle,
    description: asset.textContent.description,
    benefits: asset.textContent.benefits,
    features: asset.textContent.features
  } : undefined;
};

// Get bundle section content from media asset
export const getBundleSectionContent = (): {
  title?: string;
  subtitle?: string;
  description?: string;
  benefits?: string[];
  features?: string[];
  ctaText?: string;
} | undefined => {
  const asset = getMediaAsset('bundle-demonstration-video');
  return asset?.textContent ? {
    title: asset.textContent.title,
    subtitle: asset.textContent.subtitle,
    description: asset.textContent.description,
    benefits: asset.textContent.benefits,
    features: asset.textContent.features,
    ctaText: asset.textContent.ctaText
  } : undefined;
};

// Get feel the difference section content from media asset
export const getFeelTheDifferenceContent = (): {
  title?: string;
  description?: string;
  benefits?: string[];
  features?: string[];
} | undefined => {
  const asset = getMediaAsset('feel-the-difference-section');
  return asset?.textContent ? {
    title: asset.textContent.title,
    description: asset.textContent.description,
    benefits: asset.textContent.benefits,
    features: asset.textContent.features
  } : undefined;
};

// Get reviews section content from media asset
export const getReviewsSectionContent = (): {
  title: string;
  subtitle: string;
  description: string;
  loadMoreButton: string;
  loadMoreRemaining: string;
} | undefined => {
  const asset = mediaAssets.find(asset => asset.id === 'reviews-section');
  return asset?.textContent as {
    title: string;
    subtitle: string;
    description: string;
    loadMoreButton: string;
    loadMoreRemaining: string;
  } | undefined;
};

// Get general store text content
export const getStoreGeneralText = (): {
  storeName: string;
  brandName: string;
  navigation: {
    home: string;
    store: string;
    about: string;
    contact: string;
    dashboard: string;
  };
} | undefined => {
  const asset = mediaAssets.find(asset => asset.id === 'store-general-text');
  return asset?.textContent as {
    storeName: string;
    brandName: string;
    navigation: {
      home: string;
      store: string;
      about: string;
      contact: string;
      dashboard: string;
    };
  } | undefined;
};

export const getProductSpecifications = (): {
  description: string;
  benefits: string[];
  features: string[];
  specifications: Record<string, string>;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  shippingInfo: string;
  guarantee: string;
  returnPolicy: string;
} | undefined => {
  const asset = mediaAssets.find(asset => asset.id === 'product-specifications');
  return asset?.textContent as {
    description: string;
    benefits: string[];
    features: string[];
    specifications: Record<string, string>;
    faqs: Array<{
      question: string;
      answer: string;
    }>;
    shippingInfo: string;
    guarantee: string;
    returnPolicy: string;
  } | undefined;
};

export const getMarqueeText = (): string[] | undefined => {
  const asset = mediaAssets.find(asset => asset.id === 'marquee-text');
  return asset?.textContent?.phrases;
};

export const getProductUIText = (): {
  verifiedReviews: string;
  verifiedPurchase: string;
  selectModel: string;
  securePayment: string;
  freeShipping: string;
  thirtyDayReturns: string;
  saveText: string;
  offText: string;
  extraOffText: string;
  rankText: string;
  remainingText: string;
  } | undefined => {
  const asset = mediaAssets.find(asset => asset.id === 'product-ui-text');
  return asset?.textContent as {
    verifiedReviews: string;
    verifiedPurchase: string;
    selectModel: string;
    securePayment: string;
    freeShipping: string;
    thirtyDayReturns: string;
    saveText: string;
    offText: string;
    extraOffText: string;
    rankText: string;
    remainingText: string;
  } | undefined;
};

export const getBundleSectionHeader = (): {
  headerText: string;
  benefitsIcons: string[];
} | undefined => {
  const asset = mediaAssets.find(asset => asset.id === 'bundle-section-header');
  return asset?.textContent as {
    headerText: string;
    benefitsIcons: string[];
  } | undefined;
};

// Individual review content
export const getIndividualReviewContent = (reviewId: string): {
  name: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
  productImage: string;
  profileImage: string;
} | undefined => {
  const asset = mediaAssets.find(asset => asset.id === `review-${reviewId}`);
  return asset?.textContent as {
    name: string;
    rating: number;
    comment: string;
    date: string;
    verified: boolean;
    productImage: string;
    profileImage: string;
  } | undefined;
};

export const getAllReviewsContent = (): Array<{
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
  productImage: string;
  profileImage: string;
}> => {
  const reviews = [];
  // Dynamically find all review assets instead of hardcoding to 5
  const reviewAssets = mediaAssets.filter(asset => 
    asset.id.startsWith('review-') && 
    asset.isActive && 
    asset.textContent?.name && 
    asset.textContent?.comment
  );
  
  // console.log(`[getAllReviewsContent] Found ${reviewAssets.length} review assets:`, reviewAssets.map(a => a.id));
  
  // Sort by review ID number for consistent ordering
  reviewAssets.sort((a, b) => {
    const aNum = parseInt(a.id.replace('review-', ''));
    const bNum = parseInt(b.id.replace('review-', ''));
    return aNum - bNum;
  });
  
  reviewAssets.forEach(asset => {
    const reviewId = asset.id.replace('review-', '');
    const review = getIndividualReviewContent(reviewId);
    if (review) {
      reviews.push({
        id: reviewId,
        ...review
      });
    }
  });
  
  // console.log(`[getAllReviewsContent] Returning ${reviews.length} processed reviews:`, reviews.map(r => r.id));
  
  return reviews;
};

// Video preloading utility with debugging
export const preloadVideo = (videoUrl: string): Promise<void> => {
  console.log(`[preloadVideo] Starting to preload video: ${videoUrl}`);
  
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      console.log(`[preloadVideo] Video metadata loaded successfully: ${videoUrl}`);
      console.log(`[preloadVideo] Video dimensions: ${video.videoWidth}x${video.videoHeight}`);
      console.log(`[preloadVideo] Video duration: ${video.duration}s`);
      resolve();
    };
    
    video.onerror = (error) => {
      console.error(`[preloadVideo] Failed to preload video: ${videoUrl}`, error);
      reject(new Error(`Failed to preload video: ${videoUrl}`));
    };
    
    video.src = videoUrl;
    console.log(`[preloadVideo] Video element created and src set: ${videoUrl}`);
  });
};

// Get video review content from a media asset
export const getVideoReviewContent = (id: string): {
  testimonial?: string;
  customerName?: string;
} | undefined => {
  const asset = getMediaAsset(id);
  return asset?.textContent ? {
    testimonial: asset.textContent.testimonial,
    customerName: asset.textContent.customerName
  } : undefined;
};

export const getVideoReviewsContent = (): Array<{
  id: string;
  thumbnail: string;
  videoUrl: string;
  testimonial: string;
  customerName: string;
}> => {
  const videoReviews = [];
  // Dynamically find all video review assets instead of hardcoding to 5
  const videoReviewAssets = mediaAssets.filter(asset => 
    asset.id.startsWith('video-review-') && 
    asset.isActive && 
    asset.textContent?.testimonial && 
    asset.textContent?.customerName
  );
  
  // Sort by video review ID number for consistent ordering
  videoReviewAssets.sort((a, b) => {
    const aNum = parseInt(a.id.replace('video-review-', ''));
    const bNum = parseInt(b.id.replace('video-review-', ''));
    return aNum - bNum;
  });
  
  videoReviewAssets.forEach(asset => {
    const reviewId = asset.id.replace('video-review-', '');
    if (asset.textContent) {
      videoReviews.push({
        id: reviewId,
        thumbnail: `video-review-thumb-${reviewId}`,
        videoUrl: `video-review-${reviewId}`,
        testimonial: asset.textContent.testimonial || "",
        customerName: asset.textContent.customerName || ""
      });
    }
  });
  
  return videoReviews;
};

// Get video reviews
export const getVideoReviews = (): MediaAsset[] => {
  const videoReviews = mediaAssets.filter(asset => 
    asset.category === 'video' && 
    asset.id.startsWith('video-review-') && 
    asset.isActive
  );
  
  return videoReviews;
};

// Get video review thumbnails
export const getVideoReviewThumbnails = (): MediaAsset[] => {
  const thumbnails = mediaAssets.filter(asset => 
    asset.category === 'image' && 
    asset.id.startsWith('video-review-thumb-') && 
    asset.isActive
  );
  
  return thumbnails;
};

// Preload all video reviews
export const preloadAllVideoReviews = async (): Promise<void> => {
  const videoReviews = getVideoReviews();
  
  if (videoReviews.length === 0) {
    console.warn(`[preloadAllVideoReviews] No video reviews found to preload`);
    return;
  }
  
  console.log(`[preloadAllVideoReviews] Preloading ${videoReviews.length} video reviews...`);
  
  const preloadPromises = videoReviews.map(async (review) => {
    try {
      console.log(`[preloadAllVideoReviews] Preloading video: ${review.id} - ${review.name}`);
      await preloadVideo(review.uploadLink);
      console.log(`[preloadAllVideoReviews] Successfully preloaded video: ${review.id}`);
    } catch (error) {
      console.error(`[preloadAllVideoReviews] Failed to preload video ${review.id}:`, error);
    }
  });
  
  await Promise.allSettled(preloadPromises);
  console.log(`[preloadAllVideoReviews] Finished preloading all video reviews`);
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

// Get critical images for preloading
export const getCriticalImages = (): MediaAsset[] => {
  return mediaAssets.filter(a => 
    a.isActive && 
    a.priority === 'high' && 
    a.category === 'image' && 
    validateMediaAsset(a)
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