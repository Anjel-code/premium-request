// Storage utility functions to handle localStorage quota and data management

// Check if storage is available and has space
export const isStorageAvailable = (type: 'localStorage' | 'sessionStorage'): boolean => {
  try {
    const storage = window[type];
    const testKey = '__storage_test__';
    storage.setItem(testKey, 'test');
    storage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

// Get available storage space (approximate)
export const getStorageSpace = (type: 'localStorage' | 'sessionStorage'): number => {
  try {
    const storage = window[type];
    let total = 0;
    for (let key in storage) {
      if (storage.hasOwnProperty(key)) {
        total += storage[key].length + key.length;
      }
    }
    return total;
  } catch (e) {
    return 0;
  }
};

// Safe storage setter with fallback
export const safeSetItem = (key: string, value: any, useSessionStorage = false): boolean => {
  try {
    const storage = useSessionStorage ? sessionStorage : localStorage;
    const serializedValue = JSON.stringify(value);
    
    // Check if we're about to exceed quota (rough estimate)
    const currentSize = getStorageSpace(useSessionStorage ? 'sessionStorage' : 'localStorage');
    const newSize = currentSize + serializedValue.length + key.length;
    
    // If approaching limit (5MB for localStorage, 10MB for sessionStorage), try to clean up
    const limit = useSessionStorage ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (newSize > limit * 0.8) {
      cleanupStorage(useSessionStorage ? 'sessionStorage' : 'localStorage');
    }
    
    storage.setItem(key, serializedValue);
    return true;
  } catch (error) {
    console.warn(`Failed to save to ${useSessionStorage ? 'sessionStorage' : 'localStorage'}:`, error);
    
    // Try fallback to sessionStorage if localStorage failed
    if (!useSessionStorage && isStorageAvailable('sessionStorage')) {
      return safeSetItem(key, value, true);
    }
    
    return false;
  }
};

// Safe storage getter with fallback
export const safeGetItem = (key: string, useSessionStorage = false): any => {
  try {
    const storage = useSessionStorage ? sessionStorage : localStorage;
    const item = storage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.warn(`Failed to load from ${useSessionStorage ? 'sessionStorage' : 'localStorage'}:`, error);
    
    // Try fallback to sessionStorage if localStorage failed
    if (!useSessionStorage && isStorageAvailable('sessionStorage')) {
      return safeGetItem(key, true);
    }
    
    return null;
  }
};

// Clean up old or large data from storage
export const cleanupStorage = (type: 'localStorage' | 'sessionStorage'): void => {
  try {
    const storage = window[type];
    const keys = Object.keys(storage);
    
    // Remove old temporary data first
    const tempKeys = keys.filter(key => 
      key.startsWith('temp_') || 
      key.startsWith('cache_') ||
      key.includes('_temp')
    );
    
    tempKeys.forEach(key => {
      try {
        storage.removeItem(key);
      } catch (e) {
        // Ignore errors during cleanup
      }
    });
    
    // If still too much data, remove oldest items
    const remainingKeys = Object.keys(storage);
    if (remainingKeys.length > 50) { // Arbitrary limit
      const keysToRemove = remainingKeys.slice(0, 10); // Remove oldest 10 items
      keysToRemove.forEach(key => {
        try {
          storage.removeItem(key);
        } catch (e) {
          // Ignore errors during cleanup
        }
      });
    }
  } catch (error) {
    console.warn('Error during storage cleanup:', error);
  }
};

// Compress large data before storage
export const compressData = (data: any): string => {
  try {
    // Simple compression: remove unnecessary whitespace and use shorter property names
    const compressed = JSON.stringify(data, null, 0);
    return compressed;
  } catch (error) {
    console.warn('Compression failed, using original data:', error);
    return JSON.stringify(data);
  }
};

// Decompress data after retrieval
export const decompressData = (compressedData: string): any => {
  try {
    return JSON.parse(compressedData);
  } catch (error) {
    console.warn('Decompression failed:', error);
    return null;
  }
};

// Storage quota management
export const checkStorageQuota = (): { localStorage: number; sessionStorage: number } => {
  return {
    localStorage: getStorageSpace('localStorage'),
    sessionStorage: getStorageSpace('sessionStorage')
  };
};

// Clear all storage data (use with caution)
export const clearAllStorage = (): void => {
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (error) {
    console.warn('Error clearing storage:', error);
  }
}; 