import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Trash2,
  Search,
  Filter,
  Database,
  Users,
  ShoppingCart,
  Activity,
  AlertTriangle,
  CheckCircle,
  X,
  Eye,
  Calendar,
  MapPin,
  DollarSign,
} from "lucide-react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  getDocs,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { clearAllSampleData } from "../lib/liveViewUtils";

interface DatabaseManagementProps {
  user?: any;
  appId?: string;
}

interface Order {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  title?: string;
  productName?: string;
  status: "pending" | "accepted" | "completed" | "dismissed" | "paid" | "shipped" | "delivered" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
  budget?: string;
  totalPrice?: number;
  totalAmount?: number;
  paymentStatus?: string;
  location?: {
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
  };
}

interface UserActivity {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  activity: "view" | "cart" | "checkout" | "purchase";
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
  };
}

const DatabaseManagement: React.FC<DatabaseManagementProps> = ({ user, appId }) => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [storeOrders, setStoreOrders] = useState<Order[]>([]);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCollection, setSelectedCollection] = useState<"orders" | "store-orders" | "user-activities">("orders");
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [clearingSampleData, setClearingSampleData] = useState(false);

  // Fetch real-time data from Firestore
  useEffect(() => {
    if (!db || !appId) return;

    const ordersRef = collection(db, `artifacts/${appId}/public/data/orders`);
    const storeOrdersRef = collection(db, `artifacts/${appId}/public/data/store-orders`);
    const userActivitiesRef = collection(db, `artifacts/${appId}/public/data/user-activities`);

    // Listen to orders
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
      },
      (error) => {
        console.error("Error fetching orders:", error);
      }
    );

    // Listen to store orders
    const unsubscribeStoreOrders = onSnapshot(
      query(storeOrdersRef, orderBy("createdAt", "desc")),
      (snapshot) => {
        const fetchedStoreOrders: Order[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as Order[];
        setStoreOrders(fetchedStoreOrders);
      },
      (error) => {
        console.error("Error fetching store orders:", error);
      }
    );

    // Listen to user activities
    const unsubscribeActivities = onSnapshot(
      query(userActivitiesRef, orderBy("timestamp", "desc")),
      (snapshot) => {
        const fetchedActivities: UserActivity[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date(),
        })) as UserActivity[];
        setUserActivities(fetchedActivities);
      },
      (error) => {
        console.error("Error fetching user activities:", error);
      }
    );

    setLoading(false);

    return () => {
      unsubscribeOrders();
      unsubscribeStoreOrders();
      unsubscribeActivities();
    };
  }, [db, appId]);

  const handleDelete = async (id: string, collectionName: string) => {
    if (!db || !appId) return;

    setDeletingIds(prev => new Set(prev).add(id));
    
    try {
      const docRef = doc(db, `artifacts/${appId}/public/data/${collectionName}`, id);
      await deleteDoc(docRef);
      console.log(`Successfully deleted ${collectionName} with ID: ${id}`);
    } catch (error) {
      console.error(`Error deleting ${collectionName}:`, error);
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      setShowDeleteConfirm(null);
    }
  };

  const handleClearAllSampleData = async () => {
    if (!db || !appId) return;

    setClearingSampleData(true);
    
    try {
      await clearAllSampleData(appId);
      console.log("Successfully cleared all sample data");
    } catch (error) {
      console.error("Error clearing sample data:", error);
    } finally {
      setClearingSampleData(false);
    }
  };

  const getCurrentData = () => {
    switch (selectedCollection) {
      case "orders":
        return orders;
      case "store-orders":
        return storeOrders;
      case "user-activities":
        return userActivities;
      default:
        return orders;
    }
  };

  const getFilteredData = () => {
    const data = getCurrentData();
    if (!searchTerm) return data;

    return data.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      
      // Search in different fields based on collection type
      if (selectedCollection === "user-activities") {
        const activity = item as UserActivity;
        return (
          activity.userName?.toLowerCase().includes(searchLower) ||
          activity.userEmail?.toLowerCase().includes(searchLower) ||
          activity.activity?.toLowerCase().includes(searchLower) ||
          activity.location?.city?.toLowerCase().includes(searchLower) ||
          activity.location?.country?.toLowerCase().includes(searchLower)
        );
      } else {
        const order = item as Order;
        return (
          order.userName?.toLowerCase().includes(searchLower) ||
          order.userEmail?.toLowerCase().includes(searchLower) ||
          order.title?.toLowerCase().includes(searchLower) ||
          order.productName?.toLowerCase().includes(searchLower) ||
          order.status?.toLowerCase().includes(searchLower) ||
          order.location?.city?.toLowerCase().includes(searchLower) ||
          order.location?.country?.toLowerCase().includes(searchLower)
        );
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "delivered":
        return "bg-green-100 text-green-800";
      case "pending":
      case "accepted":
        return "bg-yellow-100 text-yellow-800";
      case "paid":
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
      case "dismissed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getActivityColor = (activity: string) => {
    switch (activity) {
      case "purchase":
        return "bg-green-100 text-green-800";
      case "checkout":
        return "bg-blue-100 text-blue-800";
      case "cart":
        return "bg-yellow-100 text-yellow-800";
      case "view":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <DashboardLayout user={user} appId={appId} userRole="admin">
        <div className="space-y-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
              <p className="text-muted-foreground">Loading database data...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const filteredData = getFilteredData();

  return (
    <DashboardLayout user={user} appId={appId} userRole="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Database Management</h1>
            <p className="text-sm text-muted-foreground">
              View and manage your Firestore data collections
            </p>
          </div>
          <Button
            variant="destructive"
            onClick={handleClearAllSampleData}
            disabled={clearingSampleData}
            className="flex items-center gap-2"
          >
            {clearingSampleData ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Clear All Sample Data
          </Button>
        </div>

        {/* Collection Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-premium rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Orders</p>
                  <p className="text-2xl font-bold text-primary">{orders.length}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-premium rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Store Orders</p>
                  <p className="text-2xl font-bold text-primary">{storeOrders.length}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <ShoppingCart className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-premium rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User Activities</p>
                  <p className="text-2xl font-bold text-primary">{userActivities.length}</p>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Activity className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card className="border-0 shadow-premium rounded-xl">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Collection Selector */}
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <select
                  value={selectedCollection}
                  onChange={(e) => setSelectedCollection(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="orders">Orders ({orders.length})</option>
                  <option value="store-orders">Store Orders ({storeOrders.length})</option>
                  <option value="user-activities">User Activities ({userActivities.length})</option>
                </select>
              </div>

              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`Search ${selectedCollection.replace('-', ' ')}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card className="border-0 shadow-premium rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              {selectedCollection.replace('-', ' ').charAt(0).toUpperCase() + selectedCollection.slice(1).replace('-', ' ')} 
              ({filteredData.length} records)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredData.length === 0 ? (
              <div className="text-center py-8">
                <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No data found</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredData.map((item) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        {/* Header */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            ID: {item.id.slice(0, 8)}...
                          </span>
                          {selectedCollection === "user-activities" ? (
                            <Badge className={getActivityColor((item as UserActivity).activity)}>
                              {(item as UserActivity).activity}
                            </Badge>
                          ) : (
                            <Badge className={getStatusColor((item as Order).status)}>
                              {(item as Order).status}
                            </Badge>
                          )}
                        </div>

                        {/* User Info */}
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span>{(item as any).userName || 'Unknown'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span>
                              {selectedCollection === "user-activities" 
                                ? (item as UserActivity).timestamp.toLocaleDateString()
                                : (item as Order).createdAt.toLocaleDateString()
                              }
                            </span>
                          </div>
                          {(item as any).location?.city && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span>{(item as any).location.city}</span>
                            </div>
                          )}
                          {(item as any).totalAmount && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3 text-muted-foreground" />
                              <span>${(item as any).totalAmount}</span>
                            </div>
                          )}
                        </div>

                        {/* Additional Details */}
                        {selectedCollection === "user-activities" ? (
                          <div className="text-sm text-muted-foreground">
                            Activity: {(item as UserActivity).activity} - {(item as UserActivity).userEmail}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            Product: {(item as Order).productName || (item as Order).title || 'No product name'}
                            {(item as Order).budget && ` - Budget: ${(item as Order).budget}`}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => console.log('View details:', item)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {showDeleteConfirm === item.id ? (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(item.id, selectedCollection)}
                              disabled={deletingIds.has(item.id)}
                            >
                              {deletingIds.has(item.id) ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowDeleteConfirm(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDeleteConfirm(item.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Warning */}
        <Card className="border-0 shadow-premium rounded-xl border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-900">⚠️ Warning</h3>
                <p className="text-sm text-red-700 mt-1">
                  Deleting records is permanent and cannot be undone. Make sure you want to delete the selected record before confirming.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DatabaseManagement; 