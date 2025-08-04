// src/pages/AdminPanel.jsx
import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  getDocs,
  doc,
  updateDoc,
  orderBy,
  startAt,
  endAt,
} from "firebase/firestore";
import { db } from "../firebase"; // Ensure this path is correct
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Search, UserCheck, UserX, AlertCircle } from "lucide-react";

// Define UserProfile interface for clarity
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  roles: string[];
}

interface AdminPanelProps {
  userRoles: string[]; // Pass the current user's roles to this component
}

const AdminPanel: React.FC<AdminPanelProps> = ({ userRoles }) => {
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

  useEffect(() => {
    if (isAdmin) {
      // Only fetch users if the current user is an admin
      fetchUsers();
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
        <h1 className="text-4xl font-bold text-primary mb-8 text-center">
          Admin Panel: User Management
        </h1>

        <Card className="shadow-premium rounded-xl mb-8">
          <CardHeader>
            <CardTitle>Search Users</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Input
              type="text"
              placeholder="Search by email or display name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              className="flex-1 rounded-md"
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
          </CardContent>
        </Card>

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

        <Card className="shadow-premium rounded-xl">
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && users.length === 0 ? (
              <div className="text-center p-4 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading
                users...
              </div>
            ) : users.length === 0 ? (
              <div className="text-center p-4 text-muted-foreground">
                No users found.
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>
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
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
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
