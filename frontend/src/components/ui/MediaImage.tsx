import * as React from 'react';
import { useMediaAsset } from '../../hooks/useMediaAssets';
import { cn } from '../../lib/utils';
import { generateOptimizedImageUrl, generateResponsiveImageUrls, IMAGE_OPTIMIZATION_CONFIG } from '../../lib/mediaAssets';
import { useState, useEffect, useRef, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';

export interface MediaImageProps {
  assetId: string;
  className?: string;
  alt?: string;
  fallbackUrl?: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: (event: React.SyntheticEvent<HTMLImageElement | HTMLVideoElement, Event>) => void;
  placeholder?: React.ReactNode;
  errorFallback?: React.ReactNode;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  responsive?: boolean;
  blurUp?: boolean;
  preload?: boolean;
  // Video-specific props
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  playsInline?: boolean;
  // Video event handlers
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

/**
 * Optimized MediaImage component with progressive loading, blur-up effects,
 * responsive images, and intersection observer for lazy loading.
 * Now supports both image and video assets based on asset category.
 * 
 * Usage:
 * <MediaImage assetId="product-main-image" className="w-full h-auto" responsive blurUp />
 * <MediaImage assetId="bundle-demonstration-video" className="w-full h-auto" controls autoPlay muted />
 */
export const MediaImage = forwardRef<HTMLVideoElement | HTMLImageElement, MediaImageProps>(({
  assetId,
  className = "",
  alt,
  width,
  height,
  loading = "lazy",
  fallbackUrl,
  onError,
  placeholder,
  errorFallback,
  priority = false,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  quality = 80,
  format = 'webp',
  responsive = true,
  blurUp = true,
  preload = false,
  // Video props
  autoPlay = false,
  muted = true,
  loop = false,
  controls = true,
  playsInline = true,
  onPlay,
  onPause,
  onEnded,
  ...props
}, ref) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [placeholderSrc, setPlaceholderSrc] = useState<string>('');
  
  const imageRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  

  
  const { asset, url, isLoading, error, altText, dimensions } = useMediaAsset(assetId, {
    fallbackUrl,
    onError: onError ? (error: Error) => {
      // Convert Error to synthetic event for HTML img/video onError
      const syntheticEvent = {
        nativeEvent: new Event('error'),
        currentTarget: null as any,
        target: null as any,
        bubbles: false,
        cancelable: false,
        defaultPrevented: false,
        eventPhase: 0,
        isTrusted: false,
        preventDefault: () => {},
        isDefaultPrevented: () => false,
        stopPropagation: () => {},
        isPropagationStopped: () => false,
        persist: () => {},
        timeStamp: Date.now(),
        type: 'error'
      } as React.SyntheticEvent<HTMLImageElement | HTMLVideoElement, Event>;
      onError(syntheticEvent);
    } : undefined
  });

  // Check if this is a video asset
  const isVideoAsset = asset?.category === 'video';

  // Generate optimized URLs (only for images)
  const optimizedUrls = useMemo(() => {
    if (!url || isVideoAsset) return null;
    
    if (responsive && dimensions) {
      return generateResponsiveImageUrls(url, dimensions);
    }
    
    return {
      thumbnail: generateOptimizedImageUrl(url, { quality: 60, format: 'webp' }),
      small: generateOptimizedImageUrl(url, { quality: 70, format: 'webp' }),
      medium: generateOptimizedImageUrl(url, { quality: quality, format: format }),
      large: generateOptimizedImageUrl(url, { quality: 85, format: format }),
      original: generateOptimizedImageUrl(url, { quality: 90, format: format })
    };
  }, [url, responsive, dimensions, quality, format, isVideoAsset]);

  // Set initial source (only for images)
  useEffect(() => {
    if (optimizedUrls && !isVideoAsset) {
      // Start with thumbnail for blur-up effect
      if (blurUp) {
        setPlaceholderSrc(optimizedUrls.thumbnail);
        setCurrentSrc(optimizedUrls.medium);
      } else {
        setCurrentSrc(optimizedUrls.medium);
      }
    }
  }, [optimizedUrls, blurUp, isVideoAsset]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const currentRef = isVideoAsset ? videoRef.current : imageRef.current;
    if (!currentRef || priority || loading === 'eager') {
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before element enters viewport
        threshold: 0.1
      }
    );

    observer.observe(currentRef);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [priority, loading, isVideoAsset]);

  // Preload critical media (only for images)
  useEffect(() => {
    if (preload && optimizedUrls && !isVideoAsset) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = optimizedUrls.medium;
      document.head.appendChild(link);
      
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [preload, optimizedUrls, isVideoAsset]);

  // Handle media load
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    props.onLoad?.();
  }, [props.onLoad]);

  // Handle media error
  const handleError = useCallback((event: React.SyntheticEvent<HTMLImageElement | HTMLVideoElement, Event>) => {
    setIsError(true);
    onError?.(event);
  }, [onError]);

  // Forward the ref to the appropriate element
  useImperativeHandle(ref, () => {
    if (isVideoAsset && videoRef.current) {
      return videoRef.current;
    }
    if (!isVideoAsset && imageRef.current) {
      return imageRef.current;
    }
    return null as any;
  }, [isVideoAsset]);



  if (isLoading) {
    return (
      <div 
        className={cn("bg-muted animate-pulse", className)} 
        style={{ width, height }}
      />
    );
  }

  if (error || !url) {
    return (
      <div 
        className={cn("bg-muted", className)} 
        style={{ width, height }}
      />
    );
  }

  if (!isIntersecting && loading === 'lazy') {
    return (
      <div 
        className={cn("bg-muted animate-pulse", className)} 
        style={{ width, height }}
        ref={isVideoAsset ? videoRef as any : imageRef as any}
      />
    );
  }

  if (isError) {
    return errorFallback || (
      <div 
        className={cn("bg-muted flex items-center justify-center", className)} 
        style={{ width, height }}
      >
        <span className="text-muted-foreground text-sm">Failed to load {isVideoAsset ? 'video' : 'image'}</span>
      </div>
    );
  }

  // Render video element for video assets
  if (isVideoAsset) {
    return (
      <div 
        className={cn("relative overflow-hidden", className)}
        style={{ width, height }}
      >
        <video
          ref={videoRef}
          src={url}
          className="w-full h-full object-cover"
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          controls={controls}
          playsInline={playsInline}
          onLoadedData={handleLoad}
          onError={handleError}
          onPlay={onPlay}
          onPause={onPause}
          onEnded={onEnded}
          {...props}
        />
        
        {/* Loading overlay */}
        {!isLoaded && (
          <div className="absolute inset-0 bg-muted/20 animate-pulse" />
        )}
      </div>
    );
  }

  // Render image element for image assets
  return (
    <div 
      className={cn("relative overflow-hidden", className)}
      style={{ width, height }}
    >
      {/* Blur-up placeholder */}
      {blurUp && placeholderSrc && !isLoaded && (
        <img
          src={placeholderSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-110"
          style={{ transform: 'scale(1.1)' }}
          aria-hidden="true"
        />
      )}
      
      {/* Main image */}
      <img
        ref={imageRef}
        src={currentSrc}
        alt={alt || altText}
        width={width || dimensions?.width}
        height={height || dimensions?.height}
        loading={loading}
        className={cn(
          "object-cover transition-opacity duration-300",
          blurUp && !isLoaded ? "opacity-0" : "opacity-100",
          className
        )}
        onLoad={handleLoad}
        onError={handleError}
        sizes={responsive ? sizes : undefined}
        {...(responsive && optimizedUrls ? {
          srcSet: `${optimizedUrls.thumbnail} 300w, ${optimizedUrls.small} 600w, ${optimizedUrls.medium} 1200w, ${optimizedUrls.large} 1920w`
        } : {})}
        {...props}
      />
      
      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted/20 animate-pulse" />
      )}
    </div>
  );
});

MediaImage.displayName = 'MediaImage';

/**
 * Progressive MediaImage with advanced optimization features
 */
export const ProgressiveMediaImage: React.FC<MediaImageProps & {
  progressiveSteps?: number;
  blurIntensity?: number;
}> = ({
  progressiveSteps = 3,
  blurIntensity = 10,
  ...props
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { url, dimensions } = useMediaAsset(props.assetId);
  
  const progressiveUrls = useMemo(() => {
    if (!url || !dimensions) return null;
    
    const steps = [];
    for (let i = 1; i <= progressiveSteps; i++) {
      const quality = Math.max(30, 90 - (i * 20));
      const size = Math.max(150, Math.min(dimensions.width, dimensions.height) / i);
      
      steps.push({
        url: generateOptimizedImageUrl(url, {
          width: size,
          height: size,
          quality,
          format: 'webp'
        }),
        quality,
        size
      });
    }
    
    return steps;
  }, [url, dimensions, progressiveSteps]);

  const handleLoad = useCallback(() => {
    if (currentStep < progressiveSteps - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, progressiveSteps]);

  if (!progressiveUrls) {
    return <MediaImage {...props} />;
  }

  return (
    <div className="relative">
      {progressiveUrls.map((step, index) => (
        <img
          key={index}
          src={step.url}
          alt={props.alt || ''}
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-all duration-500",
            index === currentStep ? "opacity-100" : "opacity-0",
            index < currentStep ? "filter blur-sm" : ""
          )}
          style={{
            filter: index < currentStep ? `blur(${blurIntensity}px)` : 'none'
          }}
          onLoad={index === currentStep ? handleLoad : undefined}
        />
      ))}
    </div>
  );
};

/**
 * Optimized version of MediaImage with automatic image optimization
 */
export const OptimizedMediaImage: React.FC<MediaImageProps & {
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}> = ({
  assetId,
  quality = 80,
  format = 'webp',
  ...props
}) => {
  const { url, altText } = useMediaAsset(assetId, {
    fallbackUrl: props.fallbackUrl,
    onError: props.onError ? (error: Error) => {
      // Convert Error to synthetic event for HTML img onError
      const syntheticEvent = {
        nativeEvent: new Event('error'),
        currentTarget: null as any,
        target: null as any,
        bubbles: false,
        cancelable: false,
        defaultPrevented: false,
        eventPhase: 0,
        isTrusted: false,
        preventDefault: () => {},
        isDefaultPrevented: () => false,
        stopPropagation: () => {},
        isPropagationStopped: () => false,
        persist: () => {},
        timeStamp: Date.now(),
        type: 'error'
      } as React.SyntheticEvent<HTMLImageElement, Event>;
      props.onError!(syntheticEvent);
    } : undefined
  });

  // Generate optimized URL if you have an image optimization service
  const optimizedUrl = React.useMemo(() => {
    if (!url) return '';
    
    // Example for services like Cloudinary, ImageKit, etc.
    // return `${url}?q=${quality}&f=${format}`;
    
    return url;
  }, [url, quality, format]);

  return (
    <MediaImage
      {...props}
      assetId={assetId}
      alt={props.alt || altText}
    />
  );
};

/**
 * Background image component for CSS backgrounds
 */
export const MediaBackground: React.FC<MediaBackgroundProps> = ({
  assetId,
  className = "",
  overlay = false,
  overlayOpacity = 0.5,
  overlayColor = "black",
  children,
  waitForLoad = false,
  onLoad,
  onError,
}) => {
  const { asset, isLoading, error, url } = useMediaAsset(assetId);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // Handle image load for background
  useEffect(() => {
    if (!url || !waitForLoad) return;

    const img = new Image();
    img.onload = () => {
      setIsImageLoaded(true);
      onLoad?.();
    };
    img.onerror = () => {
      onError?.(new Error('Failed to load background image'));
    };
    img.src = url;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [url, waitForLoad, onLoad, onError]);

  // If waiting for load and image isn't loaded yet, show loading state
  if (waitForLoad && !isImageLoaded) {
    return (
      <div className={`${className} bg-muted animate-pulse flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
        {children}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`${className} bg-muted animate-pulse`}>
        {children}
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className={`${className} bg-muted`}>
        {children}
      </div>
    );
  }

  if (!url) {
    return (
      <div className={`${className} bg-muted`}>
        {children}
      </div>
    );
  }

  const backgroundStyle = {
    backgroundImage: `url(${url})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };

  return (
    <div 
      className={className} 
      style={backgroundStyle}
    >
      {overlay && (
        <div 
          className="absolute inset-0"
          style={{
            backgroundColor: overlayColor,
            opacity: overlayOpacity,
          }}
        />
      )}
      {children}
    </div>
  );
};

// Missing interface definition
interface MediaBackgroundProps {
  assetId: string;
  className?: string;
  overlay?: boolean;
  overlayOpacity?: number;
  overlayColor?: string;
  children?: React.ReactNode;
  waitForLoad?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
} 