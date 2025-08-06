import React, { useState, useEffect, useRef } from "react";
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
  const [isInViewport, setIsInViewport] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Intersection Observer to detect when timeline is in viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInViewport(entry.isIntersecting);
      },
      {
        threshold: 0.3, // Trigger when 30% of the element is visible
        rootMargin: "0px 0px -50px 0px", // Trigger slightly before fully in view
      }
    );

    if (timelineRef.current) {
      observer.observe(timelineRef.current);
    }

    return () => {
      if (timelineRef.current) {
        observer.unobserve(timelineRef.current);
      }
    };
  }, []);

  // Animation effect - only trigger when expanded AND in viewport AND hasn't animated yet
  useEffect(() => {
    if (isExpanded && isInViewport && !hasAnimated) {
      // Reset animation to 0 first
      setAnimationProgress(0);

      // Animate the progress line after a short delay
      const timer = setTimeout(() => {
        setAnimationProgress(100);
        setHasAnimated(true);
      }, 200);
      return () => clearTimeout(timer);
    } else if (!isExpanded) {
      setAnimationProgress(0);
      setHasAnimated(false);
    }
  }, [isExpanded, isInViewport, hasAnimated]);
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
            location: "Quibble",
            status: "Order Processed",
            description: "Order has been processed and is ready for shipment",
          },
          {
            id: "2",
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
            location: "Distribution Center",
            status: "In Transit",
            description: "Package is in transit to destination",
          },
          {
            id: "3",
            timestamp: currentStatus === "delivered" ? new Date() : null,
            location: "Customer",
            status:
              currentStatus === "delivered" ? "Delivered" : "To Be Delivered",
            description:
              currentStatus === "delivered"
                ? "Package has been delivered successfully"
                : "Awaiting delivery confirmation",
          },
        ];

  // Sort events to ensure proper order: Quibble -> Distribution Center -> Customer
  const sortedEvents = [...events].sort((a, b) => {
    // Customer should always be last
    if (a.location === "Customer") return 1;
    if (b.location === "Customer") return -1;

    // Quibble should always be first
    if (a.location === "Quibble") return -1;
    if (b.location === "Quibble") return 1;

    // Distribution Center should be second
    if (a.location === "Distribution Center") return -1;
    if (b.location === "Distribution Center") return 1;

    // For other events, sort by timestamp (newest first)
    if (a.timestamp && b.timestamp) {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    }

    // If one has timestamp and other doesn't, put the one with timestamp first
    if (a.timestamp && !b.timestamp) return -1;
    if (!a.timestamp && b.timestamp) return 1;

    return 0;
  });

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
          <div className="relative" ref={timelineRef}>
            {/* Animated Timeline line */}
            <div
              className="absolute left-6 top-0 w-0.5 transition-all duration-1000 ease-out"
              style={{
                height: `${animationProgress}%`,
                background: `linear-gradient(to bottom, hsl(var(--primary)) 0%, hsl(var(--primary)) ${animationProgress}%, hsl(var(--muted-foreground) / 0.2) ${animationProgress}%, hsl(var(--muted-foreground) / 0.2) 100%)`,
              }}
            ></div>

            <div
              className="space-y-8"
              key={`timeline-${isExpanded}-${animationProgress}`}
            >
              {sortedEvents.map((event, index) => (
                <div key={event.id} className="relative flex items-start gap-6">
                  {/* Timeline dot with animation */}
                  <div className="relative z-10 flex-shrink-0">
                    <div
                      className={`w-12 h-12 rounded-full bg-white border-4 flex items-center justify-center shadow-lg transition-all duration-500 ${
                        (index * 100) / (events.length - 1) <= animationProgress
                          ? "border-primary scale-110"
                          : "border-muted-foreground/20 scale-100"
                      }`}
                    >
                      {getStatusIcon(event.status)}
                    </div>

                    {/* Location name under dot */}
                    <div className="absolute top-16 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-20">
                      <div className="bg-white px-2 py-1 rounded-md shadow-sm border text-xs font-medium text-primary">
                        {event.location}
                      </div>
                    </div>

                    {/* Individual connector lines removed - main animated line handles connections */}
                  </div>

                  {/* Event content with animation */}
                  <div
                    className={`flex-grow bg-muted/30 rounded-lg p-4 border border-border/50 transition-all duration-500 ${
                      (index * 100) / (events.length - 1) <= animationProgress
                        ? "opacity-100 translate-x-0"
                        : "opacity-50 translate-x-4"
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
                        {event.location === "Customer" &&
                        event.status !== "Delivered" ? (
                          "Pending"
                        ) : event.timestamp ? (
                          <>
                            {(event.timestamp instanceof Date
                              ? event.timestamp
                              : new Date(event.timestamp)
                            ).toLocaleDateString()}{" "}
                            {(event.timestamp instanceof Date
                              ? event.timestamp
                              : new Date(event.timestamp)
                            ).toLocaleTimeString()}
                          </>
                        ) : (
                          "Pending"
                        )}
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

            {/* End cap - only show if there are more events after Customer */}
            {events.length > 0 &&
              events[events.length - 1].location !== "Customer" && (
                <div className="relative flex items-center gap-4 mt-6">
                  <div className="w-12 h-12 rounded-full bg-muted border-4 border-muted-foreground/20 flex items-center justify-center">
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Journey continues...
                  </div>
                </div>
              )}
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
