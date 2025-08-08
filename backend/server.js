// server.js (or your main backend file)

// Load environment variables from .env file FIRST
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import Stripe from "stripe";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import Tokens from "csrf";

// Initialize Stripe with your secret key from environment variables
// Ensure process.env.STRIPE_SECRET_KEY is defined
console.log("Stripe secret key loaded:", process.env.VITE_STRIPE_SECRET_KEY ? "Yes" : "No");
const stripe = new Stripe(process.env.VITE_STRIPE_SECRET_KEY);

const app = express();

// --- Security Headers ---
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

// --- Rate Limiting ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use(limiter);

// Stricter rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth attempts per windowMs
  message: {
    error: "Too many authentication attempts, please try again later."
  }
});

// --- HTTPS Enforcement (Production Only) ---
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

// --- CORS Configuration ---
// Allow specific origins (recommended for production)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4242';

app.use(
  cors({
    origin: [FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"], // Allow multiple frontend ports
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: '10mb' })); // To parse JSON request bodies with size limit

// --- CSRF Protection ---
const tokens = new Tokens();
const secret = tokens.secretSync();

// CSRF token endpoint
app.get("/api/csrf-token", (req, res) => {
  const token = tokens.create(secret);
  res.json({ token });
});

// CSRF validation middleware for POST/PUT/DELETE requests
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

// Your existing /api/create-checkout-session endpoint
app.post("/api/create-checkout-session", validateCSRF, async (req, res) => {
  const { amount, ticketId, orderTitle, customerEmail, isStoreOrder } =
    req.body;

  // Basic validation for required fields
  if (!amount || !ticketId || !orderTitle) {
    return res.status(400).json({
      error:
        "Missing required fields: amount, ticketId (or orderId), orderTitle",
    });
  }

  // Validate amount is a valid number
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
            unit_amount: Math.round(numericAmount * 100), // Amount in cents (Stripe expects cents) - rounded to avoid floating point issues
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${FRONTEND_URL}/success?${
        isStoreOrder ? "orderId" : "ticketId"
      }=${ticketId}&session_id={CHECKOUT_SESSION_ID}`, // Include session ID for payment intent lookup
      cancel_url: `${FRONTEND_URL}/cancel?${
        isStoreOrder ? "orderId" : "ticketId"
      }=${ticketId}`, // Adjust cancel URL to your frontend
      customer_email: customerEmail, // Pre-fill customer email if available
      metadata: {
        ticketId: ticketId, // Attach metadata to the session
        isStoreOrder: isStoreOrder || false, // Add flag to metadata
      },
    });

    res.json({ url: session.url });
  } catch (e) {
    console.error("Error creating checkout session:", e.message);
    // Provide a more user-friendly error message
    res.status(500).json({
      error: "Failed to create checkout session. Please try again later.",
    });
  }
});

// Get payment intent ID from session ID
app.get("/api/get-payment-intent/:sessionId", async (req, res) => {
  const { sessionId } = req.params;

  if (!sessionId) {
    return res.status(400).json({
      error: "Missing session ID",
    });
  }

  try {
    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session.payment_intent) {
      return res.status(404).json({
        error: "No payment intent found for this session",
      });
    }

    res.json({ 
      paymentIntentId: session.payment_intent,
      amount: session.amount_total / 100, // Convert from cents to dollars
      status: session.payment_status
    });
  } catch (e) {
    console.error("Error retrieving payment intent:", e.message);
    res.status(500).json({
      error: "Failed to retrieve payment intent. Please try again later.",
      details: e.message
    });
  }
});

// Find payment intent by order details (amount and date range)
app.post("/api/find-payment-intent", validateCSRF, async (req, res) => {
  const { amount, startDate, endDate, customerEmail } = req.body;

  if (!amount || !startDate || !endDate) {
    return res.status(400).json({
      error: "Missing required fields: amount, startDate, endDate",
    });
  }

  try {
    // Convert amount to cents for comparison
    const amountInCents = Math.round(parseFloat(amount) * 100);
    
    // List payment intents within the date range
    const paymentIntents = await stripe.paymentIntents.list({
      created: {
        gte: Math.floor(new Date(startDate).getTime() / 1000),
        lte: Math.floor(new Date(endDate).getTime() / 1000),
      },
      limit: 100,
    });

    // Find matching payment intent by amount
    const matchingIntent = paymentIntents.data.find(intent => 
      intent.amount === amountInCents && 
      intent.status === 'succeeded'
    );

    if (matchingIntent) {
      res.json({
        paymentIntentId: matchingIntent.id,
        amount: matchingIntent.amount / 100,
        status: matchingIntent.status,
        created: new Date(matchingIntent.created * 1000)
      });
    } else {
      res.status(404).json({
        error: "No matching payment intent found for the given amount and date range"
      });
    }
  } catch (e) {
    console.error("Error finding payment intent:", e.message);
    res.status(500).json({
      error: "Failed to find payment intent. Please try again later.",
      details: e.message
    });
  }
});

// Refund endpoint
app.post("/api/process-refund", validateCSRF, async (req, res) => {
  console.log("Refund request received:", req.body);
  
  const { paymentIntentId, amount, reason } = req.body;

  // Basic validation
  if (!paymentIntentId || !amount) {
    console.log("Missing required fields:", { paymentIntentId, amount });
    return res.status(400).json({
      error: "Missing required fields: paymentIntentId, amount",
    });
  }

  // Validate amount is a valid number
  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    console.log("Invalid amount:", amount);
    return res.status(400).json({
      error: "Invalid amount. Please provide a valid positive number.",
    });
  }

  console.log("Processing refund for:", {
    paymentIntentId,
    amount: numericAmount,
    reason
  });

  try {
    // Create refund using Stripe API
    // Stripe only accepts specific reason values, so we'll use 'requested_by_customer' 
    // and store the custom reason in metadata
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: Math.round(numericAmount * 100), // Convert to cents
      reason: "requested_by_customer", // Always use this for Stripe
      metadata: {
        refund_reason: reason || "Customer requested refund", // Store custom reason here
      },
    });

    console.log("Refund processed successfully:", refund.id);
    res.json({ 
      success: true, 
      refundId: refund.id,
      status: refund.status,
      amount: refund.amount / 100 // Convert back to dollars
    });
  } catch (e) {
    console.error("Error processing refund:", e.message);
    console.error("Error details:", {
      code: e.code,
      type: e.type,
      decline_code: e.decline_code,
      param: e.param
    });
    res.status(500).json({
      error: "Failed to process refund. Please try again later.",
      details: e.message
    });
  }
});

// --- AI Chat API Endpoint (Server-side API key protection) ---
app.post("/api/chat", validateCSRF, async (req, res) => {
  const { messages, model = "deepseek/deepseek-r1-0528:free" } = req.body;

  // Validate input
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

  // Apply chat-specific rate limiting
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

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));
