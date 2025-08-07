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
  usePurpleColor?: boolean;
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
  isLoading?: boolean;
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
  isLoading = false,
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

  // Animation effect - trigger when expanded AND in viewport AND hasn't animated yet AND not loading
  useEffect(() => {
    if (isExpanded && isInViewport && !hasAnimated && !isLoading) {
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
  }, [isExpanded, isInViewport, hasAnimated, isLoading]);
  const getStatusIcon = (status: string, usePurpleColor?: boolean) => {
    if (usePurpleColor) {
      return <Package className="h-5 w-5 text-purple-600" />;
    }
    
    switch (status.toLowerCase()) {
      case "delivered":
        return <CheckCircle className="h-5 w-5 text-secondary" />;
      case "out for delivery":
        return <Truck className="h-5 w-5 text-accent" />;
      case "in transit":
        return <Truck className="h-5 w-5 text-primary" />;
      case "pending":
        return <Clock className="h-5 w-5 text-secondary" />;
      default:
        return <Package className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-secondary/10 text-secondary border-secondary/20";
      case "out for delivery":
        return "bg-accent/10 text-accent border-accent/20";
      case "in transit":
        return "bg-primary/10 text-primary border-primary/20";
      case "pending":
        return "bg-secondary/10 text-secondary border-secondary/20";
      default:
        return "bg-muted text-muted-foreground border-muted";
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
  }).map((event) => ({
    ...event,
    usePurpleColor: event.usePurpleColor !== undefined ? event.usePurpleColor : (event.location === "Quibble" || (event.location === "Customer" && event.status === "Delivered")),
  }));

  // Show skeleton content when loading, but keep the timeline structure
  const showSkeleton = isLoading;

  // Reset animation when loading finishes
  useEffect(() => {
    if (!isLoading && isExpanded && isInViewport) {
      setHasAnimated(false);
    }
  }, [isLoading, isExpanded, isInViewport]);

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
            {/* Individual line segments between dots */}
            {!showSkeleton && sortedEvents.slice(0, -1).map((event, index) => {
              const nextEvent = sortedEvents[index + 1];
              const segmentHeight = 100 / (sortedEvents.length - 1);
              const segmentTop = (index * 100) / (sortedEvents.length - 1);
              
              // Calculate if this segment should be visible based on animation progress
              const segmentProgress = (index + 1) * segmentHeight;
              const isSegmentVisible = animationProgress >= segmentProgress;
              
              // Determine line color based on the next dot (the one we're connecting to)
              const isNextDotPurple = nextEvent && nextEvent.usePurpleColor;
              const isNextDotGray = nextEvent && !nextEvent.usePurpleColor && 
                nextEvent.status !== "Delivered" && nextEvent.status !== "delivered";
              
              let lineColor = "hsl(var(--primary))"; // Default primary color
              if (isNextDotPurple) {
                lineColor = "hsl(var(--primary))"; // Purple for purple dots
              } else if (isNextDotGray) {
                lineColor = "#6b7280"; // Gray for gray dots
              }
              
              return (
                <div
                  key={`segment-${index}`}
                  className="absolute left-14 w-0.5 transition-all duration-1000 ease-out"
                  style={{
                    top: `${segmentTop}%`,
                    height: `${segmentHeight}%`,
                    backgroundColor: isSegmentVisible ? lineColor : "transparent",
                  }}
                />
              );
            })}

            <div
              className="space-y-8"
              key={`timeline-${isExpanded}-${animationProgress}`}
            >
              {showSkeleton ? (
                // Show skeleton timeline items
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="relative flex items-start gap-8">
                    {/* Timeline dot skeleton */}
                    <div className="relative z-10 flex-shrink-0 ml-8">
                      <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
                      
                      {/* Location name under dot skeleton */}
                      <div className="absolute top-16 left-1/2 transform -translate-x-1/2">
                        <div className="w-20 h-6 rounded-md bg-muted animate-pulse" />
                      </div>
                    </div>

                    {/* Event content skeleton */}
                    <div className="flex-grow bg-muted/30 rounded-lg p-4 border border-border/50">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-24 rounded-full bg-muted animate-pulse" />
                          <div className="h-6 w-6 rounded bg-muted animate-pulse" />
                        </div>
                        <div className="h-4 w-32 bg-muted animate-pulse" />
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-4 w-4 bg-muted animate-pulse" />
                        <div className="h-4 w-32 bg-muted animate-pulse" />
                      </div>

                      <div className="h-4 w-full bg-muted animate-pulse" />
                      <div className="h-4 w-3/4 mt-2 bg-muted animate-pulse" />
                    </div>
                  </div>
                ))
              ) : (
                // Show actual timeline items
                sortedEvents.map((event, index) => (
                  <div key={event.id} className="relative flex items-start gap-8">
                    {/* Timeline dot with animation */}
                    <div className="relative z-10 flex-shrink-0 ml-8">
                                             <div
                         className={`w-12 h-12 rounded-full bg-white border-4 flex items-center justify-center shadow-lg ${
                           event.usePurpleColor
                             ? "border-purple-500"
                             : event.status === "Delivered" || event.status === "delivered"
                             ? "border-secondary"
                             : "border-muted-foreground/20"
                         }`}
                       >
                        {getStatusIcon(event.status, event.usePurpleColor)}
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
                ))
              )}
            </div>

            {/* End cap - only show if there are more events after Customer */}
            {!showSkeleton && events.length > 0 &&
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
