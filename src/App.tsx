import React, { useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore"; // Import Firestore functions
import { auth, db } from "./firebase"; // Import both auth and db

// Your existing imports for UI components and routing
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Your page components
import Home from "./pages/Home";
import Order from "./pages/Order"; // This component now expects 'user' and 'appId' props
import Dashboard from "./pages/Dashboard";
import DashboardOrders from "./pages/DashboardOrders";
import DashboardNotifications from "./pages/DashboardNotifications";
import TicketView from "./pages/TicketView";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import Navigation from "@/components/Navigation";

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

// New component to wrap content that needs access to React Router hooks
const AppContent = ({
  user,
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
  // Added appId prop
  const location = useLocation(); // useLocation is now correctly inside BrowserRouter's context
  const hideNavbarPaths = [
    "/dashboard",
    "/dashboard/orders",
    "/dashboard/notifications",
    "/ticket", // Match /ticket/:ticketId
  ];
  const shouldHideNavbar = hideNavbarPaths.some((path) =>
    location.pathname.startsWith(path)
  );

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
        {/* Pass the 'user' and 'appId' props to the Order component */}
        <Route path="/order" element={<Order user={user} appId={appId} />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/orders" element={<DashboardOrders />} />
        <Route
          path="/dashboard/notifications"
          element={<DashboardNotifications />}
        />
        <Route path="/ticket/:ticketId" element={<TicketView />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
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
  const [user, setUser] = useState(null); // The Firebase user object
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginView, setIsLoginView] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true); // Initial loading state for Firebase Auth
  const [showAuthModal, setShowAuthModal] = useState(false); // New state for modal visibility

  // Retrieve __app_id at the top level of App component and ensure it's a string
  // THIS IS THE CRUCIAL PART THAT WAS MISSING IN YOUR PREVIOUS COPY
  // Safely access __app_id from the global window object to avoid reference errors
  const rawAppId =
    typeof (window as any).__app_id !== "undefined"
      ? (window as any).__app_id
      : "default-app-id-fallback";
  console.log(
    "App.jsx Debug: Type of __app_id:",
    typeof (window as any).__app_id
  );
  console.log("App.jsx Debug: Value of __app_id:", (window as any).__app_id);
  const appId = String(rawAppId); // Explicitly convert to string to prevent 'undefined' as a segment
  console.log("App.jsx Debug: Final appId being used:", appId);

  // Function to create or update user profile in Firestore
  const createUserProfile = async (user) => {
    if (!user) return; // Ensure user object exists

    const userRef = doc(db, "users", user.uid);
    const createdAt = user.metadata.creationTime
      ? new Date(user.metadata.creationTime)
      : new Date();
    const lastLoginAt = user.metadata.lastSignInTime
      ? new Date(user.metadata.lastSignInTime)
      : new Date();

    try {
      await setDoc(
        userRef,
        {
          email: user.email,
          displayName: user.displayName || user.email.split("@")[0], // Use display name or email username
          createdAt: createdAt,
          lastLoginAt: lastLoginAt,
          roles: ["customer"], // Default role
          profilePictureUrl: user.photoURL || null, // Store profile picture URL if available (e.g., from Google)
        },
        { merge: true }
      ); // Use merge: true to update if document exists, create if not
      console.log("User profile updated/created in Firestore:", user.uid);
    } catch (firestoreError) {
      console.error("Error writing user to Firestore:", firestoreError);
      setError("Failed to save user profile.");
    }
  };

  // Use a useEffect hook to set up the onAuthStateChanged listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false); // Authentication state has been determined
      // If user logs in, close the modal automatically and create/update profile
      if (currentUser) {
        setShowAuthModal(false);
        await createUserProfile(currentUser); // Call profile creation/update
      }
    });

    return () => unsubscribe(); // Clean up the listener
  }, []);

  const handleAuthAction = async (isLogin) => {
    setError(""); // Clear previous errors
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
      // createUserProfile will be called by onAuthStateChanged listener
    } catch (e) {
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
          default:
            errorMessage = e.message;
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Sign-in
  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      // createUserProfile will be called by onAuthStateChanged listener
    } catch (e) {
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
    } catch (e) {
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
        <Toaster />
        <Sonner />
        <style>{styles}</style> {/* Apply global styles */}
        {/* Main application content - always rendered */}
        <BrowserRouter>
          <AppContent
            user={user}
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
            appId={appId} // Pass appId to AppContent
          />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
