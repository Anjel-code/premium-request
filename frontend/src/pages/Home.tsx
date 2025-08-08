import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Clock,
  Shield,
  Star,
  ArrowRight,
  Users,
  Trophy,
  Zap,
  Edit,
  Loader2,
} from "lucide-react";
// Removed: import Navigation from "@/components/Navigation"; // Navigation is now handled in App.jsx
import TestimonialCarousel from "@/components/TestimonialCarousel";
import AnimatedCounter from "@/components/AnimatedCounter";
import Footer from "@/components/Footer";
import { isAdmin } from "@/lib/userUtils";
import { useState, useEffect } from "react";

// Home component now accepts props for authentication state and modal control
const Home = ({ setShowAuthModal, user, handleSignOut, setIsLoginView }) => {
  const navigate = useNavigate(); // Initialize useNavigate hook
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [showBackgroundEditor, setShowBackgroundEditor] = useState(false);
  const [backgroundPosition, setBackgroundPosition] = useState(() => {
    return localStorage.getItem('homeBackgroundPosition') || 'center';
  });

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.uid) {
        setIsAdminUser(false);
        setIsCheckingAdmin(false);
        return;
      }

      try {
        const adminStatus = await isAdmin(user.uid);
        setIsAdminUser(adminStatus);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdminUser(false);
      } finally {
        setIsCheckingAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user?.uid]);

  // Function to handle "Shop Now" button click
  const handleShopNowClick = () => {
    navigate("/store");
  };

  // Function to handle background image change
  const handleBackgroundImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        localStorage.setItem('homeBackgroundImage', imageData);
        localStorage.setItem('homeBackgroundPosition', backgroundPosition);
        // Reload the page to apply the new background
        window.location.reload();
      };
      reader.readAsDataURL(file);
    }
  };

  // Function to handle background position change
  const handleBackgroundPositionChange = (position: string) => {
    setBackgroundPosition(position);
    localStorage.setItem('homeBackgroundPosition', position);
  };

  // Load background image and position from localStorage
  const backgroundImage = localStorage.getItem('homeBackgroundImage') || '/public/hero-background.jpg';
  const savedBackgroundPosition = localStorage.getItem('homeBackgroundPosition') || 'center';

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation component is now rendered at the App.jsx level, not here. */}

      {/* Admin Edit Button */}
      {isCheckingAdmin ? (
        <div className="fixed top-4 right-4 z-50">
          <div className="flex flex-col items-end gap-2">
            <Badge variant="secondary" className="text-xs">
              Checking...
            </Badge>
            <Button
              disabled
              className="flex items-center gap-2 bg-muted text-muted-foreground"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading
            </Button>
          </div>
        </div>
      ) : isAdminUser ? (
        <div className="fixed top-4 right-4 z-50">
          <div className="flex flex-col items-end gap-2">
            <Badge variant="secondary" className="text-xs">
              Admin
            </Badge>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowBackgroundEditor(!showBackgroundEditor)}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
              >
                <Edit className="h-4 w-4" />
                Edit Background
              </Button>
            </div>
                         {showBackgroundEditor && (
               <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 shadow-lg border border-white/20 mt-2 min-w-[300px]">
                 <h4 className="font-semibold text-white mb-4">Background Settings</h4>
                 
                 <div className="space-y-4">
                   <div>
                     <p className="text-sm text-white/80 mb-2">Upload new background image:</p>
                     <input
                       type="file"
                       accept="image/*"
                       onChange={handleBackgroundImageChange}
                       className="text-sm w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-md px-3 py-2 text-white placeholder-white/50"
                     />
                   </div>
                   
                   <div>
                     <p className="text-sm text-white/80 mb-2">Background position:</p>
                     <div className="grid grid-cols-3 gap-2">
                       {[
                         { value: 'top', label: 'Top' },
                         { value: 'center', label: 'Center' },
                         { value: 'bottom', label: 'Bottom' },
                         { value: 'left', label: 'Left' },
                         { value: 'right', label: 'Right' },
                         { value: 'top left', label: 'Top Left' },
                         { value: 'top right', label: 'Top Right' },
                         { value: 'bottom left', label: 'Bottom Left' },
                         { value: 'bottom right', label: 'Bottom Right' }
                       ].map((position) => (
                         <button
                           key={position.value}
                           onClick={() => handleBackgroundPositionChange(position.value)}
                           className={`px-3 py-2 text-xs rounded-md border transition-all duration-200 ${
                             backgroundPosition === position.value
                               ? 'bg-white/30 text-white border-white/50'
                               : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
                           }`}
                         >
                           {position.label}
                         </button>
                       ))}
                     </div>
                   </div>
                   
                   <div className="pt-2 border-t border-white/20">
                     <p className="text-xs text-white/60">
                       Current: {backgroundPosition}
                     </p>
                   </div>
                 </div>
               </div>
             )}
          </div>
        </div>
      ) : null}

             {/* Hero Section */}
       <section 
         className="relative overflow-hidden px-4 sm:px-6 bg-no-repeat bg-cover"
         style={{ 
           backgroundImage: `url(${backgroundImage})`,
           backgroundPosition: savedBackgroundPosition
         }}
       >
        <div className="absolute inset-0 z-0 bg-black/35"></div>
        <div className="relative container mx-auto text-center pt-24 sm:pt-32 md:pt-36 pb-24 sm:pb-32 md:pb-36 z-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-stone-100 mb-4 sm:mb-6 animate-fade-in leading-tight">
            Premium Wireless
            <span className="block text-primary">Headphones</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-stone-300 mb-6 sm:mb-8 max-w-3xl mx-auto animate-slide-up px-2">
            Experience crystal-clear sound with our premium wireless headphones
            featuring active noise cancellation, 30-hour battery life, and
            premium comfort for all-day wear.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center animate-scale-in px-2">
            <Button
              variant="premium"
              size="lg"
              className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 w-full sm:w-auto"
              onClick={handleShopNowClick}
            >
              <span className="relative z-10">Shop Now</span>{" "}
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 z-10" />
            </Button>
                         <Button
               asChild
               variant="outline"
               size="lg"
               className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 border-2 border-white/30 text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 hover:border-white/50 transition-all duration-300 w-full sm:w-auto"
             >
               <Link to="/about">Learn More</Link>
             </Button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 mt-8 sm:mt-14 max-w-4xl mx-auto px-2">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary mr-2" />
                <AnimatedCounter
                  end={2370}
                  suffix="+"
                  className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary"
                  duration={2500}
                />
              </div>
              <p className="text-stone-300 text-sm sm:text-base">Satisfied Clients</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-primary mr-2" />
                <AnimatedCounter
                  end={100}
                  suffix="%"
                  className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary"
                  duration={2500}
                />
              </div>
              <p className="text-stone-300 text-sm sm:text-base">Success Rate</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-primary mr-2" />
                <AnimatedCounter
                  end={30}
                  suffix=" min"
                  className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary"
                  duration={2500}
                />
              </div>
              <p className="text-stone-300 text-sm sm:text-base">Avg Response Time</p>
            </div>
          </div>
        </div>
      </section>

             {/* Why Choose Our Product */}
       <section className="py-20 px-6 bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/10">
         <div className="container mx-auto">
           <h2 className="text-4xl font-bold text-center text-primary mb-16">
             Why Choose Our Headphones
           </h2>
           <div className="grid md:grid-cols-3 gap-8">
                           <Card className="border-0 shadow-elegant bg-white/90 backdrop-blur-sm border border-white/50">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4 text-primary">Premium Quality</h3>
                  <p className="text-muted-foreground">
                    Built with premium materials and advanced technology for
                    exceptional sound quality and durability.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-elegant bg-white/90 backdrop-blur-sm border border-white/50">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20">
                    <Clock className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4 text-primary">
                    Long Battery Life
                  </h3>
                  <p className="text-muted-foreground">
                    Enjoy up to 30 hours of continuous playback with quick charge
                    technology for convenience.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-elegant bg-white/90 backdrop-blur-sm border border-white/50">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20">
                    <CheckCircle className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4 text-primary">
                    Active Noise Cancellation
                  </h3>
                  <p className="text-muted-foreground">
                    Immerse yourself in music with advanced noise cancellation
                    technology that blocks out distractions.
                  </p>
                </CardContent>
              </Card>
           </div>
         </div>
       </section>

      {/* Product Features */}
      <section className="py-20 px-4 sm:px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="w-full">
              <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-6 sm:mb-8">
                Premium Features
              </h2>
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-accent mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">
                      Active Noise Cancellation
                    </h3>
                    <p className="text-muted-foreground text-sm sm:text-base">
                      Advanced technology that blocks out ambient noise for an
                      immersive listening experience.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 sm:gap-4">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-accent mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">
                      30-Hour Battery Life
                    </h3>
                    <p className="text-muted-foreground text-sm sm:text-base">
                      Extended playback time with quick charge capability for
                      uninterrupted listening sessions.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 sm:gap-4">
                  <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-accent mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">
                      Premium Comfort
                    </h3>
                    <p className="text-muted-foreground text-sm sm:text-base">
                      Memory foam ear cushions and adjustable headband for
                      all-day comfort without fatigue.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative w-full">
              <Card className="p-4 sm:p-6 lg:p-8 border-0 shadow-premium bg-white/90 backdrop-blur-sm border border-white/50 overflow-hidden">
                <CardContent className="p-0">
                  <h3 className="text-xl sm:text-2xl text-center font-bold text-primary mb-4 sm:mb-6">
                    <span className="text-muted-foreground mr-1">Regular</span> vs.{" "}
                    <span className="text-secondary ml-1">Premium</span>
                  </h3>
                  <div className="space-y-3 sm:space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-white/50 backdrop-blur-sm rounded-lg border border-primary/20 gap-2 sm:gap-0">
                      <span className="text-muted-foreground text-sm sm:text-base">
                        Basic sound quality
                      </span>
                      <span className="text-primary font-semibold text-sm sm:text-base">
                        → Crystal clear audio
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-white/50 backdrop-blur-sm rounded-lg border border-primary/20 gap-2 sm:gap-0">
                      <span className="text-muted-foreground text-sm sm:text-base">
                        Background noise
                      </span>
                      <span className="text-primary font-semibold text-sm sm:text-base">
                        → Active cancellation
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-white/50 backdrop-blur-sm rounded-lg border border-primary/20 gap-2 sm:gap-0">
                      <span className="text-muted-foreground text-sm sm:text-base">
                        Short battery life
                      </span>
                      <span className="text-primary font-semibold text-sm sm:text-base">
                        → 30-hour playback
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 bg-gradient-subtle">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center text-primary mb-16">
            What Our Clients Say
          </h2>
          <TestimonialCarousel />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-primary mb-6">
            Ready to Experience Premium Sound?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust our premium wireless
            headphones for their daily listening needs.
          </p>
          <Button
            variant="glow"
            size="lg"
            className="text-lg px-8 py-6"
            onClick={handleShopNowClick}
          >
            Shop Now <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
