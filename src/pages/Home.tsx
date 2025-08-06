import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

// Home component now accepts props for authentication state and modal control
const Home = ({ setShowAuthModal, user, handleSignOut, setIsLoginView }) => {
  const navigate = useNavigate(); // Initialize useNavigate hook

  // Function to handle "Shop Now" button click
  const handleShopNowClick = () => {
    navigate("/store");
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation component is now rendered at the App.jsx level, not here. */}

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 bg-[url('/public/hero-background.jpg')] bg-no-repeat bg-cover bg-bottom">
        <div className="absolute inset-0 z-0 bg-black/35"></div>
        <div className="relative container mx-auto text-center pt-36 pb-36 z-10">
          <h1 className="text-5xl md:text-7xl font-bold text-stone-100 mb-6 animate-fade-in">
            Premium Wireless
            <span className="block text-accent">Headphones</span>
          </h1>
          <p className="text-xl md:text-2xl text-stone-300 mb-8 max-w-3xl mx-auto animate-slide-up">
            Experience crystal-clear sound with our premium wireless headphones
            featuring active noise cancellation, 30-hour battery life, and
            premium comfort for all-day wear.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-scale-in">
            <Button
              variant="premium"
              size="lg"
              className="text-lg px-8 py-6"
              onClick={handleShopNowClick}
            >
              <span className="relative z-10">Shop Now</span>{" "}
              <ArrowRight className="ml-2 h-5 w-5 z-10" />
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="text-lg px-8 py-6 border-accent text-accent bg-stone-800 hover:text-stone-200 hover:bg-accent/10"
            >
              <Link to="/about">Learn More</Link>
            </Button>
          </div>

          {/* Statistics */}
          <div className="grid md:grid-cols-3 gap-8 mt-14 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-8 w-8 text-accent mr-2" />
                <AnimatedCounter
                  end={2370}
                  suffix="+"
                  className="text-4xl font-bold text-accent"
                  duration={2500}
                />
              </div>
              <p className="text-stone-300">Satisfied Clients</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Trophy className="h-8 w-8 text-accent mr-2" />
                <AnimatedCounter
                  end={100}
                  suffix="%"
                  className="text-4xl font-bold text-accent"
                  duration={2500}
                />
              </div>
              <p className="text-stone-300">Success Rate</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Zap className="h-8 w-8 text-accent mr-2" />
                <AnimatedCounter
                  end={30}
                  suffix=" min"
                  className="text-4xl font-bold text-accent"
                  duration={2500}
                />
              </div>
              <p className="text-stone-300">Avg Response Time</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Our Product */}
      <section className="py-20 px-6 bg-gradient-subtle">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center text-primary mb-16">
            Why Choose Our Headphones
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-elegant">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Premium Quality</h3>
                <p className="text-muted-foreground">
                  Built with premium materials and advanced technology for
                  exceptional sound quality and durability.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-elegant">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Clock className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-4">
                  Long Battery Life
                </h3>
                <p className="text-muted-foreground">
                  Enjoy up to 30 hours of continuous playback with quick charge
                  technology for convenience.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-elegant">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-4">
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
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-primary mb-8">
                Premium Features
              </h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <CheckCircle className="h-6 w-6 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      Active Noise Cancellation
                    </h3>
                    <p className="text-muted-foreground">
                      Advanced technology that blocks out ambient noise for an
                      immersive listening experience.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Clock className="h-6 w-6 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      30-Hour Battery Life
                    </h3>
                    <p className="text-muted-foreground">
                      Extended playback time with quick charge capability for
                      uninterrupted listening sessions.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Shield className="h-6 w-6 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      Premium Comfort
                    </h3>
                    <p className="text-muted-foreground">
                      Memory foam ear cushions and adjustable headband for
                      all-day comfort without fatigue.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <Card className="p-8 border-0 shadow-premium">
                <CardContent className="p-0">
                  <h3 className="text-2xl text-center font-bold text-primary mb-6">
                    <span className="text-[#737373] mr-1">Regular</span> vs.{" "}
                    <span className="text-[#FBBD23] ml-1">Premium</span>
                  </h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <span className="text-muted-foreground">
                        Basic sound quality
                      </span>
                      <span className="text-accent font-semibold">
                        → Crystal clear audio
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <span className="text-muted-foreground">
                        Background noise
                      </span>
                      <span className="text-accent font-semibold">
                        → Active cancellation
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <span className="text-muted-foreground">
                        Short battery life
                      </span>
                      <span className="text-accent font-semibold">
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

      {/* Footer */}
      <footer className="py-12 px-6 bg-primary text-primary-foreground">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Premium Audio</h3>
              <p className="text-primary-foreground/80">
                Premium wireless headphones for the ultimate listening
                experience.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-primary-foreground/80">
                <li>Active Noise Cancellation</li>
                <li>30-Hour Battery Life</li>
                <li>Premium Comfort</li>
                <li>Bluetooth 5.0</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-primary-foreground/80">
                <li>
                  <Link
                    to="/about"
                    className="hover:text-accent transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="hover:text-accent transition-colors"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    to="/dashboard"
                    className="hover:text-accent transition-colors"
                  >
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-primary-foreground/80">
                <li>support@productconcierge.com</li>
                <li>+1 (555) 123-4567</li>
                <li>Available 24/7</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-primary-foreground/20 pt-8 mt-8 text-center text-primary-foreground/80">
            <p>&copy; 2025 Quibble. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
