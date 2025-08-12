import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Gift, Mail, CheckCircle } from "lucide-react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface PopupOfferProps {
  onClose?: () => void;
}

const PopupOffer: React.FC<PopupOfferProps> = ({ onClose }) => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Check if email has already been collected
  const emailCollected = localStorage.getItem('wellnessEmail') === email.trim();
  
  // If this email was already collected, don't show the popup
  if (emailCollected && email.trim()) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      // Store email in Firebase with email marketing data
      await addDoc(collection(db, "emailMarketing"), {
        email: email.trim(),
        timestamp: serverTimestamp(),
        userAgent: navigator.userAgent,
        source: "popup_collection",
        status: "active",
        emailSent: false,
        discountCodeSent: false,
        cartReminderSent: false,
        abandonmentEmailSent: false,
        lastActivity: serverTimestamp(),
        cartItems: [],
        purchaseHistory: [],
        tags: ["popup_collector"]
      });

      // Store email in localStorage to prevent showing popup again
      localStorage.setItem('wellnessEmail', email.trim());
      localStorage.setItem('emailCollectedAt', new Date().toISOString());
      
      setShowSuccess(true);
      
      // Close popup after 3 seconds
      setTimeout(() => {
        onClose?.();
      }, 3000);
      
    } catch (error) {
      console.error('Error saving email:', error);
      // Still mark as collected even if Firebase save fails
      localStorage.setItem('wellnessEmail', email.trim());
      localStorage.setItem('emailCollectedAt', new Date().toISOString());
      setShowSuccess(true);
      
      setTimeout(() => {
        onClose?.();
      }, 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose?.();
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
        <Card className="w-full max-w-md mx-auto shadow-2xl border-0 animate-in slide-in-from-bottom-4 duration-300 bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-8 text-center">
            <div className="h-16 w-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">
              Thank You!
            </h2>
            <p className="text-green-700 mb-4">
              Check your email for your exclusive 10% discount code!
            </p>
            <p className="text-sm text-green-600">
              We'll also send you special offers and wellness tips.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-md mx-auto shadow-2xl border-0 animate-in slide-in-from-bottom-4 duration-300 bg-gradient-to-br from-background to-muted/30">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-gradient-to-br from-accent to-accent/80 rounded-full flex items-center justify-center">
                <Gift className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-primary mb-1">
                  Get 10% Off!
                </h2>
                <p className="text-sm text-muted-foreground">
                  Enter your email to receive your discount code
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0 hover:bg-muted rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
                autoFocus
              />
            </div>

            <Button
              type="submit"
              disabled={!email.trim() || isSubmitting}
              className="w-full bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent text-accent-foreground font-bold py-3 text-base rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Get My Discount Code
                </>
              )}
            </Button>
          </form>

          {/* Benefits */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>10% off your first order</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>Exclusive wellness tips</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>Special offers & updates</span>
            </div>
          </div>

          {/* Social Proof */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Join 125+ shoppers who've already unlocked their discount!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PopupOffer; 