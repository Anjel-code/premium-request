// server.js (or your main backend file)

// Load environment variables from .env file FIRST
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import Stripe from "stripe";

// Initialize Stripe with your secret key from environment variables
// Ensure process.env.STRIPE_SECRET_KEY is defined
const stripe = new Stripe(process.env.VITE_STRIPE_SECRET_KEY);

const app = express();

// --- CORS Configuration ---
// Allow specific origins (recommended for production)
app.use(
  cors({
    origin: "http://localhost:8080", // Only allow requests from your frontend's origin
  })
);

app.use(express.json()); // To parse JSON request bodies

// Your existing /api/create-checkout-session endpoint
app.post("/api/create-checkout-session", async (req, res) => {
  const { amount, ticketId, orderTitle, customerEmail } = req.body;

  // Basic validation for required fields
  if (!amount || !ticketId || !orderTitle || !customerEmail) {
    return res.status(400).json({
      error:
        "Missing required fields: amount, ticketId, orderTitle, customerEmail",
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
            unit_amount: amount * 100, // Amount in cents (Stripe expects cents)
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `http://localhost:8080/success?ticketId=${ticketId}`, // Adjust success URL to your frontend
      cancel_url: `http://localhost:8080/cancel?ticketId=${ticketId}`, // Adjust cancel URL to your frontend
      customer_email: customerEmail, // Pre-fill customer email if available
      metadata: {
        ticketId: ticketId, // Attach metadata to the session
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

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));
