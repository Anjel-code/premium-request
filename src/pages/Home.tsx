import { Link } from "react-router-dom";
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
import Navigation from "@/components/Navigation";
import TestimonialCarousel from "@/components/TestimonialCarousel";
import AnimatedCounter from "@/components/AnimatedCounter";

const Home = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Navigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden  px-6 bg-[url('/public/hero-background.jpg')] bg-no-repeat bg-cover bg-bottom">
        <div className="absolute inset-0 z-0 bg-black/35"></div>
        <div className="relative container mx-auto text-center pt-36 pb-36 z-10">
          <h1 className="text-5xl md:text-7xl font-bold text-stone-100 mb-6 animate-fade-in">
            Your Personal Product
            <span className="block text-accent">Concierge</span>
          </h1>
          <p className="text-xl md:text-2xl text-stone-300 mb-8 max-w-3xl mx-auto animate-slide-up">
            From concept to delivery, we handle every aspect of finding,
            sourcing, and acquiring any product you need. Experience the luxury
            of having a dedicated team work exclusively for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-scale-in">
            <Button
              asChild
              variant="premium"
              size="lg"
              className="text-lg px-8 py-6"
            >
              <Link to="/order">
                <span className="relative z-10">Start Your Request</span>{" "}
                <ArrowRight className="ml-2 h-5 w-5 z-10" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="text-lg px-8 py-6 border-accent text-accent hover:bg-accent/10"
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

      {/* How It Works */}
      <section className="py-20 px-6 bg-gradient-subtle">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center text-primary mb-16">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-elegant">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-accent">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-4">
                  Tell Us What You Need
                </h3>
                <p className="text-muted-foreground">
                  Describe your product requirements through our intelligent
                  conversation system. No detail is too small.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-elegant">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-accent">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-4">
                  We Research & Source
                </h3>
                <p className="text-muted-foreground">
                  Our experts analyze your needs, research options, negotiate
                  prices, and handle all procurement logistics.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-elegant">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-accent">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-4">Receive & Enjoy</h3>
                <p className="text-muted-foreground">
                  Track progress in real-time and receive your perfectly sourced
                  products with complete documentation.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-primary mb-8">
                Why Choose Our Service
              </h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <CheckCircle className="h-6 w-6 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      Expert Research & Analysis
                    </h3>
                    <p className="text-muted-foreground">
                      Our team conducts comprehensive market research to find
                      the best products at optimal prices.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Clock className="h-6 w-6 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      Time-Saving Convenience
                    </h3>
                    <p className="text-muted-foreground">
                      Focus on what matters while we handle all the
                      time-consuming research and procurement processes.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Shield className="h-6 w-6 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      Quality Assurance
                    </h3>
                    <p className="text-muted-foreground">
                      Every product is thoroughly vetted for quality,
                      authenticity, and value before recommendation.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <Card className="p-8 border-0 shadow-premium">
                <CardContent className="p-0">
                  <h3 className="text-2xl text-center font-bold text-primary mb-6">
                    <span className="text-[#737373] mr-1">Before</span> vs.{" "}
                    <span className="text-[#FBBD23] ml-1">After</span>
                  </h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <span className="text-muted-foreground">
                        Hours of research
                      </span>
                      <span className="text-accent font-semibold">
                        → Expert analysis
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <span className="text-muted-foreground">
                        Uncertain choices
                      </span>
                      <span className="text-accent font-semibold">
                        → Confident decisions
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <span className="text-muted-foreground">
                        Scattered purchases
                      </span>
                      <span className="text-accent font-semibold">
                        → Streamlined process
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
            Ready to Experience Premium Service?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join hundreds of satisfied clients who trust us with their most
            important product needs.
          </p>
          <Button
            asChild
            variant="glow"
            size="lg"
            className="text-lg px-8 py-6"
          >
            <Link to="/order">
              Start Your Request Today <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-primary text-primary-foreground">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Quibble</h3>
              <p className="text-primary-foreground/80">
                Premium personal shopping and product sourcing services.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-primary-foreground/80">
                <li>Product Research</li>
                <li>Price Negotiation</li>
                <li>Quality Assurance</li>
                <li>Logistics Management</li>
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
