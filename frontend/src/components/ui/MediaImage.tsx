import * as React from 'react';
import { useMediaAsset } from '../../hooks/useMediaAssets';
import { cn } from '../../lib/utils';

interface MediaImageProps {
  assetId: string;
  className?: string;
  alt?: string;
  fallbackUrl?: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  placeholder?: React.ReactNode;
  errorFallback?: React.ReactNode;
  priority?: boolean;
}

/**
 * MediaImage component that automatically loads images from the media assets system
 * 
 * Usage:
 * <MediaImage assetId="product-main-image" className="w-full h-auto" />
 */
export const MediaImage: React.FC<MediaImageProps> = ({
  assetId,
  className = "",
  alt,
  width,
  height,
  loading = "lazy",
  fallbackUrl,
  onError,
  ...props
}) => {
  // Special logging for main product image to debug URL issues
  if (assetId === "product-main-image") {
    console.log(`[MediaImage] Main product image - assetId: ${assetId}`);
  }
  
  const { url, isLoading, error, altText, dimensions } = useMediaAsset(assetId, {
    fallbackUrl,
    onError: onError ? (error: Error) => {
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
      onError(syntheticEvent);
    } : undefined
  });

  // Special logging for main product image to show the URL being used
  if (assetId === "product-main-image") {
    console.log(`[MediaImage] Main product image - URL: ${url}, Loading: ${isLoading}, Error: ${error}`);
  }

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
  
  return (
    <img
      src={url}
      alt={alt || altText}
      width={width || dimensions?.width}
      height={height || dimensions?.height}
      loading={loading}
      className={cn("object-cover", className)}
      onError={onError}
    />
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

interface MediaBackgroundProps {
  assetId: string;
  className?: string;
  overlay?: boolean;
  overlayOpacity?: number;
  overlayColor?: string;
  children?: React.ReactNode;
}

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
}) => {
  const { asset, isLoading, error, url } = useMediaAsset(assetId);

  if (isLoading) {
    return (
      <div className={`${className} bg-gray-200 animate-pulse`}>
        {children}
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className={`${className} bg-gray-300`}>
        {children}
      </div>
    );
  }

  if (!url) {
    return (
      <div className={`${className} bg-gray-400`}>
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

export default MediaImage; 