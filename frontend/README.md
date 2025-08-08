# 🎨 Quibble Frontend

This is the frontend React application for Quibble, designed to be deployed on Vercel.

## 🚀 Quick Deploy to Vercel

1. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/Login with GitHub
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Environment Variables:**
   - In your Vercel project settings, add these environment variables:
   ```
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=quibble-62a3a.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=quibble-62a3a
   VITE_FIREBASE_STORAGE_BUCKET=quibble-62a3a.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_firebase_app_id
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_stripe_publishable_key
   VITE_API_BASE_URL=https://your-railway-domain.railway.app
   ```

3. **Build Settings:**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Deploy:**
   - Click "Deploy"
   - Vercel will automatically build and deploy your app

## 🔧 Local Development

```bash
cd frontend
npm install
npm run dev
```

## 📁 Project Structure

- `src/` - React components and pages
- `public/` - Static assets
- `src/components/` - Reusable UI components
- `src/pages/` - Page components
- `src/contexts/` - React contexts
- `src/hooks/` - Custom React hooks
- `src/lib/` - Utility functions

## 🌐 Production URLs

After deployment, update your backend environment variables with your Vercel domain for CORS configuration. 