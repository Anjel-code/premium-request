# Discount Popup with Email Collection

## Overview
The 10% discount popup has been enhanced to collect user email addresses and store them in Firebase Firestore for administrative review.

## New Features

### 1. Email Collection
- When users click "Get your 10% off", they are prompted to enter their email address
- Email addresses are stored in Firebase Firestore in the `discountEmails` collection
- Each email record includes:
  - Email address
  - Selected wellness goal
  - Discount percentage
  - Timestamp
  - User agent
  - Source (wellness_popup)

### 2. Admin Panel Integration
- New section in AdminPanel showing all collected discount emails
- Real-time updates using Firebase onSnapshot
- Displays email, goal, discount, date, and source
- Only visible to users with admin privileges

### 3. Test Functionality
- "Test Discount Popup" button in AdminPanel
- Clears localStorage to allow popup to show again
- Useful for testing popup functionality

## Technical Implementation

### Files Modified
1. **`frontend/src/components/PopupOffer.tsx`**
   - Added email input form
   - Firebase integration for storing emails
   - Enhanced user flow

2. **`frontend/src/components/AdminPanel.tsx`**
   - New discount emails section
   - Real-time email fetching
   - Test popup functionality

3. **`backend/firestore.rules`**
   - Added security rules for `discountEmails` collection
   - Public create access for popup
   - Admin-only read/update/delete access

### Firebase Collection Structure
```typescript
interface DiscountEmail {
  id: string;
  email: string;
  goal: string;
  discountPercentage: number;
  timestamp: Timestamp;
  ipAddress: string;
  userAgent: string;
  source: string;
}
```

## Usage

### For Users
1. Visit the store page
2. Wait for the 10% discount popup (appears after 3 seconds)
3. Select a wellness goal
4. Enter email address when prompted
5. Receive discount

### For Administrators
1. Access AdminPanel (requires admin role)
2. View collected emails in "Discount Email Collection" section
3. Use "Test Discount Popup" button to test functionality
4. Monitor email collection in real-time

## Security
- Email creation is public (allows popup to work for all users)
- Email viewing/management restricted to admin users only
- Firebase security rules enforce access control

## Future Enhancements
- Email validation and spam protection
- Export functionality for collected emails
- Analytics dashboard for popup performance
- A/B testing for different popup variations 