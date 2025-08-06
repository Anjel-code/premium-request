import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  XCircle,
  ArrowLeft,
  Package,
  Truck,
  ShoppingCart,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { StoreOrder } from "@/lib/storeUtils";

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  roles: string[];
  photoURL?: string;
}

interface DashboardStoreOrdersProps {
  user: UserProfile | null;
  appId: string;
}

const DashboardStoreOrders: React.FC<DashboardStoreOrdersProps> = ({
  user,
  appId,
}) => {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db || !user) {
      setLoadingOrders(false);
      return;
    }

    const ordersCollectionRef = collection(
      db,
      `artifacts/${appId}/public/data/store-orders`
    );

    const ordersQuery = query(
      ordersCollectionRef,
      where("userId", "==", user.uid),
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
        setError(
          "Failed to load store orders. Please check your internet connection."
        );
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
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getPaymentStatusColor = (status: StoreOrder["paymentStatus"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatStatus = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
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
              Store Orders
            </h1>
            <p className="text-lg text-muted-foreground">
              Track your product purchases and delivery status.
            </p>
          </div>
          <Button
            asChild
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            <Link to="/store">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Shop Now
            </Link>
          </Button>
        </div>

        <Card className="border-0 shadow-premium rounded-xl">
          <CardHeader className="border-b border-border p-6">
            <CardTitle className="text-2xl font-semibold text-primary">
              Your Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  No store orders found.
                </p>
                <Button
                  asChild
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  <Link to="/store">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Start Shopping
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card
                    key={order.id}
                    className="border shadow-sm rounded-lg hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="flex-grow">
                          <h3 className="font-semibold text-lg text-primary">
                            {order.productName}
                          </h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3 inline-block" /> Ordered:{" "}
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleDateString()
                              : "N/A"}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge className={getStatusColor(order.status)}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(order.status)}
                                {formatStatus(order.status)}
                              </div>
                            </Badge>
                            <Badge
                              className={getPaymentStatusColor(
                                order.paymentStatus
                              )}
                            >
                              {formatStatus(order.paymentStatus)}
                            </Badge>
                            <Badge variant="outline">
                              Qty: {order.quantity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            Total: ${order.totalAmount.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="border-primary text-primary hover:bg-primary/10 rounded-md"
                          >
                            <Link to={`/dashboard/store-orders/${order.id}`}>
                              View Details
                            </Link>
                          </Button>
                          {order.status === "shipped" && (
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="border-green-600 text-green-600 hover:bg-green-50 rounded-md"
                            >
                              <Link to={`/dashboard/store-orders/${order.id}`}>
                                Track Package
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
      </div>
    </DashboardLayout>
  );
};

export default DashboardStoreOrders;
