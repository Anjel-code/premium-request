# Netlify Deployment Guide

## Overview
This guide covers deploying your premium-request project to Netlify using:
- **Frontend**: React app with global CDN
- **Backend**: Netlify Functions (serverless)

## Why Netlify is Perfect for Your Project

### ✅ **Frontend Benefits**
- **Global CDN** - Fast loading worldwide
- **Automatic deployments** - Git integration
- **Free tier** - Generous limits
- **Built-in optimizations** - Image optimization, minification

### ✅ **Backend Benefits (Netlify Functions)**
- **Serverless functions** - Auto-scaling, pay-per-use
- **Node.js support** - Full compatibility with your code
- **Environment variables** - Secure API key management
- **Built-in CORS** - Easy cross-origin handling
- **Webhook support** - Perfect for Stripe integration

## Project Structure

```
premium-request/
├── frontend/                 # React app
│   ├── src/
│   ├── dist/                # Build output
│   └── package.json
├── backend/
│   ├── netlify-functions/   # Serverless functions
│   │   ├── create-checkout-session.js
│   │   ├── process-refund.js
│   │   ├── find-payment-intent.js
│   │   ├── chat.js
│   │   └── csrf-token.js
│   └── package.json
└── netlify.toml             # Netlify configuration
```

## Step 1: Environment Setup

### Frontend (.env)
```env
VITE_API_BASE_URL=/.netlify/functions
VITE_FRONTEND_URL=https://your-site-name.netlify.app
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_stripe_publishable_key
```

### Backend (Netlify Environment Variables)
Set these in Netlify dashboard:
```env
NODE_ENV=production
FRONTEND_URL=https://your-site-name.netlify.app
STRIPE_SECRET_KEY=sk_live_your_live_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
DEEPSEEK_API_KEY=your_deepseek_api_key
FIREBASE_PROJECT_ID=quibble-62a3a
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
```

## Step 2: Local Development

### Install Netlify CLI
```bash
cd backend
npm install -g netlify-cli
npm install
```

### Start Development Server
```bash
# Terminal 1: Frontend
cd frontend
npm run dev

# Terminal 2: Netlify Functions
cd backend
netlify dev
```

This will run:
- Frontend: `http://localhost:8080`
- Functions: `http://localhost:8888/.netlify/functions/*`

## Step 3: Build and Deploy

### 1. Build Frontend
```bash
cd frontend
npm run build
```

### 2. Deploy to Netlify
```bash
# Option A: Netlify CLI
netlify deploy --prod

# Option B: Drag & Drop
# Upload frontend/dist/ folder to Netlify dashboard
```

### 3. Configure Netlify
- Connect your GitHub repository
- Set build settings:
  - Build command: `cd frontend && npm run build`
  - Publish directory: `frontend/dist`
  - Functions directory: `backend/netlify-functions`

## Step 4: Function Deployment

Netlify automatically deploys your functions when you push to your connected repository.

## Step 5: Testing

### Test Functions Locally
```bash
cd backend
netlify dev
curl http://localhost:8888/.netlify/functions/csrf-token
```

### Test Functions in Production
```bash
curl https://your-site-name.netlify.app/.netlify/functions/csrf-token
```

## Step 6: Stripe Webhooks

### Configure Webhook Endpoint
In Stripe dashboard, set webhook endpoint to:
```
https://your-site-name.netlify.app/.netlify/functions/webhook
```

### Create Webhook Function
Add `webhook.js` to `backend/netlify-functions/`:

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const sig = event.headers['stripe-signature'];
  const body = event.body;

  try {
    const stripeEvent = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // Handle the event
    switch (stripeEvent.type) {
      case 'checkout.session.completed':
        // Handle successful payment
        break;
      default:
        console.log(`Unhandled event type ${stripeEvent.type}`);
    }

    return { statusCode: 200, body: 'Webhook received' };
  } catch (err) {
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }
};
```

## Benefits of This Setup

1. **Single Platform**: One dashboard, one deployment
2. **Cost Effective**: Generous free tier, pay-per-use functions
3. **Scalable**: Auto-scaling functions, global CDN
4. **Developer Experience**: Git-based deployments, local development
5. **Performance**: Edge functions, image optimization
6. **Security**: Environment variables, built-in CORS

## Troubleshooting

### Common Issues
1. **Function not found**: Check `netlify.toml` configuration
2. **Environment variables**: Verify in Netlify dashboard
3. **CORS errors**: Check function headers
4. **Build failures**: Verify Node.js version (18+)

### Debug Functions
```bash
netlify functions:list
netlify functions:invoke function-name
```

## Next Steps

1. **Set up Netlify account** and connect GitHub
2. **Configure environment variables** in Netlify dashboard
3. **Test locally** with `netlify dev`
4. **Deploy** and test in production
5. **Set up Stripe webhooks** for payment processing

## Conclusion

Netlify provides the perfect platform for your project:
- **Frontend**: Fast, optimized React app
- **Backend**: Scalable, serverless functions
- **Integration**: Seamless deployment and management

This setup gives you the best of both worlds with minimal complexity! 