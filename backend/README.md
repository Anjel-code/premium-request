# 🔧 Quibble Backend

This is the backend Node.js/Express API server for Quibble, designed to be deployed on Railway.

## 🚀 Quick Deploy to Railway

1. **Connect to Railway:**
   - Go to [railway.app](https://railway.app)
   - Sign up/Login with GitHub
   - Click "New Project"
   - Select "Deploy from GitHub repo"

2. **Configure Environment Variables:**
   - In your Railway project settings, add these environment variables:
   ```
   NODE_ENV=production
   PORT=3000
   FRONTEND_URL=https://your-vercel-domain.vercel.app
   BACKEND_URL=https://your-railway-domain.railway.app
   STRIPE_SECRET_KEY=sk_live_your_live_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
   DEEPSEEK_API_KEY=your_deepseek_api_key
   ```

3. **Deploy:**
   - Railway will automatically detect the Node.js app
   - It will install dependencies and start the server
   - Your API will be available at the provided Railway URL

## 🔧 Local Development

```bash
cd backend
npm install
npm run dev
```

## 📁 Project Structure

- `server.js` - Main Express server
- `server.production.js` - Production-specific server configuration
- `firebase.json` - Firebase configuration
- `firestore.rules` - Firestore security rules
- `firestore.indexes.json` - Firestore indexes
- `railway.json` - Railway deployment configuration

## 🌐 API Endpoints

- `POST /api/create-checkout-session` - Create Stripe checkout session
- `POST /api/process-refund` - Process refunds
- `POST /api/find-payment-intent` - Find payment intents
- `POST /api/chat` - AI chat functionality
- `GET /api/csrf-token` - Get CSRF token
- `GET /api/health` - Health check

## 🔒 Security Features

- Rate limiting
- CSRF protection
- Security headers (Helmet)
- Input sanitization
- CORS configuration

## 📊 Monitoring

Railway provides built-in monitoring for:
- Request logs
- Error tracking
- Performance metrics
- Resource usage 