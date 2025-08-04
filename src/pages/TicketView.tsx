// src/pages/TicketView.tsx
import { useState, useEffect, useRef } from "react"; // Added useRef for chat scrolling
import { useParams, Link, useNavigate } from "react-router-dom"; // Added useNavigate
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
} from "firebase/firestore";
import { db } from "../firebase"; // Ensure this path is correct for your firebase.js

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
  conversation: Array<{ text: string; isBot: boolean; timestamp: string }>; // This will be the chat messages
}

interface ChatMessage {
  id?: string; // Firestore document ID
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
}

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  roles: string[]; // Crucial for role-based access
}

// Props for the TicketView component
interface TicketViewProps {
  user: UserProfile | null; // Pass the authenticated user
  appId: string; // Pass the appId
}

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
      (docSnap) => {
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
            timestamp: data.timestamp?.toDate(), // Convert timestamp to Date
          } as ChatMessage);
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
                        // In a real app, you'd fetch the user's displayName by assignedTo UID
                        <span className="font-medium">
                          {orderDetails.assignedTo === user?.uid
                            ? `You (${
                                user?.displayName || user?.email.split("@")[0]
                              })`
                            : orderDetails.assignedTo}
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
                                {message.timestamp.toLocaleDateString()}{" "}
                                {message.timestamp.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
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
