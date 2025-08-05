// src/pages/TeamChat.tsx
import React, { useState, useEffect, useRef } from "react";
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
  deleteDoc,
  arrayUnion,
  arrayRemove,
  getDocs,
  where,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  LogOut,
  Users,
  PlusCircle,
  Loader2,
  Bot,
  LayoutDashboard,
  Crown,
  UserPlus,
  UserMinus,
  Search,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { auth, db } from "../firebase";
import { signOut, User as FirebaseUser } from "firebase/auth";
import { Navigate, useNavigate } from "react-router-dom";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
  const [joinTeamId, setJoinTeamId] = useState("");
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [showAllTeams, setShowAllTeams] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const navigate = useNavigate();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch user roles
  useEffect(() => {
    if (!user || !db) return;

    const userProfileRef = doc(db, "users", user.uid);
    const unsubscribeUserProfile = onSnapshot(userProfileRef, (docSnap) => {
      if (docSnap.exists()) {
        const profileData = docSnap.data() as UserProfile;
        setUserRoles(profileData.roles || []);
      }
    });

    return () => unsubscribeUserProfile();
  }, [user]);

  // Fetch all teams for admins
  useEffect(() => {
    if (!user || !appId || !userRoles.includes("admin")) return;

    const teamsRef = collection(db, `artifacts/${appId}/public/data/teams`);
    const unsubscribeTeams = onSnapshot(teamsRef, (snapshot) => {
      const teams: Team[] = [];
      snapshot.forEach((doc) => {
        teams.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        } as Team);
      });
      setAllTeams(teams);
    });

    return () => unsubscribeTeams();
  }, [user, appId, userRoles]);

  // Fetch current team data
  useEffect(() => {
    if (!user || !appId) {
      setCurrentTeam(null);
      setMessages([]);
      return;
    }

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
        setCurrentTeam(null);
      }
    });

    return () => unsubscribeUserProfile();
  }, [user, appId]);

  // Fetch messages for current team
  useEffect(() => {
    if (!currentTeam) {
      setMessages([]);
      return;
    }

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

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isAdmin = userRoles.includes("admin");
  const isTeamMember = userRoles.includes("team_member");

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut(auth);
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
      setError(null);
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
      setSuccess("Team created successfully!");
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
      setError(null);
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
        setSuccess("Successfully joined team!");
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

  const handleJoinTeamById = async (teamId: string) => {
    if (!user || !appId) return;
    try {
      setLoading(true);
      setError(null);
      const teamRef = doc(db, `artifacts/${appId}/public/data/teams/${teamId}`);
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
        await updateDoc(userProfileRef, { teamId });
        setSuccess("Successfully joined team!");
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
      setError(null);
      const userProfileRef = doc(db, `users`, user.uid);
      await updateDoc(userProfileRef, { teamId: null });
      setSuccess("Successfully left team!");
    } catch (e: any) {
      console.error("Error leaving team:", e);
      setError(`Failed to leave team: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromTeam = async (teamId: string, memberId: string) => {
    if (!appId) return;
    try {
      setLoading(true);
      setError(null);
      const teamRef = doc(db, `artifacts/${appId}/public/data/teams/${teamId}`);
      await updateDoc(teamRef, {
        memberIds: arrayRemove(memberId),
      });
      setSuccess("Member removed from team!");
    } catch (e: any) {
      console.error("Error removing member:", e);
      setError(`Failed to remove member: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!appId || !teamToDelete) return;
    try {
      setLoading(true);
      setError(null);
      const teamRef = doc(
        db,
        `artifacts/${appId}/public/data/teams/${teamToDelete.id}`
      );
      await deleteDoc(teamRef);
      setSuccess("Team deleted successfully!");
      setShowDeleteConfirm(false);
      setTeamToDelete(null);
    } catch (e: any) {
      console.error("Error deleting team:", e);
      setError(`Failed to delete team: ${e.message}`);
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

  const formatDate = (date: Date | any) => {
    if (!date) return "Unknown";

    // Handle Firestore Timestamp
    if (date && typeof date.toDate === "function") {
      return date.toDate().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }

    // Handle regular Date object or timestamp
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return "Invalid Date";

    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

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
      {/* Navbar */}
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
          {/* Error/Success Messages */}
          {error && (
            <Card className="mb-4 border-red-200 bg-red-50">
              <CardContent className="p-4">
                <p className="text-red-800">{error}</p>
              </CardContent>
            </Card>
          )}

          {success && (
            <Card className="mb-4 border-green-200 bg-green-50">
              <CardContent className="p-4">
                <p className="text-green-800">{success}</p>
              </CardContent>
            </Card>
          )}

          {/* Team Selection/Display */}
          <Card className="mb-6 shadow-premium rounded-xl">
            <CardHeader className="border-b border-border flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                {currentTeam ? (
                  <div className="flex flex-col">
                    <span>Team: {currentTeam.name}</span>
                    <span className="text-sm text-muted-foreground font-normal">
                      ID: {currentTeam.id}
                    </span>
                  </div>
                ) : (
                  "No Team Selected"
                )}
                {currentTeam && currentTeam.adminId === user.uid && (
                  <Badge variant="outline" className="ml-2">
                    <Crown className="h-3 w-3 mr-1" />
                    Admin
                  </Badge>
                )}
              </CardTitle>
              <div className="flex gap-2">
                {isAdmin && (
                  <Button
                    onClick={() => setShowAllTeams(!showAllTeams)}
                    variant="outline"
                    className="rounded-md"
                  >
                    {showAllTeams ? (
                      <EyeOff className="h-4 w-4 mr-2" />
                    ) : (
                      <Eye className="h-4 w-4 mr-2" />
                    )}
                    {showAllTeams ? "Hide" : "View"} All Teams
                  </Button>
                )}
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
                    disabled={loading}
                  >
                    Leave Team
                  </Button>
                )}
              </div>
            </CardHeader>
            {currentTeam && (
              <CardContent className="p-4 text-sm text-muted-foreground">
                <p>Members: {currentTeam.memberIds.length}</p>
                <p>Created: {formatDate(currentTeam.createdAt)}</p>
              </CardContent>
            )}
          </Card>

          {/* All Teams View (Admin Only) */}
          {isAdmin && showAllTeams && (
            <Card className="mb-6 shadow-premium rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  All Teams (Admin View)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {allTeams.length === 0 ? (
                  <p className="text-muted-foreground">No teams found.</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {allTeams.map((team) => (
                      <Card key={team.id} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex flex-col">
                            <h3 className="font-semibold">{team.name}</h3>
                            <span className="text-xs text-muted-foreground">
                              ID: {team.id}
                            </span>
                          </div>
                          <Badge variant="outline">
                            {team.memberIds.length} members
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Created: {formatDate(team.createdAt)}
                        </p>
                        <div className="flex gap-2">
                          {!team.memberIds.includes(user.uid) ? (
                            <Button
                              onClick={() => handleJoinTeamById(team.id)}
                              size="sm"
                              className="flex-1"
                              disabled={loading}
                            >
                              <UserPlus className="h-3 w-3 mr-1" />
                              Join
                            </Button>
                          ) : (
                            <>
                              <Button
                                onClick={() => {
                                  // Set the current team to this team
                                  const userProfileRef = doc(
                                    db,
                                    `users`,
                                    user.uid
                                  );
                                  updateDoc(userProfileRef, {
                                    teamId: team.id,
                                  });
                                }}
                                size="sm"
                                className="flex-1"
                                disabled={loading}
                              >
                                <Bot className="h-3 w-3 mr-1" />
                                Join Chat
                              </Button>
                              <Button
                                onClick={() =>
                                  handleRemoveFromTeam(team.id, user.uid)
                                }
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                disabled={loading}
                              >
                                <UserMinus className="h-3 w-3 mr-1" />
                                Leave
                              </Button>
                            </>
                          )}
                          {isAdmin && (
                            <Button
                              onClick={() => {
                                setTeamToDelete(team);
                                setShowDeleteConfirm(true);
                              }}
                              size="sm"
                              variant="destructive"
                              className="flex-1"
                              disabled={loading}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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
                      disabled={loading || !teamName.trim()}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <PlusCircle className="h-4 w-4 mr-2" />
                      )}
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
                      disabled={loading || !joinTeamId.trim()}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <UserPlus className="h-4 w-4 mr-2" />
                      )}
                      Join Team
                    </Button>
                  </div>
                  <Button
                    onClick={() => {
                      setShowTeamModal(false);
                      setError(null);
                      setSuccess(null);
                    }}
                    variant="ghost"
                    className="w-full rounded-md"
                  >
                    Close
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Delete Team Confirmation Modal */}
          {showDeleteConfirm && teamToDelete && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md shadow-premium rounded-xl">
                <CardHeader>
                  <CardTitle className="text-center flex items-center justify-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    Delete Team
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <p className="text-lg font-semibold mb-2">
                      Are you sure you want to delete "{teamToDelete.name}"?
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      This action cannot be undone. All team messages and data
                      will be permanently deleted.
                    </p>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-red-800 font-medium">
                        ⚠️ Warning: This will permanently delete the team and
                        all its messages.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleDeleteTeam}
                      variant="destructive"
                      className="flex-1"
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Yes, Delete Team
                    </Button>
                    <Button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setTeamToDelete(null);
                      }}
                      variant="outline"
                      className="flex-1"
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  </div>
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
