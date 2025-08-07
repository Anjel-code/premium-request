import React, { useState, useEffect, useRef, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Users,
  DollarSign,
  ShoppingCart,
  Package,
  MapPin,
  Search,
  Eye,
  Maximize2,
  Plus,
  Minus,
  Globe,
  TrendingUp,
  Activity,
  Database,
} from "lucide-react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars, Html } from "@react-three/drei";
import * as THREE from "three";
import { generateSampleUserActivity, generateSampleOrders } from "../lib/liveViewUtils";

// Utility function to ensure user has admin role
const ensureAdminRole = async (user: any, appId: string) => {
  if (!user?.uid || !appId) return;
  
  try {
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      // Create user document with admin role
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email,
        roles: ["admin"],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log("Created user document with admin role");
    } else {
      const userData = userDoc.data();
      if (!userData.roles || !Array.isArray(userData.roles) || !userData.roles.includes("admin")) {
        // Update user document with admin role
        await updateDoc(userDocRef, {
          roles: ["admin"],
          updatedAt: new Date()
        });
        console.log("Updated user document with admin role");
      }
    }
  } catch (error) {
    console.error("Error ensuring admin role:", error);
  }
};

interface LiveViewProps {
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

// 3D Globe Component
function Earth({ userLocations }: { userLocations: Array<{ lat: number; lng: number; type: string; locationName?: string }> }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [textureLoaded, setTextureLoaded] = useState(false);

  useEffect(() => {
    if (meshRef.current) {
      const textureLoader = new THREE.TextureLoader();
      const material = meshRef.current.material as THREE.MeshPhongMaterial;
      
      // Try multiple texture sources
      const textureUrls = [
        '/images/earth-texture.jpg',
        'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg',
        'https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x5400x2700.jpg'
      ];
      
      let currentUrlIndex = 0;
      
      const tryNextTexture = () => {
        if (currentUrlIndex >= textureUrls.length) {
          console.log('All texture sources failed, using fallback');
          // Create a simple procedural texture as fallback
          const canvas = document.createElement('canvas');
          canvas.width = 1024;
          canvas.height = 512;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Blue ocean background
            ctx.fillStyle = '#1e40af';
            ctx.fillRect(0, 0, 1024, 512);
            
            // Simple green continents
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(200, 100, 300, 200); // North America
            ctx.fillRect(800, 150, 400, 250); // Europe/Asia
            ctx.fillRect(900, 450, 200, 300); // Africa
            ctx.fillRect(1400, 700, 200, 150); // Australia
            
            const texture = new THREE.CanvasTexture(canvas);
            material.map = texture;
            material.color = new THREE.Color(0xffffff);
            material.needsUpdate = true;
            setTextureLoaded(true);
          }
          return;
        }
        
        const currentUrl = textureUrls[currentUrlIndex];
        console.log(`Trying texture: ${currentUrl}`);
        
        textureLoader.load(
          currentUrl,
          (texture) => {
            console.log('Earth texture loaded successfully from:', currentUrl);
            material.map = texture;
            material.color = new THREE.Color(0xffffff);
            material.transparent = false;
            material.opacity = 1;
            material.needsUpdate = true;
            setTextureLoaded(true);
          },
          (progress) => {
            console.log('Loading earth texture...', progress);
          },
          (error) => {
            console.log(`Failed to load texture from ${currentUrl}:`, error);
            currentUrlIndex++;
            tryNextTexture();
          }
        );
      };
      
      tryNextTexture();
    }
  }, []);

  return (
    <group>
      {/* Earth */}
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhongMaterial
          color={0xffffff}
          transparent={false}
          opacity={1}
          shininess={30}
          specular={0x111111}
          emissive={0x000000}
          emissiveIntensity={0}
        />
      </mesh>

             {/* User location pins */}
       {userLocations.map((location, index) => (
         <LocationPin
           key={index}
           lat={location.lat}
           lng={location.lng}
           type={location.type}
           locationName={location.locationName}
         />
       ))}

      {/* Stars background */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
    </group>
  );
}

// Location Pin Component
function LocationPin({ lat, lng, type, locationName }: { lat: number; lng: number; type: string; locationName?: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  
  const x = -(1.02 * Math.sin(phi) * Math.cos(theta));
  const z = (1.02 * Math.sin(phi) * Math.sin(theta));
  const y = (1.02 * Math.cos(phi));

  const color = type === 'order' ? '#ef4444' : '#8b5cf6';
  const pinScale = hovered ? 1.2 : 1;

  // Add pulsing animation
  useEffect(() => {
    if (groupRef.current) {
      const animate = () => {
        if (groupRef.current) {
          groupRef.current.scale.setScalar(pinScale * (1 + Math.sin(Date.now() * 0.005) * 0.1));
        }
        requestAnimationFrame(animate);
      };
      animate();
    }
  }, [pinScale]);

  return (
    <group 
      ref={groupRef}
      position={[x, y, z]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Pin Head - spherical top */}
      <mesh position={[0, 0.02, 0]}>
        <sphereGeometry args={[0.015, 16, 16]} />
        <meshPhongMaterial 
          color={color} 
          emissive={color}
          emissiveIntensity={hovered ? 0.8 : 0.4}
          shininess={100}
        />
      </mesh>
      
      {/* Pin Shaft - cylindrical body */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.003, 0.003, 0.04, 8]} />
        <meshPhongMaterial 
          color={color} 
          emissive={color}
          emissiveIntensity={hovered ? 0.6 : 0.3}
          shininess={80}
        />
      </mesh>
      
      {/* Pin Tip - cone pointing down */}
      <mesh position={[0, -0.02, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.003, 0.02, 8]} />
        <meshPhongMaterial 
          color={color} 
          emissive={color}
          emissiveIntensity={hovered ? 0.6 : 0.3}
          shininess={80}
        />
      </mesh>
      
      {/* Tooltip (only show when hovered) */}
      {hovered && locationName && (
        <Html position={[0, 0.06, 0]} center>
          <div className="bg-black/90 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap border border-white/30 shadow-lg backdrop-blur-sm">
            {locationName}
          </div>
        </Html>
      )}
    </group>
  );
}

const LiveView: React.FC<LiveViewProps> = ({ user, appId }) => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [storeOrders, setStoreOrders] = useState<Order[]>([]);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [searchLocation, setSearchLocation] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hasNoData, setHasNoData] = useState(false);
  const [generatingSampleData, setGeneratingSampleData] = useState(false);

  // Function to manually generate sample data
  const handleGenerateSampleData = async () => {
    if (!appId) return;
    setGeneratingSampleData(true);
    try {
      console.log("🔄 LiveView: Manually generating sample data...");
      await generateSampleUserActivity(appId);
      await generateSampleOrders(appId);
      console.log("✅ LiveView: Sample data generated successfully");
      setHasNoData(false);
    } catch (error) {
      console.error("❌ LiveView: Error generating sample data:", error);
    } finally {
      setGeneratingSampleData(false);
    }
  };

  // Real-time statistics
  const [stats, setStats] = useState({
    visitorsNow: 0,
    totalSales: 0,
    totalSessions: 0,
    totalOrders: 0,
    activeCarts: 0,
    checkingOut: 0,
    purchased: 0,
  });

  // Top locations data
  const [topLocations, setTopLocations] = useState<Array<{
    location: string;
    sessions: number;
    percentage: number;
  }>>([]);

  // Customer behavior data
  const [customerBehavior, setCustomerBehavior] = useState({
    firstTime: 0,
    returning: 0,
  });

  // Top products data
  const [topProducts, setTopProducts] = useState<Array<{
    name: string;
    sales: number;
    percentage: number;
  }>>([]);

  // User locations for the globe
  const [userLocations, setUserLocations] = useState<Array<{
    lat: number;
    lng: number;
    type: string;
    locationName?: string;
  }>>([]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch real-time data from Firestore
  useEffect(() => {
    if (!db || !appId) return;

    // Ensure user has admin role
    ensureAdminRole(user, appId);

    const ordersRef = collection(db, `artifacts/${appId}/public/data/orders`);
    const storeOrdersRef = collection(db, `artifacts/${appId}/public/data/store-orders`);
    const userActivitiesRef = collection(db, `artifacts/${appId}/public/data/user-activities`);

    // Check for existing data without generating sample data automatically
    const checkExistingData = async () => {
      try {
        // Check if we have any user activities
        const activitiesSnapshot = await getDocs(userActivitiesRef);
        const hasActivities = !activitiesSnapshot.empty;
        
        // Check if we have any orders
        const ordersSnapshot = await getDocs(ordersRef);
        const hasOrders = !ordersSnapshot.empty;
        
        // Check if we have any store orders
        const storeOrdersSnapshot = await getDocs(storeOrdersRef);
        const hasStoreOrders = !storeOrdersSnapshot.empty;
        
        const hasAnyData = hasActivities || hasOrders || hasStoreOrders;
        setHasNoData(!hasAnyData);
        
        if (!hasAnyData) {
          console.log("ℹ️ LiveView: No data found in database - LiveView will show empty state");
        } else {
          console.log("ℹ️ LiveView: Found data - activities:", activitiesSnapshot.docs.length, "orders:", ordersSnapshot.docs.length, "store orders:", storeOrdersSnapshot.docs.length);
        }
      } catch (error) {
        console.log("Could not check for existing data:", error);
        setHasNoData(true);
      }
    };
    
    checkExistingData();

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
        console.log("Fetched orders:", fetchedOrders.length, fetchedOrders);
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
        
        console.log("Fetched store orders:", fetchedStoreOrders.length, fetchedStoreOrders);
        setStoreOrders(fetchedStoreOrders);
      },
      (error) => {
        console.error("Error fetching store orders:", error);
      }
    );

    // Listen to user activities (with error handling)
    let unsubscribeActivities: (() => void) | null = null;
    
    try {
      unsubscribeActivities = onSnapshot(
        query(userActivitiesRef, orderBy("timestamp", "desc")),
        (snapshot) => {
          const fetchedActivities: UserActivity[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate() || new Date(),
          })) as UserActivity[];
          console.log("Fetched user activities:", fetchedActivities.length, fetchedActivities);
          setUserActivities(fetchedActivities);
        },
        (error) => {
          console.warn("User activities collection not accessible (permissions or not created yet):", error);
          // Set empty array to avoid errors
          setUserActivities([]);
        }
      );
    } catch (error) {
      console.warn("Could not set up user activities listener:", error);
      setUserActivities([]);
    }

    setLoading(false);

    return () => {
      unsubscribeOrders();
      unsubscribeStoreOrders();
      if (unsubscribeActivities) {
        unsubscribeActivities();
      }
    };
  }, [db, appId]);

  // Calculate real-time statistics
  useEffect(() => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // Filter recent activities (handle empty array)
    const recentActivities = userActivities.filter(
      activity => activity.timestamp >= fiveMinutesAgo
    );

    // Calculate statistics
    const visitorsNow = recentActivities.filter(
      activity => activity.activity === "view"
    ).length;

    // Combine all orders for calculations
    const allOrders = [...orders, ...storeOrders];
    
    const totalSales = allOrders.reduce((sum, order) => 
      sum + (order.totalAmount || order.totalPrice || 0), 0
    );

    const totalSessions = userActivities.filter(
      activity => activity.activity === "view"
    ).length;

    const totalOrders = allOrders.length;

    const activeCarts = userActivities.filter(
      activity => activity.activity === "cart"
    ).length;

    const checkingOut = userActivities.filter(
      activity => activity.activity === "checkout"
    ).length;

    const purchased = userActivities.filter(
      activity => activity.activity === "purchase"
    ).length;

    const calculatedStats = {
      visitorsNow,
      totalSales,
      totalSessions,
      totalOrders,
      activeCarts,
      checkingOut,
      purchased,
    };
    
    console.log("Calculated stats:", calculatedStats);
    setStats(calculatedStats);

    // Calculate top locations
    const locationCounts: { [key: string]: number } = {};
    userActivities.forEach(activity => {
      if (activity.location?.city && activity.location?.country) {
        const location = `${activity.location.city}, ${activity.location.country}`;
        locationCounts[location] = (locationCounts[location] || 0) + 1;
      }
    });

    const topLocationsData = Object.entries(locationCounts)
      .map(([location, sessions]) => ({
        location,
        sessions,
        percentage: totalSessions > 0 ? (sessions / totalSessions) * 100 : 0,
      }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 5);

    setTopLocations(topLocationsData);

      // Calculate customer behavior
  const uniqueUsers = new Set(userActivities.map(activity => activity.userId));
  const firstTimeUsers = Array.from(uniqueUsers).filter(userId => {
    const userActivitiesForUser = userActivities.filter(activity => activity.userId === userId);
    return userActivitiesForUser.length === 1;
  }).length;

    setCustomerBehavior({
      firstTime: firstTimeUsers,
      returning: uniqueUsers.size - firstTimeUsers,
    });

    // Calculate top products
    const productSales: { [key: string]: number } = {};
    allOrders.forEach(order => {
      const productName = order.productName || order.title || "Unknown Product";
      productSales[productName] = (productSales[productName] || 0) + (order.totalAmount || order.totalPrice || 0);
    });

    const topProductsData = Object.entries(productSales)
      .map(([name, sales]) => ({
        name,
        sales,
        percentage: totalSales > 0 ? (sales / totalSales) * 100 : 0,
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 3);

    setTopProducts(topProductsData);

    // Generate user locations for the globe
    const locations: Array<{ lat: number; lng: number; type: string; locationName?: string }> = [];
    
    // Add order locations
    allOrders.forEach(order => {
      if (order.location?.latitude && order.location?.longitude) {
        const locationName = order.location.city && order.location.country 
          ? `${order.location.city}, ${order.location.country}`
          : order.location.city || order.location.country || 'Unknown Location';
        
        locations.push({
          lat: order.location.latitude,
          lng: order.location.longitude,
          type: 'order',
          locationName,
        });
      }
    });

    // Add user activity locations
    userActivities.forEach(activity => {
      if (activity.location?.latitude && activity.location?.longitude) {
        const locationName = activity.location.city && activity.location.country 
          ? `${activity.location.city}, ${activity.location.country}`
          : activity.location.city || activity.location.country || 'Unknown Location';
        
        locations.push({
          lat: activity.location.latitude,
          lng: activity.location.longitude,
          type: 'visitor',
          locationName,
        });
      }
    });

    setUserLocations(locations);

  }, [orders, storeOrders, userActivities]);

  if (loading) {
    return (
      <DashboardLayout user={user} appId={appId} userRole="admin">
        <div className="space-y-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
              <p className="text-muted-foreground">Loading live view data...</p>
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
          <div>
            <h1 className="text-3xl font-bold text-primary">Live View</h1>
            <p className="text-sm text-muted-foreground">
              {currentTime.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              })} at {currentTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              })} EDT
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Orders</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span>Visitors right now</span>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => generateSampleUserActivity(appId || '')}
            >
              Generate User Data
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => generateSampleOrders(appId || '')}
            >
              Generate Orders
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => ensureAdminRole(user, appId || '')}
            >
              Ensure Admin Role
            </Button>
          </div>
        </div>

        {/* Empty State */}
        {hasNoData && (
          <Card className="border-0 shadow-premium rounded-xl">
            <CardContent className="p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Database className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  The LiveView dashboard is currently empty. To see live statistics and activity on the globe, you can generate sample data for testing purposes.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={handleGenerateSampleData}
                    disabled={generatingSampleData}
                    className="flex items-center gap-2"
                  >
                    {generatingSampleData ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <Database className="h-4 w-4" />
                    )}
                    {generatingSampleData ? "Generating..." : "Generate Sample Data"}
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="/database-management">View Database</a>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Sample data includes fake user activities and orders for demonstration purposes.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Statistics */}
          <div className="lg:col-span-1 space-y-6">
            {/* Key Metrics */}
            <div className="space-y-4">
              <Card className="border-0 shadow-premium rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Visitors right now</p>
                      <p className="text-2xl font-bold text-primary">{stats.visitorsNow.toLocaleString()}</p>
                    </div>
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-premium rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total sales</p>
                      <p className="text-2xl font-bold text-primary">${stats.totalSales.toLocaleString()}</p>
                      <div className="w-16 h-1 bg-blue-500 mt-2"></div>
                    </div>
                    <div className="p-2 bg-green-100 rounded-lg">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-premium rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Sessions</p>
                      <p className="text-2xl font-bold text-primary">{stats.totalSessions.toLocaleString()}</p>
                      <div className="w-16 h-1 bg-blue-500 mt-2"></div>
                    </div>
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Activity className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-premium rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Orders</p>
                      <p className="text-2xl font-bold text-primary">{stats.totalOrders.toLocaleString()}</p>
                      <div className="w-16 h-1 bg-blue-500 mt-2"></div>
                    </div>
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <ShoppingCart className="h-5 w-5 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Customer Behavior */}
            <Card className="border-0 shadow-premium rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Customer behavior</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active carts</span>
                  <span className="text-lg font-semibold">{stats.activeCarts}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Checking out</span>
                  <span className="text-lg font-semibold">{stats.checkingOut}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Purchased</span>
                  <span className="text-lg font-semibold">{stats.purchased}</span>
                </div>
              </CardContent>
            </Card>

            {/* Top Locations */}
            <Card className="border-0 shadow-premium rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Top locations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topLocations.length > 0 ? (
                  topLocations.map((location, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground truncate">{location.location}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${Math.min(location.percentage, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{location.sessions.toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No data for this date range</p>
                )}
              </CardContent>
            </Card>

            {/* Customers */}
            <Card className="border-0 shadow-premium rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Customers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">First-time</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${customerBehavior.firstTime > 0 ? 60 : 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{customerBehavior.firstTime} sessions</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Returning</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${customerBehavior.returning > 0 ? 40 : 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{customerBehavior.returning} sessions</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card className="border-0 shadow-premium rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Top products</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topProducts.length > 0 ? (
                  topProducts.map((product, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground truncate">{product.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${Math.min(product.percentage, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">${product.sales.toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No data for this date range</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - 3D Globe */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-premium rounded-xl h-[600px]">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Live Activity Map</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search location"
                        value={searchLocation}
                        onChange={(e) => setSearchLocation(e.target.value)}
                        className="pl-10 w-48"
                      />
                    </div>
                    <Button variant="outline" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <MapPin className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 h-full">
                <div className="relative h-full">
                                     <Canvas
                     camera={{ position: [0, 0, 2.5], fov: 45 }}
                     style={{ background: 'linear-gradient(to bottom, #1e293b, #0f172a)' }}
                   >
                                           <Suspense fallback={null}>
                        <ambientLight intensity={0.6} />
                        <pointLight position={[10, 10, 10]} intensity={2} />
                        <pointLight position={[-10, -10, -10]} intensity={0.8} />
                        <pointLight position={[0, 10, 0]} intensity={1} />
                        <Earth userLocations={userLocations} />
                        <OrbitControls 
                          enableZoom={true}
                          enablePan={true}
                          enableRotate={true}
                          zoomSpeed={0.6}
                          panSpeed={0.6}
                          rotateSpeed={0.6}
                        />
                      </Suspense>
                   </Canvas>
                  
                  {/* Zoom Controls */}
                  <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                    <Button variant="outline" size="icon" className="w-8 h-8">
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="icon" className="w-8 h-8">
                      <Minus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LiveView; 