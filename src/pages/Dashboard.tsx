import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Package,
  DollarSign,
  Calendar,
  MessageSquare,
  Target,
  Award,
  Zap,
  Star,
  Loader2, // Import Loader2 for loading state
  PlusCircle, // For the "Create Dummy Order" button
  ShoppingCart, // For Orders tab (from previous shorter version)
  Bell, // For Notifications tab (from previous shorter version)
  Users, // For Team Chat tab (from previous shorter version)
  XCircle, // For dismissed status
  User, // For Settings button
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/DashboardLayout";
import AnimatedCounter from "@/components/AnimatedCounter";

// Firebase imports
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase"; // Ensure this path is correct for your firebase.js
import { getUnreadNotificationCount } from "../lib/notificationUtils";

// Define the Order interface to match Firestore data and your display needs
interface Order {
  id: string;
  userId: string; // Added userId for filtering
  userEmail: string; // Added userEmail for context
  userName: string; // Added userName for context
  title: string;
  summary?: string; // Optional summary field
  status: "pending" | "accepted" | "completed" | "dismissed"; // Updated status types for consistency
  createdAt: Date; // Changed to Date as it will be converted on fetch
  updatedAt: Date; // Changed to Date as it will be converted on fetch
  ticketNumber: string;
  estimatedCompletion: Date | null; // Changed to Date or null
  budget: string;
  progress: number;
  lastUpdate: string;
  timeRemaining?: string; // Optional field
  isPaid?: boolean; // Optional field
  assignedTo: string | null; // Added assignedTo
  assignedDate: Date | null; // Added assignedDate
  dismissedBy: string | null; // Added dismissedBy
  dismissedDate: Date | null; // Added dismissedDate
  conversation?: Array<{ text: string; isBot: boolean; timestamp: string }>; // Optional conversation
}

// Define the UserProfile interface (matching what's stored in Firestore)
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  roles: string[]; // Crucial for role-based access
  photoURL?: string; // Optional, if you store it
}

// Props for the Dashboard component
interface DashboardProps {
  user: UserProfile | null;
  appId: string;
}

const Dashboard: React.FC<DashboardProps> = ({ user, appId }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [userRole, setUserRole] = useState<string[]>([]);
  const [loadingUserRole, setLoadingUserRole] = useState(true);
  const [error, setError] = useState<string | null>(null); // State for errors
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Fetch user's role on component mount or when user changes
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user || !db) {
        setLoadingUserRole(false);
        setUserRole([]); // No user, no roles
        return;
      }
      try {
        const userProfileRef = doc(db, `users`, user.uid); // Top-level 'users' collection
        const userSnap = await getDoc(userProfileRef);
        if (userSnap.exists()) {
          const profileData = userSnap.data() as UserProfile;
          setUserRole(profileData.roles || []);
        } else {
          setUserRole(["customer"]); // Default to customer if profile not found
        }
      } catch (err) {
        console.error("Error fetching user role:", err);
        setUserRole([]);
        setError("Failed to load user permissions.");
      } finally {
        setLoadingUserRole(false);
      }
    };
    fetchUserRole();
  }, [user, db]); // Re-run when user or db instance changes

  // Fetch store orders instead of regular orders
  useEffect(() => {
    // Wait until db, user, and userRole are loaded
    if (!db || !user || loadingUserRole) {
      if (!user) {
        // If no user, set orders to empty and stop loading
        setOrders([]);
        setLoadingOrders(false);
      }
      return;
    }

    // For now, we'll use the same Order interface but fetch from store-orders
    // In the future, we can create a separate interface for store orders
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
            isPaid: data.paymentStatus === "completed",
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

    return () => unsubscribe(); // Clean up the listener when the component unmounts
  }, [db, user, appId, userRole, loadingUserRole]); // Depend on userRole and loadingUserRole

  // Fetch unread notification count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user || !appId) return;

      try {
        const count = await getUnreadNotificationCount(appId, user.uid);
        setUnreadNotifications(count);
      } catch (err) {
        console.error("Error fetching unread notification count:", err);
      }
    };

    fetchUnreadCount();
  }, [user, appId]);

  // Determine if the user has admin or team_member role
  const hasAdminOrTeamRole =
    userRole.includes("admin") || userRole.includes("team_member");

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
        return <AlertCircle className="h-4 w-4" />; // Using AlertCircle for accepted, could be different
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "dismissed":
        return <XCircle className="h-4 w-4" />; // Using XCircle for dismissed
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatStatus = (status: Order["status"]) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => o.status === "completed").length;
  const activeOrders = orders.filter(
    (o) => o.status !== "completed" && o.status !== "dismissed"
  ).length; // Active excludes dismissed
  const avgProgress =
    orders.length > 0
      ? Math.round(
          orders.reduce((acc, o) => acc + o.progress, 0) / orders.length
        )
      : 0;

  if (loadingUserRole || loadingOrders) {
    // Combine loading states
    return (
      <DashboardLayout>
        <div className="min-h-[calc(100vh-100px)] flex items-center justify-center p-6">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="ml-4 text-primary">Loading your dashboard data...</p>
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
                your security rules allow read access to the 'orders'
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
            <h1 className="text-4xl font-bold text-primary mb-2">
              Dashboard Overview
            </h1>
            <p className="text-lg text-muted-foreground">
              Track your product orders, manage settings, and stay updated on
              your purchases
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button asChild variant="outline">
              <Link to="/dashboard/settings">
                <User className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </Button>
            {hasAdminOrTeamRole && (
              <>
                <Button onClick={() => navigate("queue")}>See the Queue</Button>
                <Button
                  asChild
                  className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-md shadow-sm"
                >
                  <Link to="/dashboard/admin/store-orders">
                    <Package className="mr-2 h-4 w-4" /> Manage Store Orders
                  </Link>
                </Button>
                <Button
                  onClick={() => navigate("/create-dummy-order")}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-md shadow-sm"
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Create Dummy Order
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Enhanced Statistics Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-elegant hover:shadow-premium transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <AnimatedCounter
                    end={totalOrders}
                    className="text-2xl font-bold text-primary"
                    duration={1500}
                  />
                </div>
                <Package className="h-8 w-8 text-accent animate-bounce-subtle" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-elegant hover:shadow-premium transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Orders</p>
                  <AnimatedCounter
                    end={activeOrders}
                    className="text-2xl font-bold text-primary"
                    duration={1500}
                  />
                </div>
                <Clock className="h-8 w-8 text-accent animate-pulse-glow" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-elegant hover:shadow-premium transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <AnimatedCounter
                    end={completedOrders}
                    className="text-2xl font-bold text-primary"
                    duration={1500}
                  />
                </div>
                <CheckCircle className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-elegant hover:shadow-premium transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Progress</p>
                  <AnimatedCounter
                    end={avgProgress}
                    suffix="%"
                    className="text-2xl font-bold text-primary"
                    duration={1500}
                  />
                </div>
                <TrendingUp className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gamification Elements */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-elegant bg-gradient-gold/10">
            <CardContent className="p-6 text-center">
              <Target className="h-12 w-12 text-accent mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Completion Rate</h3>
              <AnimatedCounter
                end={92}
                suffix="%"
                className="text-3xl font-bold text-accent"
                duration={2000}
              />
              <p className="text-sm text-muted-foreground mt-2">
                Keep up the great work!
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-elegant bg-gradient-gold/10">
            <CardContent className="p-6 text-center">
              <Award className="h-12 w-12 text-accent mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Loyalty Level</h3>
              <div className="text-3xl font-bold text-accent mb-2">Gold</div>
              <Progress value={75} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                25% to Platinum
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-elegant bg-gradient-gold/10">
            <CardContent className="p-6 text-center">
              <Star className="h-12 w-12 text-accent mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Satisfaction Score</h3>
              <div className="flex justify-center mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-6 w-6 fill-accent text-accent" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Excellent feedback!
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Orders, Notifications, Team Chat */}
        {/* Note: These tabs are visually present but their content is simple placeholders.
            The actual "All Orders" view is handled by DashboardOrders.tsx via the link. */}
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 bg-muted/50 rounded-lg p-1 mb-4">
            <TabsTrigger
              value="orders"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-md transition-all duration-200"
            >
              <ShoppingCart className="mr-2 h-4 w-4" /> Orders
            </TabsTrigger>
            <TabsTrigger
              value="store-orders"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-md transition-all duration-200"
            >
              <Package className="mr-2 h-4 w-4" /> Store Orders
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-md transition-all duration-200"
            >
              <Bell className="mr-2 h-4 w-4" /> Notifications
              {unreadNotifications > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                >
                  {unreadNotifications}
                </Badge>
              )}
            </TabsTrigger>
            {hasAdminOrTeamRole && (
              <TabsTrigger
                value="team-chat"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-md transition-all duration-200"
              >
                <Users className="mr-2 h-4 w-4" /> Team Chat
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="orders" className="mt-6">
            <Card className="border-0 shadow-premium rounded-xl">
              <CardHeader className="border-b border-border p-6">
                <CardTitle className="text-2xl font-semibold text-primary">
                  Your Recent Store Orders
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {loadingOrders ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" />
                    <span className="text-primary">Loading orders...</span>
                  </div>
                ) : orders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No orders found.
                    <Link
                      to="/store"
                      className="text-accent hover:underline ml-1 font-medium"
                    >
                      Start shopping!
                    </Link>
                  </p>
                ) : (
                  <div className="space-y-4">
                    {orders.slice(0, 3).map(
                      (
                        order // Display only top 3 recent orders
                      ) => (
                        <Card
                          key={order.id}
                          className="border shadow-sm rounded-lg"
                        >
                          <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div>
                              <h3 className="font-semibold text-lg text-primary">
                                {order.title || `Order ${order.ticketNumber}`}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Status:{" "}
                                <span
                                  className={`font-medium ${getStatusColor(
                                    order.status
                                  )}`}
                                >
                                  {formatStatus(order.status)}
                                </span>
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Created:{" "}
                                {order.createdAt
                                  ? new Date(
                                      order.createdAt
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </p>
                            </div>
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
                          </CardContent>
                        </Card>
                      )
                    )}
                    {orders.length > 3 && (
                      <div className="text-center mt-6">
                        <Button asChild variant="outline">
                          <Link to="/dashboard/store-orders">
                            View All Orders
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="store-orders" className="mt-6">
            <Card className="border-0 shadow-premium rounded-xl">
              <CardHeader className="border-b border-border p-6">
                <CardTitle className="text-2xl font-semibold text-primary">
                  Store Orders
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                    Product Purchases
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Track your product purchases and delivery status.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button asChild variant="outline">
                      <Link to="/dashboard/store-orders">
                        View Store Orders
                      </Link>
                    </Button>
                    <Button
                      asChild
                      className="bg-accent hover:bg-accent/90 text-accent-foreground"
                    >
                      <Link to="/store">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Shop Now
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <Card className="border-0 shadow-premium rounded-xl">
              <CardHeader className="border-b border-border p-6">
                <CardTitle className="text-2xl font-semibold text-primary">
                  Recent Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                    Notifications
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    View all your notifications and updates here.
                  </p>
                  <Button asChild variant="outline">
                    <Link to="/dashboard/notifications">
                      View All Notifications
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {hasAdminOrTeamRole && (
            <TabsContent value="team-chat" className="mt-6">
              <Card className="border-0 shadow-premium rounded-xl">
                <CardHeader className="border-b border-border p-6">
                  <CardTitle className="text-2xl font-semibold text-primary">
                    Team Communication
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground py-8">
                    Team chat functionality will be available here.
                    <Link
                      to="/team-chat"
                      className="text-accent hover:underline ml-1 font-medium"
                    >
                      Go to Team Chat
                    </Link>
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
