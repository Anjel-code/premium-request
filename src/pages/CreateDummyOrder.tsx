// src/pages/CreateDummyOrder.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, PlusCircle } from "lucide-react";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../firebase"; // Import db and auth

// Define the UserProfile interface (matching what's stored in Firestore)
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  roles: string[]; // Crucial for role-based access
  photoURL?: string; // Optional, if you store it
}

// Props for the CreateDummyOrder component
interface CreateDummyOrderProps {
  user: UserProfile | null;
  appId: string;
}

const CreateDummyOrder: React.FC<CreateDummyOrderProps> = ({ user, appId }) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user || !db) {
        setCheckingPermission(false);
        return;
      }

      try {
        const userProfileRef = doc(db, `users`, user.uid); // Assuming 'users' is a top-level collection
        const userSnap = await getDoc(userProfileRef);

        if (userSnap.exists()) {
          const userProfileData = userSnap.data() as UserProfile;
          if (
            userProfileData.roles &&
            (userProfileData.roles.includes("admin") ||
              userProfileData.roles.includes("team_member"))
          ) {
            setHasPermission(true);
          } else {
            setHasPermission(false);
          }
        } else {
          setHasPermission(false); // User profile not found, no permission
        }
      } catch (error) {
        console.error("Error checking user role:", error);
        setHasPermission(false); // Assume no permission on error
      } finally {
        setCheckingPermission(false);
      }
    };

    checkUserRole();
  }, [user, db]); // Re-run when user or db instance changes

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db || !appId || loading || !hasPermission) return;

    setLoading(true);
    try {
      const ordersCollectionRef = collection(
        db,
        `artifacts/${appId}/public/data/orders`
      );

      // Generate dummy data
      const dummyOrder = {
        userId: user.uid,
        userEmail: user.email || "dummy@example.com",
        userName: user.displayName || "Dummy User",
        conversation: [
          {
            text: `This is a dummy order created by ${
              user.displayName || user.email
            } for testing purposes.`,
            isBot: false,
            timestamp: new Date().toISOString(),
          },
          {
            text: `Product requested: ${title}. Summary: ${summary}`,
            isBot: true,
            timestamp: new Date().toISOString(),
          },
        ],
        summary: summary || `Dummy order: ${title}`,
        status: "pending", // Default status for new dummy orders
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ticketNumber: `TKT-DUMMY-${Date.now().toString().slice(-6)}`, // Unique dummy ticket number
        title: title,
        estimatedCompletion: null,
        budget: "N/A (Dummy)",
        progress: 0,
        lastUpdate: "Dummy order created for testing.",
        assignedTo: null,
        assignedDate: null,
        dismissedBy: null,
        dismissedDate: null,
      };

      await addDoc(ordersCollectionRef, dummyOrder);
      console.log("Dummy order added successfully!");
      setTitle("");
      setSummary("");
      navigate("/dashboard/orders"); // Redirect to dashboard orders page
    } catch (error) {
      console.error("Error adding dummy order:", error);
      alert("Failed to add dummy order. Check console for details."); // Using alert for quick feedback in this utility page
    } finally {
      setLoading(false);
    }
  };

  if (checkingPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="ml-4 text-primary">Checking permissions...</p>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 text-center">
        <Card className="w-full max-w-md shadow-premium rounded-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-red-500">
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You do not have the necessary permissions to create dummy orders.
              This feature is restricted to team members and administrators.
            </p>
            <Button
              onClick={() => navigate("/dashboard")}
              className="bg-primary text-primary-foreground"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-20 px-6">
      <div className="container mx-auto max-w-2xl">
        <Card className="border-0 shadow-premium rounded-xl">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-primary" />
              Create Dummy Order (Admin/Team Only)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title">Order Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Test Order: Gaming PC"
                  required
                  disabled={loading}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="summary">Order Summary</Label>
                <Textarea
                  id="summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="A brief description of the dummy order, e.g., High-end gaming PC with custom liquid cooling."
                  required
                  disabled={loading}
                  className="mt-1 min-h-[100px]"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading || !title || !summary}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Add Dummy Order"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateDummyOrder;
