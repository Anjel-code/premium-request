// src/pages/TeamChat.tsx
import React, { useState, useEffect, useRef } from "react";
// We no longer need these imports from firebase as we use the global instances
// import { initializeApp } from "firebase/app";
// import { getAuth, ... } from "firebase/auth";
import {
  doc,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Send,
  LogOut,
  Users,
  PlusCircle,
  Loader2,
  Bot,
  LayoutDashboard,
} from "lucide-react";
import { auth, db } from "../firebase"; // Import global auth and db instances
import { signOut, User as FirebaseUser } from "firebase/auth"; // Import signOut and User type
import { Navigate, useNavigate } from "react-router-dom";
import Dashboard from "./Dashboard";

// Declare global variables for TypeScript (no longer needed here, but kept for context if other files use them)
// declare const __app_id: string;
// declare const __firebase_config: string;
// declare const __initial_auth_token: string;

// Define interfaces for data structures
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  roles: string[];
  teamId: string | null;
}

interface Team {
  id: string;
  name: string;
  memberIds: string[];
  adminId: string;
  createdAt: Date;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
}

// Define the props for the component
interface TeamChatProps {
  user: FirebaseUser | null;
  appId: string;
}

const TeamChat: React.FC<TeamChatProps> = ({ user, appId }) => {
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false); // Local loading state for chat actions
  const [error, setError] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
  const [joinTeamId, setJoinTeamId] = useState("");
  const [showTeamModal, setShowTeamModal] = useState(false);
  const navigate = useNavigate();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Fetch Team Data and Chat Messages ---
  useEffect(() => {
    // Only proceed if a user and a valid appId exist
    if (!user || !appId) {
      setCurrentTeam(null);
      setMessages([]);
      return;
    }

    // Listener for user profile changes (e.g., teamId update)
    const userProfileRef = doc(db, `users`, user.uid);
    const unsubscribeUserProfile = onSnapshot(userProfileRef, (docSnap) => {
      if (docSnap.exists()) {
        const updatedProfile = docSnap.data() as UserProfile;
        const teamId = updatedProfile.teamId;

        if (teamId) {
          const teamRef = doc(
            db,
            `artifacts/${appId}/public/data/teams/${teamId}`
          );
          const unsubscribeTeam = onSnapshot(teamRef, (teamSnap) => {
            if (teamSnap.exists()) {
              setCurrentTeam({ id: teamSnap.id, ...teamSnap.data() } as Team);
            } else {
              setCurrentTeam(null);
            }
          });
          return () => unsubscribeTeam();
        } else {
          setCurrentTeam(null);
        }
      } else {
        // Handle case where user profile might not exist (e.g., new user)
        setCurrentTeam(null);
      }
    });

    return () => unsubscribeUserProfile();
  }, [user, appId]);

  useEffect(() => {
    if (!currentTeam) {
      setMessages([]); // Clear messages if there is no team
      return;
    }

    // Listener for chat messages
    const messagesRef = collection(
      db,
      `artifacts/${appId}/public/data/teams/${currentTeam.id}/messages`
    );
    const q = query(messagesRef, orderBy("timestamp"));
    const unsubscribeMessages = onSnapshot(
      q,
      (snapshot) => {
        const fetchedMessages: ChatMessage[] = [];
        snapshot.forEach((doc) => {
          fetchedMessages.push({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp.toDate(),
          } as ChatMessage);
        });
        setMessages(fetchedMessages);
      },
      (e) => {
        console.error("Error fetching messages:", e);
        setError("Failed to load messages.");
      }
    );

    return () => unsubscribeMessages();
  }, [currentTeam, appId]);

  // --- Scroll to bottom of chat ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- Authentication and Team Management Handlers ---
  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      // The onAuthStateChanged listener in App.jsx will handle state update
    } catch (e: any) {
      console.error("Sign out error:", e);
      setError(`Sign out failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!user || !appId || !teamName) return;
    try {
      setLoading(true);
      const teamsCollectionRef = collection(
        db,
        `artifacts/${appId}/public/data/teams`
      );
      const newTeamRef = await addDoc(teamsCollectionRef, {
        name: teamName,
        memberIds: [user.uid],
        adminId: user.uid,
        createdAt: new Date(),
      });
      const userProfileRef = doc(db, `users`, user.uid);
      await updateDoc(userProfileRef, { teamId: newTeamRef.id });
      setTeamName("");
      setShowTeamModal(false);
    } catch (e: any) {
      console.error("Error creating team:", e);
      setError(`Failed to create team: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async () => {
    if (!user || !appId || !joinTeamId) return;
    try {
      setLoading(true);
      const teamRef = doc(
        db,
        `artifacts/${appId}/public/data/teams/${joinTeamId}`
      );
      const teamSnap = await getDoc(teamRef);

      if (teamSnap.exists()) {
        const teamData = teamSnap.data();
        if (teamData?.memberIds.includes(user.uid)) {
          setError("You are already a member of this team.");
          return;
        }

        await updateDoc(teamRef, {
          memberIds: arrayUnion(user.uid),
        });
        const userProfileRef = doc(db, `users`, user.uid);
        await updateDoc(userProfileRef, { teamId: joinTeamId });
        setJoinTeamId("");
        setShowTeamModal(false);
      } else {
        setError("Team not found.");
      }
    } catch (e: any) {
      console.error("Error joining team:", e);
      setError(`Failed to join team: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveTeam = async () => {
    if (!user || !appId || !currentTeam) return;
    try {
      setLoading(true);
      const userProfileRef = doc(db, `users`, user.uid);
      await updateDoc(userProfileRef, { teamId: null });
      // The listener will automatically update the state
    } catch (e: any) {
      console.error("Error leaving team:", e);
      setError(`Failed to leave team: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !currentTeam || !newMessage.trim()) return;
    try {
      const messagesCollectionRef = collection(
        db,
        `artifacts/${appId}/public/data/teams/${currentTeam.id}/messages`
      );
      await addDoc(messagesCollectionRef, {
        senderId: user.uid,
        senderName: user.displayName || user.email,
        text: newMessage.trim(),
        timestamp: new Date(),
      });
      setNewMessage("");
    } catch (e: any) {
      console.error("Error sending message:", e);
      setError("Failed to send message.");
    }
  };

  // --- Render Logic ---
  // The parent App.jsx now handles the initial loading and authentication state,
  // so we can simplify the render logic here.
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">
          Please sign in to access the team chat.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar - now part of TeamChat */}
      <nav className="fixed top-0 left-0 w-full bg-white bg-opacity-90 backdrop-blur-sm z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-primary">Quibble</div>
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate("../dashboard")}>
              <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
            </Button>
            <Button
              onClick={handleSignOut}
              variant="ghost"
              className="rounded-md"
            >
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-4 px-6 flex-1 flex flex-col">
        <div className="container mx-auto max-w-4xl flex-1 flex flex-col">
          {/* Team Selection/Display */}
          <Card className="mb-6 shadow-premium rounded-xl">
            <CardHeader className="border-b border-border flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                {currentTeam ? `Team: ${currentTeam.name}` : "No Team Selected"}
              </CardTitle>
              <div>
                {!currentTeam ? (
                  <Button
                    onClick={() => setShowTeamModal(true)}
                    className="rounded-md"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" /> Manage Teams
                  </Button>
                ) : (
                  <Button
                    onClick={handleLeaveTeam}
                    variant="outline"
                    className="border-red-500 text-red-500 hover:bg-red-500/10 rounded-md"
                  >
                    Leave Team
                  </Button>
                )}
              </div>
            </CardHeader>
            {currentTeam && (
              <CardContent className="p-4 text-sm text-muted-foreground">
                <p>Members: {currentTeam.memberIds.length}</p>
              </CardContent>
            )}
          </Card>

          {/* Team Management Modal */}
          {showTeamModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md shadow-premium rounded-xl">
                <CardHeader>
                  <CardTitle className="text-center">Manage Teams</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Create New Team</h4>
                    <Input
                      placeholder="New Team Name"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="rounded-md mb-2"
                    />
                    <Button
                      onClick={handleCreateTeam}
                      className="w-full rounded-md"
                      disabled={loading}
                    >
                      Create Team
                    </Button>
                  </div>
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">Join Existing Team</h4>
                    <Input
                      placeholder="Team ID"
                      value={joinTeamId}
                      onChange={(e) => setJoinTeamId(e.target.value)}
                      className="rounded-md mb-2"
                    />
                    <Button
                      onClick={handleJoinTeam}
                      variant="outline"
                      className="w-full border-primary text-primary rounded-md"
                      disabled={loading}
                    >
                      Join Team
                    </Button>
                  </div>
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  <Button
                    onClick={() => setShowTeamModal(false)}
                    variant="ghost"
                    className="w-full rounded-md"
                  >
                    Close
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Chat Window */}
          {currentTeam ? (
            <Card className="flex-1 border-0 shadow-premium rounded-xl flex flex-col">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-accent" />
                  Team Chat
                </CardTitle>
              </CardHeader>
              <CardContent
                className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col"
                ref={messagesEndRef}
              >
                {messages.map((message) => (
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
                      <p className="text-xs font-semibold opacity-80 mb-1">
                        {message.senderName}
                      </p>
                      <p className="text-sm">{message.text}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>

              <div className="border-t border-border p-6">
                <div className="flex gap-2">
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
                    className="flex-1 min-h-[60px] resize-none rounded-md"
                    rows={2}
                    disabled={loading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    size="lg"
                    className="bg-accent hover:bg-accent/90 text-accent-foreground px-4 rounded-md"
                    disabled={!newMessage.trim() || loading}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <p>Please create or join a team to start chatting.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamChat;
