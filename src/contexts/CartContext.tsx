import React, { createContext, useContext, useState, useEffect } from 'react';
import { safeSetItem, safeGetItem } from '@/lib/storageUtils';
import { releaseReservedStock } from '@/lib/storeUtils';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  productId: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: React.ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load cart from storage on mount
  useEffect(() => {
    const savedCart = safeGetItem('cart');
    if (savedCart && Array.isArray(savedCart)) {
      setItems(savedCart);
    }
  }, []);

  // Save cart to storage whenever items change
  useEffect(() => {
    if (items.length > 0) {
      safeSetItem('cart', items);
    } else {
      // Clear storage when cart is empty
      try {
        localStorage.removeItem('cart');
        sessionStorage.removeItem('cart');
      } catch (error) {
        console.warn('Error clearing cart storage:', error);
      }
    }
  }, [items]);

  const addToCart = (newItem: Omit<CartItem, 'id'>) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.productId === newItem.productId);
      
      if (existingItem) {
        // Update quantity if item already exists
        return prevItems.map(item =>
          item.productId === newItem.productId
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item
        );
      } else {
        // Add new item
        return [...prevItems, { ...newItem, id: `${newItem.productId}-${Date.now()}` }];
      }
    });
  };

  const removeFromCart = (id: string) => {
    setItems(prevItems => {
      const itemToRemove = prevItems.find(item => item.id === id);
      if (itemToRemove) {
        // Release reserved stock when item is removed from cart
        const appId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
        if (appId) {
          releaseReservedStock(appId, itemToRemove.productId, itemToRemove.quantity).catch(error => {
            console.error('Error releasing reserved stock:', error);
          });
        }
      }
      return prevItems.filter(item => item.id !== id);
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    setItems(prevItems => {
      const currentItem = prevItems.find(item => item.id === id);
      if (currentItem) {
        const quantityDifference = quantity - currentItem.quantity;
        const appId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
        
        // If quantity increased, we need to reserve more stock
        // If quantity decreased, we need to release some stock
        if (appId && quantityDifference !== 0) {
          if (quantityDifference > 0) {
            // Quantity increased - reserve more stock
            // This would need to be handled in the component that calls updateQuantity
          } else {
            // Quantity decreased - release some stock
            releaseReservedStock(appId, currentItem.productId, Math.abs(quantityDifference)).catch(error => {
              console.error('Error releasing reserved stock:', error);
            });
          }
        }
      }
      
      return prevItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      );
    });
  };

  const clearCart = () => {
    setItems(prevItems => {
      // Release all reserved stock when cart is cleared
      const appId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
      if (appId) {
        prevItems.forEach(item => {
          releaseReservedStock(appId, item.productId, item.quantity).catch(error => {
            console.error('Error releasing reserved stock:', error);
          });
        });
      }
      return [];
    });
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const value: CartContextType = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
    isCartOpen,
    setIsCartOpen,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}; 