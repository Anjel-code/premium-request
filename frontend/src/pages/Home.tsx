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
} from "lucide-react";
// Removed: import Navigation from "@/components/Navigation"; // Navigation is now handled in App.jsx
import TestimonialCarousel from "@/components/TestimonialCarousel";
import AnimatedCounter from "@/components/AnimatedCounter";
import Footer from "@/components/Footer";
import { isAdmin } from "@/lib/userUtils";
import { useState, useEffect } from "react";
import { MediaBackground } from "@/components/ui/MediaImage";
import { useMediaAsset } from "@/hooks/useMediaAssets";

// Home component now accepts props for authentication state and modal control
const Home = ({ setShowAuthModal, user, handleSignOut, setIsLoginView }) => {
  const navigate = useNavigate(); // Initialize useNavigate hook
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [isHeroImageLoaded, setIsHeroImageLoaded] = useState(false);

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

  // Handle hero image load
  const handleHeroImageLoad = () => {
    setIsHeroImageLoaded(true);
  };

  const handleHeroImageError = (error: Error) => {
    console.error('[Home] Hero background image failed to load:', error);
    // Still allow the page to render even if image fails
    setIsHeroImageLoaded(true);
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation component is now rendered at the App.jsx level, not here. */}

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 sm:px-6">
        <MediaBackground
          assetId="home-hero-background"
          className="absolute inset-0 w-full h-full object-cover"
          overlay={true}
          overlayOpacity={0.6}
          waitForLoad={true}
          onLoad={handleHeroImageLoad}
          onError={handleHeroImageError}
        />
        
        {/* Only render hero content when image is loaded */}
        {isHeroImageLoaded && (
          <div className="relative container mx-auto text-center pt-24 sm:pt-32 md:pt-36 pb-24 sm:pb-32 md:pb-36 z-10">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 animate-fade-in leading-tight drop-shadow-2xl">
              Premium Men's
              <span className="block text-primary drop-shadow-2xl">Business Watch</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white mb-6 sm:mb-8 max-w-3xl mx-auto animate-slide-up px-2 drop-shadow-lg">
              Experience
timeless elegance with our premium business watch, featuring classic
Arabic numeral markers, a durable stainless steel band, and reliable
quartz movement.
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
                    end={1240}
                    suffix="+"
                    className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary"
                    duration={2500}
                  />
                </div>
                <p className="text-white text-sm sm:text-base drop-shadow-md">Satisfied Clients</p>
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
                <p className="text-white text-sm sm:text-base drop-shadow-md">Quality Guarantee</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-primary mr-2" />
                  <AnimatedCounter
                    end={2}
                    suffix="+ years"
                    className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary"
                    duration={2500}
                  />
                </div>
                <p className="text-white text-sm sm:text-base drop-shadow-md">Quartz Movement</p>
              </div>
            </div>
          </div>
        )}
      </section>

             {/* Why Choose Our Product */}
       <section className="py-20 px-6 bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/10">
         <div className="container mx-auto">
           <h2 className="text-4xl font-bold text-center text-primary mb-16">
             Why Choose Our Watch
           </h2>
           <div className="grid md:grid-cols-3 gap-8">
                           <Card className="border-0 shadow-elegant bg-white/90 backdrop-blur-sm border border-white/50">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4 text-primary">Premium Quality</h3>
                  <p className="text-muted-foreground">
                    Crafted with high-quality alloy and stainless steel for exceptional durability and a sophisticated look.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-elegant bg-white/90 backdrop-blur-sm border border-white/50">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20">
                    <Clock className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4 text-primary">
                    Elegant Design
                  </h3>
                  <p className="text-muted-foreground">
                    Features classic Arabic numeral markers and a fluted bezel for a timeless, business-ready style.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-elegant bg-white/90 backdrop-blur-sm border border-white/50">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20">
                    <CheckCircle className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4 text-primary">
                    Reliable Movement
                  </h3>
                  <p className="text-muted-foreground">
                    Powered by a precise quartz movement from Mainland China, ensuring accurate timekeeping.
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
                      Arabic Numeral Markers
                    </h3>
                    <p className="text-muted-foreground text-sm sm:text-base">
                      Classic and unique display with Arabic numerals for a distinguished look.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 sm:gap-4">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-accent mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">
                      Stainless Steel Band
                    </h3>
                    <p className="text-muted-foreground text-sm sm:text-base">
                      Durable and stylish bracelet clasp band for a secure and comfortable fit.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 sm:gap-4">
                  <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-accent mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">
                      Complete Calendar
                    </h3>
                    <p className="text-muted-foreground text-sm sm:text-base">
                      Includes a complete calendar feature for added functionality and convenience.
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
                        Basic design
                      </span>
                      <span className="text-primary font-semibold text-sm sm:text-base">
                        → Timeless elegance
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-white/50 backdrop-blur-sm rounded-lg border border-primary/20 gap-2 sm:gap-0">
                      <span className="text-muted-foreground text-sm sm:text-base">
                        Low-quality materials
                      </span>
                      <span className="text-primary font-semibold text-sm sm:text-base">
                        → Premium alloy & steel
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-white/50 backdrop-blur-sm rounded-lg border border-primary/20 gap-2 sm:gap-0">
                      <span className="text-muted-foreground text-sm sm:text-base">
                        Generic features
                      </span>
                      <span className="text-primary font-semibold text-sm sm:text-base">
                        → Complete calendar
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
            Ready to Experience Timeless Elegance?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust our premium business watch for their daily style needs.
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
