// src/pages/DashboardSupport.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  getDoc,
  where,
  updateDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Send,
  Loader2,
  MessageSquare,
  User,
  AlertCircle,
  Clock,
  Mail,
  ChevronRight,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { createSupportNotification } from "../lib/notificationUtils";

// Define interfaces
interface ChatMessage {
  id?: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date | null;
  isRead?: boolean;
}

interface SupportChat {
  id: string;
  customerUid: string;
  customerName: string;
  customerEmail: string;
  createdAt: Date;
  lastMessageTime: Date;
  lastMessageText: string;
  lastMessageSender: string;
  unreadCount: number;
  status: "open" | "closed";
}

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  roles: string[];
  photoURL?: string;
}

interface DashboardSupportProps {
  user: UserProfile | null;
  appId: string;
}

const DashboardSupport: React.FC<DashboardSupportProps> = ({ user, appId }) => {
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [supportChats, setSupportChats] = useState<SupportChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<SupportChat | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch user roles
  useEffect(() => {
    if (!user || !db) {
      setLoading(false);
      return;
    }

    const fetchUserRole = async () => {
      try {
        const userProfileRef = doc(db, `users`, user.uid);
        const userSnap = await getDoc(userProfileRef);
        if (userSnap.exists()) {
          const profileData = userSnap.data() as UserProfile;
          setUserRoles(profileData.roles || []);
        } else {
          setUserRoles(["customer"]);
        }
      } catch (err) {
        console.error("Error fetching user role:", err);
        setUserRoles([]);
        setError("Failed to load user permissions.");
      } finally {
        setLoading(false);
      }
    };
    fetchUserRole();
  }, [user, db]);

  const isAdminOrTeam =
    userRoles.includes("admin") || userRoles.includes("team_member");
  const isCustomer = !isAdminOrTeam;

  // For customers: Get or create their support chat
  useEffect(() => {
    console.log("Customer chat effect:", {
      user: user?.uid,
      isCustomer,
      db: !!db,
    });

    if (!user) {
      console.log("No user available");
      return;
    }

    if (!db) {
      console.log("No database connection");
      return;
    }

    if (!isCustomer) {
      console.log("Not a customer, skipping customer chat logic");
      return;
    }

    console.log("Setting up customer chat listener for user:", user.uid);

    const chatsCollectionRef = collection(
      db,
      `artifacts/${appId}/public/data/supportChats`
    );
    const q = query(chatsCollectionRef, where("customerUid", "==", user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log(
          "Customer chat snapshot:",
          snapshot.docs.length,
          "chats found"
        );

        if (snapshot.empty) {
          console.log("No existing chat found, creating new chat");
          // Create new chat for customer
          createChatForCustomer(user.uid, user.displayName, user.email);
        } else {
          const docSnap = snapshot.docs[0];
          console.log("Found existing chat:", docSnap.id);
          setChatId(docSnap.id);
          setSelectedChat({
            id: docSnap.id,
            ...docSnap.data(),
            createdAt: docSnap.data().createdAt?.toDate() || new Date(),
            lastMessageTime:
              docSnap.data().lastMessageTime?.toDate() || new Date(),
          } as SupportChat);
        }
      },
      (error) => {
        console.error("Error in customer chat listener:", error);
        setError(`Failed to load customer chat: ${error.message}`);
      }
    );

    return () => {
      console.log("Cleaning up customer chat listener");
      unsubscribe();
    };
  }, [user, db, isCustomer, appId]);

  // For admins/team: Get all support chats
  useEffect(() => {
    if (!user || !db || !isAdminOrTeam) return;

    const chatsCollectionRef = collection(
      db,
      `artifacts/${appId}/public/data/supportChats`
    );
    const q = query(chatsCollectionRef, orderBy("lastMessageTime", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        lastMessageTime: doc.data().lastMessageTime?.toDate() || new Date(),
      })) as SupportChat[];

      setSupportChats(chats);

      // Auto-select first chat if none selected
      if (!selectedChat && chats.length > 0) {
        setSelectedChat(chats[0]);
        setChatId(chats[0].id);
      }
    });

    return () => unsubscribe();
  }, [user, db, isAdminOrTeam, appId, selectedChat]);

  // Fetch messages for selected chat
  useEffect(() => {
    console.log("Fetching messages for chatId:", chatId);

    if (!chatId) {
      console.log("No chatId provided");
      return;
    }

    if (!db) {
      console.log("No database connection");
      return;
    }

    const messagesCollectionRef = collection(
      db,
      `artifacts/${appId}/public/data/supportChats/${chatId}/messages`
    );
    const q = query(messagesCollectionRef, orderBy("timestamp", "asc"));

    console.log("Setting up message listener for chat:", chatId);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log(
          "Received message snapshot:",
          snapshot.docs.length,
          "messages"
        );

        const fetchedMessages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date(),
        })) as ChatMessage[];

        console.log("Processed messages:", fetchedMessages);
        setMessages(fetchedMessages);

        // Mark messages as read if user is admin/team
        if (isAdminOrTeam) {
          markMessagesAsRead(chatId, fetchedMessages);
        }
      },
      (error) => {
        console.error("Error fetching messages:", error);
        setError(`Failed to fetch messages: ${error.message}`);
      }
    );

    return () => {
      console.log("Cleaning up message listener for chat:", chatId);
      unsubscribe();
    };
  }, [chatId, db, appId, isAdminOrTeam]);

  const createChatForCustomer = async (
    customerUid: string,
    displayName: string,
    email: string
  ) => {
    console.log("Creating chat for customer:", {
      customerUid,
      displayName,
      email,
    });

    if (!db) {
      console.log("No database connection");
      setError("Database connection not available.");
      return;
    }

    try {
      const supportChatsRef = collection(
        db,
        `artifacts/${appId}/public/data/supportChats`
      );

      const chatData = {
        customerUid: customerUid,
        customerName: displayName,
        customerEmail: email,
        createdAt: serverTimestamp(),
        lastMessageTime: serverTimestamp(),
        lastMessageText: "Chat created",
        lastMessageSender: "system",
        unreadCount: 0,
        status: "open",
      };

      console.log("Creating chat with data:", chatData);

      const newChatRef = await addDoc(supportChatsRef, chatData);
      console.log("Chat created successfully with ID:", newChatRef.id);

      setChatId(newChatRef.id);
      setError(null); // Clear any previous errors
    } catch (e) {
      console.error("Error creating chat: ", e);
      setError(
        `Failed to create support chat: ${
          e instanceof Error ? e.message : "Unknown error"
        }`
      );
    }
  };

  const markMessagesAsRead = async (
    chatId: string,
    messages: ChatMessage[]
  ) => {
    if (!db || !user || !isAdminOrTeam) return;

    try {
      // Only mark messages as read if they're from customers and not already read
      const unreadMessages = messages.filter(
        (msg) => (msg.isRead === undefined || !msg.isRead) && msg.senderId !== user.uid
      );

      if (unreadMessages.length === 0) return;

      for (const message of unreadMessages) {
        if (message.id) {
          try {
            const messageRef = doc(
              db,
              `artifacts/${appId}/public/data/supportChats/${chatId}/messages`,
              message.id
            );
            // Check if the message already has isRead field, if not, use setDoc with merge
            if (message.isRead === undefined) {
              await setDoc(messageRef, { isRead: true }, { merge: true });
            } else {
              await updateDoc(messageRef, { isRead: true });
            }
          } catch (updateError) {
            // Silently ignore individual message update errors
            console.warn("Failed to mark message as read:", message.id, updateError);
          }
        }
      }
    } catch (e) {
      console.error("Error marking messages as read:", e);
    }
  };

  const handleSendMessage = async () => {
    console.log("handleSendMessage called", { newMessage, user, chatId });

    if (!newMessage.trim()) {
      console.log("Message is empty");
      return;
    }

    if (!user) {
      console.log("No user");
      setError("You must be logged in to send messages.");
      return;
    }

    if (!chatId) {
      console.log("No chatId");
      setError("No chat selected.");
      return;
    }

    try {
      console.log("Sending message to chat:", chatId);

      const messagesCollectionRef = collection(
        db,
        `artifacts/${appId}/public/data/supportChats/${chatId}/messages`
      );

      const messageData = {
        senderId: user.uid,
        senderName: user.displayName || user.email,
        text: newMessage.trim(),
        timestamp: serverTimestamp(),
        isRead: false,
      };

      console.log("Message data:", messageData);

      const docRef = await addDoc(messagesCollectionRef, messageData);
      console.log("Message sent successfully, doc ID:", docRef.id);

      // Update chat metadata
      const chatRef = doc(
        db,
        `artifacts/${appId}/public/data/supportChats`,
        chatId
      );

      const updateData = {
        lastMessageTime: serverTimestamp(),
        lastMessageText: newMessage.trim(),
        lastMessageSender: user.displayName || user.email,
        unreadCount: isCustomer ? 0 : (selectedChat?.unreadCount || 0) + 1,
      };

      console.log("Updating chat metadata:", updateData);
      await updateDoc(chatRef, updateData);
      console.log("Chat metadata updated successfully");

      // Create notification for customer if message is from admin/team member
      if (isAdminOrTeam && selectedChat?.customerUid) {
        try {
          await createSupportNotification(
            appId,
            selectedChat.customerUid,
            user.displayName || user.email,
            newMessage.trim()
          );
          console.log("Support notification created successfully");
        } catch (notificationError) {
          console.warn("Failed to create support notification:", notificationError);
        }
      }

      setNewMessage("");
      setError(null); // Clear any previous errors
    } catch (e) {
      console.error("Error sending message:", e);
      setError(
        `Failed to send message: ${
          e instanceof Error ? e.message : "Unknown error"
        }`
      );
    }
  };

  const handleChatSelect = (chat: SupportChat) => {
    setSelectedChat(chat);
    setChatId(chat.id);
  };

  const filteredChats = supportChats.filter(
    (chat) =>
      chat.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading) {
    return (
      <DashboardLayout user={user} appId={appId}>
        <div className="min-h-[calc(100vh-100px)] flex items-center justify-center p-6">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="ml-4 text-primary">Loading support...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout user={user} appId={appId}>
        <div className="min-h-[calc(100vh-100px)] flex flex-col items-center justify-center p-6">
          <Card className="w-full max-w-md text-center shadow-premium rounded-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Error</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-muted-foreground">{error}</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Customer view - single chat interface
  if (isCustomer) {
    return (
      <DashboardLayout user={user} appId={appId}>
        <div className="container mx-auto max-w-4xl p-6">
          <Card className="shadow-premium rounded-xl flex flex-col h-[calc(100vh - 200px)]">
            <CardHeader className="border-b border-border p-4">
              <CardTitle className="text-xl font-bold flex items-center">
                <MessageSquare className="mr-2 h-5 w-5 text-primary" />
                Support Chat
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                We're here to help! Send us a message and we'll get back to you
                soon.
              </p>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No messages yet. Start the conversation!
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.senderId === user?.uid
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                          message.senderId === user?.uid
                            ? "bg-accent text-accent-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(
                            message.timestamp || Date.now()
                          ).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </CardContent>

            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message here..."
                  className="flex-1 min-h-[60px] resize-none rounded-md"
                  rows={2}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button
                  onClick={handleSendMessage}
                  className="rounded-md"
                  disabled={!newMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Admin/Team view - chat list and selected chat
  return (
    <DashboardLayout user={user} appId={appId}>
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Chat List */}
          <Card className="shadow-premium rounded-xl flex flex-col">
            <CardHeader className="border-b border-border p-4">
              <CardTitle className="text-lg font-bold flex items-center">
                <MessageSquare className="mr-2 h-5 w-5 text-primary" />
                Support Chats
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search chats..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-0">
              <div className="space-y-1">
                {filteredChats.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No support chats found
                    </p>
                  </div>
                ) : (
                  filteredChats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => handleChatSelect(chat)}
                      className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedChat?.id === chat.id
                          ? "bg-accent/20 border-r-2 border-accent"
                          : ""
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">
                              {chat.customerName}
                            </p>
                            {chat.unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {chat.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {chat.customerEmail}
                          </p>
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {chat.lastMessageText}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            {new Date(
                              chat.lastMessageTime
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="shadow-premium rounded-xl flex flex-col h-full">
              {selectedChat ? (
                <>
                  <CardHeader className="border-b border-border p-4">
                    <CardTitle className="text-lg font-bold flex items-center justify-between">
                      <div className="flex items-center">
                        <User className="mr-2 h-5 w-5 text-primary" />
                        {selectedChat.customerName}
                      </div>
                      <Badge
                        variant={
                          selectedChat.status === "open"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {selectedChat.status}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {selectedChat.customerEmail}
                    </p>
                  </CardHeader>

                  <CardContent className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-4">
                      {messages.length === 0 ? (
                        <div className="text-center py-8">
                          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">
                            No messages in this chat yet.
                          </p>
                        </div>
                      ) : (
                        messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${
                              message.senderId === user?.uid
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                                message.senderId === user?.uid
                                  ? "bg-accent text-accent-foreground"
                                  : "bg-muted text-foreground"
                              }`}
                            >
                              <p className="text-sm">{message.text}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {new Date(
                                  message.timestamp || Date.now()
                                ).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </CardContent>

                  <div className="p-4 border-t border-border">
                    <div className="flex gap-2">
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message here..."
                        className="flex-1 min-h-[60px] resize-none rounded-md"
                        rows={2}
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button
                        onClick={handleSendMessage}
                        className="rounded-md"
                        disabled={!newMessage.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Select a chat to start messaging
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardSupport;
