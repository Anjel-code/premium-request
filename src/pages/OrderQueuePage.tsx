import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  createAssignmentNotification,
  createOrderStatusNotification,
} from "../lib/notificationUtils"; // Ensure this path is correct
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Calendar,
  DollarSign,
  Package,
  UserCheck,
  Trash2,
  Info,
  AlertCircle,
} from "lucide-react";

// Define the Order interface to match Firestore data
interface Order {
  id: string;
  userId: string; // The ID of the user who placed the order
  userEmail: string;
  userName: string;
  ticketNumber: string;
  title: string;
  status: "pending" | "accepted" | "dismissed" | "completed"; // Updated statuses
  createdAt: Date; // Changed to Date as it will be converted on fetch
  updatedAt: Date; // Changed to Date as it will be converted on fetch
  estimatedCompletion: Date | null; // Changed to Date or null
  budget: string;
  progress: number;
  lastUpdate: string;
  timeRemaining?: string;
  isPaid?: boolean;
  summary: string; // Detailed description of the order
  conversation: Array<{ text: string; isBot: boolean; timestamp: string }>; // Chat history
  assignedTo: string | null; // UID of the worker, null if in queue
  assignedDate: Date | null; // Changed to Date or null
  dismissedBy: string | null; // UID of the user who dismissed it
  dismissedDate: Date | null; // Changed to Date or null
}

interface OrderQueuePageProps {
  userRoles: string[]; // Current user's roles
  user: any; // Current user object (to get UID for assignment)
}

const OrderQueuePage: React.FC<OrderQueuePageProps> = ({ userRoles, user }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null); // For expanded view
  const [showDismissConfirm, setShowDismissConfirm] = useState(false);
  const [showAcceptConfirm, setShowAcceptConfirm] = useState(false);
  const [orderToActOn, setOrderToActOn] = useState<Order | null>(null);

  // Check if the current user has team_member or admin privileges
  const hasAccess =
    userRoles.includes("team_member") || userRoles.includes("admin");

  // Get appId from environment variable
  const appId =
    import.meta.env.VITE_FIREBASE_PROJECT_ID || "default-app-id-fallback";

  useEffect(() => {
    if (!db) {
      setError("Firestore database is not initialized.");
      setIsLoading(false);
      return;
    }

    if (!hasAccess) {
      setIsLoading(false);
      setError("You do not have permission to view the order queue.");
      return;
    }

    // Query for orders that are 'pending' and not yet assigned
    const ordersCollectionRef = collection(
      db,
      `artifacts/${appId}/public/data/orders`
    );
    const q = query(
      ordersCollectionRef,
      where("status", "==", "pending"),
      where("assignedTo", "==", null), // Only show unassigned orders
      orderBy("createdAt", "asc") // <--- CHANGED: Use 'createdAt'
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedOrders: Order[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore Timestamps to Date objects immediately
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          estimatedCompletion: doc.data().estimatedCompletion?.toDate() || null,
          assignedDate: doc.data().assignedDate?.toDate() || null,
          dismissedDate: doc.data().dismissedDate?.toDate() || null,
        })) as Order[];
        setOrders(fetchedOrders);
        setIsLoading(false);
      },
      (err) => {
        console.error("Error fetching pending orders:", err);
        setError(
          "Failed to load order queue. Check console and Firebase rules."
        );
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db, appId, hasAccess]); // Re-run effect if db, appId, or access status changes

  const getStatusColor = (status: string) => {
    switch (status) {
      case "initial_review":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"; // New status
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "sourcing":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "accepted":
        return "bg-blue-100 text-blue-800 border-blue-200"; // New status
      case "dismissed":
        return "bg-red-100 text-red-800 border-red-200"; // New status
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "initial_review":
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "processing":
        return <AlertCircle className="h-4 w-4" />;
      case "sourcing":
        return <Package className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "accepted":
        return <UserCheck className="h-4 w-4" />;
      case "dismissed":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatStatus = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
  };

  const handleDismissClick = (order: Order) => {
    setOrderToActOn(order);
    setShowDismissConfirm(true);
  };

  const confirmDismissOrder = async () => {
    if (!orderToActOn || !db || !user) return;

    try {
      setIsLoading(true);
      const orderRef = doc(
        db,
        `artifacts/${appId}/public/data/orders`,
        orderToActOn.id
      );
      await updateDoc(orderRef, {
        status: "dismissed",
        dismissedBy: user.uid,
        dismissedDate: new Date(),
      });

      // Create notification for order dismissal
      try {
        await createOrderStatusNotification(
          appId,
          orderToActOn.userId, // Notify the order owner
          orderToActOn.id,
          orderToActOn.ticketNumber,
          "pending",
          "dismissed"
        );
      } catch (notificationError) {
        console.error(
          "Error creating dismissal notification:",
          notificationError
        );
      }

      setShowDismissConfirm(false);
      setOrderToActOn(null);
      setSelectedOrder(null); // Close expanded view if it was open
      // The onSnapshot listener will automatically update the queue
    } catch (err) {
      console.error("Error dismissing order:", err);
      setError("Failed to dismiss order. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptClick = (order: Order) => {
    setOrderToActOn(order);
    setShowAcceptConfirm(true);
  };

  const confirmAcceptOrder = async () => {
    if (!orderToActOn || !db || !user) return;

    try {
      setIsLoading(true);
      const orderRef = doc(
        db,
        `artifacts/${appId}/public/data/orders`,
        orderToActOn.id
      );
      await updateDoc(orderRef, {
        status: "accepted",
        assignedTo: user.uid,
        assignedDate: new Date(),
      });

      // Create notification for assignment
      try {
        await createAssignmentNotification(
          appId,
          orderToActOn.userId, // Notify the order owner
          orderToActOn.id,
          orderToActOn.ticketNumber
        );
      } catch (notificationError) {
        console.error(
          "Error creating assignment notification:",
          notificationError
        );
      }

      setShowAcceptConfirm(false);
      setOrderToActOn(null);
      setSelectedOrder(null); // Close expanded view if it was open
      // The onSnapshot listener will automatically update the queue
    } catch (err) {
      console.error("Error accepting order:", err);
      setError("Failed to accept order. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout user={user} appId={appId}>
        <div className="min-h-[calc(100vh-100px)] flex items-center justify-center p-6">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="ml-4 text-primary">Loading order queue...</p>
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
              <p className="text-sm text-muted-foreground mt-2">
                Please ensure your Firebase Firestore is set up correctly and
                your security rules allow read/write access for team
                members/admins.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!hasAccess) {
    return (
      <DashboardLayout user={user} appId={appId}>
        <div className="min-h-[calc(100vh-100px)] flex flex-col items-center justify-center p-6">
          <Card className="w-full max-w-md text-center shadow-premium rounded-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">
                Access Denied
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-muted-foreground">
                You do not have the necessary permissions to access this page.
                This page is for team members and administrators only.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} appId={appId}>
      <div className="space-y-8">
        <h1 className="text-4xl font-bold text-primary mb-6">Order Queue</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Review and manage incoming product requests.
        </p>

        {orders.length === 0 ? (
          <Card className="border-0 shadow-elegant">
            <CardContent className="p-6 text-center text-muted-foreground">
              <p>No pending orders in the queue. Great job!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {orders.map((order) => (
              <Card
                key={order.id}
                className="shadow-elegant rounded-xl overflow-hidden cursor-pointer hover:shadow-premium transition-shadow"
                onClick={() => openOrderDetails(order)}
              >
                <CardHeader className="bg-muted/50 border-b border-border pb-3">
                  <CardTitle className="text-lg font-semibold text-primary flex items-center justify-between">
                    <span>Order: {order.title}</span>
                    <Badge className={getStatusColor(order.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(order.status)}
                        {formatStatus(order.status)}
                      </div>
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Ticket: {order.ticketNumber}
                  </p>
                </CardHeader>
                <CardContent className="p-4 space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">
                      Customer:
                    </span>{" "}
                    {order.userName} ({order.userEmail})
                  </p>
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">
                      Created:
                    </span>{" "}
                    {order.createdAt.toLocaleDateString()}
                  </p>
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Budget:</span>{" "}
                    {order.budget}
                  </p>
                  <p className="text-muted-foreground line-clamp-2">
                    <span className="font-medium text-foreground">
                      Summary:
                    </span>{" "}
                    {order.summary}
                  </p>
                  <div className="flex justify-end pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-accent hover:underline"
                    >
                      View Details <Info className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={closeOrderDetails}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto rounded-lg shadow-premium">
          <DialogHeader>
            <DialogTitle className="text-2xl text-primary">
              Order Details: {selectedOrder?.title}
            </DialogTitle>
            <DialogDescription>
              Ticket: {selectedOrder?.ticketNumber} | Customer:{" "}
              {selectedOrder?.userName} ({selectedOrder?.userEmail})
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Status:</p>
                <Badge
                  className={getStatusColor(selectedOrder?.status || "pending")}
                >
                  <div className="flex items-center gap-1">
                    {getStatusIcon(selectedOrder?.status || "pending")}
                    {formatStatus(selectedOrder?.status || "pending")}
                  </div>
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Budget:</p>
                <p className="font-medium text-foreground">
                  {selectedOrder?.budget}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Date Created:</p>
                <p className="font-medium text-foreground">
                  {selectedOrder?.createdAt?.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Estimated Completion:</p>
                <p className="font-medium text-foreground">
                  {selectedOrder?.estimatedCompletion?.toLocaleDateString()}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">
                Order Summary:
              </h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {selectedOrder?.summary}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-primary mb-2 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" /> Conversation History:
              </h3>
              <div className="max-h-60 overflow-y-auto border rounded-md p-4 bg-muted/30 space-y-4">
                {selectedOrder?.conversation &&
                selectedOrder.conversation.length > 0 ? (
                  selectedOrder.conversation.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        msg.isBot ? "justify-start" : "justify-end"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          msg.isBot
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        <p className="font-semibold text-xs mb-1">
                          {msg.isBot ? "AI Assistant" : "Customer"}
                        </p>
                        <p className="text-sm">{msg.text}</p>
                        <p className="text-xs text-right mt-1 opacity-70">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center">
                    No conversation history available.
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-4">
            <Button
              variant="destructive"
              onClick={() => handleDismissClick(selectedOrder!)} // Use ! as we know it's not null here
              disabled={isLoading}
              className="rounded-md"
            >
              <Trash2 className="h-4 w-4 mr-2" /> Dismiss Order
            </Button>
            <Button
              variant="premium"
              onClick={() => handleAcceptClick(selectedOrder!)} // Use ! as we know it's not null here
              disabled={isLoading}
              className="rounded-md"
            >
              <UserCheck className="h-4 w-4 mr-2" /> Accept Order
            </Button>
            <Button
              variant="outline"
              onClick={closeOrderDetails}
              disabled={isLoading}
              className="rounded-md"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dismiss Confirmation Dialog */}
      <Dialog open={showDismissConfirm} onOpenChange={setShowDismissConfirm}>
        <DialogContent className="sm:max-w-[425px] rounded-lg shadow-premium">
          <DialogHeader>
            <DialogTitle>Confirm Dismissal</DialogTitle>
            <DialogDescription>
              Are you sure you want to dismiss this order ({orderToActOn?.title}
              )? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDismissConfirm(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDismissOrder}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Confirm Dismiss
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Accept Confirmation Dialog */}
      <Dialog open={showAcceptConfirm} onOpenChange={setShowAcceptConfirm}>
        <DialogContent className="sm:max-w-[425px] rounded-lg shadow-premium">
          <DialogHeader>
            <DialogTitle>Confirm Acceptance</DialogTitle>
            <DialogDescription>
              Are you sure you want to accept this order ({orderToActOn?.title}
              )? It will be assigned to you.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowAcceptConfirm(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="premium"
              onClick={confirmAcceptOrder}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <UserCheck className="h-4 w-4 mr-2" />
              )}
              Confirm Accept
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default OrderQueuePage;
