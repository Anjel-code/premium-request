import { useState, useEffect } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

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

  // Fetch notifications from Firebase
  useEffect(() => {
    if (!user || !db || !appId) {
      setLoading(false);
      return;
    }

    const notificationsRef = collection(
      db,
      `artifacts/${appId}/public/data/notifications`
    );
    const q = query(
      notificationsRef,
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedNotifications: Notification[] = snapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
          })
        ) as Notification[];

        setNotifications(fetchedNotifications);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching notifications:", err);
        setError("Failed to load notifications. Please try again.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, appId]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    if (!db || !appId) return;

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
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!db || !appId) return;

    try {
      const unreadNotifications = notifications.filter((n) => !n.read);
      const batch = db.batch();

      unreadNotifications.forEach((notification) => {
        const notificationRef = doc(
          db,
          `artifacts/${appId}/public/data/notifications`,
          notification.id
        );
        batch.update(notificationRef, {
          read: true,
          readAt: serverTimestamp(),
        });
      });

      await batch.commit();
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "order_status":
        return <Package className="h-5 w-5 text-blue-600" />;
      case "payment":
        return <DollarSign className="h-5 w-5 text-green-600" />;
      case "support":
        return <MessageSquare className="h-5 w-5 text-purple-600" />;
      case "assignment":
        return <CheckCircle className="h-5 w-5 text-accent" />;
      case "completion":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "message":
        return <Bell className="h-5 w-5 text-orange-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  // Get priority color
  const getPriorityColor = (priority: Notification["priority"]) => {
    switch (priority) {
      case "high":
        return "border-red-200 bg-red-50";
      case "medium":
        return "border-yellow-200 bg-yellow-50";
      case "low":
        return "border-green-200 bg-green-50";
      default:
        return "";
    }
  };

  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-primary">Notifications</h1>
            <div className="flex items-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          </div>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-primary">Notifications</h1>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-800">{error}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Notifications</h1>
            <p className="text-muted-foreground">
              {notifications.length} total, {unreadCount} unread
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              variant="outline"
              size="sm"
              className="text-accent border-accent hover:bg-accent/10"
            >
              Mark all as read
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <Card className="border-0 shadow-elegant">
            <CardContent className="p-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`border-0 shadow-elegant transition-all duration-200 hover:shadow-premium ${
                  !notification.read
                    ? "bg-accent/5 border-l-4 border-l-accent"
                    : ""
                } ${getPriorityColor(notification.priority)}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-white rounded-full shadow-sm">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1 text-primary">
                            {notification.title}
                          </h3>
                          <p className="text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{formatTimeAgo(notification.createdAt)}</span>
                            {notification.ticketNumber && (
                              <span className="font-mono bg-muted px-2 py-1 rounded">
                                {notification.ticketNumber}
                              </span>
                            )}
                            {notification.priority === "high" && (
                              <Badge variant="destructive" className="text-xs">
                                High Priority
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <Badge
                              variant="outline"
                              className="text-accent border-accent"
                            >
                              New
                            </Badge>
                          )}
                          {!notification.read && (
                            <Button
                              onClick={() => markAsRead(notification.id)}
                              variant="ghost"
                              size="sm"
                              className="text-xs text-muted-foreground hover:text-primary"
                            >
                              Mark read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardNotifications;
