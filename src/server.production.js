// Production Server Configuration
// This file contains production-specific server settings

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import Stripe from "stripe";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import Tokens from "csrf";

// Initialize Stripe with production secret key
const stripe = new Stripe(process.env.VITE_STRIPE_SECRET_KEY);

const app = express();

// Production URLs from environment variables
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://your-frontend.vercel.app';
const BACKEND_URL = process.env.BACKEND_URL || 'https://your-backend.railway.app';

// --- Security Headers (Production) ---
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com", "https://checkout.stripe.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.stripe.com", "https://openrouter.ai"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://checkout.stripe.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// --- Rate Limiting (Production) ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Stricter rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth attempts per windowMs
  message: {
    error: "Too many authentication attempts, please try again later."
  }
});

// --- HTTPS Enforcement (Production) ---
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
});

// --- CORS Configuration (Production) ---
app.use(cors({
  origin: [FRONTEND_URL, "https://your-domain.com"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
}));

app.use(express.json({ limit: '10mb' }));

// --- CSRF Protection ---
const tokens = new Tokens();
const secret = tokens.secretSync();

// CSRF token endpoint
app.get("/api/csrf-token", (req, res) => {
  const token = tokens.create(secret);
  res.json({ token });
});

// CSRF validation middleware
const validateCSRF = (req, res, next) => {
  if (req.method === 'GET') {
    return next();
  }
  
  const token = req.headers['x-csrf-token'] || req.body._csrf;
  if (!token || !tokens.verify(secret, token)) {
    return res.status(403).json({ error: 'CSRF token validation failed' });
  }
  
  next();
};

// --- Stripe Checkout Session (Production) ---
app.post("/api/create-checkout-session", validateCSRF, async (req, res) => {
  const { amount, ticketId, orderTitle, customerEmail, isStoreOrder } = req.body;

  if (!amount || !ticketId || !orderTitle) {
    return res.status(400).json({
      error: "Missing required fields: amount, ticketId (or orderId), orderTitle",
    });
  }

  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({
      error: "Invalid amount. Please provide a valid positive number.",
    });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: orderTitle,
            },
            unit_amount: Math.round(numericAmount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${FRONTEND_URL}/success?${isStoreOrder ? "orderId" : "ticketId"}=${ticketId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/cancel?${isStoreOrder ? "orderId" : "ticketId"}=${ticketId}`,
      customer_email: customerEmail,
      metadata: {
        ticketId: ticketId,
        isStoreOrder: isStoreOrder || false,
      },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout session error:", error);
    res.status(500).json({
      error: "Failed to create checkout session. Please try again.",
    });
  }
});

// --- Refund Processing (Production) ---
app.post("/api/process-refund", validateCSRF, async (req, res) => {
  const { paymentIntentId, amount, reason } = req.body;

  if (!paymentIntentId || !amount) {
    return res.status(400).json({
      error: "Missing required fields: paymentIntentId, amount",
    });
  }

  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({
      error: "Invalid amount. Please provide a valid positive number.",
    });
  }

  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: Math.round(numericAmount * 100),
      reason: "requested_by_customer",
      metadata: {
        refund_reason: reason || "Customer requested refund",
      },
    });

    res.json({ 
      success: true, 
      refundId: refund.id,
      status: refund.status,
      amount: refund.amount / 100
    });
  } catch (error) {
    console.error("Refund processing error:", error);
    res.status(500).json({
      error: "Failed to process refund. Please try again later.",
      details: error.message
    });
  }
});

// --- AI Chat API (Production) ---
app.post("/api/chat", validateCSRF, async (req, res) => {
  const { messages, model = "deepseek/deepseek-r1-0528:free" } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({
      error: "Invalid messages format"
    });
  }

  // Rate limiting for chat API
  const chatLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // limit each IP to 10 chat requests per minute
    message: {
      error: "Too many chat requests, please try again later."
    }
  });

  chatLimiter(req, res, async () => {
    try {
      const apiKey = process.env.DEEPSEEK_API_KEY;
      if (!apiKey) {
        console.error("DEEPSEEK_API_KEY environment variable is not set");
        return res.status(500).json({
          error: "AI service configuration error"
        });
      }

      const payload = {
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
      };

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": req.headers.origin || FRONTEND_URL,
          "X-Title": "Quibble Concierge",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`OpenRouter API error (status ${response.status}):`, errorBody);
        return res.status(response.status).json({
          error: "AI service temporarily unavailable"
        });
      }

      const result = await response.json();
      res.json(result);
    } catch (error) {
      console.error("Error in chat API:", error);
      res.status(500).json({
        error: "Internal server error"
      });
    }
  });
});

// --- Payment Intent Lookup (Production) ---
app.post("/api/find-payment-intent", validateCSRF, async (req, res) => {
  const { amount, startDate, endDate, customerEmail } = req.body;

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const paymentIntents = await stripe.paymentIntents.list({
      created: {
        gte: Math.floor(start.getTime() / 1000),
        lte: Math.floor(end.getTime() / 1000),
      },
      limit: 100,
    });

    const matchingIntent = paymentIntents.data.find(intent => {
      const intentAmount = intent.amount / 100;
      const amountMatch = Math.abs(intentAmount - parseFloat(amount)) < 0.01;
      const emailMatch = intent.receipt_email === customerEmail;
      
      return amountMatch && emailMatch;
    });

    if (matchingIntent) {
      res.json({ 
        paymentIntentId: matchingIntent.id,
        amount: matchingIntent.amount / 100,
        status: matchingIntent.status
      });
    } else {
      res.status(404).json({ 
        error: "Payment intent not found for the given criteria" 
      });
    }
  } catch (error) {
    console.error("Payment intent lookup error:", error);
    res.status(500).json({
      error: "Failed to lookup payment intent"
    });
  }
});

// --- Get Payment Intent by Session ID (Production) ---
app.get("/api/get-payment-intent/:sessionId", async (req, res) => {
  const { sessionId } = req.params;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_intent) {
      res.json({ 
        paymentIntentId: session.payment_intent,
        amount: session.amount_total / 100,
        status: session.payment_status
      });
    } else {
      res.status(404).json({ 
        error: "Payment intent not found for this session" 
      });
    }
  } catch (error) {
    console.error("Session lookup error:", error);
    res.status(500).json({
      error: "Failed to retrieve session information"
    });
  }
});

// --- Health Check Endpoint ---
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
  console.log(`🚀 Production server running on port ${PORT}`);
  console.log(`📱 Frontend URL: ${FRONTEND_URL}`);
  console.log(`🔧 Backend URL: ${BACKEND_URL}`);
  console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
}); 