import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { handleStorePaymentSuccess } from "@/lib/storeUtils";
import { API_ENDPOINTS } from "@/lib/productionConfig";

// Define the UserProfile interface (matching what's stored in Firestore)
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  roles: string[];
  photoURL?: string;
}

interface PaymentPortalPageProps {
  appId: string; // Prop passed from App.tsx
  user: UserProfile | null; // Pass user to potentially prefill customer data
}

// Load Stripe outside of component render to avoid recreating Stripe object on re-renders.
// This function returns a Promise that resolves to the Stripe object.
const getStripePromise = () => loadStripe("pk_test_TYooMQauvdEDq54NiTgbpRLL"); // Replace with your actual Stripe Publishable Key.

const PaymentPortalPage: React.FC<PaymentPortalPageProps> = ({
  appId,
  user,
}) => {
  const { ticketId } = useParams<{ ticketId: string }>(); // Get ticketId from URL params
  const [searchParams] = useSearchParams(); // Get query parameters
  const amount = searchParams.get("amount"); // Get amount from query params
  const orderTitle = searchParams.get("title") || "Product Request"; // Get title for line item
  const orderId = searchParams.get("orderId"); // Get orderId for store orders

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stripeInstance, setStripeInstance] = useState<Stripe | null>(null); // State to hold the resolved Stripe object
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const initializeStripe = async () => {
      try {
        const stripe = await getStripePromise();
        if (!stripe) {
          setError(
            "Failed to load Stripe.js. Please check your publishable key and network connection."
          );
          return;
        }
        setStripeInstance(stripe);
      } catch (err) {
        console.error("Error initializing Stripe:", err);
        setError(
          "Failed to initialize payment. Please check console for details."
        );
      } finally {
        setLoading(false);
      }
    };

    initializeStripe();
  }, []); // Run only once on component mount

  // Simulate a backend call to create a Stripe Checkout Session
  const createCheckoutSession = async () => {
    if (
      !stripeInstance ||
      (!ticketId && !orderId) ||
      !amount ||
      isRedirecting
    ) {
      setError("Payment system not ready or already redirecting.");
      return;
    }

    setIsRedirecting(true);
    setError(null);

    try {
      // --- IMPORTANT CHANGE HERE: Specify the full URL including the backend port ---
      const response = await fetch(API_ENDPOINTS.CREATE_CHECKOUT_SESSION, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(parseFloat(amount) * 100) / 100, // Round to 2 decimal places
          ticketId: ticketId || orderId, // Use orderId for store orders
          orderTitle,
          customerEmail: user?.email,
          isStoreOrder: !!orderId, // Flag to indicate this is a store order
        }),
      });
      const session = await response.json();
      if (session.url) {
        // Store order info in sessionStorage for success page
        if (orderId && user) {
          sessionStorage.setItem(
            "storeOrderInfo",
            JSON.stringify({
              orderId,
              productName: orderTitle,
              amount: parseFloat(amount),
              userId: user.uid,
              userEmail: user.email,
              userName: user.displayName,
              appId,
            })
          );
        }
        window.location.href = session.url;
      } else {
        setError("Failed to get checkout session URL from the server.");
        setIsRedirecting(false);
      }
    } catch (err) {
      setError("Failed to initiate payment. Please try again.");
      setIsRedirecting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="ml-4 text-primary">Loading payment portal...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md text-center shadow-premium rounded-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-red-500">
              Payment Error
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="ml-4 text-primary">Redirecting to Stripe Checkout...</p>
      </div>
    );
  }

  // Ensure either ticketId (for regular orders) or orderId (for store orders) and amount are available
  if ((!ticketId && !orderId) || !amount) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md text-center shadow-premium rounded-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-red-500">
              Missing Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-muted-foreground">
              Order ID or amount is missing. Please ensure you navigate here
              from a valid order.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-lg shadow-premium rounded-xl">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-2xl text-primary text-center">
            Complete Your Payment
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <p className="text-center text-lg font-semibold text-accent mb-6">
            Amount Due: ${parseFloat(amount).toFixed(2)}
          </p>
          <p className="text-muted-foreground mb-8">
            You will be redirected to a secure Stripe page to complete your
            purchase.
          </p>
          <Button
            onClick={createCheckoutSession}
            disabled={!stripeInstance || isRedirecting}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-md text-lg py-3"
          >
            Pay with Stripe
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentPortalPage;
