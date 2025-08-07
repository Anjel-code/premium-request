import { useState, useEffect, useMemo, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Loader2,
  MessageSquare,
  DollarSign,
  Package,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationSkeletonList } from "@/components/NotificationSkeleton";
import NotificationCard from "@/components/NotificationCard";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { 
  deleteNotification, 
  deleteAllNotifications, 
  getPaginatedNotifications,
  clearNotificationCache,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from "../lib/notificationUtils";
import { getUserRoles } from "../lib/userUtils";

// Define the Notification interface
interface Notification {
  id: string;
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
  createdAt: Date;
  read: boolean;
  readAt?: Date;
  priority: "low" | "medium" | "high";
}

interface DashboardNotificationsProps {
  user: any;
  appId: string;
}

const DashboardNotifications: React.FC<DashboardNotificationsProps> = ({
  user,
  appId,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [performingAction, setPerformingAction] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);

  // Fetch user roles and initial notifications
  useEffect(() => {
    if (!user || !appId) {
      setLoading(false);
      return;
    }

    const fetchUserDataAndNotifications = async () => {
      try {
        // First, get user roles
        console.log("Fetching user roles for:", user.uid);
        const roles = await getUserRoles(user.uid);
        setUserRoles(roles);
        console.log("User roles:", roles);

        // Then fetch notifications
        console.log("Fetching notifications for user:", user.uid, "appId:", appId);
        const result = await getPaginatedNotifications(appId, user.uid, 20);
        console.log("Notifications fetched successfully:", result.notifications.length);
        setNotifications(result.notifications);
        setHasMore(result.hasMore);
        setLastDoc(result.lastDoc);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching user data or notifications:", err);
        // Check if it's a permission error
        if (err instanceof Error && err.message.includes('permission-denied')) {
          setError("You don't have permission to view notifications. Please contact support.");
        } else {
          setError("Failed to load notifications. Please try again.");
        }
        setLoading(false);
      }
    };

    fetchUserDataAndNotifications();
  }, [user, appId]);

  // Load more notifications
  const loadMoreNotifications = useCallback(async () => {
    if (!user || !appId || !hasMore || loadingMore) return;

    setLoadingMore(true);
    try {
      const result = await getPaginatedNotifications(appId, user.uid, 20, lastDoc);
      setNotifications(prev => [...prev, ...result.notifications]);
      setHasMore(result.hasMore);
      setLastDoc(result.lastDoc);
    } catch (err) {
      console.error("Error loading more notifications:", err);
      setError("Failed to load more notifications. Please try again.");
    } finally {
      setLoadingMore(false);
    }
  }, [user, appId, hasMore, loadingMore, lastDoc]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    if (!db || !appId || !user) return;

    setPerformingAction(`mark-read-${notificationId}`);
    try {
      await markNotificationAsRead(appId, notificationId, user.uid);
      
      // Update local state immediately
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true, readAt: new Date() }
            : notification
        )
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    } finally {
      setPerformingAction(null);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!appId || !user) return;

    setPerformingAction("mark-all-read");
    try {
      await markAllNotificationsAsRead(appId, user.uid);
      
      // Update local state immediately
      setNotifications(prev => 
        prev.map(notification => 
          !notification.read 
            ? { ...notification, read: true, readAt: new Date() }
            : notification
        )
      );
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    } finally {
      setPerformingAction(null);
    }
  };

  // Delete a single notification
  const handleDeleteNotification = async (notificationId: string) => {
    if (!appId || !user) return;

    setPerformingAction(`delete-${notificationId}`);
    try {
      await deleteNotification(appId, notificationId, user.uid);
      
      // Update local state immediately
      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      );
    } catch (err) {
      console.error("Error deleting notification:", err);
      setError("Failed to delete notification. Please try again.");
    } finally {
      setPerformingAction(null);
    }
  };

  // Delete all notifications
  const handleClearAllNotifications = async () => {
    if (!appId || !user) return;

    setPerformingAction("clear-all");
    try {
      await deleteAllNotifications(appId, user.uid);
      
      // Update local state immediately
      setNotifications([]);
    } catch (err) {
      console.error("Error deleting all notifications:", err);
      setError("Failed to clear all notifications. Please try again.");
    } finally {
      setPerformingAction(null);
    }
  };



  const unreadCount = useMemo(() => 
    notifications.filter((n) => !n.read).length, 
    [notifications]
  );

  if (loading) {
    return (
      <DashboardLayout user={user} appId={appId}>
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-primary">Notifications</h1>
            <div className="flex items-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          </div>
          <NotificationSkeletonList />
        </div>
      </DashboardLayout>
    );
  }

  // Check if user has proper roles
  const hasValidRoles = userRoles.length > 0 && (
    userRoles.includes('admin') || 
    userRoles.includes('team_member') || 
    userRoles.includes('customer')
  );

  if (!hasValidRoles) {
    return (
      <DashboardLayout user={user} appId={appId}>
        <div className="space-y-6 animate-in fade-in duration-500 slide-in-from-bottom-4">
          <h1 className="text-3xl font-bold text-primary">Notifications</h1>
          <Card className="border-yellow-200 bg-yellow-50 animate-in fade-in duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 animate-pulse" />
                <span className="text-yellow-800">
                  Your account doesn't have the necessary permissions to view notifications. 
                  Please contact support to update your account permissions.
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout user={user} appId={appId}>
        <div className="space-y-6 animate-in fade-in duration-500 slide-in-from-bottom-4">
          <h1 className="text-3xl font-bold text-primary">Notifications</h1>
          <Card className="border-red-200 bg-red-50 animate-in fade-in duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600 animate-pulse" />
                <span className="text-red-800">{error}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} appId={appId}>
      <div className="space-y-6 animate-in fade-in duration-500 slide-in-from-bottom-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Notifications</h1>
            <p className="text-muted-foreground">
              {notifications.length} total, {unreadCount} unread
            </p>
          </div>
          <div className="flex gap-2">
            {notifications.length > 0 && (
              <Button
                onClick={handleClearAllNotifications}
                variant="outline"
                size="sm"
                disabled={performingAction === "clear-all"}
                className="text-red-600 border-red-200 hover:bg-red-50 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {performingAction === "clear-all" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                {performingAction === "clear-all" ? "Clearing..." : "Clear All"}
              </Button>
            )}
            {unreadCount > 0 && (
              <Button
                onClick={markAllAsRead}
                variant="outline"
                size="sm"
                disabled={performingAction === "mark-all-read"}
                className="text-accent border-accent hover:bg-accent/10 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {performingAction === "mark-all-read" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {performingAction === "mark-all-read" ? "Marking..." : "Mark All Read"}
              </Button>
            )}
          </div>
        </div>

        {notifications.length === 0 ? (
          <Card className="border-0 shadow-elegant animate-in fade-in duration-500 slide-in-from-bottom-4">
            <CardContent className="p-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                No notifications yet
              </h3>
              <p className="text-sm text-muted-foreground">
                You'll see notifications here when there are updates to your
                orders or account.
              </p>
            </CardContent>
          </Card>
        ) : (
                    <div className="space-y-4">
            {notifications.map((notification, index) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                index={index}
                performingAction={performingAction}
                onMarkAsRead={markAsRead}
                onDelete={handleDeleteNotification}
              />
            ))}
          </div>
         )}

         {/* Load More Button */}
         {hasMore && (
           <div className="flex justify-center mt-6">
             <Button
               onClick={loadMoreNotifications}
               variant="outline"
               disabled={loadingMore}
               className="transition-all duration-200 hover:scale-105"
             >
               {loadingMore ? (
                 <>
                   <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                   Loading...
                 </>
               ) : (
                 "Load More"
               )}
             </Button>
           </div>
         )}
       </div>
     </DashboardLayout>
   );
 };

export default DashboardNotifications;
