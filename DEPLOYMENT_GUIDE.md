# 🚀 Production Deployment Guide

## 📋 Pre-Deployment Checklist

### ✅ **Current Status Assessment**

#### **Security Features** ✅
- ✅ Firebase Authentication & Authorization
- ✅ Firestore Security Rules Deployed
- ✅ Rate Limiting (100 req/15min, 5 auth/15min)
- ✅ CSRF Protection on all sensitive endpoints
- ✅ Input Sanitization with DOMPurify
- ✅ Security Headers (CSP, HSTS, XSS Protection)
- ✅ HTTPS Enforcement in Production
- ✅ API Keys moved to server-side

#### **Payment System** ✅
- ✅ Stripe Integration (Test Mode)
- ✅ Payment Processing Endpoints
- ✅ Refund Processing
- ✅ Success/Cancel URL Handling

#### **Core Features** ✅
- ✅ User Authentication & Registration
- ✅ Dashboard with Role-based Access
- ✅ Order Management System
- ✅ AI Chat Integration
- ✅ File Upload System
- ✅ Notification System
- ✅ Admin Panel
- ✅ Store & Cart System
- ✅ Refund Management
- ✅ Policy Pages (Privacy, Terms, etc.)
- ✅ Loading Page & Logo Implementation

---

## 🔧 **Production Changes Required**

### **1. Environment Variables Setup**

Create a `.env.production` file:

```bash
# Firebase Configuration (Production)
VITE_FIREBASE_API_KEY=your_production_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Stripe Configuration (PRODUCTION KEYS)
VITE_STRIPE_SECRET_KEY=sk_live_your_production_stripe_secret_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_production_stripe_publishable_key

# AI API Configuration (Server-side only)
DEEPSEEK_API_KEY=your_deepseek_api_key

# Security Configuration
NODE_ENV=production
SESSION_SECRET=your_secure_session_secret_here
CSRF_SECRET=your_secure_csrf_secret_here

# Production URLs
FRONTEND_URL=https://your-domain.com
BACKEND_URL=https://your-domain.com
```

### **2. Fix Hardcoded URLs**

#### **Server.js Changes:**
```javascript
// Replace hardcoded localhost URLs with environment variables
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4242';

// Update CORS configuration
app.use(cors({
  origin: [FRONTEND_URL, "https://your-domain.com"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
}));

// Update Stripe success/cancel URLs
success_url: `${FRONTEND_URL}/success?${isStoreOrder ? "orderId" : "ticketId"}=${ticketId}&session_id={CHECKOUT_SESSION_ID}`,
cancel_url: `${FRONTEND_URL}/cancel?${isStoreOrder ? "orderId" : "ticketId"}=${ticketId}`,
```

#### **Client-side Changes:**
```javascript
// Replace hardcoded localhost URLs in:
// - frontend/src/pages/PaymentPortalPage.tsx
// - frontend/src/pages/Order.tsx
// - frontend/src/lib/csrfUtils.ts
// - frontend/src/lib/storeUtils.ts
// - frontend/src/pages/SuccessPage.tsx

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4242';
```

### **3. Stripe Production Setup**

#### **Stripe Dashboard Changes:**
1. **Switch to Live Mode** in Stripe Dashboard
2. **Update Webhook Endpoints:**
   - URL: `https://your-domain.com/api/webhooks/stripe`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`
3. **Update API Keys:**
   - Replace `pk_test_` with `pk_live_`
   - Replace `sk_test_` with `sk_live_`

#### **Stripe Publishable Key Update:**
```javascript
// In PaymentPortalPage.tsx
const getStripePromise = () => loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
```

### **4. Firebase Production Setup**

#### **Firebase Console Changes:**
1. **Add Production Domain** to Authorized Domains
2. **Update Security Rules** (already deployed)
3. **Enable Analytics** (optional)
4. **Set up Production Project** (if using separate project)

### **5. Domain & SSL Setup**

#### **Required for Production:**
- ✅ Custom Domain
- ✅ SSL Certificate (Let's Encrypt or paid)
- ✅ HTTPS Enforcement
- ✅ Proper DNS Configuration

---

## 🚀 **Deployment Options (Cheapest to Most Expensive)**

### **Option 1: Vercel + Railway (Recommended - $0-20/month)**

#### **Frontend (Vercel - Free):**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
vercel --prod

# Set environment variables in Vercel dashboard
```

#### **Backend (Railway - $5/month):**
```bash
# Connect GitHub repo to Railway
# Railway will auto-deploy from your repo

# Set environment variables in Railway dashboard
# Railway provides HTTPS and domain automatically
```

#### **Database (Firebase - Free tier):**
- Firestore: 1GB free
- Authentication: 10,000 users free
- Hosting: 10GB free

**Total Cost: $5-20/month**

### **Option 2: Netlify + Render (Alternative - $0-25/month)**

#### **Frontend (Netlify - Free):**
```bash
# Connect GitHub repo
# Netlify auto-deploys from main branch
# Set environment variables in dashboard
```

#### **Backend (Render - $7/month):**
```bash
# Connect GitHub repo
# Render auto-deploys
# Set environment variables in dashboard
```

**Total Cost: $7-25/month**

### **Option 3: DigitalOcean Droplet (Advanced - $6-12/month)**

#### **Full Stack on One Server:**
```bash
# Deploy both frontend and backend on same droplet
# Use Nginx as reverse proxy
# Let's Encrypt for SSL
```

**Total Cost: $6-12/month**

---

## 📝 **Step-by-Step Deployment (Vercel + Railway)**

### **Step 1: Prepare Code for Production**

1. **Create Production Environment File:**
```bash
# Create .env.production
cp .env .env.production
# Edit with production values
```

2. **Update Package.json:**
```json
{
  "scripts": {
    "build": "vite build",
    "start": "node server.js"
  }
}
```

3. **Create Railway Configuration:**
```json
// railway.json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

### **Step 2: Deploy Backend (Railway)**

1. **Connect GitHub to Railway:**
   - Go to railway.app
   - Connect your GitHub repo
   - Railway auto-detects Node.js

2. **Set Environment Variables:**
   - `NODE_ENV=production`
   - `VITE_STRIPE_SECRET_KEY=sk_live_...`
   - `DEEPSEEK_API_KEY=your_key`
   - `FRONTEND_URL=https://your-frontend.vercel.app`
   - `BACKEND_URL=https://your-backend.railway.app`

3. **Deploy:**
   - Railway auto-deploys on push to main
   - Get your backend URL: `https://your-app.railway.app`

### **Step 3: Deploy Frontend (Vercel)**

1. **Connect GitHub to Vercel:**
   - Go to vercel.com
   - Import your GitHub repo
   - Set build command: `npm run build`
   - Set output directory: `dist`

2. **Set Environment Variables:**
   - `VITE_API_BASE_URL=https://your-backend.railway.app`
   - `VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...`
   - All Firebase config variables

3. **Deploy:**
   - Vercel auto-deploys on push to main
   - Get your frontend URL: `https://your-app.vercel.app`

### **Step 4: Update URLs**

1. **Update Backend CORS:**
```javascript
// In server.js
app.use(cors({
  origin: ["https://your-frontend.vercel.app"],
  credentials: true
}));
```

2. **Update Frontend API Calls:**
```javascript
// Replace all localhost:4242 with your Railway URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
```

### **Step 5: Test Production**

1. **Test Authentication:**
   - Sign up/sign in
   - Verify Firebase connection

2. **Test Payments:**
   - Use Stripe test cards in live mode
   - Verify webhook delivery

3. **Test AI Chat:**
   - Verify API calls work
   - Check rate limiting

4. **Test All Features:**
   - Dashboard functionality
   - Order management
   - File uploads
   - Admin panel

---

## 🔍 **Post-Deployment Checklist**

### **Security Verification:**
- [ ] HTTPS enforced
- [ ] Security headers present
- [ ] Rate limiting working
- [ ] CSRF protection active
- [ ] Input sanitization working

### **Functionality Verification:**
- [ ] User registration/login
- [ ] Payment processing
- [ ] AI chat working
- [ ] File uploads
- [ ] Admin panel access
- [ ] Order management
- [ ] Refund processing

### **Performance Verification:**
- [ ] Page load times < 3 seconds
- [ ] API response times < 1 second
- [ ] Mobile responsiveness
- [ ] Cross-browser compatibility

---

## 🚨 **Critical Production Considerations**

### **1. Monitoring Setup**
- Set up error tracking (Sentry)
- Monitor API response times
- Set up uptime monitoring

### **2. Backup Strategy**
- Regular database backups
- Code repository backups
- Environment variable backups

### **3. Scaling Considerations**
- Monitor resource usage
- Set up auto-scaling if needed
- Optimize database queries

### **4. Security Maintenance**
- Regular dependency updates
- Security audit reviews
- API key rotation

---

## 💰 **Cost Breakdown**

### **Monthly Costs:**
- **Railway (Backend):** $5-20/month
- **Vercel (Frontend):** Free
- **Firebase (Database):** Free (up to limits)
- **Domain:** $10-15/year
- **SSL:** Free (Let's Encrypt)

### **Total:** $5-20/month

---

## 🆘 **Troubleshooting**

### **Common Issues:**
1. **CORS Errors:** Check origin URLs in backend
2. **Environment Variables:** Verify all are set
3. **Stripe Errors:** Check live vs test keys
4. **Firebase Errors:** Verify production config
5. **Build Errors:** Check Node.js version compatibility

### **Support Resources:**
- Vercel Documentation
- Railway Documentation
- Firebase Console
- Stripe Dashboard

---

**🎉 Your application is now ready for production deployment!** 