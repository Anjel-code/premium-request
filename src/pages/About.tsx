import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Users, Award, Globe, Clock, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
// Removed: import Navigation from "@/components/Navigation"; // Navigation is now handled in App.jsx

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation component is now rendered at the App.jsx level, not here. */}

      {/* Hero Section */}
      <section className="pt-36 pb-20 px-6">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-primary mb-6 animate-fade-in">
            About Our
            <span className="block text-accent">Brand</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-4xl mx-auto animate-slide-up">
            We are dedicated to finding and providing innovative,
            problem-solving products that enhance your daily life. Our mission
            is to bring you premium quality items that make a real difference.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-6 bg-gradient-subtle">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-primary mb-8">
                Our Mission
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                We believe that everyone deserves access to premium quality
                products that solve real problems and enhance daily life. Our
                mission is to curate and provide innovative solutions that make
                a meaningful difference.
              </p>
              <p className="text-lg text-muted-foreground mb-8">
                Every product we offer is carefully selected for its quality,
                functionality, and value. We're committed to bringing you items
                that exceed expectations and deliver genuine benefits.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-accent mb-2">2370+</h3>
                  <p className="text-muted-foreground">Satisfied Clients</p>
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-accent mb-2">100%</h3>
                  <p className="text-muted-foreground">Success Rate</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <Card className="p-8 border-0 shadow-premium">
                <CardContent className="p-0 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Shield className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">
                        Quality Guarantee
                      </h3>
                      <p className="text-muted-foreground">
                        Every product recommendation is thoroughly vetted for
                        quality, authenticity, and value.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">
                        Time Savings
                      </h3>
                      <p className="text-muted-foreground">
                        We handle all research, comparison, and negotiation,
                        saving you dozens of hours.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">
                        Personalized Service
                      </h3>
                      <p className="text-muted-foreground">
                        Every request receives individual attention from our
                        specialized team members.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center text-primary mb-16">
            Our Core Values
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-elegant text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-4">
                  Client-Centric Approach
                </h3>
                <p className="text-muted-foreground">
                  Your needs, preferences, and satisfaction are at the center of
                  everything we do. We adapt our process to match your
                  requirements.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-elegant text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Award className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-4">
                  Excellence in Execution
                </h3>
                <p className="text-muted-foreground">
                  We maintain the highest standards in research methodology,
                  vendor relationships, and service delivery.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-elegant text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Globe className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Global Network</h3>
                <p className="text-muted-foreground">
                  Our extensive network of suppliers, manufacturers, and
                  specialists spans across industries and continents.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-6 bg-gradient-subtle">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center text-primary mb-8">
            Our Commitment
          </h2>
          <p className="text-lg text-center text-muted-foreground mb-16 max-w-3xl mx-auto">
            We're committed to providing exceptional products and outstanding
            customer service. Our team works tirelessly to ensure every
            interaction exceeds your expectations.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-elegant text-center">
              <CardContent className="p-8">
                <div className="w-20 h-20 bg-accent/10 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Quality Assurance
                </h3>
                <p className="text-accent font-medium mb-4">Rigorous Testing</p>
                <p className="text-muted-foreground text-sm">
                  Every product undergoes thorough quality testing to ensure it
                  meets our high standards before reaching you.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-elegant text-center">
              <CardContent className="p-8">
                <div className="w-20 h-20 bg-accent/10 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <Shield className="h-10 w-10 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Customer Satisfaction
                </h3>
                <p className="text-accent font-medium mb-4">Your Success</p>
                <p className="text-muted-foreground text-sm">
                  We're committed to your complete satisfaction with every
                  product and every interaction.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-elegant text-center">
              <CardContent className="p-8">
                <div className="w-20 h-20 bg-accent/10 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <Clock className="h-10 w-10 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
                <p className="text-accent font-medium mb-4">Quick & Reliable</p>
                <p className="text-muted-foreground text-sm">
                  Fast, reliable shipping ensures your products arrive quickly
                  and in perfect condition.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-primary mb-6">
            Experience Premium Quality
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Ready to discover products that make a real difference? Browse our
            carefully curated selection and find the perfect solution for your
            needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8 py-6"
            >
              <Link to="/store">Shop Now</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="text-lg px-8 py-6 border-accent text-accent hover:bg-accent/10"
            >
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
