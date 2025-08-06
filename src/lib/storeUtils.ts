import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

// Interface for tracking event
export interface TrackingEvent {
  id: string;
  timestamp: Date;
  location: string;
  status: string;
  description: string;
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
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  paymentStatus: "pending" | "completed" | "failed";
  createdAt: Date;
  updatedAt: Date;
  trackingInfo?: TrackingInfo;
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
  orderId: string
) => {
  try {
    // Create payment success notification only
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
