import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

// Interface for tracking event
export interface TrackingEvent {
  id: string;
  timestamp: Date;
  location: string;
  status: string;
  description: string;
  usePurpleColor?: boolean; // Optional flag to use purple color for this timeline point
}

// Interface for tracking information
export interface TrackingInfo {
  trackingNumber: string;
  carrier: string;
  status: "pending" | "in_transit" | "out_for_delivery" | "delivered";
  estimatedDelivery: Date;
  currentLocation: string;
  trackingHistory?: TrackingEvent[];
}

// Interface for store order data
export interface StoreOrder {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  productId: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  totalPrice?: number;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  paymentStatus: "pending" | "completed" | "failed";
  createdAt: Date;
  updatedAt: Date;
  trackingInfo?: TrackingInfo;
  // Shipping information
  shippingInfo?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

// Interface for store notification
export interface StoreNotification {
  id: string;
  userId: string;
  type: "store_order" | "store_payment" | "store_shipping" | "store_delivery";
  title: string;
  message: string;
  orderId?: string;
  productName?: string;
  amount?: number;
  createdAt: Date;
  read: boolean;
  priority: "low" | "medium" | "high";
}

// Interface for product stock data
export interface ProductStock {
  productId: string;
  stockCount: number;
  lastUpdated: Date;
  reservedStock: number; // Stock reserved in carts but not yet purchased
}

// Function to get current stock count
export const getProductStock = async (appId: string, productId: string): Promise<number> => {
  if (!db) {
    throw new Error("Firestore not initialized");
  }

  try {
    const stockRef = doc(db, `artifacts/${appId}/public/data/product-stock`, productId);
    const stockDoc = await getDoc(stockRef);
    
    if (stockDoc.exists()) {
      return stockDoc.data().stockCount || 0;
    } else {
      // If no stock document exists, create one with default stock
      await setDoc(stockRef, {
        productId,
        stockCount: 15, // Default stock
        lastUpdated: serverTimestamp(),
        reservedStock: 0,
      });
      return 15;
    }
  } catch (error) {
    console.error("Error getting product stock:", error);
    return 0;
  }
};

// Function to update product stock
export const updateProductStock = async (appId: string, productId: string, newStockCount: number): Promise<void> => {
  if (!db) {
    throw new Error("Firestore not initialized");
  }

  try {
    const stockRef = doc(db, `artifacts/${appId}/public/data/product-stock`, productId);
    
    // First check if document exists
    const stockDoc = await getDoc(stockRef);
    
    if (stockDoc.exists()) {
      // Document exists, update it
      await updateDoc(stockRef, {
        productId,
        stockCount: newStockCount,
        lastUpdated: serverTimestamp(),
      });
    } else {
      // Document doesn't exist, create it
      await setDoc(stockRef, {
        productId,
        stockCount: newStockCount,
        lastUpdated: serverTimestamp(),
        reservedStock: 0,
      });
    }
  } catch (error) {
    console.error("Error updating product stock:", error);
    throw error;
  }
};

// Function to reserve stock (when added to cart)
export const reserveStock = async (appId: string, productId: string, quantity: number): Promise<boolean> => {
  if (!db) {
    throw new Error("Firestore not initialized");
  }

  try {
    const stockRef = doc(db, `artifacts/${appId}/public/data/product-stock`, productId);
    const stockDoc = await getDoc(stockRef);
    
    if (stockDoc.exists()) {
      const currentStock = stockDoc.data().stockCount || 0;
      const reservedStock = stockDoc.data().reservedStock || 0;
      const availableStock = currentStock - reservedStock;
      
      if (availableStock >= quantity) {
        await updateDoc(stockRef, {
          reservedStock: reservedStock + quantity,
          lastUpdated: serverTimestamp(),
        });
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error("Error reserving stock:", error);
    return false;
  }
};

// Function to release reserved stock (when removed from cart)
export const releaseReservedStock = async (appId: string, productId: string, quantity: number): Promise<void> => {
  if (!db) {
    throw new Error("Firestore not initialized");
  }

  try {
    const stockRef = doc(db, `artifacts/${appId}/public/data/product-stock`, productId);
    const stockDoc = await getDoc(stockRef);
    
    if (stockDoc.exists()) {
      const reservedStock = stockDoc.data().reservedStock || 0;
      const newReservedStock = Math.max(0, reservedStock - quantity);
      
      await updateDoc(stockRef, {
        reservedStock: newReservedStock,
        lastUpdated: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("Error releasing reserved stock:", error);
  }
};

// Function to purchase stock (when payment is successful)
export const purchaseStock = async (appId: string, productId: string, quantity: number): Promise<void> => {
  if (!db) {
    throw new Error("Firestore not initialized");
  }

  try {
    const stockRef = doc(db, `artifacts/${appId}/public/data/product-stock`, productId);
    const stockDoc = await getDoc(stockRef);
    
    if (stockDoc.exists()) {
      const currentStock = stockDoc.data().stockCount || 0;
      const reservedStock = stockDoc.data().reservedStock || 0;
      
      // Reduce both actual stock and reserved stock
      const newStockCount = Math.max(0, currentStock - quantity);
      const newReservedStock = Math.max(0, reservedStock - quantity);
      
      await updateDoc(stockRef, {
        stockCount: newStockCount,
        reservedStock: newReservedStock,
        lastUpdated: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("Error purchasing stock:", error);
    throw error;
  }
};

// Function to create a store order
export const createStoreOrder = async (
  appId: string,
  orderData: Omit<StoreOrder, "id" | "createdAt" | "updatedAt">
): Promise<string> => {
  if (!db) {
    throw new Error("Firestore not initialized");
  }

  try {
    console.log(
      "Creating store order in collection:",
      `artifacts/${appId}/public/data/store-orders`
    );
    console.log("Order data:", orderData);

    const ordersRef = collection(
      db,
      `artifacts/${appId}/public/data/store-orders`
    );
    const docRef = await addDoc(ordersRef, {
      ...orderData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log("Store order created successfully with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error creating store order:", error);
    throw error;
  }
};

// Function to create a store notification
export const createStoreNotification = async (
  appId: string,
  notificationData: Omit<StoreNotification, "id" | "createdAt">
): Promise<string> => {
  if (!db) {
    throw new Error("Firestore not initialized");
  }

  try {
    const notificationsRef = collection(
      db,
      `artifacts/${appId}/public/data/notifications`
    );
    const docRef = await addDoc(notificationsRef, {
      ...notificationData,
      createdAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error("Error creating store notification:", error);
    throw error;
  }
};

// Function to handle successful store payment
export const handleStorePaymentSuccess = async (
  appId: string,
  userId: string,
  userEmail: string,
  userName: string,
  productName: string,
  amount: number,
  orderId: string,
  productId: string,
  quantity: number
) => {
  try {
    // Purchase the stock (reduce actual stock count)
    await purchaseStock(appId, productId, quantity);

    // Create payment success notification
    await createStoreNotification(appId, {
      userId,
      type: "store_payment",
      title: "Payment Successful",
      message: `Your payment of $${amount.toFixed(
        2
      )} for ${productName} has been processed successfully. Your order is being prepared for shipment.`,
      orderId,
      productName,
      amount,
      read: false,
      priority: "medium",
    });

    // Note: Shipping notification will be created separately when the order is actually shipped
    // This prevents showing "Order Shipped" immediately after payment
  } catch (error) {
    console.error("Error handling store payment success:", error);
  }
};

// Function to create initial store order notification
export const createStoreOrderNotification = async (
  appId: string,
  userId: string,
  userEmail: string,
  userName: string,
  productName: string,
  amount: number,
  orderId: string
) => {
  try {
    await createStoreNotification(appId, {
      userId,
      type: "store_order",
      title: "Order Placed",
      message: `Your order for ${productName} has been placed successfully. Total: $${amount.toFixed(
        2
      )}`,
      orderId,
      productName,
      amount,
      read: false,
      priority: "high",
    });
  } catch (error) {
    console.error("Error creating store order notification:", error);
  }
};

// Function to create shipping notification when order is actually shipped
export const createStoreShippingNotification = async (
  appId: string,
  userId: string,
  productName: string,
  orderId: string,
  trackingNumber: string
) => {
  try {
    await createStoreNotification(appId, {
      userId,
      type: "store_shipping",
      title: "Order Shipped",
      message: `Your order for ${productName} has been shipped! Tracking number: ${trackingNumber}`,
      orderId,
      productName,
      read: false,
      priority: "high",
    });
  } catch (error) {
    console.error("Error creating store shipping notification:", error);
  }
};

// Function to create delivery notification when order is delivered
export const createStoreDeliveryNotification = async (
  appId: string,
  userId: string,
  productName: string,
  orderId: string
) => {
  try {
    await createStoreNotification(appId, {
      userId,
      type: "store_delivery",
      title: "Order Delivered",
      message: `Your order for ${productName} has been delivered! Enjoy your purchase.`,
      orderId,
      productName,
      read: false,
      priority: "high",
    });
  } catch (error) {
    console.error("Error creating store delivery notification:", error);
  }
};
