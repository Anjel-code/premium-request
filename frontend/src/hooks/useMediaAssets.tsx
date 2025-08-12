import { useState, useEffect, useMemo } from 'react';
import { 
  getMediaAsset, 
  getMediaAssetsByCategory, 
  getMediaAssetsByDescription,
  MediaAsset,
  validateMediaAsset 
} from '../lib/mediaAssets';

interface UseMediaAssetOptions {
  fallbackUrl?: string;
  onError?: (error: Error) => void;
}

interface UseMediaAssetReturn {
  asset: MediaAsset | undefined;
  isLoading: boolean;
  error: Error | null;
  url: string;
  altText: string;
  dimensions: { width: number; height: number } | undefined;
}

interface UseMediaAssetsReturn {
  assets: MediaAsset[];
  isLoading: boolean;
  error: Error | null;
  getAsset: (id: string) => MediaAsset | undefined;
}

/**
 * Hook for using a single media asset
 */
export const useMediaAsset = (
  assetId: string, 
  options: UseMediaAssetOptions = {}
): UseMediaAssetReturn => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [asset, setAsset] = useState<MediaAsset | undefined>();

  useEffect(() => {
    const loadAsset = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Check if this is a full URL (not a media asset ID)
        const isFullUrl = assetId.startsWith('http') || assetId.startsWith('data:') || assetId.startsWith('/');
        
        if (isFullUrl) {
          // Create a mock asset for full URLs
          const mockAsset: MediaAsset = {
            id: assetId,
            name: 'Direct URL',
            description: 'Direct URL asset',
            category: 'image',
            uploadLink: assetId,
            altText: 'Direct URL image',
            lastUpdated: new Date().toISOString(),
            isActive: true
          };
          setAsset(mockAsset);
          return;
        }
        
        const mediaAsset = getMediaAsset(assetId);
        
        if (!mediaAsset) {
          throw new Error(`Media asset not found: ${assetId}`);
        }
        
        // Validate the asset
        if (!validateMediaAsset(mediaAsset)) {
          throw new Error(`Invalid media asset: ${assetId}`);
        }
        
        setAsset(mediaAsset);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error loading media asset');
        setError(error);
        options.onError?.(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAsset();
  }, [assetId, options.onError]);

  const url = useMemo(() => {
    if (asset?.uploadLink) {
      return asset.uploadLink;
    }
    return options.fallbackUrl || 'https://mro774wfph.ufs.sh/f/bwRfX2qUMqkgu0s6cMr5U3Hp2kVCI4csGZFedlbAq61QSPyt';
  }, [asset?.uploadLink, options.fallbackUrl]);

  const altText = useMemo(() => {
    return asset?.altText || asset?.name || 'Media asset';
  }, [asset?.altText, asset?.name]);

  const dimensions = useMemo(() => {
    return asset?.dimensions;
  }, [asset?.dimensions]);

  return {
    asset,
    isLoading,
    error,
    url,
    altText,
    dimensions
  };
};

/**
 * Hook for using multiple media assets
 */
export const useMediaAssets = (
  category?: MediaAsset['category'],
  searchTerm?: string
): UseMediaAssetsReturn => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [assets, setAssets] = useState<MediaAsset[]>([]);

  useEffect(() => {
    const loadAssets = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        let mediaAssets: MediaAsset[];
        
        if (searchTerm) {
          mediaAssets = getMediaAssetsByDescription(searchTerm);
        } else if (category) {
          mediaAssets = getMediaAssetsByCategory(category);
        } else {
          // Get all active assets
          mediaAssets = getMediaAssetsByDescription('');
        }
        
        setAssets(mediaAssets);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error loading media assets');
        setError(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAssets();
  }, [category, searchTerm]);

  const getAsset = useMemo(() => {
    return (id: string) => assets.find(asset => asset.id === id);
  }, [assets]);

  return {
    assets,
    isLoading,
    error,
    getAsset
  };
};

/**
 * Hook for using media assets with pagination
 */
export const useMediaAssetsPaginated = (
  category?: MediaAsset['category'],
  pageSize: number = 12,
  searchTerm?: string
) => {
  const [currentPage, setCurrentPage] = useState(1);
  const { assets, isLoading, error } = useMediaAssets(category, searchTerm);
  
  const totalPages = Math.ceil(assets.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentAssets = assets.slice(startIndex, endIndex);
  
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };
  
  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);
  
  return {
    assets: currentAssets,
    allAssets: assets,
    isLoading,
    error,
    currentPage,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    goToPage,
    nextPage,
    prevPage,
    pageSize
  };
};

/**
 * Hook for using a media asset with image optimization
 */
export const useOptimizedImage = (
  assetId: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
    fallbackUrl?: string;
  } = {}
) => {
  const { asset, isLoading, error, url } = useMediaAsset(assetId, {
    fallbackUrl: options.fallbackUrl
  });

  const optimizedUrl = useMemo(() => {
    if (!url) return '';
    
    // If you're using an image optimization service, you can add the parameters here
    // Example: return `${url}?w=${options.width}&h=${options.height}&q=${options.quality}&f=${options.format}`;
    
    return url;
  }, [url, options.width, options.height, options.quality, options.format]);

  return {
    asset,
    isLoading,
    error,
    url: optimizedUrl,
    originalUrl: url,
    altText: asset?.altText || asset?.name || 'Image',
    dimensions: asset?.dimensions
  };
}; 