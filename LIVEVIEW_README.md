# LiveView Dashboard Feature

## Overview
The LiveView dashboard provides real-time analytics and an interactive 3D globe visualization for admin users. It displays live user activity, sales metrics, and geographical data with an interactive 3D earth that can be rotated and zoomed.

## Features

### Real-time Statistics
- **Visitors right now**: Shows active users in the last 5 minutes
- **Total sales**: Real-time sales data from orders
- **Sessions**: Total user sessions tracked
- **Orders**: Total number of orders placed
- **Customer behavior**: Active carts, checkout, and purchase metrics

### Interactive 3D Globe
- **Rotatable Earth**: Users can drag to rotate the globe
- **Zoom Controls**: Plus/minus buttons for zooming in/out
- **Location Pins**: 
  - Red pins: Order locations
  - Purple pins: Visitor locations
- **Search Functionality**: Search bar for finding specific locations
- **Map Controls**: Eye, pin, and fullscreen controls

### Data Sources
The LiveView connects to Firebase Firestore collections:
- `artifacts/{appId}/public/data/orders` - Order data
- `artifacts/{appId}/public/data/store-orders` - Store order data  
- `artifacts/{appId}/public/data/user-activities` - User activity tracking

### Top Analytics Sections
- **Top Locations**: Most active geographical areas
- **Customers**: First-time vs returning customer breakdown
- **Top Products**: Best-selling products with sales figures

## Access
- **Route**: `/live-view`
- **Access Level**: Admin users only
- **Navigation**: Available in the sidebar for admin users

## Testing
Use the "Generate Sample Data" button to create test user activity data for demonstration purposes.

## Technical Implementation
- **3D Graphics**: Three.js with React Three Fiber
- **Real-time Updates**: Firebase Firestore listeners
- **Responsive Design**: Tailwind CSS with shadcn/ui components
- **TypeScript**: Fully typed interfaces and components

## Dependencies
- `three` - 3D graphics library
- `@react-three/fiber` - React renderer for Three.js
- `@react-three/drei` - Useful helpers for React Three Fiber
- `firebase` - Real-time database and authentication 