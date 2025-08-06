import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  MapPin,
  Truck,
  Package,
  CheckCircle,
  AlertCircle,
  Plus,
  Edit,
  ChevronDown,
  ChevronUp,
  Settings,
} from "lucide-react";
import AdminTrackingManager from "./AdminTrackingManager";

interface TrackingEvent {
  id: string;
  timestamp: Date;
  location: string;
  status: string;
  description: string;
}

interface TrackingTimelineProps {
  trackingHistory: TrackingEvent[];
  currentStatus: string;
  onAddEvent?: () => void;
  onEditEvent?: (eventId: string) => void;
  onSaveTrackingHistory?: (events: TrackingEvent[]) => void;
  isAdmin?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const TrackingTimeline: React.FC<TrackingTimelineProps> = ({
  trackingHistory,
  currentStatus,
  onAddEvent,
  onEditEvent,
  onSaveTrackingHistory,
  isAdmin = false,
  isExpanded = false,
  onToggleExpand,
}) => {
  const [animationProgress, setAnimationProgress] = useState(0);
  const [isAdminManagerOpen, setIsAdminManagerOpen] = useState(false);

  useEffect(() => {
    if (isExpanded) {
      // Animate the progress line
      const timer = setTimeout(() => {
        setAnimationProgress(100);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setAnimationProgress(0);
    }
  }, [isExpanded]);
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "out for delivery":
        return <Truck className="h-5 w-5 text-blue-600" />;
      case "in transit":
        return <Truck className="h-5 w-5 text-purple-600" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <Package className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "out for delivery":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "in transit":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Generate mock tracking history if none exists
  const events =
    trackingHistory.length > 0
      ? trackingHistory
      : [
          {
            id: "1",
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            location: "Memphis, TN",
            status: "Package Picked Up",
            description: "Package has been picked up by carrier",
          },
          {
            id: "2",
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
            location: "Nashville, TN",
            status: "In Transit",
            description: "Package is in transit to destination",
          },
          {
            id: "3",
            timestamp: new Date(),
            location: "Local Facility",
            status:
              currentStatus === "delivered" ? "Delivered" : "Out for Delivery",
            description:
              currentStatus === "delivered"
                ? "Package has been delivered successfully"
                : "Package is out for delivery",
          },
        ];

  return (
    <Card className="border-0 shadow-premium rounded-xl">
      <CardHeader className="border-b border-border p-6">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold text-primary">
            Tracking History
          </CardTitle>
          <div className="flex gap-2">
            {onToggleExpand && (
              <Button
                onClick={onToggleExpand}
                size="sm"
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Collapse
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Expand
                  </>
                )}
              </Button>
            )}
            {isAdmin && onSaveTrackingHistory && (
              <Button
                onClick={() => setIsAdminManagerOpen(true)}
                size="sm"
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10"
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage Timeline
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {!isExpanded ? (
          <div className="text-center py-8">
            <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Click "Expand" to view detailed tracking timeline
            </p>
            <Button
              onClick={onToggleExpand}
              variant="outline"
              className="border-primary text-primary hover:bg-primary/10"
            >
              <ChevronDown className="h-4 w-4 mr-2" />
              View Tracking Timeline
            </Button>
          </div>
        ) : (
                <div className="relative">
          {/* Animated Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-muted-foreground/20"></div>
          <div 
            className="absolute left-6 top-0 w-0.5 bg-gradient-to-b from-primary to-primary transition-all duration-1000 ease-out"
            style={{ 
              height: `${animationProgress}%`,
              background: `linear-gradient(to bottom, hsl(var(--primary)) 0%, hsl(var(--primary)) ${animationProgress}%, hsl(var(--muted-foreground) / 0.2) ${animationProgress}%, hsl(var(--muted-foreground) / 0.2) 100%)`
            }}
          ></div>
          
          <div className="space-y-8">
            {events.map((event, index) => (
              <div key={event.id} className="relative flex items-start gap-6">
                {/* Timeline dot with animation */}
                <div className="relative z-10 flex-shrink-0">
                  <div 
                    className={`w-12 h-12 rounded-full bg-white border-4 flex items-center justify-center shadow-lg transition-all duration-500 ${
                      index * 100 / (events.length - 1) <= animationProgress 
                        ? 'border-primary scale-110' 
                        : 'border-muted-foreground/20 scale-100'
                    }`}
                  >
                    {getStatusIcon(event.status)}
                  </div>
                  
                  {/* Location name under dot */}
                  <div className="absolute top-16 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                    <div className="bg-white px-2 py-1 rounded-md shadow-sm border text-xs font-medium text-primary">
                      {event.location}
                    </div>
                  </div>
                  
                  {/* Animated connector line */}
                  {index < events.length - 1 && (
                    <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-0.5 h-12">
                      <div 
                        className={`w-full transition-all duration-1000 ease-out ${
                          (index + 1) * 100 / events.length <= animationProgress 
                            ? 'bg-gradient-to-b from-primary to-primary' 
                            : 'bg-gradient-to-b from-muted-foreground/20 to-muted-foreground/20'
                        }`}
                        style={{ height: '100%' }}
                      ></div>
                    </div>
                  )}
                </div>

                {/* Event content with animation */}
                <div 
                  className={`flex-grow bg-muted/30 rounded-lg p-4 border border-border/50 transition-all duration-500 ${
                    index * 100 / (events.length - 1) <= animationProgress 
                      ? 'opacity-100 translate-x-0' 
                      : 'opacity-50 translate-x-4'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(event.status)}>
                        {event.status}
                      </Badge>
                      {isAdmin && onEditEvent && (
                        <Button
                          onClick={() => onEditEvent(event.id)}
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 hover:bg-primary/10"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {event.timestamp.toLocaleDateString()}{" "}
                      {event.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-primary">
                      {event.location}
                    </span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {event.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* End cap */}
          <div className="relative flex items-center gap-4 mt-6">
            <div className="w-12 h-12 rounded-full bg-muted border-4 border-muted-foreground/20 flex items-center justify-center">
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-sm text-muted-foreground">
              Journey continues...
            </div>
          </div>
        </div>
        )}
      </CardContent>

      {/* Admin Tracking Manager */}
      {isAdmin && onSaveTrackingHistory && (
        <AdminTrackingManager
          trackingHistory={trackingHistory}
          onSaveTrackingHistory={onSaveTrackingHistory}
          isOpen={isAdminManagerOpen}
          onClose={() => setIsAdminManagerOpen(false)}
        />
      )}
    </Card>
  );
};

export default TrackingTimeline;
