import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  CheckCircle,
  Truck,
  Package,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Edit,
  Eye,
  Calendar,
  MapPin,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { StoreOrder, TrackingEvent } from "@/lib/storeUtils";
import {
  createStoreShippingNotification,
  createStoreDeliveryNotification,
} from "@/lib/storeUtils";

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  roles: string[];
  photoURL?: string;
}

interface AdminStoreOrdersProps {
  user: UserProfile | null;
  appId: string;
}

interface TrackingInfo {
  trackingNumber: string;
  carrier: string;
  status: "pending" | "in_transit" | "out_for_delivery" | "delivered";
  estimatedDelivery: Date;
  currentLocation: string;
  trackingHistory: TrackingEvent[];
}

const AdminStoreOrders: React.FC<AdminStoreOrdersProps> = ({ user, appId }) => {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<StoreOrder | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isTrackingDialogOpen, setIsTrackingDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Form states for order update
  const [newStatus, setNewStatus] = useState<string>("");
  const [newPaymentStatus, setNewPaymentStatus] = useState<string>("");

  // Form states for tracking update
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");
  const [trackingStatus, setTrackingStatus] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");
  const [currentLocation, setCurrentLocation] = useState("");
  const [trackingEvent, setTrackingEvent] = useState("");

  useEffect(() => {
    if (!db || !user || !appId) {
      setLoadingOrders(false);
      return;
    }

    const ordersCollectionRef = collection(
      db,
      `artifacts/${appId}/public/data/store-orders`
    );

    const ordersQuery = query(
      ordersCollectionRef,
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const fetchedOrders: StoreOrder[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        })) as StoreOrder[];
        setOrders(fetchedOrders);
        setLoadingOrders(false);
      },
      (err) => {
        console.error("Error fetching store orders:", err);
        setError("Failed to load store orders.");
        setLoadingOrders(false);
      }
    );

    return () => unsubscribe();
  }, [db, user, appId]);

  const getStatusColor = (status: StoreOrder["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "paid":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "shipped":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
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

  const formatStatus = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "paid":
        return "Payment Completed";
      case "shipped":
        return "Shipped";
      case "delivered":
        return "Delivered";
      case "cancelled":
        return "Cancelled";
      case "failed":
        return "Failed";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrder || !newStatus || !newPaymentStatus) return;

    setUpdating(true);
    try {
      const orderRef = doc(
        db,
        `artifacts/${appId}/public/data/store-orders`,
        selectedOrder.id
      );

      const updateData: any = {
        status: newStatus,
        paymentStatus: newPaymentStatus,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(orderRef, updateData);

      // Send notifications based on status change
      if (newStatus === "shipped" && selectedOrder.status !== "shipped") {
        await createStoreShippingNotification(
          appId,
          selectedOrder.userId,
          selectedOrder.productName,
          selectedOrder.id,
          trackingNumber || `TRK${selectedOrder.id.slice(-8).toUpperCase()}`
        );
      }

      if (newStatus === "delivered" && selectedOrder.status !== "delivered") {
        await createStoreDeliveryNotification(
          appId,
          selectedOrder.userId,
          selectedOrder.productName,
          selectedOrder.id
        );
      }

      setIsUpdateDialogOpen(false);
      setSelectedOrder(null);
      setNewStatus("");
      setNewPaymentStatus("");
    } catch (error) {
      console.error("Error updating order:", error);
      setError("Failed to update order status.");
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateTracking = async () => {
    if (!selectedOrder || !trackingNumber || !carrier) return;

    setUpdating(true);
    try {
      const orderRef = doc(
        db,
        `artifacts/${appId}/public/data/store-orders`,
        selectedOrder.id
      );

      // Create initial tracking history if this is the first time adding tracking
      const isFirstTimeTracking = !selectedOrder.trackingInfo;
      const initialTrackingHistory: TrackingEvent[] = isFirstTimeTracking
        ? [
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
              timestamp: trackingStatus === "delivered" ? new Date() : null,
              location: "Customer",
              status:
                trackingStatus === "delivered"
                  ? "Delivered"
                  : "To Be Delivered",
              description:
                trackingStatus === "delivered"
                  ? "Package has been delivered successfully"
                  : "Awaiting delivery confirmation",
            },
          ]
        : selectedOrder.trackingInfo.trackingHistory || [];

      const trackingData = {
        trackingNumber,
        carrier,
        status: trackingStatus,
        estimatedDelivery: estimatedDelivery
          ? new Date(estimatedDelivery)
          : null,
        currentLocation,
        trackingHistory: initialTrackingHistory,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(orderRef, {
        trackingInfo: trackingData,
        updatedAt: serverTimestamp(),
      });

      // If this is the first time adding tracking info and order is being shipped
      if (selectedOrder.status !== "shipped") {
        await updateDoc(orderRef, {
          status: "shipped",
          updatedAt: serverTimestamp(),
        });

        await createStoreShippingNotification(
          appId,
          selectedOrder.userId,
          selectedOrder.productName,
          selectedOrder.id,
          trackingNumber
        );
      }

      setIsTrackingDialogOpen(false);
      setSelectedOrder(null);
      setTrackingNumber("");
      setCarrier("");
      setTrackingStatus("");
      setEstimatedDelivery("");
      setCurrentLocation("");
    } catch (error) {
      console.error("Error updating tracking:", error);
      setError("Failed to update tracking information.");
    } finally {
      setUpdating(false);
    }
  };

  const openUpdateDialog = (order: StoreOrder) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setNewPaymentStatus(order.paymentStatus);
    setIsUpdateDialogOpen(true);
  };

  const openTrackingDialog = (order: StoreOrder) => {
    setSelectedOrder(order);
    if (order.trackingInfo) {
      setTrackingNumber(order.trackingInfo.trackingNumber || "");
      setCarrier(order.trackingInfo.carrier || "");
      setTrackingStatus(order.trackingInfo.status || "");
      setEstimatedDelivery(
        order.trackingInfo.estimatedDelivery
          ? new Date(order.trackingInfo.estimatedDelivery)
              .toISOString()
              .split("T")[0]
          : ""
      );
      setCurrentLocation(order.trackingInfo.currentLocation || "");
    }
    setIsTrackingDialogOpen(true);
  };

  if (loadingOrders) {
    return (
      <DashboardLayout user={user} appId={appId}>
        <div className="min-h-[calc(100vh-100px)] flex items-center justify-center p-6">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="ml-4 text-primary">Loading store orders...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
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
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} appId={appId}>
      <div className="space-y-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <Button asChild variant="outline" className="mb-4">
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-4xl font-bold text-primary mb-2">
              Admin Store Orders
            </h1>
            <p className="text-lg text-muted-foreground">
              Manage all store orders, update statuses, and track shipments.
            </p>
          </div>
        </div>

        <Card className="border-0 shadow-premium rounded-xl">
          <CardHeader className="border-b border-border p-6">
            <CardTitle className="text-2xl font-semibold text-primary">
              All Store Orders ({orders.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No store orders found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card
                    key={order.id}
                    className="border shadow-sm rounded-lg hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <div className="flex-grow">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg text-primary">
                              {order.productName}
                            </h3>
                            <Badge variant="outline">
                              #{order.id.slice(-8).toUpperCase()}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                            <div>
                              <span className="font-medium">Customer:</span>{" "}
                              {order.userName}
                            </div>
                            <div>
                              <span className="font-medium">Quantity:</span>{" "}
                              {order.quantity}
                            </div>
                            <div>
                              <span className="font-medium">Total:</span> $
                              {(order.totalAmount || order.totalPrice || 0).toFixed(2)}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-3">
                            <Badge className={getStatusColor(order.status)}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(order.status)}
                                {formatStatus(order.status)}
                              </div>
                            </Badge>
                            <Badge variant="outline">
                              Payment: {formatStatus(order.paymentStatus)}
                            </Badge>
                            {order.trackingInfo?.trackingNumber && (
                              <Badge variant="outline" className="font-mono">
                                {order.trackingInfo.trackingNumber}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Created: {order.createdAt?.toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            onClick={() => openUpdateDialog(order)}
                            variant="outline"
                            size="sm"
                            className="border-primary text-primary hover:bg-primary/10"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Update Status
                          </Button>
                          <Button
                            onClick={() => openTrackingDialog(order)}
                            variant="outline"
                            size="sm"
                            className="border-green-600 text-green-600 hover:bg-green-50"
                          >
                            <Truck className="h-4 w-4 mr-2" />
                            {order.trackingInfo
                              ? "Update Tracking"
                              : "Add Tracking"}
                          </Button>
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="border-blue-600 text-blue-600 hover:bg-blue-50"
                          >
                            <Link to={`/dashboard/store-orders/${order.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </Button>
                          {order.trackingInfo && (
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="border-purple-600 text-purple-600 hover:bg-purple-50"
                            >
                              <Link
                                to={`/dashboard/store-orders/${order.id}?expand=tracking`}
                              >
                                <MapPin className="h-4 w-4 mr-2" />
                                Manage Timeline
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Update Order Status Dialog */}
        <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Update Order Status</DialogTitle>
              <DialogDescription>
                Update the status for order #
                {selectedOrder?.id.slice(-8).toUpperCase()}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="status">Order Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="paymentStatus">Payment Status</Label>
                <Select
                  value={newPaymentStatus}
                  onValueChange={setNewPaymentStatus}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsUpdateDialogOpen(false)}
                disabled={updating}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateOrder} disabled={updating}>
                {updating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Order"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Update Tracking Dialog */}
        <Dialog
          open={isTrackingDialogOpen}
          onOpenChange={setIsTrackingDialogOpen}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Update Tracking Information</DialogTitle>
              <DialogDescription>
                Add or update tracking details for order #
                {selectedOrder?.id.slice(-8).toUpperCase()}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="trackingNumber">Tracking Number</Label>
                <Input
                  id="trackingNumber"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                />
              </div>
              <div>
                <Label htmlFor="carrier">Shipping Carrier</Label>
                <Select value={carrier} onValueChange={setCarrier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select carrier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FedEx">FedEx</SelectItem>
                    <SelectItem value="UPS">UPS</SelectItem>
                    <SelectItem value="USPS">USPS</SelectItem>
                    <SelectItem value="DHL">DHL</SelectItem>
                    <SelectItem value="YunExpress">YunExpress</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="trackingStatus">Current Status</Label>
                <Select
                  value={trackingStatus}
                  onValueChange={setTrackingStatus}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="out_for_delivery">
                      Out for Delivery
                    </SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="estimatedDelivery">
                  Estimated Delivery Date
                </Label>
                <Input
                  id="estimatedDelivery"
                  type="date"
                  value={estimatedDelivery}
                  onChange={(e) => setEstimatedDelivery(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="currentLocation">Current Location</Label>
                <Input
                  id="currentLocation"
                  value={currentLocation}
                  onChange={(e) => setCurrentLocation(e.target.value)}
                  placeholder="e.g., Memphis, TN"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsTrackingDialogOpen(false)}
                disabled={updating}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateTracking} disabled={updating}>
                {updating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Tracking"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminStoreOrders;
