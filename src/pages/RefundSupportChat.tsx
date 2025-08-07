// src/pages/RefundSupportChat.tsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Send,
  ArrowLeft,
  Download,
  Upload,
  FileText,
  User,
  MapPin,
  Package,
  DollarSign,
  Calendar,
  X,
} from "lucide-react";
import { auth, db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";

interface RefundSupportChatProps {
  user: any;
  appId: string;
  isAdmin?: boolean;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
  isFromSupport: boolean;
  attachments?: {
    name: string;
    url: string;
    type: string;
  }[];
}

interface StoreOrder {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  productName: string;
  totalAmount: number;
  status: string;
  refundStatus: string;
  refundReason?: string;
  createdAt: Date;
  shippingInfo?: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

const RefundSupportChat: React.FC<RefundSupportChatProps> = ({ user, appId, isAdmin = false }) => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  
  console.log("RefundSupportChat props:", { user, appId, isAdmin, orderId });
  console.log("Current URL:", window.location.pathname);
  console.log("Is Admin Route:", window.location.pathname.includes("/refund-support-chat/"));
  console.log("Is Customer Route:", window.location.pathname.includes("/customer-refund-chat/"));
  
  // Ensure customer is using the correct route
  if (!isAdmin && window.location.pathname.includes("/refund-support-chat/")) {
    console.error("Customer is accessing admin route!");
    navigate("/");
    return null;
  }
  
  // Ensure admin is using the correct route
  if (isAdmin && window.location.pathname.includes("/customer-refund-chat/")) {
    console.error("Admin is accessing customer route!");
    navigate("/");
    return null;
  }
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [orderDetails, setOrderDetails] = useState<StoreOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
     const messagesEndRef = useRef<HTMLDivElement>(null);
   const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Fetch order details
  useEffect(() => {
    if (!orderId || !appId) return;

    const fetchOrderDetails = async () => {
      try {
        const orderRef = doc(db, `artifacts/${appId}/public/data/store-orders`, orderId);
        const orderDoc = await getDoc(orderRef);
        
        if (orderDoc.exists()) {
          const data = orderDoc.data();
          setOrderDetails({
            id: orderDoc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
          } as StoreOrder);
        } else {
          setError("Order not found");
        }
      } catch (err) {
        console.error("Error fetching order details:", err);
        setError("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, appId]);

  // Fetch chat messages
  useEffect(() => {
    if (!orderId || !appId) return;

    const messagesRef = collection(
      db,
      `artifacts/${appId}/public/data/store-orders/${orderId}/refund-chat`
    );
    const q = query(messagesRef, orderBy("timestamp", "asc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        fetchedMessages.push({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date(),
        } as ChatMessage);
      });
      setMessages(fetchedMessages);
    }, (err) => {
      console.error("Error fetching messages:", err);
      setError("Failed to load messages");
    });

    return () => unsubscribe();
  }, [orderId, appId]);

     // Scroll to bottom of chat
   useEffect(() => {
     if (messagesContainerRef.current) {
       messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
     }
   }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !orderId) return;

    console.log("Sending message:", { newMessage, user, orderId, isAdmin });
    console.log("Sender name will be:", isAdmin ? "Refund Support" : (user.displayName || user.email || "Customer"));

    try {
      const messagesRef = collection(
        db,
        `artifacts/${appId}/public/data/store-orders/${orderId}/refund-chat`
      );

      const messageData: any = {
        senderId: user.uid,
        senderName: isAdmin ? "Refund Support" : (user.displayName || user.email || "Customer"),
        text: newMessage.trim(),
        timestamp: serverTimestamp(),
        isFromSupport: isAdmin,
      };

      // Add file attachment if selected
      if (selectedFile) {
        // In a real implementation, you'd upload the file to storage
        // For now, we'll just store the file name
        messageData.attachments = [{
          name: selectedFile.name,
          url: "#", // Placeholder - in real implementation, this would be the uploaded file URL
          type: selectedFile.type,
        }];
      }

      await addDoc(messagesRef, messageData);
      setNewMessage("");
      setSelectedFile(null);
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message");
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const generateShippingLabel = () => {
    if (!orderDetails?.shippingInfo) return;
    
    // Create a simple shipping label PDF (in real implementation, this would generate an actual PDF)
    const shippingLabelContent = `
      SHIPPING LABEL
      
      From:
      Your Company Name
      Company Address
      City, State ZIP
      
      To:
      ${orderDetails.shippingInfo.firstName} ${orderDetails.shippingInfo.lastName}
      ${orderDetails.shippingInfo.address}
      ${orderDetails.shippingInfo.city}, ${orderDetails.shippingInfo.state} ${orderDetails.shippingInfo.zipCode}
      ${orderDetails.shippingInfo.country}
      
      Order ID: ${orderDetails.id}
      Return Reason: ${orderDetails.refundReason || "Customer requested refund"}
    `;
    
    // Create and download the file
    const blob = new Blob([shippingLabelContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shipping-label-${orderDetails.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading refund support chat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6">
            <p className="text-muted-foreground mb-4">Order not found</p>
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-6xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Refund Support Chat</h1>
              <p className="text-muted-foreground">Order #{orderDetails.id}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={generateShippingLabel} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Generate Shipping Label
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Details Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Order Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Customer</Label>
                  <p className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {orderDetails.userName}
                  </p>
                  <p className="text-sm text-muted-foreground">{orderDetails.userEmail}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Product</Label>
                  <p className="mt-1">{orderDetails.productName}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Amount</Label>
                  <p className="flex items-center gap-2 mt-1">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    ${orderDetails.totalAmount.toFixed(2)}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Order Date</Label>
                  <p className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {orderDetails.createdAt.toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline">{orderDetails.status}</Badge>
                    <Badge variant="outline">{orderDetails.refundStatus}</Badge>
                  </div>
                </div>

                {orderDetails.shippingInfo && (
                  <div>
                    <Label className="text-sm font-medium">Shipping Address</Label>
                    <div className="flex items-start gap-2 mt-1">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="text-sm">
                        <p>{orderDetails.shippingInfo.firstName} {orderDetails.shippingInfo.lastName}</p>
                        <p>{orderDetails.shippingInfo.address}</p>
                        <p>{orderDetails.shippingInfo.city}, {orderDetails.shippingInfo.state} {orderDetails.shippingInfo.zipCode}</p>
                        <p>{orderDetails.shippingInfo.country}</p>
                      </div>
                    </div>
                  </div>
                )}

                {orderDetails.refundReason && (
                  <div>
                    <Label className="text-sm font-medium">Refund Reason</Label>
                    <p className="mt-1 text-sm">{orderDetails.refundReason}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

                     {/* Chat Area */}
           <div className="lg:col-span-2">
             <Card className="h-[600px] flex flex-col overflow-hidden">
               <CardHeader className="border-b flex-shrink-0">
                 <CardTitle>Chat with Customer</CardTitle>
               </CardHeader>
               
               <CardContent className="flex-1 flex flex-col p-0 min-h-0">
                 {/* Messages */}
                 <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                                             <div
                         key={message.id}
                         className={`flex ${
                           message.senderId === user?.uid ? "justify-end" : "justify-start"
                         }`}
                       >
                         <div
                           className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                             message.senderId === user?.uid
                               ? "bg-primary text-primary-foreground"
                               : "bg-muted text-foreground"
                           }`}
                         >
                                                     <p className="text-xs font-semibold opacity-80 mb-1">
                             {message.senderId === user?.uid ? (isAdmin ? "Refund Support" : (user.displayName || user.email || "Customer")) : message.senderName}
                           </p>
                          <p className="text-sm">{message.text}</p>
                          
                                                     {/* File Attachments */}
                           {message.attachments && message.attachments.length > 0 && (
                             <div className="mt-2 space-y-1">
                               {message.attachments.map((attachment, index) => (
                                 <div key={index} className="flex items-center gap-2 p-2 bg-background/50 rounded-md border border-border/50">
                                   <FileText className="h-3 w-3 text-muted-foreground" />
                                   <a
                                     href={attachment.url}
                                     download={attachment.name}
                                     className="text-xs font-medium hover:underline"
                                   >
                                     {attachment.name}
                                   </a>
                                   <span className="text-xs text-muted-foreground">
                                     ({attachment.type})
                                   </span>
                                 </div>
                               ))}
                             </div>
                           )}
                          
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(message.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                                 {/* Message Input */}
                 <div className="border-t p-4 flex-shrink-0">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="Type your message here..."
                        className="min-h-[60px] resize-none"
                        rows={2}
                      />
                      
                                             {/* File Upload */}
                       <div className="flex items-center gap-2 mt-2">
                         <Input
                           type="file"
                           onChange={handleFileSelect}
                           className="hidden"
                           id="file-upload"
                           accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                         />
                         <Label 
                           htmlFor="file-upload" 
                           className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded-md border border-border transition-colors"
                         >
                           <Upload className="h-4 w-4" />
                           <span>Attach File</span>
                         </Label>
                         {selectedFile && (
                           <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-md border border-primary/20">
                             <FileText className="h-4 w-4" />
                             <span className="text-sm font-medium">{selectedFile.name}</span>
                             <Button
                               type="button"
                               variant="ghost"
                               size="sm"
                               className="h-4 w-4 p-0 hover:bg-primary/20"
                               onClick={() => setSelectedFile(null)}
                             >
                               <X className="h-3 w-3" />
                             </Button>
                           </div>
                         )}
                       </div>
                    </div>
                    
                    <Button
                      onClick={handleSendMessage}
                      size="lg"
                      className="px-4"
                      disabled={!newMessage.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundSupportChat; 