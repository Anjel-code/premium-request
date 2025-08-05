// src/pages/SuccessPage.tsx
import React, { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import {
  doc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { signInWithCustomToken, signInAnonymously } from "firebase/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth, db } from "../firebase"; // Import the existing Firebase instances
import { createPaymentNotification } from "../lib/notificationUtils";

const SuccessPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const idFromUrl = queryParams.get("ticketId");

    if (!idFromUrl) {
      setError("Ticket ID not found in URL. Cannot confirm payment.");
      setLoading(false);
      return;
    }

    setTicketId(idFromUrl);

    const setupFirebaseAndProceed = async () => {
      let currentUserId: string | undefined;

      try {
        // Listen for auth state changes to ensure user is logged in
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          if (user) {
            currentUserId = user.uid;
            console.log("User authenticated:", currentUserId);
            // Now that authentication is handled, proceed with updating payment status
            await updatePaymentStatus(idFromUrl, currentUserId);
          } else {
            console.log("No user authenticated, attempting sign-in.");
            try {
              // Try to sign in anonymously
              await signInAnonymously(auth);
              console.log("Signed in anonymously on SuccessPage.");
              currentUserId = auth.currentUser?.uid;
              if (currentUserId) {
                await updatePaymentStatus(idFromUrl, currentUserId);
              } else {
                setError(
                  "Authentication failed: No user ID after sign-in attempt."
                );
                setLoading(false);
              }
            } catch (authError) {
              console.error("Authentication error on SuccessPage:", authError);
              setError("Failed to authenticate. Please try again.");
              setLoading(false);
            }
          }
        });

        // Cleanup the auth listener when the component unmounts
        return () => unsubscribe();
      } catch (err) {
        console.error("Firebase setup or authentication error:", err);
        setError(
          "Failed to initialize Firebase or authenticate. Please try again."
        );
        setLoading(false);
      }
    };

    setupFirebaseAndProceed();
  }, [location.search]); // Re-run when query parameters change

  const updatePaymentStatus = async (
    currentTicketId: string,
    currentUserId: string | undefined
  ) => {
    try {
      if (!currentUserId) {
        setError("User not authenticated. Cannot confirm payment.");
        setLoading(false);
        return;
      }

      // Get the app ID from the Firebase config
      const appId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
      if (!appId) {
        setError("Firebase project ID not configured.");
        setLoading(false);
        return;
      }

      const orderRef = doc(
        db,
        `artifacts/${appId}/public/data/orders`,
        currentTicketId
      );

      await updateDoc(orderRef, {
        paymentStatus: "paid",
        updatedAt: new Date(),
      });

      const messagesCollectionRef = collection(
        db,
        `artifacts/${appId}/public/data/orders/${currentTicketId}/conversation`
      );
      await addDoc(messagesCollectionRef, {
        senderId: currentUserId,
        senderName: "Customer",
        text: "Payment has been successfully received for this order.",
        timestamp: serverTimestamp(),
      });

      // Create a notification for the payment
      try {
        await createPaymentNotification(
          appId,
          currentUserId,
          currentTicketId,
          currentTicketId // Using ticketId as ticketNumber for now
        );
      } catch (notificationError) {
        console.error(
          "Error creating payment notification:",
          notificationError
        );
        // Don't fail the payment confirmation if notification fails
      }

      setLoading(false);
    } catch (err) {
      console.error("Error updating payment status:", err);
      if ((err as any).code === "permission-denied") {
        setError(
          "Permission denied to update payment status. Please check Firestore rules. Ensure the user is authenticated and is the order owner."
        );
      } else {
        setError(
          "Failed to confirm payment. Please contact support if you believe this is an error."
        );
      }
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="ml-4 text-primary">Confirming payment...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center shadow-premium rounded-xl">
        <CardHeader>
          <CardTitle
            className={`text-2xl ${error ? "text-red-500" : "text-green-500"}`}
          >
            {error ? "Payment Confirmation Failed" : "Payment Successful!"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {error ? (
            <>
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">{error}</p>
            </>
          ) : (
            <>
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg text-primary font-semibold mb-2">
                Thank you for your payment!
              </p>
              <p className="text-muted-foreground mb-4">
                Your order status has been updated.
              </p>
            </>
          )}
          {ticketId && (
            <Button
              asChild
              className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md"
            >
              <Link to={`/ticket/${ticketId}`}>View Your Ticket</Link>
            </Button>
          )}
          <Button asChild variant="outline" className="mt-4 ml-2 rounded-md">
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuccessPage;
