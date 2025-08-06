import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, ArrowRight } from "lucide-react";

const Navigation = ({
  user,
  setShowAuthModal,
  handleSignOut,
  setIsLoginView,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  // Function to format the user's email for display
  const formatUserEmail = (email) => {
    if (!email) return "";
    return email.split("@")[0]; // Get and return the whole part before @
  };

  // This function is kept for consistency but is not directly tied to a button in this component.
  const handleStartRequestClick = () => {
    if (!user) {
      setShowAuthModal(true);
      setIsLoginView(true); // Default to login view when opening from "Start Request"
    } else {
      navigate("/order");
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-6 py-2">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-primary">
            Quibble
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`transition-colors ${
                isActive("/")
                  ? "text-accent"
                  : "text-foreground hover:text-accent"
              }`}
            >
              Home
            </Link>
            <Link
              to="/store"
              className={`transition-colors ${
                isActive("/store")
                  ? "text-accent"
                  : "text-foreground hover:text-accent"
              }`}
            >
              Store
            </Link>
            <Link
              to="/about"
              className={`transition-colors ${
                isActive("/about")
                  ? "text-accent"
                  : "text-foreground hover:text-accent"
              }`}
            >
              About
            </Link>
            <Link
              to="/contact"
              className={`transition-colors ${
                isActive("/contact")
                  ? "text-accent"
                  : "text-foreground hover:text-accent"
              }`}
            >
              Contact
            </Link>
            {/* Only show Dashboard link if user is logged in */}
            {user && (
              <Link
                to="/dashboard"
                className={`transition-colors ${
                  isActive("/dashboard")
                    ? "text-accent"
                    : "text-foreground hover:text-accent"
                }`}
              >
                Dashboard
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              // If user is logged in, show welcome message and Sign Out button
              <>
                <span className="text-sm text-muted-foreground hidden md:block">
                  Welcome, {formatUserEmail(user.email)}
                </span>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm" // Smaller size for navbar
                  className="border-accent text-accent hover:bg-accent/10 font-medium"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </Button>
              </>
            ) : (
              // If user is not logged in, show Sign In and Sign Up buttons
              <>
                <Button
                  onClick={() => {
                    setIsLoginView(true); // Set to login view
                    setShowAuthModal(true); // Open the modal
                  }}
                  variant="ghost"
                  size="sm" // Smaller size for navbar
                  className="font-medium"
                >
                  <LogIn className="mr-2 h-4 w-4" /> Sign In
                </Button>
                <Button
                  onClick={() => {
                    setIsLoginView(false); // Set to signup view
                    setShowAuthModal(true); // Open the modal
                  }}
                  variant="premium" // Use your premium variant for Sign Up
                  size="sm" // Smaller size for navbar
                  className="font-medium"
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
