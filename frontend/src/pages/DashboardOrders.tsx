// src/pages/OrdersPage.tsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  XCircle,
  ArrowLeft, // Added for back button
  Trash2,
  Eye,
  Package,
  Truck,
  ShoppingCart,
  RefreshCw,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";

// Firebase imports
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where, // Added for potential filtering in the future
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase"; // Ensure this path is correct for your firebase.js
import { StoreOrder } from "@/lib/storeUtils";

// Define the Order interface
interface Order {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  title: string;
  summary?: string;
  status: "pending" | "accepted" | "completed" | "dismissed";
  createdAt: Date;
  updatedAt: Date;
  ticketNumber: string;
  estimatedCompletion: Date | null;
  budget: string;
  progress: number;
  lastUpdate: string;
  assignedTo: string | null;
  assignedDate: Date | null;
  dismissedBy: string | null;
  dismissedDate: Date | null;
  conversation?: Array<{ text: string; isBot: boolean; timestamp: string }>;
}

// Combined order type for display
interface CombinedOrder {
  id: string;
  type: "ticket" | "store";
  order: Order | StoreOrder;
  createdAt: Date;
}

// Define the UserProfile interface
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  roles: string[];
  photoURL?: string;
}

// Props for the OrdersPage component
interface OrdersPageProps {
  user: UserProfile | null;
  appId: string;
  userRoles: string[];
}

const OrdersPage: React.FC<OrdersPageProps> = ({ user, appId, userRoles }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [storeOrders, setStoreOrders] = useState<StoreOrder[]>([]);
  const [combinedOrders, setCombinedOrders] = useState<CombinedOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete order state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!db || !user || userRoles.length === 0) {
      setLoadingOrders(false);
      return;
    }

    // Fetch both regular orders and store orders
    const regularOrdersRef = collection(
      db,
      `artifacts/${appId}/public/data/orders`
    );

    const storeOrdersRef = collection(
      db,
      `artifacts/${appId}/public/data/store-orders`
    );

    // Admin users can see all orders, regular users see only their own
    const isAdmin = userRoles.includes("admin") || userRoles.includes("team_member");
    
    const regularOrdersQuery = isAdmin
      ? query(regularOrdersRef, orderBy("createdAt", "desc"))
      : query(regularOrdersRef, where("userId", "==", user.uid), orderBy("createdAt", "desc"));

    const storeOrdersQuery = isAdmin
      ? query(storeOrdersRef, orderBy("createdAt", "desc"))
      : query(storeOrdersRef, where("userId", "==", user.uid), orderBy("createdAt", "desc"));

    const unsubscribeRegular = onSnapshot(
      regularOrdersQuery,
      (snapshot) => {
        const fetchedOrders: Order[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        })) as Order[];
        setOrders(fetchedOrders);
      },
      (err) => {
        console.error("Error fetching regular orders:", err);
      }
    );

    const unsubscribeStore = onSnapshot(
      storeOrdersQuery,
      (snapshot) => {
        const fetchedStoreOrders: StoreOrder[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        })) as StoreOrder[];
        setStoreOrders(fetchedStoreOrders);
      },
      (err) => {
        console.error("Error fetching store orders:", err);
      }
    );

    return () => {
      unsubscribeRegular();
      unsubscribeStore();
    };
  }, [db, user, appId, userRoles]);

  // Combine and sort orders by creation date
  useEffect(() => {
    const combined = [
      ...orders.map(order => ({
        id: order.id,
        type: "ticket" as const,
        order,
        createdAt: order.createdAt,
      })),
      ...storeOrders.map(order => ({
        id: order.id,
        type: "store" as const,
        order,
        createdAt: order.createdAt,
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    setCombinedOrders(combined);
    setLoadingOrders(false);
  }, [orders, storeOrders]);

  // --- Helper Functions for UI ---
  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "accepted":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "dismissed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "accepted":
        return <AlertCircle className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "dismissed":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatStatus = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "accepted":
        return "Accepted";
      case "completed":
        return "Payment Completed";
      case "dismissed":
        return "Dismissed";
      default:
        return status as string;
    }
  };

  const handleDeleteClick = (order: Order) => {
    setOrderToDelete(order);
    setDeletePassword("");
    setDeleteError(null);
    setShowDeleteDialog(true);
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete || deletePassword !== "oublydbv") {
      setDeleteError("Incorrect password");
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const orderRef = doc(
        db,
        `artifacts/${appId}/public/data/store-orders`,
        orderToDelete.id
      );
      await deleteDoc(orderRef);

      setShowDeleteDialog(false);
      setOrderToDelete(null);
      setDeletePassword("");
    } catch (error) {
      console.error("Error deleting order:", error);
      setDeleteError("Failed to delete order. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
    setOrderToDelete(null);
    setDeletePassword("");
    setDeleteError(null);
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
              <p className="text-sm text-muted-foreground mt-2">
                Please ensure your Firebase Firestore is set up correctly and
                your security rules allow read access to the 'store-orders'
                collection.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} appId={appId}>
      <div className="space-y-6 lg:space-y-8">
        <div className="mb-6 lg:mb-8 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div>
            <Button asChild variant="outline" size="sm" className="mb-3 lg:mb-4">
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-2">
              Orders & Tickets
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
              View and manage your store orders and support tickets.
            </p>
          </div>
        </div>

        <Card className="border-0 shadow-premium rounded-xl">
          <CardHeader className="border-b border-border p-4 lg:p-6">
            <CardTitle className="text-lg sm:text-xl lg:text-2xl font-semibold text-primary">
              Orders & Tickets
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 lg:p-6">
            {combinedOrders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No orders or tickets found.
                <Link
                  to="/store"
                  className="text-accent hover:underline ml-1 font-medium"
                >
                  Start shopping!
                </Link>
              </p>
            ) : (
              <div className="space-y-3 lg:space-y-4">
                {combinedOrders.map((combinedOrder) => {
                  if (combinedOrder.type === "ticket") {
                    const order = combinedOrder.order as Order;
                    return (
                      <Card
                        key={order.id}
                        className="border shadow-sm rounded-lg hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-3 lg:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div className="flex-grow">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                                Ticket Request
                              </Badge>
                              <h3 className="font-semibold text-base sm:text-lg text-primary">
                                {order.title || `Order ${order.ticketNumber}`}
                              </h3>
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3 inline-block" /> Created:{" "}
                              {order.createdAt
                                ? new Date(order.createdAt).toLocaleDateString()
                                : "N/A"}
                            </p>
                            <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <AlertCircle className="h-3 w-3 inline-block" />{" "}
                              Status:{" "}
                              <Badge className={getStatusColor(order.status)}>
                                <div className="flex items-center gap-1">
                                  {getStatusIcon(order.status)}
                                  {formatStatus(order.status)}
                                </div>
                              </Badge>
                            </div>
                            <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <Progress
                                value={order.progress}
                                className="h-2 w-20 sm:w-24 inline-block mr-2"
                              />{" "}
                              Progress: {order.progress}%
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="border-primary text-primary hover:bg-primary/10 rounded-md"
                            >
                              <Link to={`/dashboard/orders/${order.id}`}>
                                <Eye className="h-4 w-4 mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">View</span>
                              </Link>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(order)}
                              className="border-red-500 text-red-500 hover:bg-red-50 rounded-md"
                            >
                              <Trash2 className="h-4 w-4 mr-1 sm:mr-2" />
                              <span className="hidden sm:inline">Delete</span>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  } else {
                    const storeOrder = combinedOrder.order as StoreOrder;
                    return (
                      <Card
                        key={storeOrder.id}
                        className="border shadow-sm rounded-lg hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-3 lg:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div className="flex-grow">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                                Store Order
                              </Badge>
                              <h3 className="font-semibold text-base sm:text-lg text-primary">
                                {storeOrder.productName || `Order ${storeOrder.id.slice(-8).toUpperCase()}`}
                              </h3>
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                              <ShoppingCart className="h-3 w-3 inline-block" /> Quantity: {storeOrder.quantity}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3 inline-block" /> Created:{" "}
                              {storeOrder.createdAt
                                ? new Date(storeOrder.createdAt).toLocaleDateString()
                                : "N/A"}
                            </p>
                            <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <Truck className="h-3 w-3 inline-block" />{" "}
                              Status:{" "}
                              <Badge className={getStatusColor(storeOrder.status as Order["status"])}>
                                <div className="flex items-center gap-1">
                                  {getStatusIcon(storeOrder.status as Order["status"])}
                                  {formatStatus(storeOrder.status as Order["status"])}
                                </div>
                              </Badge>
                            </div>
                            <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <Progress
                                value={
                                  storeOrder.status === "pending"
                                    ? 25
                                    : storeOrder.status === "paid"
                                    ? 50
                                    : storeOrder.status === "shipped"
                                    ? 75
                                    : storeOrder.status === "delivered"
                                    ? 100
                                    : 0
                                }
                                className="h-2 w-20 sm:w-24 inline-block mr-2"
                              />{" "}
                              Progress: {
                                storeOrder.status === "pending"
                                  ? 25
                                  : storeOrder.status === "paid"
                                  ? 50
                                  : storeOrder.status === "shipped"
                                  ? 75
                                  : storeOrder.status === "delivered"
                                  ? 100
                                  : 0
                              }%
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="border-primary text-primary hover:bg-primary/10 rounded-md"
                            >
                              <Link to={`/dashboard/store-orders/${storeOrder.id}`}>
                                <Eye className="h-4 w-4 mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">View</span>
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Order</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this order? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="delete-password">Enter your password to confirm:</Label>
                <Input
                  id="delete-password"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter your password"
                  className="mt-2"
                />
              </div>
              {deleteError && (
                <p className="text-sm text-red-500">{deleteError}</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancelDelete}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteOrder}
                disabled={!deletePassword.trim()}
              >
                Delete Order
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default OrdersPage;
