# Deploy Firestore Rules to Fix LiveView Permissions

## Issue
The LiveView component is getting permission errors when trying to access the `user-activities` collection because the Firestore security rules don't include permissions for this collection.

## Solution
The `firestore.rules` file has been updated to include permissions for the `user-activities` collection. You need to deploy these updated rules to Firebase.

## Steps to Deploy

### Option 1: Using Firebase Console (Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** in the left sidebar
4. Click on the **Rules** tab
5. Copy the contents of the `firestore.rules` file from this project
6. Paste it into the rules editor
7. Click **Publish** to deploy the rules

### Option 2: Using Firebase CLI
1. Install Firebase CLI if not already installed:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project (if not already done):
   ```bash
   firebase init firestore
   ```

4. Deploy the rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

## What the Updated Rules Include
The new rules add permissions for the `user-activities` collection:
- **Read**: Admin users only
- **Create**: Admin users only  
- **Update**: Admin users only
- **Delete**: Admin users only

## After Deployment
Once the rules are deployed, the LiveView component should work without permission errors. You can then use the "Generate Sample Data" button to create test user activity data for the 3D globe visualization.

## Fallback Behavior
The LiveView component has been updated to handle permission errors gracefully. If the `user-activities` collection is not accessible, it will:
- Show 0 for visitor statistics
- Display "No data for this date range" for location and customer analytics
- Still show order data and sales from existing collections
- Allow the 3D globe to render (though without location pins) 