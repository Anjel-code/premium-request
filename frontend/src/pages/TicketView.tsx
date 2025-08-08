// src/pages/TicketView.tsx
import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input"; // For progress input
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Package,
  Send,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2, // For loading states
  XCircle, // For dismissed status
} from "lucide-react";

// Shadcn UI Dialog components for the payment modal
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label"; // For form labels

import {
  doc,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp, // Import Timestamp type from firebase/firestore
} from "firebase/firestore";
import { db } from "../firebase"; // Ensure this path is correct for your firebase.js
import { createOrderStatusNotification } from "../lib/notificationUtils";

// Define interfaces to match Firestore data structures
interface Order {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  title: string;
  summary: string;
  status: "pending" | "accepted" | "completed" | "dismissed";
  createdAt: Date;
  updatedAt: Date;
  ticketNumber: string;
  estimatedCompletion: Date | null;
  budget: string;
  progress: number;
  lastUpdate: string;
  assignedTo: string | null;
  assignedDate: Date | null;
  dismissedBy: string | null;
  dismissedDate: Date | null;
  conversation?: Array<{
    text: string;
    senderId: string;
    senderName: string;
    timestamp: Date | null;
  }>; // Chat messages are now only text
  // New payment fields directly on the Order
  paymentStatus?: "none" | "requested" | "paid" | "refunded";
  finalPaymentAmount?: number | null;
  paymentRequestNotes?: string | null;
  paymentPortalUrl?: string | null;
}

interface ChatMessage {
  id?: string; // Firestore document ID
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date | null; // Changed to Date | null to handle potential invalid dates
}

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  roles: string[]; // Crucial for role-based access
  photoURL?: string;
}

// Props for the TicketView component
interface TicketViewProps {
  user: UserProfile | null; // Pass the authenticated user
  appId: string; // Pass the appId
}

// Helper function to safely convert Firestore timestamp or string to Date
const parseFirestoreTimestamp = (timestamp: any): Date | null => {
  if (timestamp instanceof Date) {
    return timestamp; // Already a Date object
  }
  // Check if it's a Firestore Timestamp object
  if (timestamp && typeof timestamp.toDate === "function") {
    const date = timestamp.toDate();
    // Ensure the date is valid after conversion
    return !isNaN(date.getTime()) ? date : null;
  }
  // Check if it's a string that can be parsed by Date
  if (typeof timestamp === "string") {
    const date = new Date(timestamp);
    // Check if the parsed date is valid
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  // Fallback for null, undefined, or unparseable values
  return null;
};

const TicketView: React.FC<TicketViewProps> = ({ user, appId }) => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();

  const [orderDetails, setOrderDetails] = useState<Order | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string[]>([]);
  const [loadingUserRole, setLoadingUserRole] = useState(true);
  const [newProgress, setNewProgress] = useState<number | string>(""); // State for progress input
  const [assignedToName, setAssignedToName] = useState<string | null>(null); // New state for assigned user's name

  // Payment Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentNotes, setPaymentNotes] = useState<string>("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  console.log("TicketView component rendered.");
  console.log(
    "Props received: user =",
    user,
    "appId =",
    appId,
    "ticketId =",
    ticketId
  );

  // --- Fetch User Role ---
  useEffect(() => {
    console.log("useEffect: Fetching user role...");
    const fetchUserRole = async () => {
      if (!user || !db) {
        console.log(
          "User or DB not available for role fetch. User:",
          user,
          "DB:",
          db
        );
        setLoadingUserRole(false);
        setUserRole([]);
        return;
      }
      try {
        console.log("Attempting to fetch user profile for UID:", user.uid);
        const userProfileRef = doc(db, `users`, user.uid); // Top-level 'users' collection
        const userSnap = await getDoc(userProfileRef);
        if (userSnap.exists()) {
          const profileData = userSnap.data() as UserProfile;
          console.log("User profile found:", profileData);
          setUserRole(profileData.roles || []);
        } else {
          console.log("User profile NOT found. Defaulting to customer role.");
          setUserRole(["customer"]); // Default to customer if profile not found
        }
      } catch (err) {
        console.error("Error fetching user role:", err);
        setUserRole([]);
        setError("Failed to load user permissions.");
      } finally {
        setLoadingUserRole(false);
        console.log("Finished fetching user role. loadingUserRole =", false);
      }
    };
    fetchUserRole();
  }, [user, db]); // Re-run when user or db instance changes

  // --- Fetch Order Details and Chat Messages ---
  useEffect(() => {
    console.log("useEffect: Fetching order details and chat messages...");
    console.log(
      "Dependencies: db =",
      db,
      "ticketId =",
      ticketId,
      "loadingUserRole =",
      loadingUserRole,
      "user =",
      user
    );

    if (!db || !ticketId || loadingUserRole || !user) {
      console.log("Skipping order/chat fetch due to missing dependencies.");
      if (!user) {
        console.log("No user found, setting loading to false for orders.");
        setLoading(false);
      }
      return;
    }

    const orderRef = doc(db, `artifacts/${appId}/public/data/orders`, ticketId);
    const messagesCollectionRef = collection(
      db,
      `artifacts/${appId}/public/data/orders/${ticketId}/conversation`
    );

    console.log(
      "Firestore Order Path:",
      `artifacts/${appId}/public/data/orders/${ticketId}`
    );
    console.log(
      "Firestore Chat Path:",
      `artifacts/${appId}/public/data/orders/${ticketId}/conversation`
    );

    // Listener for Order Details
    console.log("Setting up onSnapshot for order details...");
    const unsubscribeOrder = onSnapshot(
      orderRef,
      async (docSnap) => {
        console.log("Order details snapshot received.");
        if (docSnap.exists()) {
          const data = docSnap.data();
          const order: Order = {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
            estimatedCompletion: data.estimatedCompletion?.toDate() || null,
            assignedDate: data.assignedDate?.toDate() || null,
            dismissedDate: data.dismissedDate?.toDate() || null,
            // Payment fields
            paymentStatus: data.paymentStatus || "none",
            finalPaymentAmount: data.finalPaymentAmount || null,
            paymentRequestNotes: data.paymentRequestNotes || null,
            paymentPortalUrl: data.paymentPortalUrl || null,
          } as Order;

          console.log("Fetched Order Data:", order);

          // Check if the current user is authorized to view this order
          const isAuthorized =
            userRole.includes("admin") ||
            userRole.includes("team_member") ||
            order.userId === user.uid;

          console.log("User roles:", userRole);
          console.log(
            "Order userId:",
            order.userId,
            "Current user UID:",
            user.uid
          );
          console.log("Is Authorized to view order?", isAuthorized);

          if (isAuthorized) {
            setOrderDetails(order);
            setNewProgress(order.progress); // Initialize progress input

            // --- Fetch assigned team member's name ---
            if (order.assignedTo) {
              try {
                const assignedUserRef = doc(db, "users", order.assignedTo);
                const assignedUserSnap = await getDoc(assignedUserRef);
                if (assignedUserSnap.exists()) {
                  const assignedUserData =
                    assignedUserSnap.data() as UserProfile;
                  setAssignedToName(
                    assignedUserData.displayName ||
                      assignedUserData.email.split("@")[0]
                  );
                  console.log(
                    "Fetched assigned user name:",
                    assignedUserData.displayName ||
                      assignedUserData.email.split("@")[0]
                  );
                } else {
                  setAssignedToName("Unknown Team Member");
                  console.warn(
                    "Assigned user profile not found for UID:",
                    order.assignedTo
                  );
                }
              } catch (fetchErr) {
                console.error(
                  "Error fetching assigned user profile:",
                  fetchErr
                );
                setAssignedToName("Error fetching name");
              }
            } else {
              setAssignedToName(null); // No one assigned
            }

            console.log("Order details set.");
          } else {
            setError("You do not have permission to view this order.");
            setOrderDetails(null);
            console.warn("Permission denied for order:", ticketId);
          }
        } else {
          setError("Order not found.");
          setOrderDetails(null);
          console.warn("Order document does not exist for ID:", ticketId);
        }
        setLoading(false);
        console.log("Order details loading finished. Loading state =", false);
      },
      (err) => {
        console.error("Error fetching order details:", err);
        setError("Failed to load order details. Please check permissions.");
        setLoading(false);
        console.log(
          "Order details loading finished with error. Loading state =",
          false
        );
      }
    );

    // Listener for Chat Messages (subcollection)
    console.log("Setting up onSnapshot for chat messages...");
    const q = query(messagesCollectionRef, orderBy("timestamp", "asc"));
    const unsubscribeMessages = onSnapshot(
      q,
      (snapshot) => {
        console.log("Chat messages snapshot received.");
        const fetchedMessages: ChatMessage[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          fetchedMessages.push({
            id: doc.id,
            senderId: data.senderId,
            senderName: data.senderName,
            text: data.text,
            timestamp: parseFirestoreTimestamp(data.timestamp),
          } as ChatMessage); // Removed type and paymentDetails from chat messages
        });
        setChatMessages(fetchedMessages);
        console.log("Fetched Chat Messages:", fetchedMessages);
      },
      (err) => {
        console.error("Error fetching chat messages:", err);
        setError("Failed to load chat messages.");
      }
    );

    return () => {
      console.log("Cleaning up Firestore listeners.");
      unsubscribeOrder();
      unsubscribeMessages();
    }; // Cleanup listeners
  }, [db, ticketId, appId, user, loadingUserRole, userRole]); // Re-run when these dependencies change

  // --- Scroll to bottom of chat ---
  useEffect(() => {
    if (chatMessages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      console.log("Scrolled to bottom of chat.");
    }
  }, [chatMessages]);

  // --- Chat Message Handler ---
  const handleSendMessage = async () => {
    console.log("Attempting to send message...");
    if (!newMessage.trim() || !user || !orderDetails) {
      console.warn(
        "Cannot send message: Missing message text, user, or order details."
      );
      return;
    }

    try {
      const messagesCollectionRef = collection(
        db,
        `artifacts/${appId}/public/data/orders/${orderDetails.id}/conversation`
      );
      console.log(
        "Sending message to path:",
        `artifacts/${appId}/public/data/orders/${orderDetails.id}/conversation`
      );
      await addDoc(messagesCollectionRef, {
        senderId: user.uid,
        senderName: user.displayName || user.email.split("@")[0],
        text: newMessage.trim(),
        timestamp: serverTimestamp(), // Use server timestamp
      });
      setNewMessage("");
      console.log("Message sent successfully!");
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message.");
    }
  };

  // --- Payment Request Handler ---
  const handleSendPaymentRequest = async () => {
    console.log("Attempting to send payment request...");
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0 || !user || !orderDetails) {
      console.warn("Invalid payment amount or missing user/order details.");
      setError("Please enter a valid payment amount.");
      return;
    }

    try {
      const orderRef = doc(
        db,
        `artifacts/${appId}/public/data/orders`,
        orderDetails.id
      );

      // Simulate a payment portal URL (replace with actual integration later)
      const paymentUrl = `/payment-portal/${
        orderDetails.id
      }?amount=${amount.toFixed(2)}`;

      const updateData: Partial<Order> = {
        paymentStatus: "requested",
        finalPaymentAmount: amount,
        paymentRequestNotes: paymentNotes,
        paymentPortalUrl: paymentUrl,
        updatedAt: new Date(), // Update the order's last updated time
      };

      await updateDoc(orderRef, updateData);

      // Optionally, send a regular chat message to notify both parties
      const messagesCollectionRef = collection(
        db,
        `artifacts/${appId}/public/data/orders/${orderDetails.id}/conversation`
      );
      await addDoc(messagesCollectionRef, {
        senderId: user.uid,
        senderName: user.displayName || user.email.split("@")[0],
        text: `A payment request for $${amount.toFixed(2)} has been sent. ${
          paymentNotes ? `Notes: ${paymentNotes}` : ""
        }`,
        timestamp: serverTimestamp(),
      });

      setPaymentAmount("");
      setPaymentNotes("");
      setShowPaymentModal(false); // Close the modal
      console.log("Payment request sent successfully and order updated!");
    } catch (err) {
      console.error("Error sending payment request:", err);
      setError("Failed to send payment request.");
    }
  };

  // --- Order Update Handlers (for team members/admins) ---
  const handleUpdateStatus = async (newStatus: Order["status"]) => {
    console.log("Attempting to update status to:", newStatus);
    if (!orderDetails || !db || !user || !hasAdminOrTeamRole) {
      console.warn(
        "Cannot update status: Missing order details, DB, user, or insufficient role."
      );
      return;
    }
    try {
      const orderRef = doc(
        db,
        `artifacts/${appId}/public/data/orders`,
        orderDetails.id
      );
      const updateData: Partial<Order> = {
        status: newStatus,
        updatedAt: new Date(), // Update local timestamp
      };

      if (newStatus === "accepted" && !orderDetails.assignedTo) {
        updateData.assignedTo = user.uid;
        updateData.assignedDate = new Date();
        console.log("Assigning order to current user on acceptance.");
      } else if (newStatus === "dismissed" && !orderDetails.dismissedBy) {
        updateData.dismissedBy = user.uid;
        updateData.dismissedDate = new Date();
        console.log("Dismissing order by current user.");
      }

      // Create notification for status change
      try {
        await createOrderStatusNotification(
          appId,
          orderDetails.userId, // Notify the order owner
          orderDetails.id,
          orderDetails.ticketNumber,
          orderDetails.status, // Old status
          newStatus // New status
        );
      } catch (notificationError) {
        console.error("Error creating status notification:", notificationError);
      }

      console.log(
        "Updating order status for ID:",
        orderDetails.id,
        "with data:",
        updateData
      );
      await updateDoc(orderRef, updateData);
      console.log(`Order ${orderDetails.id} status updated to ${newStatus}`);
    } catch (err) {
      console.error("Error updating status:", err);
      setError("Failed to update order status.");
    }
  };

  const handleUpdateProgress = async () => {
    console.log("Attempting to update progress to:", newProgress);
    if (
      !orderDetails ||
      !db ||
      !user ||
      !hasAdminOrTeamRole ||
      typeof newProgress !== "number"
    ) {
      console.warn(
        "Cannot update progress: Missing order details, DB, user, insufficient role, or invalid progress value."
      );
      return;
    }
    try {
      const orderRef = doc(
        db,
        `artifacts/${appId}/public/data/orders`,
        orderDetails.id
      );
      const lastUpdateMessage = `Progress updated to ${newProgress}% by ${
        user.displayName || user.email.split("@")[0]
      }`;
      console.log(
        "Updating order progress for ID:",
        orderDetails.id,
        "with progress:",
        newProgress
      );
      await updateDoc(orderRef, {
        progress: newProgress,
        updatedAt: new Date(),
        lastUpdate: lastUpdateMessage,
      });
      console.log(
        `Order ${orderDetails.id} progress updated to ${newProgress}%`
      );
    } catch (err) {
      console.error("Error updating progress:", err);
      setError("Failed to update order progress.");
    }
  };

  // --- Helper Functions for UI ---
  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "accepted":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "dismissed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "accepted":
        return <AlertCircle className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "dismissed":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatStatus = (status: Order["status"]) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Check if the current user has admin or team_member role
  const hasAdminOrTeamRole =
    userRole.includes("admin") || userRole.includes("team_member");
  console.log("Current user has Admin/Team role:", hasAdminOrTeamRole);

  // --- Render Logic ---
  if (loading || loadingUserRole) {
    console.log(
      "Rendering loading state. loading =",
      loading,
      "loadingUserRole =",
      loadingUserRole
    );
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="ml-4 text-primary">Loading ticket details...</p>
      </div>
    );
  }

  if (error) {
    console.log("Rendering error state. Error:", error);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center shadow-premium rounded-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => navigate("/dashboard")} className="mt-4">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!orderDetails) {
    console.log("Rendering 'No order details available' fallback.");
    // This case should ideally be caught by the error state, but as a fallback
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-primary">No order details available.</p>
      </div>
    );
  }

  console.log("Rendering TicketView with order details:", orderDetails);
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation component is now handled in App.jsx */}

      <div className="pt-24 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-6">
            <Button asChild variant="outline" className="mb-4">
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-4xl font-bold text-primary mb-2">
              {orderDetails.title}
            </h1>
            <p className="text-lg text-muted-foreground">
              Order ID: {orderDetails.id}
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Order Details */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="border-0 shadow-elegant">
                <CardHeader>
                  <CardTitle>Order Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Badge className={getStatusColor(orderDetails.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(orderDetails.status)}
                      {formatStatus(orderDetails.status)}
                    </div>
                  </Badge>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">
                        Progress
                      </span>
                      <span className="text-sm font-medium">
                        {orderDetails.progress}%
                      </span>
                    </div>
                    <Progress value={orderDetails.progress} className="h-2" />
                  </div>

                  {/* Status & Progress Update for Team/Admin */}
                  {hasAdminOrTeamRole && (
                    <div className="space-y-4 pt-4 border-t border-border mt-4">
                      <h3 className="font-semibold text-md text-primary">
                        Update Order
                      </h3>
                      <div className="flex flex-col gap-2">
                        <label
                          htmlFor="status-select"
                          className="text-sm text-muted-foreground"
                        >
                          Change Status:
                        </label>
                        <select
                          id="status-select"
                          value={orderDetails.status}
                          onChange={(e) =>
                            handleUpdateStatus(
                              e.target.value as Order["status"]
                            )
                          }
                          className="p-2 border rounded-md bg-background text-foreground"
                        >
                          <option value="pending">Pending</option>
                          <option value="accepted">Accepted</option>
                          <option value="processing">Processing</option>
                          <option value="completed">Completed</option>
                          <option value="dismissed">Dismissed</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label
                          htmlFor="progress-input"
                          className="text-sm text-muted-foreground"
                        >
                          Update Progress (%):
                        </label>
                        <div className="flex gap-2">
                          <Input
                            id="progress-input"
                            type="number"
                            value={newProgress}
                            onChange={(e) =>
                              setNewProgress(Number(e.target.value))
                            }
                            min={0}
                            max={100}
                            className="flex-1 rounded-md"
                          />
                          <Button
                            onClick={handleUpdateProgress}
                            className="rounded-md"
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-elegant">
                <CardHeader>
                  <CardTitle>Order Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Created:</span>
                    <span>
                      {orderDetails.createdAt
                        ? orderDetails.createdAt.toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Expected:</span>
                    <span>
                      {orderDetails.estimatedCompletion
                        ? orderDetails.estimatedCompletion.toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Budget:</span>
                    <span>{orderDetails.budget}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Assigned To:</span>
                    <span>
                      {orderDetails.assignedTo ? (
                        <span className="font-medium">
                          {orderDetails.assignedTo === user?.uid
                            ? `You (${
                                user?.displayName || user?.email.split("@")[0]
                              })`
                            : assignedToName || "Loading..."}
                        </span>
                      ) : (
                        "Not Assigned"
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Client:</span>
                    <span>
                      {orderDetails.userName ||
                        orderDetails.userEmail ||
                        orderDetails.userId}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* NEW: Payment Details Card */}
              <Card className="border-0 shadow-elegant">
                <CardHeader>
                  <CardTitle>Payment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {orderDetails.paymentStatus === "none" && (
                    <p className="text-sm text-muted-foreground">
                      No payment request has been sent yet.
                    </p>
                  )}

                  {orderDetails.paymentStatus === "requested" && (
                    <>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Amount:</span>
                        <span className="font-bold text-primary text-lg">
                          $
                          {orderDetails.finalPaymentAmount?.toFixed(2) || "N/A"}
                        </span>
                      </div>
                      {orderDetails.paymentRequestNotes && (
                        <p className="text-sm text-muted-foreground">
                          Notes: {orderDetails.paymentRequestNotes}
                        </p>
                      )}
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                        Payment Requested
                      </Badge>
                    </>
                  )}

                  {orderDetails.paymentStatus === "paid" && (
                    <>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Amount:</span>
                        <span className="font-bold text-primary text-lg">
                          $
                          {orderDetails.finalPaymentAmount?.toFixed(2) || "N/A"}
                        </span>
                      </div>
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        Payment Received
                      </Badge>
                    </>
                  )}

                  {orderDetails.paymentStatus === "refunded" && (
                    <>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Amount:</span>
                        <span className="font-bold text-primary text-lg">
                          $
                          {orderDetails.finalPaymentAmount?.toFixed(2) || "N/A"}
                        </span>
                      </div>
                      <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                        Refunded
                      </Badge>
                    </>
                  )}

                  {/* Payment Action Button (Conditional based on role and status) */}
                  {hasAdminOrTeamRole && (
                    <Dialog
                      open={showPaymentModal}
                      onOpenChange={setShowPaymentModal}
                    >
                      <DialogTrigger asChild>
                        <Button
                          className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white rounded-md shadow-sm"
                          disabled={
                            orderDetails.paymentStatus === "paid" ||
                            orderDetails.paymentStatus === "requested"
                          }
                        >
                          {orderDetails.paymentStatus === "requested"
                            ? "Payment Request Sent"
                            : orderDetails.paymentStatus === "paid"
                            ? "Payment Received"
                            : "Finalize Payment"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px] bg-background text-foreground p-6 rounded-lg shadow-lg">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-bold">
                            Finalize Payment
                          </DialogTitle>
                          <DialogDescription className="text-muted-foreground">
                            Set the final price and any notes for the customer.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount" className="text-right">
                              Amount ($)
                            </Label>
                            <Input
                              id="amount"
                              type="number"
                              value={paymentAmount}
                              onChange={(e) => setPaymentAmount(e.target.value)}
                              className="col-span-3 rounded-md"
                              placeholder="e.g., 150.00"
                              min="0.01"
                              step="0.01"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="notes" className="text-right">
                              Notes
                            </Label>
                            <Textarea
                              id="notes"
                              value={paymentNotes}
                              onChange={(e) => setPaymentNotes(e.target.value)}
                              className="col-span-3 rounded-md resize-none"
                              placeholder="e.g., For design services rendered."
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setShowPaymentModal(false)}
                            className="rounded-md"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSendPaymentRequest}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-md"
                            disabled={
                              !paymentAmount || parseFloat(paymentAmount) <= 0
                            }
                          >
                            Send Payment Request
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}

                  {/* Make Payment Button (Visible to ALL roles if payment requested) */}
                  {orderDetails.paymentStatus === "requested" &&
                    orderDetails.paymentPortalUrl && (
                      <Button
                        asChild
                        className="w-full mt-4 bg-accent hover:bg-accent/90 text-accent-foreground rounded-md shadow-sm"
                      >
                        <a
                          href={orderDetails.paymentPortalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Make Payment Now
                        </a>
                      </Button>
                    )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-elegant">
                <CardHeader>
                  <CardTitle>Original Request Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {orderDetails.summary || "No summary provided."}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Chat Interface */}
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-premium h-[700px] flex flex-col">
                <CardHeader className="border-b border-border">
                  <CardTitle>Team Communication</CardTitle>
                </CardHeader>

                {/* Messages */}
                <div
                  className="flex-1 overflow-y-auto p-6 space-y-4"
                  ref={messagesEndRef}
                >
                  {chatMessages.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No messages yet. Start the conversation!
                    </p>
                  ) : (
                    chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.senderId === user?.uid
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] ${
                            message.senderId === user?.uid
                              ? "order-2"
                              : "order-1"
                          }`}
                        >
                          <div
                            className={`px-4 py-3 rounded-lg ${
                              message.senderId === user?.uid
                                ? "bg-accent text-accent-foreground"
                                : "bg-muted text-foreground"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium">
                                {message.senderName}
                              </span>
                              <span className="text-xs opacity-70">
                                {message.timestamp
                                  ? `${message.timestamp.toLocaleDateString()} ${message.timestamp.toLocaleTimeString(
                                      [],
                                      {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      }
                                    )}`
                                  : "N/A"}
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed">
                              {message.text}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input */}
                <div className="border-t border-border p-6">
                  <div className="flex gap-2">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message to the team..."
                      className="flex-1 min-h-[80px] resize-none rounded-md"
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendMessage}
                      size="lg"
                      className="bg-accent hover:bg-accent/90 text-accent-foreground px-4 self-end rounded-md"
                      disabled={!newMessage.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Press Enter to send, Shift+Enter for new line
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketView;
