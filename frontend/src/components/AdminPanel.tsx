// src/pages/AdminPanel.jsx
import { useState, useEffect } from "react";
import {
  collection,
  query,
  getDocs,
  doc,
  updateDoc,
  orderBy,
  startAt,
  endAt,
  onSnapshot,
  where,
} from "firebase/firestore";
import { db } from "../firebase"; // Ensure this path is correct
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, Search, UserCheck, UserX, AlertCircle, Mail, Gift, TestTube, Users, Store, ArrowLeft, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import AdminEmailMarketing from "./AdminEmailMarketing";

// Define UserProfile interface for clarity
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  roles: string[];
}

// Define DiscountEmail interface
interface DiscountEmail {
  id: string;
  email: string;
  goal: string;
  discountPercentage: number;
  timestamp: any;
  ipAddress: string;
  userAgent: string;
  source: string;
}

interface AdminPanelProps {
  userRoles: string[]; // Pass the current user's roles to this component
}

const AdminPanel: React.FC<AdminPanelProps> = ({ userRoles }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // State for the confirmation modal
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [selectedUserForRoleChange, setSelectedUserForRoleChange] =
    useState<UserProfile | null>(null);
  const [newRoleForSelectedUser, setNewRoleForSelectedUser] = useState<
    string | null
  >(null);

  // State for discount emails
  const [discountEmails, setDiscountEmails] = useState<DiscountEmail[]>([]);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [showTestPopup, setShowTestPopup] = useState(false);
  
  // State for active tab
  const [activeTab, setActiveTab] = useState("users");

  // Check if the current user has admin privileges
  const isAdmin = userRoles.includes("admin");

  const fetchUsers = async (search = "") => {
    setIsLoading(true);
    setMessage(null);
    try {
      const usersRef = collection(db, "users");
      let q;

      if (search.trim() === "") {
        // If no search term, fetch all users (or a limited number for large databases)
        q = query(usersRef, orderBy("email"));
      } else {
        // Case-insensitive search by email or display name
        const lowerCaseSearch = search.toLowerCase();
        q = query(
          usersRef,
          orderBy("email"),
          startAt(lowerCaseSearch),
          endAt(lowerCaseSearch + "\uf8ff") // Unicode character to match prefix
        );
      }

      const querySnapshot = await getDocs(q);
      const fetchedUsers: UserProfile[] = [];
      querySnapshot.forEach((doc) => {
        // Directly cast doc.data() to UserProfile, assuming its shape matches
        // doc.exists() is implicitly true within forEach on querySnapshot
        const userDocData = doc.data() as UserProfile;
        fetchedUsers.push({ uid: doc.id, ...userDocData });
      });
      setUsers(fetchedUsers);
    } catch (err) {
      console.error("Error fetching users:", err);
      setMessage({
        type: "error",
        text: "Failed to fetch users. Check console for details.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch discount emails
  const fetchDiscountEmails = async () => {
    if (!isAdmin) return;
    
    setIsLoadingEmails(true);
    try {
      const emailsRef = collection(db, "discountEmails");
      const q = query(emailsRef, orderBy("timestamp", "desc"));
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const emails: DiscountEmail[] = [];
        querySnapshot.forEach((doc) => {
          emails.push({ id: doc.id, ...doc.data() } as DiscountEmail);
        });
        setDiscountEmails(emails);
        setIsLoadingEmails(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error("Error fetching discount emails:", error);
      setIsLoadingEmails(false);
    }
  };

  // Test popup functionality
  const handleTestPopup = () => {
    // Clear any existing discount data to allow popup to show
    localStorage.removeItem('wellnessDiscountApplied');
    localStorage.removeItem('wellnessDiscountUsed');
    localStorage.removeItem('wellnessDiscountPercentage');
    localStorage.removeItem('wellnessGoal');
    localStorage.removeItem('discountAppliedAt');
    localStorage.removeItem('wellnessEmail');
    localStorage.removeItem('usedDiscountCodes'); // Clear used discount codes
    
    // Set a flag to immediately show popup on store page
    localStorage.setItem('adminTestPopup', 'true');
    setShowTestPopup(true);
    
    // Show success message
    setMessage({
      type: "success",
      text: "Popup test mode activated! The popup will now show on the store page. Navigate to the store to see it immediately.",
    });
  };

  // Navigation functions
  const handleGoToStore = () => {
    navigate('/store');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  // Clear all discount-related storage
  const handleClearStorage = () => {
    localStorage.removeItem('wellnessDiscountApplied');
    localStorage.removeItem('wellnessDiscountUsed');
    localStorage.removeItem('wellnessDiscountPercentage');
    localStorage.removeItem('wellnessGoal');
    localStorage.removeItem('discountAppliedAt');
    localStorage.removeItem('wellnessEmail');
    localStorage.removeItem('adminTestPopup');
    localStorage.removeItem('usedDiscountCodes'); // Clear used discount codes
    
    setMessage({
      type: "success",
      text: "All discount-related storage cleared. The popup will show again on the store page.",
    });
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchDiscountEmails();
    } else {
      setMessage({
        type: "error",
        text: "You do not have administrative privileges to view this page.",
      });
    }
  }, [isAdmin]); // Re-fetch if admin status changes (though typically static after login)

  const handleSearch = () => {
    fetchUsers(searchTerm);
  };

  const openConfirmationModal = (user: UserProfile, role: string) => {
    setSelectedUserForRoleChange(user);
    setNewRoleForSelectedUser(role);
    setShowConfirmationModal(true);
  };

  const closeConfirmationModal = () => {
    setShowConfirmationModal(false);
    setSelectedUserForRoleChange(null);
    setNewRoleForSelectedUser(null);
  };

  const confirmRoleChange = async () => {
    if (!selectedUserForRoleChange || !newRoleForSelectedUser) return;

    setIsLoading(true);
    setMessage(null);
    try {
      const userDocRef = doc(db, "users", selectedUserForRoleChange.uid);
      await updateDoc(userDocRef, {
        roles: [newRoleForSelectedUser], // Set the new role. This assumes single role for simplicity.
        // For multiple roles, you'd merge: [...existingRoles, newRole]
      });
      setMessage({
        type: "success",
        text: `Successfully changed ${selectedUserForRoleChange.email}'s role to ${newRoleForSelectedUser}.`,
      });
      closeConfirmationModal();
      fetchUsers(searchTerm); // Refresh the user list
    } catch (err) {
      console.error("Error changing user role:", err);
      setMessage({
        type: "error",
        text: "Failed to change role. Check console and security rules.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <Card className="w-full max-w-md text-center shadow-premium rounded-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-muted-foreground">
              You do not have the necessary permissions to access this
              administrative panel.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 pt-24">
      {" "}
      {/* Added pt-24 for navbar spacing */}
      <div className="container mx-auto max-w-4xl">
        {/* Navigation Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={handleGoBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <Button
            onClick={handleGoToStore}
            className="flex items-center gap-2 bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent text-accent-foreground"
          >
            <Store className="h-4 w-4" />
            Go to Store
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-primary">Admin Panel</h1>
          {isAdmin && (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleClearStorage}
                className="flex items-center gap-2"
              >
                <AlertCircle className="h-4 w-4" />
                Clear Storage
              </Button>
              <Button
                onClick={handleTestPopup}
                className="bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent text-accent-foreground"
              >
                <TestTube className="mr-2 h-4 w-4" />
                Test Discount Popup
              </Button>
            </div>
          )}
        </div>

        {/* Success/Error Message */}
        {message && (
          <div className={`mt-4 p-4 rounded-lg ${
            message.type === "success" 
              ? "bg-green-100 border border-green-400 text-green-700" 
              : "bg-red-100 border border-red-400 text-red-700"
          }`}>
            {message.text}
          </div>
        )}

                {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="emails" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Marketing
            </TabsTrigger>
            <TabsTrigger value="discounts" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Discount Emails
            </TabsTrigger>
          </TabsList>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card className="shadow-premium rounded-xl">
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-6">
                  <Input
                    placeholder="Search users by email or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    className="flex-1"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSearch}
                    disabled={isLoading}
                    className="rounded-md"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    <span className="ml-2">Search</span>
                  </Button>
                </div>

                {message && (
                  <div
                    className={`p-4 rounded-lg mb-6 ${
                      message.type === "success"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {message.text}
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                        >
                          Email
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                        >
                          Display Name
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                        >
                          Roles
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-background divide-y divide-border">
                      {users.map((user) => (
                        <tr key={user.uid}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {user.displayName || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {user.roles.join(", ") || "No Roles"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {user.roles.includes("team_member") ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  openConfirmationModal(user, "customer")
                                }
                                disabled={
                                  isLoading || user.roles.includes("admin")
                                } // Prevent demoting admin
                                className="rounded-md mr-2"
                                >
                                <UserX className="h-4 w-4 mr-1" /> Demote to
                                Customer
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  openConfirmationModal(user, "team_member")
                                }
                                disabled={isLoading}
                                className="rounded-md mr-2"
                                >
                                <UserCheck className="h-4 w-4 mr-1" /> Make Team
                                Member
                              </Button>
                            )}
                            {/* Optional: Add a button to make them admin (with extreme caution) */}
                            {!user.roles.includes("admin") && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  openConfirmationModal(user, "admin")
                                }
                                disabled={isLoading}
                                className="rounded-md"
                                >
                                Make Admin
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Marketing Tab */}
          <TabsContent value="emails" className="space-y-6">
            <AdminEmailMarketing />
          </TabsContent>

          {/* Discount Emails Tab */}
          <TabsContent value="discounts" className="space-y-6">
            <Card className="shadow-premium rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-accent" />
                  Discount Email Collection ({discountEmails.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingEmails ? (
                  <div className="text-center p-4 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading emails...
                  </div>
                ) : discountEmails.length === 0 ? (
                  <div className="text-center p-4 text-muted-foreground">
                    No discount emails collected yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Goal
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Discount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Source
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-background divide-y divide-border">
                        {discountEmails.map((email) => (
                          <tr key={email.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                              {email.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                              {email.goal}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                              <Badge variant="secondary" className="bg-accent/20 text-accent">
                                {email.discountPercentage}% OFF
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                              {email.timestamp?.toDate ? 
                                email.timestamp.toDate().toLocaleDateString() : 
                                'N/A'
                              }
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                              {email.source}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      {/* Confirmation Modal */}
      <Dialog
        open={showConfirmationModal}
        onOpenChange={setShowConfirmationModal}
      >
        <DialogContent className="sm:max-w-[425px] rounded-lg shadow-premium">
          <DialogHeader>
            <DialogTitle>Confirm Role Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to change the role for{" "}
              <span className="font-semibold text-primary">
                {selectedUserForRoleChange?.email}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-primary">
                {newRoleForSelectedUser}
              </span>
              ? This action will affect their access privileges.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={closeConfirmationModal}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={confirmRoleChange} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;
