import React, { useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User, // Import User type from firebase/auth
} from "firebase/auth";
import { doc, setDoc, onSnapshot, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "./firebase"; // Import both auth and db

// Your existing imports for UI components and routing
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Import Loader2 from lucide-react
import { Loader2 } from "lucide-react";
import {
  checkEnvironmentVariables,
  testFirebaseConnection,
} from "./lib/firebaseTest";

// Your page components
import Home from "./pages/Home";
import Order from "./pages/Order";
import Dashboard from "./pages/Dashboard";
import DashboardOrders from "./pages/DashboardOrders";
import DashboardNotifications from "./pages/DashboardNotifications";
import DashboardSettings from "./pages/DashboardSettings";
import TicketView from "./pages/TicketView";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import Navigation from "@/components/Navigation";
import AdminPanel from "./components/AdminPanel"; // Ensure this import path is correct
import OrderQueuePage from "./pages/OrderQueuePage";
import TeamChat from "./pages/TeamChat";
import CreateDummyOrder from "./pages/CreateDummyOrder"; // Import CreateDummyOrder
import DashboardSupport from "./pages/DashboardSupport";
import PaymentPortalPage from "./pages/PaymentPortalPage"; // Import PaymentPortalPage
import SuccessPage from "./pages/SuccessPage"; // Import the new SuccessPage component
import Store from "./pages/Store"; // Import the new Store component
import DashboardStoreOrders from "./pages/DashboardStoreOrders"; // Import DashboardStoreOrders
import StoreOrderDetail from "./pages/StoreOrderDetail"; // Import StoreOrderDetail
import AdminStoreOrders from "./pages/AdminStoreOrders"; // Import AdminStoreOrders
import CheckoutPage from "./pages/CheckoutPage"; // Import CheckoutPage
import Analytics from "./pages/Analytics"; // Import Analytics

import { CartProvider } from "@/contexts/CartContext";
import CartPanel from "@/components/CartPanel";

// --- Tailwind-like styles for basic UI (kept for standalone functionality) ---
const styles = `
  body { font-family: sans-serif; background-color: #f3f4f6; color: #1f2937; margin: 0; padding: 0; }
  .auth-container { max-width: 480px; margin: 2rem auto; padding: 2rem; background-color: #fff; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
  .auth-form, .logged-in-container { display: flex; flex-direction: column; gap: 1rem; }
  .input-field { padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 1rem; }
  .auth-button { padding: 0.75rem; border-radius: 0.375rem; font-size: 1rem; font-weight: 600; cursor: pointer; border: none; }
  .auth-button.primary { background-color: #1f2937; color: #fff; }
  .auth-button.google { background-color: #db4437; color: #fff; display: flex; align-items: center; justify-content: center; gap: 0.5rem; } /* Style for Google button */
  .auth-button.secondary { background-color: #e5e7eb; color: #1f2937; }
  .toggle-text { font-size: 0.875rem; text-align: center; }
  .error-message { color: #ef4444; text-align: center; font-size: 0.875rem; }
  .title { font-size: 1.5rem; font-weight: 700; text-align: center; margin-bottom: 1rem; }
  .welcome-text { font-size: 1.25rem; text-align: center; }
  .loading-screen { display: flex; justify-content: center; align-items: center; height: 100vh; font-size: 1.5rem; }

  /* Modal specific styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6); /* Semi-transparent background */
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000; /* Ensure it's on top of other content */
  }
  .modal-content {
    background-color: #fff;
    padding: 2rem;
    border-radius: 0.5rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    position: relative;
    max-width: 480px; /* Max width for the modal */
    width: 90%; /* Responsive width */
  }
  .modal-close-button {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #4b5563; /* Gray color for close button */
  }
`;

const queryClient = new QueryClient();

// Define UserProfile interface for clarity, now EXTENDING Firebase's User type
// This ensures all properties of Firebase's User object are included,
// and 'roles' is added as an optional custom field.
interface UserProfile extends User {
  roles?: string[]; // Optional roles field
  profilePictureUrl?: string; // This can be removed if photoURL from User is sufficient
  photoURL: string | null;
}

// Define props for AppContent to accept userRoles and isRolesLoaded
interface AppContentProps {
  user: User | null; // Changed to Firebase's User type
  userRoles: string[];
  isRolesLoaded: boolean; // Prop to indicate if roles have been loaded
  setShowAuthModal: (show: boolean) => void;
  handleSignOut: () => void;
  setIsLoginView: (isLogin: boolean) => void;
  showAuthModal: boolean;
  error: string;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  isLoginView: boolean;
  loading: boolean;
  handleAuthAction: (isLogin: boolean) => void;
  handleGoogleSignIn: () => void;
  appId: string;
}

// New component to wrap content that needs access to React Router hooks
const AppContent: React.FC<AppContentProps> = ({
  user,
  userRoles,
  isRolesLoaded,
  setShowAuthModal,
  handleSignOut,
  setIsLoginView,
  showAuthModal,
  error,
  email,
  setEmail,
  password,
  setPassword,
  isLoginView,
  loading,
  handleAuthAction,
  handleGoogleSignIn,
  appId,
}) => {
  const location = useLocation();
  const hideNavbarPaths = [
    "/dashboard",
    "/dashboard/orders",
    "/dashboard/notifications",
    "/ticket",
    "/admin", // Hide navbar for AdminPanel
    "/dashboard/queue", // Hide navbar for OrderQueuePage
    "/team-chat", // Hide navbar for TeamChat
    "/create-dummy-order", // Hide navbar for CreateDummyOrder
    "/dashboard/support",
    "/payment-portal", // Hide navbar on payment portal page
    "/success", // HIDE NAVBAR FOR THE SUCCESS PAGE
  ];
  const shouldHideNavbar = hideNavbarPaths.some((path) =>
    location.pathname.startsWith(path)
  );

  // Helper to check if user has admin or team_member roles
  const hasTeamOrAdminRole =
    userRoles.includes("team_member") || userRoles.includes("admin");
  const isAdmin = userRoles.includes("admin"); // Specific check for AdminPanel

  // Conditional rendering for routes based on user and roles loading status
  if (user && !isRolesLoaded) {
    // If user is logged in but roles are not yet loaded, show a loading screen
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="ml-4 text-primary">Loading user permissions...</p>
      </div>
    );
  }

  return (
    <>
      {/* Conditionally render Navigation */}
      {!shouldHideNavbar && (
        <Navigation
          user={user}
          setShowAuthModal={setShowAuthModal}
          handleSignOut={handleSignOut}
          setIsLoginView={setIsLoginView}
        />
      )}
      <Routes>
        <Route
          path="/"
          element={
            <Home
              setShowAuthModal={setShowAuthModal}
              user={user}
              handleSignOut={handleSignOut}
              setIsLoginView={setIsLoginView}
            />
          }
        />
        <Route
          path="/order"
          element={
            <Order
              user={
                user
                  ? {
                      uid: user.uid,
                      email: user.email ?? "",
                      displayName: user.displayName ?? user.email ?? "",
                      roles: userRoles,
                      photoURL: user.photoURL ?? undefined, // photoURL is now correctly recognized
                    }
                  : null
              }
              appId={appId}
            />
          }
        />
        <Route
          path="/dashboard"
          element={
            <Dashboard
              user={
                user
                  ? {
                      uid: user.uid,
                      email: user.email ?? "",
                      displayName: user.displayName ?? user.email ?? "",
                      roles: userRoles,
                      photoURL: user.photoURL ?? undefined, // photoURL is now correctly recognized
                    }
                  : null
              }
              appId={appId}
            />
          } // Pass user as UserProfile and appId
        />
        <Route
          path="/dashboard/orders"
          element={
            <DashboardOrders
              user={
                user
                  ? {
                      uid: user.uid,
                      email: user.email ?? "",
                      displayName: user.displayName ?? user.email ?? "",
                      roles: userRoles,
                      photoURL: user.photoURL ?? undefined, // photoURL is now correctly recognized
                    }
                  : null
              }
              userRoles={userRoles}
              appId={appId}
            />
          } // Pass user, appId, and userRoles
        />
        <Route
          path="/dashboard/store-orders"
          element={<Navigate to="/dashboard/orders" replace />}
        />
        <Route
          path="/dashboard/store-orders/:orderId"
          element={
            <StoreOrderDetail
              user={
                user
                  ? {
                      uid: user.uid,
                      email: user.email ?? "",
                      displayName: user.displayName ?? user.email ?? "",
                      roles: userRoles,
                      photoURL: user.photoURL ?? undefined,
                    }
                  : null
              }
              appId={appId}
            />
          }
        />
        <Route
          path="/dashboard/admin/store-orders"
          element={
            hasTeamOrAdminRole ? (
              <AdminStoreOrders
                user={
                  user
                    ? {
                        uid: user.uid,
                        email: user.email ?? "",
                        displayName: user.displayName ?? user.email ?? "",
                        roles: userRoles,
                        photoURL: user.photoURL ?? undefined,
                      }
                    : null
                }
                appId={appId}
              />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/dashboard/notifications"
          element={<DashboardNotifications user={user} appId={appId} />} // Pass user and appId
        />
        <Route
          path="/dashboard/settings"
          element={
            <DashboardSettings
              user={
                user
                  ? {
                      uid: user.uid,
                      email: user.email ?? "",
                      displayName: user.displayName ?? user.email ?? "",
                      roles: userRoles,
                      photoURL: user.photoURL ?? undefined,
                    }
                  : null
              }
              userRoles={userRoles}
              appId={appId}
              onSignOut={handleSignOut}
            />
          }
        />
        <Route
          path="/ticket/:ticketId"
          element={
            <TicketView
              user={
                user
                  ? {
                      uid: user.uid,
                      email: user.email ?? "",
                      displayName: user.displayName ?? user.email ?? "",
                      roles: userRoles,
                      photoURL: user.photoURL ?? undefined, // photoURL is now correctly recognized
                    }
                  : null
              }
              appId={appId}
            />
          } // Pass user as UserProfile and appId
        />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route
          path="/store"
          element={
            <Store
              user={
                user
                  ? {
                      uid: user.uid,
                      email: user.email ?? "",
                      displayName: user.displayName ?? user.email ?? "",
                    }
                  : null
              }
              appId={appId}
            />
          }
        />
        <Route
          path="/team-chat"
          element={<TeamChat user={user} appId={appId} />}
        />
        <Route
          path="/create-dummy-order"
          element={
            <CreateDummyOrder
              user={
                user
                  ? {
                      uid: user.uid,
                      email: user.email ?? "",
                      displayName: user.displayName ?? user.email ?? "",
                      roles: userRoles,
                      photoURL: user.photoURL ?? undefined, // photoURL is now correctly recognized
                    }
                  : null
              }
              appId={appId}
            />
          }
        />
        <Route
          path="/dashboard/support"
          element={
            <DashboardSupport
              user={
                user
                  ? {
                      uid: user.uid,
                      email: user.email ?? "",
                      displayName: user.displayName ?? user.email ?? "",
                      roles: userRoles,
                      photoURL: user.photoURL ?? undefined,
                    }
                  : null
              }
              appId={appId}
            />
          }
        />
        {/* Admin Panel Route - Protected */}
        <Route
          path="/admin"
          element={
            isAdmin ? (
              <AdminPanel userRoles={userRoles} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        {/* Order Queue Page Route - Protected for Team/Admin */}
        <Route
          path="/dashboard/queue"
          element={
            hasTeamOrAdminRole ? (
              <OrderQueuePage userRoles={userRoles} user={user} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        {/* Payment Portal Route */}
        <Route
          path="/payment-portal/:ticketId"
          element={
            <PaymentPortalPage
              user={
                user
                  ? {
                      uid: user.uid,
                      email: user.email ?? "",
                      displayName: user.displayName ?? user.email ?? "",
                      roles: userRoles,
                      photoURL: user.photoURL ?? undefined, // photoURL is now correctly recognized
                    }
                  : null
              }
              appId={appId}
            />
          }
        />
        {/* Store Payment Route */}
        <Route
          path="/payment-portal/store-order"
          element={
            <PaymentPortalPage
              user={
                user
                  ? {
                      uid: user.uid,
                      email: user.email ?? "",
                      displayName: user.displayName ?? user.email ?? "",
                      roles: userRoles,
                      photoURL: user.photoURL ?? undefined,
                    }
                  : null
              }
              appId={appId}
            />
          }
        />
        {/* Checkout Route */}
        <Route path="/checkout" element={<CheckoutPage />} />

        {/* Analytics Route - Protected for Admin Only */}
        <Route
          path="/analytics"
          element={
            isAdmin ? (
              <Analytics
                user={
                  user
                    ? {
                        uid: user.uid,
                        email: user.email ?? "",
                        displayName: user.displayName ?? user.email ?? "",
                        roles: userRoles,
                        photoURL: user.photoURL ?? undefined,
                      }
                    : null
                }
                appId={appId}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* New Success Route */}
        <Route path="/success" element={<SuccessPage />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Authentication Modal - conditionally rendered */}
      {showAuthModal && !user && (
        <div className="modal-overlay">
          <div className="modal-content">
            {/* Close button for the modal */}
            <button
              className="modal-close-button"
              onClick={() => setShowAuthModal(false)}
            >
              &times;
            </button>
            <h1 className="title">Firebase Authentication</h1>
            {error && <div className="error-message">{error}</div>}

            <div className="auth-form">
              <h2 className="title">{isLoginView ? "Sign In" : "Sign Up"}</h2>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="input-field"
                disabled={loading}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="input-field"
                disabled={loading}
              />
              <button
                onClick={() => handleAuthAction(isLoginView)}
                className="auth-button primary"
                disabled={loading || !email || !password}
              >
                {isLoginView ? "Sign In" : "Sign Up"}
              </button>
              <div className="toggle-text">
                {isLoginView
                  ? "Don't have an account? "
                  : "Already have an account? "}
                <button
                  onClick={() => setIsLoginView(!isLoginView)}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    color: "#4b5563",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                  disabled={loading}
                >
                  {isLoginView ? "Sign Up" : "Sign In"}
                </button>
              </div>

              {/* Separator */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  margin: "1rem 0",
                }}
              >
                <div
                  style={{
                    flexGrow: 1,
                    height: "1px",
                    backgroundColor: "#d1d5db",
                  }}
                ></div>
                <span
                  style={{
                    margin: "0 1rem",
                    color: "#6b7280",
                    fontSize: "0.875rem",
                  }}
                >
                  OR
                </span>
                <div
                  style={{
                    flexGrow: 1,
                    height: "1px",
                    backgroundColor: "#d1d5db",
                  }}
                ></div>
              </div>

              {/* Google Sign-in Button */}
              <button
                onClick={handleGoogleSignIn}
                className="auth-button google"
                disabled={loading}
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google logo"
                  style={{ width: "18px", height: "18px" }}
                />
                Sign In with Google
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

function App() {
  const [user, setUser] = useState<User | null>(null); // Still Firebase's User type
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isRolesLoaded, setIsRolesLoaded] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginView, setIsLoginView] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Check environment variables on app start
  useEffect(() => {
    const envCheck = checkEnvironmentVariables();
    if (!envCheck) {
      console.error(
        "Firebase environment variables are not properly configured. Please check your .env file."
      );
    } else {
      // Test Firebase connection if env vars are set
      testFirebaseConnection().then((success) => {
        if (success) {
          console.log("🎉 Firebase connection test passed!");
        } else {
          console.error("❌ Firebase connection test failed!");
        }
      });
    }
  }, []);

  const appId =
    import.meta.env.VITE_FIREBASE_PROJECT_ID || "default-app-id-fallback";

  // createUserProfile now accepts Firebase's User type
  const createUserProfile = async (user: User) => {
    if (!user || !db) return;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    const createdAt = user.metadata.creationTime
      ? new Date(user.metadata.creationTime)
      : new Date();
    const lastLoginAt = user.metadata.lastSignInTime
      ? new Date(user.metadata.lastSignInTime)
      : new Date();

    try {
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName || user.email?.split("@")[0] || null,
          createdAt: createdAt,
          lastLoginAt: lastLoginAt,
          roles: ["customer"], // Initialize roles for new users
          photoURL: user.photoURL || null,
        });
      } else {
        await updateDoc(userRef, {
          lastLoginAt: lastLoginAt,
          displayName:
            user.displayName ||
            userSnap.data()?.displayName ||
            user.email?.split("@")[0] ||
            null,
          photoURL: user.photoURL || userSnap.data()?.photoURL || null,
        });
      }
    } catch (firestoreError) {
      console.error("Error writing user to Firestore:", firestoreError);
      setError("Failed to save user profile.");
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser); // currentUser is already of type User | null
      setIsRolesLoaded(false); // Reset roles loaded status on auth change

      if (currentUser) {
        setShowAuthModal(false);
        if (db) {
          await createUserProfile(currentUser); // currentUser is already User type

          const userRef = doc(db, "users", currentUser.uid);
          const unsubscribeRoles = onSnapshot(
            userRef,
            (docSnap) => {
              if (docSnap.exists()) {
                const data = docSnap.data();
                const fetchedRoles = (data?.roles || []) as string[];
                setUserRoles(fetchedRoles);
              } else {
                setUserRoles([]); // No user profile, no roles
              }
              setIsRolesLoaded(true); // Roles are now loaded (or determined to be empty)
            },
            (error) => {
              console.error(
                "Error fetching user roles with onSnapshot:",
                error
              );
              setUserRoles([]);
              setIsRolesLoaded(true); // Mark as loaded even on error
            }
          );
          setLoading(false);
          return () => {
            unsubscribeRoles(); // Clean up role listener
          };
        } else {
          setLoading(false);
          setIsRolesLoaded(true); // If db not ready, mark roles as loaded (empty)
        }
      } else {
        setUserRoles([]); // No user, no roles
        setLoading(false);
        setIsRolesLoaded(true); // Roles are loaded (empty)
      }
    });

    return () => unsubscribeAuth(); // Clean up auth listener
  }, [db]); // Re-run effect if db instance changes

  const handleAuthAction = async (isLogin: boolean) => {
    setError("");
    setLoading(true);

    try {
      let userCredential;
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
      } else {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
      }
      setEmail("");
      setPassword("");
    } catch (e: any) {
      console.error(e);
      let errorMessage = "An unexpected error occurred.";
      if (e.code) {
        switch (e.code) {
          case "auth/email-already-in-use":
            errorMessage = "This email is already in use.";
            break;
          case "auth/invalid-email":
            errorMessage = "The email address is not valid.";
            break;
          case "auth/weak-password":
            errorMessage = "Password should be at least 6 characters.";
            break;
          case "auth/user-not-found":
          case "auth/wrong-password":
            errorMessage = "Invalid email or password.";
            break;
          case "auth/popup-closed-by-user":
            errorMessage = "Authentication popup closed.";
            break;
          default:
            errorMessage = e.message;
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (e: any) {
      console.error(e);
      let errorMessage = "Failed to sign in with Google.";
      if (e.code === "auth/popup-closed-by-user") {
        errorMessage = "Google sign-in popup closed.";
      } else if (e.code === "auth/cancelled-popup-request") {
        errorMessage = "Google sign-in already in progress.";
      } else if (e.code === "auth/account-exists-with-different-credential") {
        errorMessage =
          "An account with this email already exists using different sign-in credentials.";
      } else {
        errorMessage = e.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut(auth);
    } catch (e: any) {
      console.error(e);
      setError("Failed to sign out.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <style>{styles}</style>
        Loading application...
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <style>{styles}</style> {/* Apply global styles */}
          {/* Main application content - always rendered */}
          <BrowserRouter>
            <AppContent
              user={user}
              userRoles={userRoles}
              isRolesLoaded={isRolesLoaded}
              setShowAuthModal={setShowAuthModal}
              handleSignOut={handleSignOut}
              setIsLoginView={setIsLoginView}
              showAuthModal={showAuthModal}
              error={error}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              isLoginView={isLoginView}
              loading={loading}
              handleAuthAction={handleAuthAction}
              handleGoogleSignIn={handleGoogleSignIn}
              appId={appId}
            />
            <CartPanel />
          </BrowserRouter>
        </CartProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
