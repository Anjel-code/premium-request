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
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete order state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!db || !user || userRoles.length === 0) {
      setLoadingOrders(false);
      return;
    }

    // Fetch store orders instead of regular orders
    const storeOrdersCollectionRef = collection(
      db,
      `artifacts/${appId}/public/data/store-orders`
    );

    // All users can see their own store orders
    const storeOrdersQuery = query(
      storeOrdersCollectionRef,
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      storeOrdersQuery,
      (snapshot) => {
        const fetchedOrders: Order[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data.userId,
            userEmail: data.userEmail,
            userName: data.userName,
            title: data.productName, // Use productName as title
            summary: `Quantity: ${data.quantity}`, // Use quantity as summary
            status:
              data.status === "paid"
                ? "accepted"
                : data.status === "shipped"
                ? "completed"
                : data.status === "delivered"
                ? "completed"
                : data.status === "cancelled"
                ? "dismissed"
                : "pending",
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
            ticketNumber: doc.id.slice(-8).toUpperCase(), // Use order ID as ticket number
            estimatedCompletion: null,
            budget: `$${data.totalAmount.toFixed(2)}`,
            progress:
              data.status === "pending"
                ? 25
                : data.status === "paid"
                ? 50
                : data.status === "shipped"
                ? 75
                : data.status === "delivered"
                ? 100
                : 0,
            lastUpdate: data.updatedAt?.toDate().toLocaleDateString() || "N/A",
            assignedTo: null,
            assignedDate: null,
            dismissedBy: null,
            dismissedDate: null,
          };
        }) as Order[];
        setOrders(fetchedOrders);
        setLoadingOrders(false);
      },
      (err) => {
        console.error("Error fetching store orders:", err);
        setError(
          "Failed to load store orders. Please check your internet connection and Firebase rules."
        );
        setLoadingOrders(false);
      }
    );

    return () => unsubscribe();
  }, [db, user, appId, userRoles]);

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
    setIsDeleteDialogOpen(true);
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

      setIsDeleteDialogOpen(false);
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
    setIsDeleteDialogOpen(false);
    setOrderToDelete(null);
    setDeletePassword("");
    setDeleteError(null);
  };

  if (loadingOrders) {
    return (
      <DashboardLayout>
        <div className="min-h-[calc(100vh-100px)] flex items-center justify-center p-6">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="ml-4 text-primary">Loading store orders...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
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
    <DashboardLayout>
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
              All Store Orders
            </h1>
            <p className="text-lg text-muted-foreground">
              A comprehensive list of all your product purchases and orders.
            </p>
          </div>
        </div>

        <Card className="border-0 shadow-premium rounded-xl">
          <CardHeader className="border-b border-border p-6">
            <CardTitle className="text-2xl font-semibold text-primary">
              Store Order List
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {orders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No store orders found.
                <Link
                  to="/store"
                  className="text-accent hover:underline ml-1 font-medium"
                >
                  Start shopping!
                </Link>
              </p>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card
                    key={order.id}
                    className="border shadow-sm rounded-lg hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="flex-grow">
                        <h3 className="font-semibold text-lg text-primary">
                          {order.title || `Order ${order.ticketNumber}`}
                        </h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3 inline-block" /> Created:{" "}
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString()
                            : "N/A"}
                        </p>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 inline-block" />{" "}
                          Status:{" "}
                          <Badge className={getStatusColor(order.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(order.status)}
                              {formatStatus(order.status)}
                            </div>
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Progress
                            value={order.progress}
                            className="h-2 w-24 inline-block mr-2"
                          />{" "}
                          Progress: {order.progress}%
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="border-primary text-primary hover:bg-primary/10 rounded-md"
                        >
                          <Link to={`/dashboard/store-orders/${order.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-600 text-red-600 hover:bg-red-50 rounded-md"
                          onClick={() => handleDeleteClick(order)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this order? This action cannot be
              undone.
              <br />
              <br />
              <strong>Order:</strong>{" "}
              {orderToDelete?.title || `Order ${orderToDelete?.ticketNumber}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="deletePassword">
                Enter password to confirm deletion:
              </Label>
              <Input
                id="deletePassword"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter password"
                className="mt-2"
              />
              {deleteError && (
                <p className="text-sm text-red-600 mt-2">{deleteError}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelDelete}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteOrder}
              disabled={isDeleting || !deletePassword}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Order"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default OrdersPage;
