# Deploy Firestore Rules

## Quick Deployment

1. **Install Firebase CLI globally** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase** (if not already logged in):
   ```bash
   firebase login
   ```

3. **Set the project** (replace `quibble-62a3a` with your actual project ID):
   ```bash
   firebase use quibble-62a3a
   ```

4. **Deploy the rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

## Alternative Deployment Methods

### Method 1: Direct Project Deployment
```bash
firebase deploy --only firestore:rules --project quibble-62a3a
```

### Method 2: Add Project and Deploy
```bash
firebase use --add quibble-62a3a
firebase deploy --only firestore:rules
```

## Troubleshooting

### If you get "No currently active project":
1. List available projects:
   ```bash
   firebase projects:list
   ```

2. Set the project:
   ```bash
   firebase use quibble-62a3a
   ```

3. Then deploy:
   ```bash
   firebase deploy --only firestore:rules
   ```

### If you get permission errors:
1. Make sure you're logged in with the correct account:
   ```bash
   firebase logout
   firebase login
   ```

2. Verify you have access to the project:
   ```bash
   firebase projects:list
   ```

### If rules still don't work after deployment:
1. **Wait 1-2 minutes** - Firestore rules can take a moment to propagate
2. **Clear browser cache** and refresh the page
3. **Check the Firebase Console** to verify rules are deployed:
   - Go to https://console.firebase.google.com
   - Select your project
   - Go to Firestore Database → Rules
   - Verify the rules match the content in `firestore.rules`

## Verify Deployment

After deployment, you should see output like:
```
✔  firestore: released rules firestore.rules to firestore
```

## Current Rules Summary

The current rules allow:
- ✅ **Store Orders**: Users can update their own orders, admins can update any order (for refunds)
- ✅ **Notifications**: Users can create notifications for themselves, system can create refund notifications
- ✅ **Product Stock**: Authenticated users can update stock (for refunds that restore stock)
- ✅ **User Activities**: Authenticated users can read/write (for LiveView tracking)
- ✅ **Order Conversations**: Users can access their own order conversations, admins can access any order conversation

## Recent Fixes

### Order Timeline Permission Fix
- **Issue**: Admins couldn't access order timelines/conversations
- **Fix**: Updated order conversation rules to allow admin access
- **Status**: ✅ Fixed in rules, needs deployment

## Testing the Refund System

After deploying rules:
1. Create a test order as a customer
2. Go to the refund page as that customer
3. Request a refund
4. Switch to admin account
5. Go to Admin Refund Management
6. Approve/process the refund

## Testing Order Timeline Access

After deploying rules:
1. Create a test order as a customer
2. Switch to admin account
3. Go to Orders management
4. Click "Manage Timeline" on any order
5. Should now be able to view and manage the order timeline

If you still get permission errors after deployment, please share the exact error message. 