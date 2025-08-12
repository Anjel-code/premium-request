import { useState, useEffect, useRef } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  CheckCircle,
  Truck,
  Package,
  MapPin,
  Calendar,
  DollarSign,
  ArrowLeft,
  Loader2,
  AlertCircle,
  ShoppingBag,
  CreditCard,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import TrackingTimeline from "@/components/TrackingTimeline";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { StoreOrder, TrackingInfo, TrackingEvent } from "@/lib/storeUtils";

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  roles: string[];
  photoURL?: string;
}

interface StoreOrderDetailProps {
  user: UserProfile | null;
  appId: string;
}

const StoreOrderDetail: React.FC<StoreOrderDetailProps> = ({ user, appId }) => {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState<StoreOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [isTrackingExpanded, setIsTrackingExpanded] = useState(
    searchParams.get("expand") === "tracking"
  );
  const [isExpandedByButton, setIsExpandedByButton] = useState(false);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);
  const trackingTimelineRef = useRef<HTMLDivElement>(null);

  // Scroll to tracking timeline when expand=tracking is in URL
  useEffect(() => {
    if (searchParams.get("expand") === "tracking" && trackingTimelineRef.current) {
      // Small delay to ensure the component is rendered
      setTimeout(() => {
        trackingTimelineRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 500);
      // Reset button expansion state since this is from URL
      setIsExpandedByButton(false);
    }
  }, [searchParams, isTrackingExpanded]);

  const handleSaveTrackingHistory = async (events: TrackingEvent[]) => {
    if (!order || !user) return;

    try {
      const orderRef = doc(
        db,
        `artifacts/${appId}/public/data/store-orders`,
        order.id
      );

      await updateDoc(orderRef, {
        "trackingInfo.trackingHistory": events,
        updatedAt: serverTimestamp(),
      });

      // Update local state
      setTrackingInfo((prev) =>
        prev
          ? {
              ...prev,
              trackingHistory: events,
            }
          : null
      );
    } catch (error) {
      console.error("Error saving tracking history:", error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId || !user || !appId) {
        setError("Order not found or user not authenticated");
        setLoading(false);
        return;
      }

      try {
        const orderRef = doc(
          db,
          `artifacts/${appId}/public/data/store-orders`,
          orderId
        );
        const orderSnap = await getDoc(orderRef);

        if (!orderSnap.exists()) {
          setError("Order not found");
          setLoading(false);
          return;
        }

        const orderData = orderSnap.data() as StoreOrder;

        // Verify the order belongs to the current user OR the user is an admin
        const isAdmin = user.roles?.includes("admin") || user.roles?.includes("team_member");
        if (orderData.userId !== user.uid && !isAdmin) {
          setError("You don't have permission to view this order");
          setLoading(false);
          return;
        }

        setOrder({
          id: orderSnap.id,
          ...orderData,
          createdAt:
            orderData.createdAt instanceof Timestamp
              ? orderData.createdAt.toDate()
              : orderData.createdAt,
          updatedAt:
            orderData.updatedAt instanceof Timestamp
              ? orderData.updatedAt.toDate()
              : orderData.updatedAt,
        });

        // Use actual tracking info from database or generate mock if not available
        if (orderData.trackingInfo) {
          // Convert tracking history timestamps to Date objects
          const convertedTrackingHistory =
            orderData.trackingInfo.trackingHistory?.map((event) => ({
              ...event,
              timestamp:
                event.timestamp instanceof Timestamp
                  ? event.timestamp.toDate()
                  : event.timestamp instanceof Date
                  ? event.timestamp
                  : new Date(event.timestamp),
            })) || [];

          setTrackingInfo({
            ...orderData.trackingInfo,
            estimatedDelivery:
              orderData.trackingInfo.estimatedDelivery instanceof Timestamp
                ? orderData.trackingInfo.estimatedDelivery.toDate()
                : orderData.trackingInfo.estimatedDelivery || new Date(),
            trackingHistory: convertedTrackingHistory,
          });
        } else if (
          orderData.status === "shipped" ||
          orderData.status === "delivered"
        ) {
          // Create initial tracking history with Quibble as start and Customer as end
          const initialTrackingHistory: TrackingEvent[] = [
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
              timestamp: orderData.status === "delivered" ? new Date() : null,
              location: "Customer",
              status:
                orderData.status === "delivered"
                  ? "Delivered"
                  : "To Be Delivered",
              description:
                orderData.status === "delivered"
                  ? "Package has been delivered successfully"
                  : "Awaiting delivery confirmation",
            },
          ];

          setTrackingInfo({
            trackingNumber: `TRK${orderSnap.id.slice(-8).toUpperCase()}`,
            carrier: "FedEx",
            status:
              orderData.status === "delivered" ? "delivered" : "in_transit",
            estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
            currentLocation: "Memphis, TN",
            trackingHistory: initialTrackingHistory,
          });
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching order:", err);
        setError("Failed to load order details");
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, user, appId]);

  const getStatusColor = (status: StoreOrder["status"]) => {
    switch (status) {
      case "pending":
        return "bg-secondary/10 text-secondary border-secondary/20";
      case "paid":
        return "bg-accent/10 text-accent border-accent/20";
      case "shipped":
        return "bg-primary/10 text-primary border-primary/20";
      case "delivered":
        return "bg-secondary/10 text-secondary border-secondary/20";
      case "cancelled":
        return "bg-muted text-muted-foreground border-muted";
      default:
        return "bg-muted text-muted-foreground border-muted";
    }
  };

  const getStatusIcon = (status: StoreOrder["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "paid":
        return <CheckCircle className="h-4 w-4" />;
      case "shipped":
        return <Truck className="h-4 w-4" />;
      case "delivered":
        return <Package className="h-4 w-4" />;
      case "cancelled":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getTrackingStatusColor = (status: TrackingInfo["status"]) => {
    switch (status) {
      case "pending":
        return "bg-secondary/10 text-secondary";
      case "in_transit":
        return "bg-accent/10 text-accent";
      case "out_for_delivery":
        return "bg-primary/10 text-primary";
      case "delivered":
        return "bg-secondary/10 text-secondary";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getOrderProgress = (status: StoreOrder["status"]) => {
    switch (status) {
      case "pending":
        return 25;
      case "paid":
        return 50;
      case "shipped":
        return 75;
      case "delivered":
        return 100;
      case "cancelled":
        return 0;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <DashboardLayout user={user} appId={appId}>
        <div className="min-h-[calc(100vh-100px)] flex items-center justify-center p-6">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="ml-4 text-primary">Loading order details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !order) {
    return (
      <DashboardLayout user={user} appId={appId}>
        <div className="min-h-[calc(100vh-100px)] flex flex-col items-center justify-center p-6">
          <Card className="w-full max-w-md text-center shadow-premium rounded-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-red-500">Error</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-muted-foreground">{error}</p>
              <Button asChild className="mt-4">
                <Link to="/dashboard/store-orders">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Orders
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} appId={appId}>
      <div className="space-y-8">
        {/* Header */}
        <div className="mb-8">
          <Button asChild variant="outline" className="mb-4">
            <Link to="/dashboard/store-orders">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Link>
          </Button>
          <h1 className="text-4xl font-bold text-primary mb-2">
            Order #{order.id.slice(-8).toUpperCase()}
          </h1>
          <p className="text-lg text-muted-foreground">{order.productName}</p>
        </div>

        {/* Order Progress */}
        <Card className="border-0 shadow-premium rounded-xl">
          <CardHeader className="border-b border-border p-6">
            <CardTitle className="text-2xl font-semibold text-primary">
              Order Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Order Status
                  </span>
                  <span className="text-sm font-medium text-primary">
                    {getOrderProgress(order.status)}%
                  </span>
                </div>
                <Progress
                  value={getOrderProgress(order.status)}
                  className="h-3"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                    order.status !== "cancelled" 
                      ? "bg-primary/10 text-primary" 
                      : "bg-muted text-muted-foreground"
                  }`}>
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium">Order Placed</p>
                  <p className="text-xs text-muted-foreground">
                    {order.createdAt?.toLocaleDateString()}
                  </p>
                </div>
                <div className="text-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                    order.paymentStatus === "completed" 
                      ? "bg-secondary/10 text-secondary" 
                      : "bg-muted text-muted-foreground"
                  }`}>
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium">Payment</p>
                  <p className="text-xs text-muted-foreground">
                    {order.paymentStatus === "completed"
                      ? "Payment Completed"
                      : "Pending"}
                  </p>
                </div>
                <div className="text-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                    order.status === "shipped" || order.status === "delivered"
                      ? "bg-accent/10 text-accent" 
                      : "bg-muted text-muted-foreground"
                  }`}>
                    <Truck className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium">Shipped</p>
                  <p className="text-xs text-muted-foreground">
                    {order.status === "shipped" || order.status === "delivered"
                      ? "In Transit"
                      : "Pending"}
                  </p>
                </div>
                <div className="text-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                    order.status === "delivered" 
                      ? "bg-primary/10 text-primary" 
                      : "bg-muted text-muted-foreground"
                  }`}>
                    <Package className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium">Delivered</p>
                  <p className="text-xs text-muted-foreground">
                    {order.status === "delivered" ? "Delivered" : "Pending"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="border-0 shadow-premium rounded-xl">
            <CardHeader className="border-b border-border p-6">
              <CardTitle className="text-xl font-semibold text-primary">
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Product:</span>
                <span className="font-medium">{order.productName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Quantity:</span>
                <span className="font-medium">{order.quantity}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-medium text-lg text-primary">
                  ${(order.totalAmount || order.totalPrice || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Order Date:</span>
                <span className="font-medium">
                  {order.createdAt?.toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status:</span>
                <Badge className={getStatusColor(order.status)}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(order.status)}
                    {order.status.charAt(0).toUpperCase() +
                      order.status.slice(1)}
                  </div>
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Payment Status:</span>
                <Badge
                  variant={
                    order.paymentStatus === "completed"
                      ? "default"
                      : "secondary"
                  }
                >
                  {order.paymentStatus.charAt(0).toUpperCase() +
                    order.paymentStatus.slice(1)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Information */}
          {order.shippingInfo && (
            <Card className="border-0 shadow-premium rounded-xl">
              <CardHeader className="border-b border-border p-6">
                <CardTitle className="text-xl font-semibold text-primary">
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">
                        {order.shippingInfo.firstName} {order.shippingInfo.lastName}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium">{order.shippingInfo.email}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="font-medium">{order.shippingInfo.phone}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Address:</span>
                      <span className="font-medium text-right">
                        {order.shippingInfo.address}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">City:</span>
                      <span className="font-medium">{order.shippingInfo.city}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">State:</span>
                      <span className="font-medium">{order.shippingInfo.state}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">ZIP Code:</span>
                      <span className="font-medium">{order.shippingInfo.zipCode}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Country:</span>
                      <span className="font-medium">{order.shippingInfo.country}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tracking Information */}
          <Card className="border-0 shadow-premium rounded-xl">
            <CardHeader className="border-b border-border p-6">
              <CardTitle className="text-xl font-semibold text-primary">
                Tracking Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {trackingInfo ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      Tracking Number:
                    </span>
                    <span className="font-mono font-medium text-primary">
                      {trackingInfo.trackingNumber}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Carrier:</span>
                    <span className="font-medium">{trackingInfo.carrier}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge
                      className={getTrackingStatusColor(trackingInfo.status)}
                    >
                      {trackingInfo.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      Estimated Delivery:
                    </span>
                    <span className="font-medium">
                      {trackingInfo.estimatedDelivery.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      Current Location:
                    </span>
                    <span className="font-medium">
                      {trackingInfo.currentLocation}
                    </span>
                  </div>
                  <div className="pt-4">
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => {
                        if (!isTrackingExpanded) {
                          // Set loading state and expand tracking
                          setIsTrackingLoading(true);
                          setIsTrackingExpanded(true);
                          setIsExpandedByButton(true);
                          
                          // Scroll immediately when button is clicked
                          setTimeout(() => {
                            trackingTimelineRef.current?.scrollIntoView({
                              behavior: "smooth",
                              block: "center",
                            });
                          }, 100);
                          
                          // Simulate loading time for tracking data
                          setTimeout(() => {
                            setIsTrackingLoading(false);
                          }, 1500); // 1.5 second loading time
                        } else {
                          // Just collapse without scrolling
                          setIsTrackingExpanded(false);
                          setIsExpandedByButton(false);
                        }
                      }}
                    >
                      <Truck className="mr-2 h-4 w-4" />
                      {isTrackingExpanded ? "Hide Tracking" : "Track Package"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Tracking information will be available once your order is
                    shipped.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tracking Timeline */}
        {trackingInfo && isTrackingExpanded && (
          <div ref={trackingTimelineRef}>
            <TrackingTimeline
              trackingHistory={trackingInfo.trackingHistory || []}
              currentStatus={trackingInfo.status}
              isAdmin={
                user?.roles?.includes("admin") ||
                user?.roles?.includes("team_member")
              }
              isExpanded={isTrackingExpanded}
              onToggleExpand={() => setIsTrackingExpanded(!isTrackingExpanded)}
              onSaveTrackingHistory={handleSaveTrackingHistory}
              isLoading={isTrackingLoading}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="outline">
            <Link to="/store">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Continue Shopping
            </Link>
          </Button>
          <Button asChild>
            <Link to="/dashboard/store-orders">
              <Package className="mr-2 h-4 w-4" />
              View All Orders
            </Link>
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StoreOrderDetail;
