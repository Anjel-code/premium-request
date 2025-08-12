import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, Clock, Send, Menu, X, Home, User, Info, MessageCircle, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";
// Removed: import Navigation from "@/components/Navigation"; // Navigation is now handled in App.jsx
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    closeMobileMenu();
  };

  const handleSubmit = (e) => {
    // Removed React.FormEvent type for broader compatibility
    e.preventDefault();
    // Here you would typically send the form data to your backend
    toast({
      title: "Message Sent",
      description:
        "Thank you for your message. We'll get back to you within 24 hours.",
    });
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  const handleInputChange = (
    e // Removed explicit type for broader compatibility
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Navigation Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-border shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMobileMenu}
            className="flex items-center gap-2 text-primary hover:text-primary/80"
          >
            <Menu className="h-5 w-5" />
            <span className="text-sm font-medium">Menu</span>
          </Button>
          <div className="text-lg font-bold text-primary">Contact</div>
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Mobile Sidebar Menu */}
      <div className={`lg:hidden fixed inset-0 z-50 transition-opacity duration-300 ${
        isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={closeMobileMenu}
        ></div>

        {/* Sidebar */}
        <div className={`absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-xl transform transition-transform duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-primary">Navigation</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeMobileMenu}
              className="p-2"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation Links */}
          <div className="p-4 space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12 text-left"
              onClick={() => handleNavigation('/')}
            >
              <Home className="h-5 w-5" />
              <span>Home</span>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12 text-left"
              onClick={() => handleNavigation('/dashboard')}
            >
              <User className="h-5 w-5" />
              <span>Dashboard</span>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12 text-left"
              onClick={() => handleNavigation('/store')}
            >
              <Shield className="h-5 w-5" />
              <span>Store</span>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12 text-left"
              onClick={() => handleNavigation('/about')}
            >
              <Info className="h-5 w-5" />
              <span>About</span>
            </Button>
          </div>

          {/* Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
            <div className="text-sm text-muted-foreground text-center">
              Premium Request Store
            </div>
          </div>
        </div>
      </div>

      {/* Add top padding for mobile to account for fixed header */}
      <div className="lg:hidden pt-16"></div>

      {/* Navigation component is now rendered at the App.jsx level, not here. */}

      {/* Hero Section */}
      <section className="pt-36 pb-20 px-6">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-primary mb-6 animate-fade-in">
            Contact
            <span className="block text-accent">Us</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto animate-slide-up">
            Have questions about our services? Need assistance with an existing
            order? Our dedicated team is here to help you every step of the way.
          </p>
        </div>
      </section>

      <div className="pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="border-0 shadow-premium">
              <CardHeader>
                <CardTitle className="text-2xl">Send Us a Message</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Your full name"
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="your@email.com"
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="How can we help you?"
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Please describe your inquiry or request in detail..."
                      required
                      className="mt-1 min-h-[120px]"
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-8">
              <Card className="border-0 shadow-elegant">
                <CardHeader>
                  <CardTitle className="text-2xl">Get in Touch</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Email Us</h3>
                      <p className="text-muted-foreground mb-2">
                        General inquiries and support
                      </p>
                      <a
                        href="mailto:contact.quibble@gmail.com"
                        className="text-accent hover:underline"
                      >
                        contact.quibble@gmail.com
                      </a>
                    </div>
                  </div>

                  {/* <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Phone className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Call Us</h3>
                      <p className="text-muted-foreground mb-2">
                        Speak directly with our team
                      </p>
                      <a
                        href="tel:+15125081563"
                        className="text-accent hover:underline"
                      >
                        +1 (555) 123-4567
                      </a>
                    </div>
                  </div> */}

                  {/* <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Visit Us</h3>
                      <p className="text-muted-foreground mb-2">
                        Our headquarters
                      </p>
                      <address className="text-accent not-italic">
                        123 Business Plaza
                        <br />
                        Suite 456
                        <br />
                        New York, NY 10001
                      </address>
                    </div>
                  </div> */}

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">
                        Business Hours
                      </h3>
                      <div className="text-muted-foreground space-y-1">
                        <p>Monday - Friday: 8:00 AM - 8:00 PM EST</p>
                        <p>Saturday: 10:00 AM - 6:00 PM EST</p>
                        <p>Sunday: 12:00 PM - 5:00 PM EST</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-elegant">
                <CardContent className="p-8 text-center">
                  <h3 className="text-xl font-semibold mb-4">
                    Need Immediate Assistance?
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    For urgent matters or existing order inquiries, access your
                    dashboard for real-time support.
                  </p>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="w-full border-accent text-accent hover:bg-accent/10"
                  >
                    <Link to="/dashboard">Access Dashboard</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-gradient-subtle">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center text-primary mb-16">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="border-0 shadow-elegant">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-3">
                  How long does the typical request take?
                </h3>
                <p className="text-muted-foreground">
                  Most requests are completed within 5-10 business days,
                  depending on complexity and product availability. Urgent
                  requests can often be expedited.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-elegant">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-3">
                  What are your service fees?
                </h3>
                <p className="text-muted-foreground">
                  Our fees vary based on the complexity of your request. We
                  provide transparent pricing upfront with no hidden costs.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-elegant">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-3">
                  Do you handle international sourcing?
                </h3>
                <p className="text-muted-foreground">
                  Yes, we have a global network of suppliers and can source
                  products from anywhere in the world, handling all logistics
                  and customs.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-elegant">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-3">
                  What if I'm not satisfied with the results?
                </h3>
                <p className="text-muted-foreground">
                  We offer a satisfaction guarantee. If we don't meet your
                  expectations, we'll work with you to make it right or provide
                  a full refund.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
