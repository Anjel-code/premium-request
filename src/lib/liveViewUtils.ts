import { addDoc, collection, serverTimestamp, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

export interface UserActivity {
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

// Sample locations for testing
const sampleLocations = [
  { latitude: 40.7128, longitude: -74.0060, city: "New York", country: "USA" },
  { latitude: 34.0522, longitude: -118.2437, city: "Los Angeles", country: "USA" },
  { latitude: 51.5074, longitude: -0.1278, city: "London", country: "UK" },
  { latitude: 48.8566, longitude: 2.3522, city: "Paris", country: "France" },
  { latitude: 35.6762, longitude: 139.6503, city: "Tokyo", country: "Japan" },
  { latitude: 37.7749, longitude: -122.4194, city: "San Francisco", country: "USA" },
  { latitude: 41.8781, longitude: -87.6298, city: "Chicago", country: "USA" },
  { latitude: 25.7617, longitude: -80.1918, city: "Miami", country: "USA" },
  { latitude: 52.5200, longitude: 13.4050, city: "Berlin", country: "Germany" },
  { latitude: 55.7558, longitude: 37.6176, city: "Moscow", country: "Russia" },
  { latitude: -33.8688, longitude: 151.2093, city: "Sydney", country: "Australia" },
  { latitude: 19.4326, longitude: -99.1332, city: "Mexico City", country: "Mexico" },
  { latitude: -23.5505, longitude: -46.6333, city: "São Paulo", country: "Brazil" },
  { latitude: 39.9042, longitude: 116.4074, city: "Beijing", country: "China" },
  { latitude: 28.6139, longitude: 77.2090, city: "New Delhi", country: "India" },
];

// Sample user data
const sampleUsers = [
  { id: "user1", email: "john.doe@example.com", name: "John Doe" },
  { id: "user2", email: "jane.smith@example.com", name: "Jane Smith" },
  { id: "user3", email: "mike.johnson@example.com", name: "Mike Johnson" },
  { id: "user4", email: "sarah.wilson@example.com", name: "Sarah Wilson" },
  { id: "user5", email: "david.brown@example.com", name: "David Brown" },
];

export const generateSampleUserActivity = async (appId: string) => {
  if (!db || !appId) return;

  const activitiesRef = collection(db, `artifacts/${appId}/public/data/user-activities`);
  
  // Generate random activity for the last 24 hours
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const activities: UserActivity[] = [];
  
  // Generate 50-100 random activities
  const numActivities = Math.floor(Math.random() * 50) + 50;
  
  for (let i = 0; i < numActivities; i++) {
    const user = sampleUsers[Math.floor(Math.random() * sampleUsers.length)];
    const location = sampleLocations[Math.floor(Math.random() * sampleLocations.length)];
    const activityTypes: ("view" | "cart" | "checkout" | "purchase")[] = ["view", "cart", "checkout", "purchase"];
    const activity = activityTypes[Math.floor(Math.random() * activityTypes.length)];
    
    // Random timestamp within the last 24 hours
    const timestamp = new Date(oneDayAgo.getTime() + Math.random() * (now.getTime() - oneDayAgo.getTime()));
    
    const userActivity: UserActivity = {
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      activity,
      timestamp,
      location: {
        latitude: location.latitude + (Math.random() - 0.5) * 0.1, // Add some randomness
        longitude: location.longitude + (Math.random() - 0.5) * 0.1,
        city: location.city,
        country: location.country,
      },
    };
    
    activities.push(userActivity);
  }
  
  // Add activities to Firestore
  try {
    for (const activity of activities) {
      await addDoc(activitiesRef, {
        ...activity,
        timestamp: serverTimestamp(),
      });
    }
    console.log(`Generated ${activities.length} sample user activities`);
  } catch (error) {
    console.error("Error generating sample user activities:", error);
  }
};

export const generateSampleOrders = async (appId: string) => {
  if (!db || !appId) return;

  const ordersRef = collection(db, `artifacts/${appId}/public/data/orders`);
  
  // Generate random orders for the last 7 days
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const orderTitles = [
    "Premium Watch Collection",
    "Designer Handbag",
    "Luxury Perfume Set",
    "High-End Electronics",
    "Artisan Jewelry",
    "Premium Wine Selection",
    "Luxury Home Decor",
    "Designer Clothing",
    "Premium Skincare",
    "Luxury Travel Package"
  ];
  
  const statuses = ["pending", "accepted", "completed", "paid", "shipped", "delivered"];
  
  // Generate 20-40 random orders
  const numOrders = Math.floor(Math.random() * 20) + 20;
  
  for (let i = 0; i < numOrders; i++) {
    const user = sampleUsers[Math.floor(Math.random() * sampleUsers.length)];
    const location = sampleLocations[Math.floor(Math.random() * sampleLocations.length)];
    const title = orderTitles[Math.floor(Math.random() * orderTitles.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const totalAmount = Math.floor(Math.random() * 5000) + 100; // $100-$5100
    
    // Random timestamp within the last 7 days
    const createdAt = new Date(sevenDaysAgo.getTime() + Math.random() * (now.getTime() - sevenDaysAgo.getTime()));
    
    try {
      await addDoc(ordersRef, {
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        title,
        status,
        totalAmount,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        location: {
          latitude: location.latitude + (Math.random() - 0.5) * 0.1,
          longitude: location.longitude + (Math.random() - 0.5) * 0.1,
          city: location.city,
          country: location.country,
        },
      });
    } catch (error) {
      console.error("Error creating sample order:", error);
    }
  }
  
  console.log(`Generated ${numOrders} sample orders`);
};

export const clearUserActivities = async (appId: string) => {
  if (!db || !appId) return;
  
  try {
    const activitiesRef = collection(db, `artifacts/${appId}/public/data/user-activities`);
    const snapshot = await getDocs(activitiesRef);
    
    const deletions = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletions);
    
    console.log("Cleared all user activities");
  } catch (error) {
    console.error("Error clearing user activities:", error);
  }
}; 