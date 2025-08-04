// src/pages/DashboardOrders.tsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase"; // Ensure db is imported

// Define the Order interface (matching Firestore document structure)
interface Order {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  title: string;
  summary: string;
  status: "pending" | "accepted" | "completed" | "dismissed";
  createdAt: Date;
  updatedAt: Date;
  ticketNumber: string;
  estimatedCompletion: string | null;
  budget: string;
  progress: number;
  lastUpdate: string;
  assignedTo: string | null;
  assignedDate: Date | null;
  dismissedBy: string | null;
  dismissedDate: Date | null;
  conversation: Array<{ text: string; isBot: boolean; timestamp: string }>;
}

// Define the UserProfile interface (matching what's stored in Firestore)
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  roles: string[]; // Crucial for role-based access
  photoURL?: string; // Optional, if you store it
}

// Props for the DashboardOrders component
interface DashboardOrdersProps {
  user: UserProfile | null; // Now accepts user object
  appId: string; // Now accepts appId
}

const DashboardOrders: React.FC<DashboardOrdersProps> = ({ user, appId }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [userRole, setUserRole] = useState<string[]>([]);
  const [loadingUserRole, setLoadingUserRole] = useState(true);

  // Fetch user's role on component mount
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user || !db) {
        setLoadingUserRole(false);
        return;
      }
      try {
        // Fetch user profile from the 'users' collection
        const userProfileRef = doc(db, `users`, user.uid);
        const userSnap = await getDoc(userProfileRef);
        if (userSnap.exists()) {
          const profileData = userSnap.data() as UserProfile;
          setUserRole(profileData.roles || []);
        } else {
          setUserRole([]); // Default to no roles if profile not found
        }
      } catch (error) {
        console.error("Error fetching user role in DashboardOrders:", error);
        setUserRole([]);
      } finally {
        setLoadingUserRole(false);
      }
    };
    fetchUserRole();
  }, [user, db]); // Re-run when user or db instance changes

  // Fetch orders based on user role
  useEffect(() => {
    // Ensure db, user, and userRole are loaded before attempting to fetch orders
    if (!db || !user || loadingUserRole) return;

    let ordersQuery;
    const ordersCollectionRef = collection(
      db,
      `artifacts/${appId}/public/data/orders`
    );

    if (userRole.includes("admin") || userRole.includes("team_member")) {
      // Admins and Team Members can see all orders
      ordersQuery = query(ordersCollectionRef, orderBy("createdAt", "desc"));
    } else if (userRole.includes("customer")) {
      // Customers can only see their own orders
      ordersQuery = query(
        ordersCollectionRef,
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
    } else {
      // No recognized role or unauthenticated, show no orders
      setOrders([]);
      setLoadingOrders(false);
      return;
    }

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const fetchedOrders: Order[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore Timestamps to Date objects if necessary
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          assignedDate: doc.data().assignedDate?.toDate(),
          dismissedDate: doc.data().dismissedDate?.toDate(),
        })) as Order[];
        setOrders(fetchedOrders);
        setLoadingOrders(false);
      },
      (error) => {
        console.error("Error fetching orders in DashboardOrders:", error);
        setLoadingOrders(false);
      }
    );

    return () => unsubscribe(); // Cleanup listener on unmount
  }, [db, user, appId, userRole, loadingUserRole]); // Depend on userRole and loadingUserRole

  if (loadingUserRole || loadingOrders) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="ml-4 text-primary">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-20 px-6">
      <div className="container mx-auto max-w-6xl">
        <Card className="border-0 shadow-premium rounded-xl">
          <CardHeader className="border-b border-border">
            <CardTitle>Your Orders</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {orders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No orders found.
                {userRole.includes("customer") && (
                  <Link
                    to="/order"
                    className="text-accent hover:underline ml-1"
                  >
                    Start a new request!
                  </Link>
                )}
              </p>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id} className="border shadow-sm">
                    <CardContent className="p-4 flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {order.title || `Order ${order.ticketNumber}`}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Status:{" "}
                          <span
                            className={`font-medium ${
                              order.status === "pending"
                                ? "text-yellow-600"
                                : order.status === "accepted"
                                ? "text-blue-600"
                                : order.status === "completed"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {order.status.charAt(0).toUpperCase() +
                              order.status.slice(1)}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Created:{" "}
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                      <Button
                        onClick={() => navigate(`/ticket/${order.id}`)}
                        variant="outline"
                        size="sm"
                      >
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOrders;
