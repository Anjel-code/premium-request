import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  writeBatch,
  deleteDoc,
  limit,
  startAfter,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "../firebase";

// Cache for notification counts
const notificationCountCache = new Map<string, { count: number; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export interface NotificationData {
  userId: string;
  type:
    | "order_status"
    | "payment"
    | "support"
    | "assignment"
    | "completion"
    | "message";
  title: string;
  message: string;
  orderId?: string;
  ticketNumber?: string;
  priority: "low" | "medium" | "high";
  read?: boolean;
}

export interface Notification extends NotificationData {
  id: string;
  createdAt: Date;
  read: boolean;
  readAt?: Date;
}

export interface PaginatedNotifications {
  notifications: Notification[];
  hasMore: boolean;
  lastDoc: any;
}

/**
 * Get cached unread notification count
 */
const getCachedUnreadCount = (cacheKey: string): number | null => {
  const cached = notificationCountCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.count;
  }
  return null;
};

/**
 * Set cached unread notification count
 */
const setCachedUnreadCount = (cacheKey: string, count: number): void => {
  notificationCountCache.set(cacheKey, { count, timestamp: Date.now() });
};

/**
 * Clear cache for a specific user
 */
export const clearNotificationCache = (appId: string, userId: string): void => {
  const cacheKey = `${appId}-${userId}`;
  notificationCountCache.delete(cacheKey);
};

/**
 * Create a new notification in Firebase with optimized batch write
 */
export const createNotification = async (
  appId: string,
  notificationData: NotificationData
): Promise<string> => {
  if (!db || !appId) {
    throw new Error("Firebase database or appId not available");
  }

  try {
    const notificationsRef = collection(
      db,
      `artifacts/${appId}/public/data/notifications`
    );
    const docRef = await addDoc(notificationsRef, {
      ...notificationData,
      read: false,
      createdAt: serverTimestamp(),
    });

    // Clear cache for this user
    clearNotificationCache(appId, notificationData.userId);

    return docRef.id;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw new Error("Failed to create notification");
  }
};

/**
 * Mark a notification as read with cache invalidation
 */
export const markNotificationAsRead = async (
  appId: string,
  notificationId: string,
  userId: string
): Promise<void> => {
  if (!db || !appId) {
    throw new Error("Firebase database or appId not available");
  }

  try {
    const notificationRef = doc(
      db,
      `artifacts/${appId}/public/data/notifications`,
      notificationId
    );
    await updateDoc(notificationRef, {
      read: true,
      readAt: serverTimestamp(),
    });

    // Clear cache for this user
    clearNotificationCache(appId, userId);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw new Error("Failed to mark notification as read");
  }
};

/**
 * Mark all notifications as read for a user with optimized batch operation
 */
export const markAllNotificationsAsRead = async (
  appId: string,
  userId: string
): Promise<void> => {
  if (!db || !appId) {
    throw new Error("Firebase database or appId not available");
  }

  try {
    const notificationsRef = collection(
      db,
      `artifacts/${appId}/public/data/notifications`
    );
    const q = query(
      notificationsRef,
      where("userId", "==", userId),
      where("read", "==", false),
      limit(500) // Limit batch size for performance
    );

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return;
    }

    const batch = writeBatch(db);
    const batchSize = 500; // Firestore batch limit
    let currentBatch = writeBatch(db);
    let operationCount = 0;

    for (const docSnapshot of querySnapshot.docs) {
      const notificationRef = doc(
        db,
        `artifacts/${appId}/public/data/notifications`,
        docSnapshot.id
      );
      currentBatch.update(notificationRef, {
        read: true,
        readAt: serverTimestamp(),
      });
      operationCount++;

      // Commit batch when it reaches the limit
      if (operationCount % batchSize === 0) {
        await currentBatch.commit();
        currentBatch = writeBatch(db);
      }
    }

    // Commit remaining operations
    if (operationCount % batchSize !== 0) {
      await currentBatch.commit();
    }

    // Clear cache for this user
    clearNotificationCache(appId, userId);
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw new Error("Failed to mark all notifications as read");
  }
};

/**
 * Get unread notification count for a user with caching
 */
export const getUnreadNotificationCount = async (
  appId: string,
  userId: string
): Promise<number> => {
  if (!db || !appId) {
    return 0;
  }

  const cacheKey = `${appId}-${userId}`;
  const cachedCount = getCachedUnreadCount(cacheKey);
  
  if (cachedCount !== null) {
    return cachedCount;
  }

  try {
    const notificationsRef = collection(
      db,
      `artifacts/${appId}/public/data/notifications`
    );
    const q = query(
      notificationsRef,
      where("userId", "==", userId),
      where("read", "==", false)
    );

    const snapshot = await getCountFromServer(q);
    const count = snapshot.data().count;
    
    // Cache the result
    setCachedUnreadCount(cacheKey, count);
    
    return count;
  } catch (error) {
    console.error("Error getting unread notification count:", error);
    return 0;
  }
};

/**
 * Get paginated notifications for better performance
 */
export const getPaginatedNotifications = async (
  appId: string,
  userId: string,
  pageSize: number = 20,
  lastDoc?: any
): Promise<PaginatedNotifications> => {
  if (!db || !appId) {
    return { notifications: [], hasMore: false, lastDoc: null };
  }

  try {
    console.log("Getting paginated notifications for userId:", userId, "appId:", appId);
    const notificationsRef = collection(
      db,
      `artifacts/${appId}/public/data/notifications`
    );
    
    let q = query(
      notificationsRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );

    if (lastDoc) {
      q = query(
        notificationsRef,
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        startAfter(lastDoc),
        limit(pageSize)
      );
    }

    const querySnapshot = await getDocs(q);
    console.log("Query successful, found", querySnapshot.docs.length, "notifications");
    
    const notifications: Notification[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Notification[];

    const hasMore = querySnapshot.docs.length === pageSize;
    const newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];

    return {
      notifications,
      hasMore,
      lastDoc: newLastDoc,
    };
  } catch (error) {
    console.error("Error getting paginated notifications:", error);
    // Re-throw the error to be handled by the calling component
    throw error;
  }
};

/**
 * Create notification for order status change
 */
export const createOrderStatusNotification = async (
  appId: string,
  userId: string,
  orderId: string,
  ticketNumber: string,
  oldStatus: string,
  newStatus: string
): Promise<string> => {
  const title = `Order ${ticketNumber} Status Update`;
  const message = `Your order status has changed from ${oldStatus} to ${newStatus}.`;

  return createNotification(appId, {
    userId,
    type: "order_status",
    title,
    message,
    orderId,
    ticketNumber,
    priority: "medium",
  });
};

/**
 * Create notification for payment received
 */
export const createPaymentNotification = async (
  appId: string,
  userId: string,
  orderId: string,
  ticketNumber: string,
  amount?: string
): Promise<string> => {
  const title = "Payment Received";
  const message = amount
    ? `Payment of ${amount} for order ${ticketNumber} has been confirmed.`
    : `Payment for order ${ticketNumber} has been confirmed.`;

  return createNotification(appId, {
    userId,
    type: "payment",
    title,
    message,
    orderId,
    ticketNumber,
    priority: "high",
  });
};

/**
 * Create notification for order assignment (for team members)
 */
export const createAssignmentNotification = async (
  appId: string,
  userId: string,
  orderId: string,
  ticketNumber: string
): Promise<string> => {
  const title = `New Order Assigned`;
  const message = `You have been assigned to work on order ${ticketNumber}.`;

  return createNotification(appId, {
    userId,
    type: "assignment",
    title,
    message,
    orderId,
    ticketNumber,
    priority: "high",
  });
};

/**
 * Create notification for order completion
 */
export const createCompletionNotification = async (
  appId: string,
  userId: string,
  orderId: string,
  ticketNumber: string
): Promise<string> => {
  const title = `Order ${ticketNumber} Completed`;
  const message = `Your order has been completed and is ready for review.`;

  return createNotification(appId, {
    userId,
    type: "completion",
    title,
    message,
    orderId,
    ticketNumber,
    priority: "high",
  });
};

/**
 * Create notification for new message
 */
export const createMessageNotification = async (
  appId: string,
  userId: string,
  orderId: string,
  ticketNumber: string,
  senderName: string
): Promise<string> => {
  const title = `New Message from ${senderName}`;
  const message = `You have received a new message regarding order ${ticketNumber}.`;

  return createNotification(appId, {
    userId,
    type: "message",
    title,
    message,
    orderId,
    ticketNumber,
    priority: "medium",
  });
};

/**
 * Create notification for support message
 */
export const createSupportNotification = async (
  appId: string,
  customerUid: string,
  senderName: string,
  messageText: string
): Promise<string> => {
  const title = `New Support Message from ${senderName}`;
  const message = `You have received a new support message: "${messageText.substring(0, 100)}${messageText.length > 100 ? '...' : ''}"`;

  return createNotification(appId, {
    userId: customerUid,
    type: "support",
    title,
    message,
    priority: "medium",
  });
};

/**
 * Delete a single notification with cache invalidation
 */
export const deleteNotification = async (
  appId: string,
  notificationId: string,
  userId: string
): Promise<void> => {
  if (!db || !appId) {
    throw new Error("Firebase database or appId not available");
  }

  try {
    const notificationRef = doc(
      db,
      `artifacts/${appId}/public/data/notifications`,
      notificationId
    );
    await deleteDoc(notificationRef);

    // Clear cache for this user
    clearNotificationCache(appId, userId);
  } catch (error) {
    console.error("Error deleting notification:", error);
    throw new Error("Failed to delete notification");
  }
};

/**
 * Delete all notifications for a user with optimized batch operation
 */
export const deleteAllNotifications = async (
  appId: string,
  userId: string
): Promise<void> => {
  if (!db || !appId) {
    throw new Error("Firebase database or appId not available");
  }

  try {
    const notificationsRef = collection(
      db,
      `artifacts/${appId}/public/data/notifications`
    );
    const q = query(
      notificationsRef,
      where("userId", "==", userId),
      limit(500) // Limit batch size for performance
    );

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return;
    }

    const batchSize = 500; // Firestore batch limit
    let currentBatch = writeBatch(db);
    let operationCount = 0;

    for (const docSnapshot of querySnapshot.docs) {
      const notificationRef = doc(
        db,
        `artifacts/${appId}/public/data/notifications`,
        docSnapshot.id
      );
      currentBatch.delete(notificationRef);
      operationCount++;

      // Commit batch when it reaches the limit
      if (operationCount % batchSize === 0) {
        await currentBatch.commit();
        currentBatch = writeBatch(db);
      }
    }

    // Commit remaining operations
    if (operationCount % batchSize !== 0) {
      await currentBatch.commit();
    }

    // Clear cache for this user
    clearNotificationCache(appId, userId);
  } catch (error) {
    console.error("Error deleting all notifications:", error);
    throw new Error("Failed to delete all notifications");
  }
};
