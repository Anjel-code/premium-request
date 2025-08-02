import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Navigation = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-primary">
            The Product Concierge
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className={`transition-colors ${isActive('/') ? 'text-accent' : 'text-foreground hover:text-accent'}`}
            >
              Home
            </Link>
            <Link 
              to="/about" 
              className={`transition-colors ${isActive('/about') ? 'text-accent' : 'text-foreground hover:text-accent'}`}
            >
              About
            </Link>
            <Link 
              to="/contact" 
              className={`transition-colors ${isActive('/contact') ? 'text-accent' : 'text-foreground hover:text-accent'}`}
            >
              Contact
            </Link>
            <Link 
              to="/dashboard" 
              className={`transition-colors ${isActive('/dashboard') ? 'text-accent' : 'text-foreground hover:text-accent'}`}
            >
              Dashboard
            </Link>
          </div>

          <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-medium">
            <Link to="/order">Start Your Request</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;