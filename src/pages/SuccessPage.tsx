// src/pages/SuccessPage.tsx
import React, { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import {
  doc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { signInWithCustomToken, signInAnonymously } from "firebase/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth, db } from "../firebase"; // Import the existing Firebase instances
import { createPaymentNotification } from "../lib/notificationUtils";
import { handleStorePaymentSuccess } from "../lib/storeUtils";
import { useCart } from "@/contexts/CartContext";

const SuccessPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [isStoreOrder, setIsStoreOrder] = useState(false);
  const [storeOrderInfo, setStoreOrderInfo] = useState<any>(null);
  const location = useLocation();
  const { clearCart } = useCart();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const idFromUrl = queryParams.get("ticketId");
    const orderIdFromUrl = queryParams.get("orderId");

    // Check if this is a store order or cart order
    const storedOrderInfo = sessionStorage.getItem("storeOrderInfo");
    const cartOrderInfo = sessionStorage.getItem("cartOrderInfo");
    console.log("Stored order info:", storedOrderInfo);
    console.log("Cart order info:", cartOrderInfo);
    console.log(
      "URL params - ticketId:",
      idFromUrl,
      "orderId:",
      orderIdFromUrl
    );

    let isStoreOrderLocal = false;
    let storeOrderInfoLocal: any = null;
    let ticketIdLocal: string | null = null;

         if (cartOrderInfo) {
       try {
         const parsedInfo = JSON.parse(cartOrderInfo);
         console.log("Raw cart order info from sessionStorage:", cartOrderInfo);
         console.log("Parsed cart order info:", parsedInfo);
         console.log("Items in parsed info:", parsedInfo.items);
         console.log("Total price in parsed info:", parsedInfo.totalPrice);
         storeOrderInfoLocal = parsedInfo;
         isStoreOrderLocal = true;
         ticketIdLocal = parsedInfo.orderId;
         setStoreOrderInfo(parsedInfo);
         setIsStoreOrder(true);
         setTicketId(parsedInfo.orderId);
         // Clear the stored info
         sessionStorage.removeItem("cartOrderInfo");
       } catch (error) {
         console.error("Error parsing cart order info:", error);
       }
     } else if (storedOrderInfo) {
       try {
         const parsedInfo = JSON.parse(storedOrderInfo);
         console.log("Parsed store order info:", parsedInfo);
         storeOrderInfoLocal = parsedInfo;
         isStoreOrderLocal = true;
         ticketIdLocal = parsedInfo.orderId;
         setStoreOrderInfo(parsedInfo);
         setIsStoreOrder(true);
         setTicketId(parsedInfo.orderId);
         // Clear the stored info
         sessionStorage.removeItem("storeOrderInfo");
       } catch (error) {
         console.error("Error parsing stored order info:", error);
       }
       try {
         const parsedInfo = JSON.parse(cartOrderInfo);
         console.log("Raw cart order info from sessionStorage:", cartOrderInfo);
         console.log("Parsed cart order info:", parsedInfo);
         console.log("Items in parsed info:", parsedInfo.items);
         console.log("Total price in parsed info:", parsedInfo.totalPrice);
        storeOrderInfoLocal = parsedInfo;
        isStoreOrderLocal = true;
        ticketIdLocal = parsedInfo.orderId;
        setStoreOrderInfo(parsedInfo);
        setIsStoreOrder(true);
        setTicketId(parsedInfo.orderId);
        // Clear the stored info
        sessionStorage.removeItem("cartOrderInfo");
      } catch (error) {
        console.error("Error parsing cart order info:", error);
      }
    } else if (orderIdFromUrl) {
      // If orderId is in URL but no sessionStorage, create a basic order info
      console.log("Using orderId from URL:", orderIdFromUrl);
      ticketIdLocal = orderIdFromUrl;
      isStoreOrderLocal = true;
      storeOrderInfoLocal = {
        orderId: orderIdFromUrl,
        productName: queryParams.get("title") || "Product",
        amount: parseFloat(queryParams.get("amount") || "0"),
      };
      setTicketId(orderIdFromUrl);
      setIsStoreOrder(true);
      setStoreOrderInfo(storeOrderInfoLocal);
    } else if (idFromUrl) {
      ticketIdLocal = idFromUrl;
      isStoreOrderLocal = false;
      setTicketId(idFromUrl);
      setIsStoreOrder(false);
    } else {
      setError("Order ID not found in URL. Cannot confirm payment.");
      setLoading(false);
      return;
    }

    const setupFirebaseAndProceed = async () => {
      let currentUserId: string | undefined;

      try {
        // Listen for auth state changes to ensure user is logged in
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          if (user) {
            currentUserId = user.uid;
            console.log("User authenticated:", currentUserId);
            // Now that authentication is handled, proceed with updating payment status
            if (isStoreOrderLocal && storeOrderInfoLocal) {
              console.log("Processing as store order");
              await updateStorePaymentStatus(
                storeOrderInfoLocal,
                currentUserId
              );
            } else {
              console.log("Processing as regular order");
              await updatePaymentStatus(idFromUrl, currentUserId);
            }
          } else {
            console.log("No user authenticated, attempting sign-in.");
            try {
              // Try to sign in anonymously
              await signInAnonymously(auth);
              console.log("Signed in anonymously on SuccessPage.");
              currentUserId = auth.currentUser?.uid;
              if (currentUserId) {
                if (isStoreOrderLocal && storeOrderInfoLocal) {
                  console.log("Processing as store order (anonymous)");
                  await updateStorePaymentStatus(
                    storeOrderInfoLocal,
                    currentUserId
                  );
                } else {
                  console.log("Processing as regular order (anonymous)");
                  await updatePaymentStatus(idFromUrl, currentUserId);
                }
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

  const updateStorePaymentStatus = async (
    orderInfo: any,
    currentUserId: string | undefined
  ) => {
    try {
      console.log("Updating store payment status for order:", orderInfo);

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

      console.log("Using appId:", appId);
      console.log("Order ID:", orderInfo.orderId);
      console.log(
        "Collection path:",
        `artifacts/${appId}/public/data/store-orders`
      );

      // Check if this is a cart order (starts with "cart_")
      const isCartOrder = orderInfo.orderId && orderInfo.orderId.startsWith("cart_");
      
             if (isCartOrder) {
         // For cart orders, create the order document
         console.log("Processing cart order:", orderInfo.orderId);
         console.log("Cart order info:", orderInfo);
         console.log("Items:", orderInfo.items);
         console.log("Total price:", orderInfo.totalPrice);
         console.log("Customer info:", orderInfo.customerInfo);
        const orderRef = doc(
          db,
          `artifacts/${appId}/public/data/store-orders`,
          orderInfo.orderId
        );

                 // Create the cart order document
         await setDoc(orderRef, {
           orderId: orderInfo.orderId,
           userId: currentUserId,
           userEmail: orderInfo.customerInfo?.email || "customer@example.com",
           userName: `${orderInfo.customerInfo?.firstName || ""} ${orderInfo.customerInfo?.lastName || ""}`.trim(),
           productId: "cart_order",
           productName: orderInfo.items ? 
             orderInfo.items.length === 1 
               ? orderInfo.items[0].name 
               : `Cart Order - ${orderInfo.items.length} items` 
             : "Product",
           quantity: orderInfo.items ? orderInfo.items.reduce((total, item) => total + item.quantity, 0) : 1,
           totalPrice: orderInfo.totalPrice || 0,
           totalAmount: orderInfo.totalPrice || 0, // Add this for compatibility with existing dashboard code
           paymentStatus: "completed",
           status: "paid",
           createdAt: new Date(),
           updatedAt: new Date(),
                       // Save shipping information (only if customerInfo exists)
            ...(orderInfo.customerInfo && {
              shippingInfo: {
                firstName: orderInfo.customerInfo.firstName || "",
                lastName: orderInfo.customerInfo.lastName || "",
                email: orderInfo.customerInfo.email || "",
                phone: orderInfo.customerInfo.phone || "",
                address: orderInfo.customerInfo.address || "",
                city: orderInfo.customerInfo.city || "",
                state: orderInfo.customerInfo.state || "",
                zipCode: orderInfo.customerInfo.zipCode || "",
                country: orderInfo.customerInfo.country || "",
              }
            }),
         });

                 console.log("Cart order created successfully:", orderInfo.orderId);
         
         // Clear the cart after successful cart order payment
         clearCart();
         console.log("Cart cleared after successful payment");
       } else {
         // For existing store orders, update the payment status
        const orderRef = doc(
          db,
          `artifacts/${appId}/public/data/store-orders`,
          orderInfo.orderId
        );

        // First check if the document exists
        const orderDoc = await getDoc(orderRef);
        if (!orderDoc.exists()) {
          console.error(
            "Store order document does not exist:",
            orderInfo.orderId
          );
          setError("Store order not found. Please contact support.");
          setLoading(false);
          return;
        }

        console.log("Found store order document:", orderDoc.data());
        console.log("Current user ID:", currentUserId);
        console.log("Store order user ID:", orderDoc.data().userId);
        console.log("Attempting to update store order...");

        await updateDoc(orderRef, {
          paymentStatus: "completed",
          status: "paid",
          updatedAt: new Date(),
        });
      }

      // Create store payment success notifications
      await handleStorePaymentSuccess(
        appId,
        currentUserId,
        orderInfo.customerInfo?.email || orderInfo.userEmail || "customer@example.com",
        orderInfo.customerInfo ? `${orderInfo.customerInfo.firstName} ${orderInfo.customerInfo.lastName}`.trim() : orderInfo.userName || "Customer",
        orderInfo.items ? `Cart Order - ${orderInfo.items.length} items` : orderInfo.productName || "Product",
        orderInfo.totalPrice || orderInfo.amount || 0,
        orderInfo.orderId
      );

      setLoading(false);
    } catch (err) {
      console.error("Error updating store payment status:", err);
      console.error("Error details:", {
        code: (err as any).code,
        message: (err as any).message,
        stack: (err as any).stack
      });
      setError(
        "Failed to confirm store payment. Please contact support if you believe this is an error."
      );
      setLoading(false);
    }
  };

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
          {ticketId && !isStoreOrder && (
            <Button
              asChild
              className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md"
            >
              <Link to={`/ticket/${ticketId}`}>View Your Ticket</Link>
            </Button>
          )}
          {isStoreOrder && (
            <Button
              asChild
              className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md"
            >
              <Link to="/store">Continue Shopping</Link>
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
