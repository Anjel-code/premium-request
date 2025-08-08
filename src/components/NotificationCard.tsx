import React, { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bell,
  CheckCircle,
  MessageSquare,
  DollarSign,
  Package,
  Trash2,
  Loader2,
} from "lucide-react";

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

interface NotificationCardProps {
  notification: Notification;
  index: number;
  performingAction: string | null;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const NotificationCard = memo<NotificationCardProps>(({
  notification,
  index,
  performingAction,
  onMarkAsRead,
  onDelete,
}) => {
  // Get notification icon based on type
  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "order_status":
        return <Package className="h-5 w-5 text-primary" />;
      case "payment":
        return <DollarSign className="h-5 w-5 text-secondary" />;
      case "support":
        return <MessageSquare className="h-5 w-5 text-accent" />;
      case "assignment":
        return <CheckCircle className="h-5 w-5 text-primary" />;
      case "completion":
        return <CheckCircle className="h-5 w-5 text-secondary" />;
      case "message":
        return <Bell className="h-5 w-5 text-accent" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  // Get priority color
  const getPriorityColor = (priority: Notification["priority"]) => {
    switch (priority) {
      case "high":
        return "border-primary/20 bg-primary/5";
      case "medium":
        return "border-secondary/20 bg-secondary/5";
      case "low":
        return "border-accent/20 bg-accent/5";
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

  return (
    <Card
      className={`border-0 shadow-elegant transition-all duration-300 hover:shadow-premium hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4 ${
        !notification.read
          ? "bg-accent/5 border-l-4 border-l-accent"
          : ""
      } ${getPriorityColor(notification.priority)}`}
      style={{
        animationDelay: `${index * 100}ms`,
        animationFillMode: "both",
      }}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="p-1.5 sm:p-2 bg-white rounded-full shadow-sm flex-shrink-0">
            {getNotificationIcon(notification.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold mb-1 text-primary text-sm sm:text-base">
                  {notification.title}
                </h3>
                <p className="text-muted-foreground mb-2 text-xs sm:text-sm">
                  {notification.message}
                </p>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                  <span>{formatTimeAgo(notification.createdAt)}</span>
                  {notification.ticketNumber && (
                    <span className="font-mono bg-muted px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs">
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
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                {!notification.read && (
                  <Badge
                    variant="outline"
                    className="text-accent border-accent text-xs"
                  >
                    New
                  </Badge>
                )}
                {!notification.read && (
                  <Button
                    onClick={() => onMarkAsRead(notification.id)}
                    variant="ghost"
                    size="sm"
                    disabled={performingAction === `mark-read-${notification.id}`}
                    className="text-xs text-muted-foreground hover:text-primary transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed h-8 px-2"
                  >
                    {performingAction === `mark-read-${notification.id}` ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Mark read"
                    )}
                  </Button>
                )}
                <Button
                  onClick={() => onDelete(notification.id)}
                  variant="ghost"
                  size="sm"
                  disabled={performingAction === `delete-${notification.id}`}
                  className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed h-8 w-8 p-0"
                >
                  {performingAction === `delete-${notification.id}` ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

NotificationCard.displayName = "NotificationCard";

export default NotificationCard; 