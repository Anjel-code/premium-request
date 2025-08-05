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
} from "firebase/firestore";
import { db } from "../firebase";

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

/**
 * Create a new notification in Firebase
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

    return docRef.id;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw new Error("Failed to create notification");
  }
};

/**
 * Mark a notification as read
 */
export const markNotificationAsRead = async (
  appId: string,
  notificationId: string
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
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw new Error("Failed to mark notification as read");
  }
};

/**
 * Mark all notifications as read for a user
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
      where("read", "==", false)
    );

    const querySnapshot = await getDocs(q);
    const batch = db.batch();

    querySnapshot.docs.forEach((docSnapshot) => {
      const notificationRef = doc(
        db,
        `artifacts/${appId}/public/data/notifications`,
        docSnapshot.id
      );
      batch.update(notificationRef, {
        read: true,
        readAt: serverTimestamp(),
      });
    });

    await batch.commit();
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw new Error("Failed to mark all notifications as read");
  }
};

/**
 * Get unread notification count for a user
 */
export const getUnreadNotificationCount = async (
  appId: string,
  userId: string
): Promise<number> => {
  if (!db || !appId) {
    return 0;
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

    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error("Error getting unread notification count:", error);
    return 0;
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
