import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  TrendingUp,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  BarChart3,
  PieChart,
  MapPin,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Calendar,
  Settings,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";

interface AnalyticsProps {
  user?: any;
  appId?: string;
}

interface Order {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  title: string;
  status: "pending" | "accepted" | "completed" | "dismissed";
  createdAt: Date;
  updatedAt: Date;
  budget: string;
  progress: number;
  assignedTo: string | null;
  dismissedBy: string | null;
}

interface StoreOrder {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  productName: string;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
  totalPrice: number;
  totalAmount: number;
  paymentStatus: string;
}

const Analytics: React.FC<AnalyticsProps> = ({ user, appId }) => {
  const [dateRange, setDateRange] = useState("Today");
  const [compareDate, setCompareDate] = useState("Aug 6, 2025");
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [storeOrders, setStoreOrders] = useState<StoreOrder[]>([]);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Calculate analytics data
  const calculateAnalytics = () => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Filter orders for today
    const todayOrders = orders.filter(order => 
      order.createdAt >= startOfDay && order.createdAt < endOfDay
    );
    const todayStoreOrders = storeOrders.filter(order => 
      order.createdAt >= startOfDay && order.createdAt < endOfDay
    );

    // Calculate summary statistics
    const grossSales = todayStoreOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const totalOrders = todayOrders.length + todayStoreOrders.length;
    const completedOrders = todayOrders.filter(order => order.status === "completed").length +
                          todayStoreOrders.filter(order => order.status === "delivered").length;
    
    // Calculate returning customer rate
    const uniqueCustomers = new Set([
      ...todayOrders.map(order => order.userId),
      ...todayStoreOrders.map(order => order.userId)
    ]);
    const returningCustomers = Array.from(uniqueCustomers).filter(userId => {
      const allOrders = [...orders, ...storeOrders];
      return allOrders.filter(order => order.userId === userId).length > 1;
    }).length;
    const returningCustomerRate = uniqueCustomers.size > 0 ? 
      (returningCustomers / uniqueCustomers.size) * 100 : 0;

    return {
      grossSales,
      returningCustomerRate,
      ordersFulfilled: completedOrders,
      totalOrders,
      todayOrders,
      todayStoreOrders
    };
  };

  const analytics = calculateAnalytics();

  // Test function to try deleting a single document
  const testDeleteSingle = async () => {
    if (!db || !appId) return;
    
    // Debug: Log user information
    console.log("=== TEST DELETE DEBUG ===");
    console.log("User object:", user);
    console.log("User roles:", user?.roles);
    console.log("Is admin:", user?.roles?.includes('admin'));
    console.log("App ID:", appId);
    console.log("User UID:", user?.uid);
    
    try {
      const ordersRef = collection(db, `artifacts/${appId}/public/data/orders`);
      const snapshot = await getDocs(ordersRef);
      
      console.log("Found orders:", snapshot.docs.length);
      
      if (snapshot.docs.length > 0) {
        const firstDoc = snapshot.docs[0];
        console.log("Testing delete of single document:", firstDoc.id);
        console.log("Document data:", firstDoc.data());
        await deleteDoc(firstDoc.ref);
        console.log("Single document deleted successfully");
      } else {
        console.log("No orders found to test deletion");
      }
    } catch (error) {
      console.error("Test delete failed:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        user: user?.uid,
        roles: user?.roles,
        isAdmin: user?.roles?.includes('admin')
      });
    }
  };

  // Reset all data function
  const handleResetData = async () => {
    if (!db || !appId) return;
    
    // Debug: Log user information
    console.log("=== RESET DATA DEBUG ===");
    console.log("User object:", user);
    console.log("User roles:", user?.roles);
    console.log("Is admin:", user?.roles?.includes('admin'));
    console.log("App ID:", appId);
    console.log("User UID:", user?.uid);
    
    setResetting(true);
    try {
      // Get all orders and store orders
      const ordersRef = collection(db, `artifacts/${appId}/public/data/orders`);
      const storeOrdersRef = collection(db, `artifacts/${appId}/public/data/store-orders`);
      
      const ordersSnapshot = await getDocs(ordersRef);
      const storeOrdersSnapshot = await getDocs(storeOrdersRef);
      
      console.log("Found orders to delete:", ordersSnapshot.docs.length);
      console.log("Found store orders to delete:", storeOrdersSnapshot.docs.length);
      
      // Delete all orders
      const orderDeletions = ordersSnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      
      // Delete all store orders
      const storeOrderDeletions = storeOrdersSnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      
      // Wait for all deletions to complete
      await Promise.all([...orderDeletions, ...storeOrderDeletions]);
      
      console.log("All data reset successfully");
      setShowResetDialog(false);
    } catch (error) {
      console.error("Error resetting data:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        user: user?.uid,
        roles: user?.roles,
        isAdmin: user?.roles?.includes('admin')
      });
      alert("Error resetting data. Please try again.");
    } finally {
      setResetting(false);
    }
  };

  // Fetch data from Firestore
  useEffect(() => {
    if (!db || !appId) return;

    const ordersRef = collection(db, `artifacts/${appId}/public/data/orders`);
    const storeOrdersRef = collection(db, `artifacts/${appId}/public/data/store-orders`);

    const unsubscribeOrders = onSnapshot(
      query(ordersRef, orderBy("createdAt", "desc")),
      (snapshot) => {
        const fetchedOrders: Order[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as Order[];
        setOrders(fetchedOrders);
      }
    );

    const unsubscribeStoreOrders = onSnapshot(
      query(storeOrdersRef, orderBy("createdAt", "desc")),
      (snapshot) => {
        const fetchedStoreOrders: StoreOrder[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as StoreOrder[];
        setStoreOrders(fetchedStoreOrders);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeOrders();
      unsubscribeStoreOrders();
    };
  }, [db, appId]);

  // Mock data - in real implementation, this would come from your backend
  const summaryStats = [
    { title: "Gross sales", value: `$${analytics.grossSales.toFixed(2)}`, icon: DollarSign },
    { title: "Returning customer rate", value: `${analytics.returningCustomerRate.toFixed(1)}%`, icon: Users },
    { title: "Orders fulfilled", value: analytics.ordersFulfilled.toString(), icon: Package },
    { title: "Orders", value: analytics.totalOrders.toString(), icon: ShoppingCart },
  ];

  const salesBreakdown = [
    { label: "Gross sales", value: `$${analytics.grossSales.toFixed(2)}` },
    { label: "Discounts", value: "$0.00" },
    { label: "Returns", value: "$0.00" },
    { label: "Net sales", value: `$${analytics.grossSales.toFixed(2)}` },
    { label: "Shipping charges", value: "$0.00" },
    { label: "Return fees", value: "$0.00" },
    { label: "Taxes", value: "$0.00" },
    { label: "Total sales", value: `$${analytics.grossSales.toFixed(2)}` },
  ];

  const conversionBreakdown = [
    { label: "Sessions", value: `${analytics.totalOrders > 0 ? "100" : "0"}%` },
    { label: "Added to cart", value: `${analytics.totalOrders > 0 ? "100" : "0"}%` },
    { label: "Reached checkout", value: `${analytics.totalOrders > 0 ? "100" : "0"}%` },
    { label: "Completed checkout", value: `${analytics.totalOrders > 0 ? "100" : "0"}%` },
  ];

  const chartData = [
    { title: "Total sales over time", data: analytics.grossSales > 0 ? "Data available" : "No data" },
    { title: "Average order value over time", data: analytics.totalOrders > 0 ? "Data available" : "No data" },
    { title: "Sessions over time", data: analytics.totalOrders > 0 ? "Data available" : "No data" },
    { title: "Conversion rate over time", data: analytics.totalOrders > 0 ? "Data available" : "No data" },
  ];

  const breakdownSections = [
    "Total sales by sales channel",
    "Total sales by product",
    "Sessions by device type",
    "Sessions by location",
    "Total sales by social referrer",
    "Sessions by landing page",
    "Sales attributed to marketing",
    "Sessions by social referrer",
    "Sessions by referrer",
    "Total sales by POS location",
    "Products by sell-through rate",
    "POS staff sales total",
  ];

  if (loading) {
    return (
      <DashboardLayout user={user} appId={appId} userRole="admin">
        <div className="space-y-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
              <p className="text-muted-foreground">Loading analytics data...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} appId={appId} userRole="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-primary">Analytics</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Today</span>
              <span className="text-sm text-muted-foreground">Compare to:</span>
              <span className="text-sm font-medium">Aug 6, 2025</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Customize
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setShowResetDialog(true)}
                disabled={resetting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {resetting ? "Resetting..." : "Reset Data"}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={testDeleteSingle}
              >
                Test Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Reset Data Dialog */}
        <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Reset Analytics Data
              </DialogTitle>
              <DialogDescription>
                This action will permanently delete all orders and store orders data. 
                This will reset all analytics to zero. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <h4 className="font-semibold text-destructive mb-2">Data to be deleted:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• All regular orders ({orders.length} orders)</li>
                  <li>• All store orders ({storeOrders.length} orders)</li>
                  <li>• All sales data and analytics</li>
                  <li>• All customer order history</li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowResetDialog(false)}
                disabled={resetting}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleResetData}
                disabled={resetting}
              >
                {resetting ? (
                  <>
                    <BarChart3 className="h-4 w-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Reset All Data
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryStats.map((stat, index) => (
            <Card key={index} className="border-0 shadow-premium rounded-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-primary mt-1">
                      {stat.value}
                    </p>
                  </div>
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <stat.icon className="h-5 w-5 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Charts */}
          <div className="lg:col-span-2 space-y-6">
            {chartData.map((chart, index) => (
              <Card key={index} className="border-0 shadow-premium rounded-xl">
                <CardHeader className="border-b border-border p-6">
                  <CardTitle className="text-lg font-semibold text-primary">
                    {chart.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                    <div className="text-center">
                      {chart.data === "No data" ? (
                        <>
                          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground">No data for this date range</p>
                        </>
                      ) : (
                        <>
                          <BarChart3 className="h-12 w-12 text-primary mx-auto mb-2" />
                          <p className="text-primary font-medium">Real-time data available</p>
                          <p className="text-sm text-muted-foreground mt-1">Chart visualization coming soon</p>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Right Column - Sales Breakdown */}
          <div className="space-y-6">
            <Card className="border-0 shadow-premium rounded-xl">
              <CardHeader className="border-b border-border p-6">
                <CardTitle className="text-lg font-semibold text-primary">
                  Total sales breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {salesBreakdown.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {item.label}
                      </span>
                      <span className="text-sm font-medium text-primary">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-premium rounded-xl">
              <CardHeader className="border-b border-border p-6">
                <CardTitle className="text-lg font-semibold text-primary">
                  Conversion rate breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {conversionBreakdown.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {item.label}
                      </span>
                      <span className="text-sm font-medium text-primary">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Breakdown Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {breakdownSections.map((section, index) => (
            <Card key={index} className="border-0 shadow-premium rounded-xl">
              <CardHeader className="border-b border-border p-6">
                <CardTitle className="text-lg font-semibold text-primary">
                  {section}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-32 flex items-center justify-center bg-muted/20 rounded-lg">
                  <div className="text-center">
                    <PieChart className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No data for this date range
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Customer Cohort Analysis */}
        <Card className="border-0 shadow-premium rounded-xl">
          <CardHeader className="border-b border-border p-6">
            <CardTitle className="text-lg font-semibold text-primary">
              Customer cohort analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-sm font-medium text-muted-foreground">
                      Cohort
                    </th>
                    <th className="text-left py-2 text-sm font-medium text-muted-foreground">
                      Size
                    </th>
                    <th className="text-left py-2 text-sm font-medium text-muted-foreground">
                      Retention
                    </th>
                    <th className="text-left py-2 text-sm font-medium text-muted-foreground">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map((row) => (
                    <tr key={row} className="border-b border-border">
                      <td className="py-2 text-sm text-muted-foreground">
                        Cohort {row}
                      </td>
                      <td className="py-2 text-sm font-medium text-primary">0</td>
                      <td className="py-2 text-sm font-medium text-primary">0.0%</td>
                      <td className="py-2 text-sm font-medium text-primary">$0.00</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Analytics; 