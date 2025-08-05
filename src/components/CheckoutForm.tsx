import React, { useState, useEffect, useRef } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase"; // Import the Firestore instance

interface CheckoutFormProps {
  ticketId: string;
  amount: number;
  appId: string; // Passed from PaymentPortalPage for Firestore path
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({
  ticketId,
  amount,
  appId,
}) => {
  const stripe = useStripe(); // Hook to access the Stripe object
  const elements = useElements(); // Hook to access the Elements instance

  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "success" | "failed"
  >("idle");
  const [isPaymentElementReady, setIsPaymentElementReady] = useState(false); // State to track PaymentElement readiness

  // Set PaymentElement as ready when the PaymentElement's onReady callback fires
  // No need for useEffect here, as onReady is handled via the PaymentElement prop.

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Disable form submission if Stripe, Elements, or PaymentElement is not ready
    if (!stripe || !elements || !isPaymentElementReady) {
      setMessage(
        "Payment form is not fully loaded. Please wait a moment and try again."
      );
      return;
    }

    setIsLoading(true);
    setMessage(null);
    setPaymentStatus("idle");

    // Confirm the payment with Stripe.js.
    // The PaymentElement automatically uses the clientSecret provided to the Elements provider.
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // For this example, we're handling success/failure directly without a redirect.
        // In a real app, you might provide a return_url for 3D Secure or other redirects.
        // return_url: window.location.origin + `/payment-status/${ticketId}`,
      },
      redirect: "if_required", // Handle redirects if necessary (e.g., for 3D Secure)
    });

    if (error) {
      // This point will only be reached if there's an immediate error when
      // confirming the payment. Otherwise, your customer will be redirected to
      // your `return_url`.
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(
          error.message || "An error occurred with your card details."
        );
      } else {
        setMessage("An unexpected error occurred. Please try again.");
      }
      setPaymentStatus("failed");
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      setMessage("Payment successful! Updating order status...");
      setPaymentStatus("success");

      // Update Firestore order status upon successful payment
      if (db) {
        try {
          const orderRef = doc(
            db,
            `artifacts/${appId}/public/data/orders`,
            ticketId
          );
          await updateDoc(orderRef, {
            isPaid: true,
            status: "completed", // Or 'paid' or 'payment_received' depending on your workflow
            lastUpdate: `Payment of $${amount.toFixed(2)} received.`,
            updatedAt: new Date(),
          });
          console.log("Order status updated in Firestore successfully.");
          setMessage("Payment successful! Order status updated.");
        } catch (firestoreError) {
          console.error(
            "Error updating order status in Firestore:",
            firestoreError
          );
          setMessage(
            "Payment successful, but failed to update order status in database. Please contact support."
          );
        }
      } else {
        console.error(
          "Firestore DB not initialized. Cannot update order status."
        );
        setMessage(
          "Payment successful, but database connection issue. Please contact support."
        );
      }
    } else {
      // This case might occur if payment is still processing (e.g., pending 3D Secure)
      setMessage(
        "Payment processing. Please check your dashboard for updates."
      );
      setPaymentStatus("idle"); // Or 'processing'
    }

    setIsLoading(false);
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      {/* PaymentElement collects card details and other payment methods */}
      <PaymentElement id="payment-element" />
      <Button
        // Disable button if loading, Stripe/Elements not initialized, or PaymentElement not ready
        disabled={isLoading || !stripe || !elements || !isPaymentElementReady}
        className="mt-6 w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-md"
        type="submit"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Pay Now"
        )}
      </Button>
      {/* Display payment status messages */}
      {message && (
        <div
          className={`mt-4 p-3 rounded-md flex items-center gap-2 ${
            paymentStatus === "success"
              ? "bg-green-100 text-green-700"
              : paymentStatus === "failed"
              ? "bg-red-100 text-red-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {paymentStatus === "success" ? (
            <CheckCircle className="h-5 w-5" />
          ) : paymentStatus === "failed" ? (
            <XCircle className="h-5 w-5" />
          ) : null}
          <p className="text-sm">{message}</p>
        </div>
      )}
    </form>
  );
};

export default CheckoutForm;
