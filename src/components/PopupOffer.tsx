import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Gift, ChevronUp } from "lucide-react";

interface PopupOfferProps {
  onClose?: () => void;
  onGoalSelect?: (goal: string) => void;
}

// Load wellness goals from admin settings or use defaults
const loadWellnessGoals = () => {
  const adminDiscount = localStorage.getItem('adminDiscountOffer');
  if (adminDiscount) {
    try {
      const discountData = JSON.parse(adminDiscount);
      return discountData.goals || [
        "Build some serious strength",
        "Manage my weight", 
        "Get my digestion in check",
        "Support overall wellness & energy"
      ];
    } catch (error) {
      console.error('Error parsing admin discount data:', error);
    }
  }
  return [
    "Build some serious strength",
    "Manage my weight", 
    "Get my digestion in check",
    "Support overall wellness & energy"
  ];
};

const wellnessGoals = loadWellnessGoals();

const PopupOffer: React.FC<PopupOfferProps> = ({ onClose, onGoalSelect }) => {
  const [selectedGoal, setSelectedGoal] = useState<string>("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Load discount offer settings
  const loadDiscountSettings = () => {
    const adminDiscount = localStorage.getItem('adminDiscountOffer');
    if (adminDiscount) {
      try {
        return JSON.parse(adminDiscount);
      } catch (error) {
        console.error('Error parsing admin discount data:', error);
      }
    }
    return {
      enabled: true,
      percentage: 10,
      title: "What's Your #1 Wellness Goal?",
      description: "Help us personalize your journey and get 10% off your first order.",
      socialProof: {
        shopperCount: 125,
        message: "shoppers have unlocked 10% off in the past 24 hours!"
      }
    };
  };

  const discountSettings = loadDiscountSettings();
  const shopperCount = discountSettings.socialProof?.shopperCount || 125;

  // Check if discount has already been applied or used
  const wellnessDiscountApplied = localStorage.getItem('wellnessDiscountApplied') === 'true';
  const wellnessDiscountUsed = localStorage.getItem('wellnessDiscountUsed') === 'true';
  
  // If discount already applied and used, or if it was never applied, don't show the popup
  if (wellnessDiscountApplied || wellnessDiscountUsed) {
    return null;
  }

  const handleGoalSelect = (goal: string) => {
    setSelectedGoal(goal);
    onGoalSelect?.(goal);
  };

  const handleGetDiscount = () => {
    // Store the discount application in localStorage
    localStorage.setItem('wellnessDiscountApplied', 'true');
    localStorage.setItem('wellnessGoal', selectedGoal);
    localStorage.setItem('discountAppliedAt', new Date().toISOString());
    localStorage.setItem('wellnessDiscountPercentage', discountSettings.percentage.toString());
    
    console.log(`Applying ${discountSettings.percentage}% discount for goal:`, selectedGoal);
    onClose?.();
  };

  const handleCollapse = () => {
    setIsCollapsed(true);
  };

  const handleExpand = () => {
    setIsCollapsed(false);
  };

  // Auto-collapse after 10 seconds if not interacted with
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!selectedGoal) {
        setIsCollapsed(true);
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [selectedGoal]);

  if (isCollapsed) {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 duration-300">
        <Card className="shadow-xl border-0 bg-gradient-to-r from-accent to-accent/90 text-accent-foreground">
          <CardContent className="p-0">
            <Button
              onClick={handleExpand}
              variant="ghost"
              size="sm"
              className="h-auto p-4 text-accent-foreground hover:bg-accent/20 rounded-lg"
            >
                             <div className="flex items-center gap-3">
                 <div className="relative">
                   <Gift className="h-6 w-6" />
                 </div>
                                 <div className="text-left">
                   <div className="font-bold text-sm">Get {discountSettings.percentage}% Off</div>
                   <div className="text-xs opacity-80">Limited Time</div>
                 </div>
                <ChevronUp className="h-4 w-4" />
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
       <Card className="w-full max-w-4xl mx-auto shadow-2xl border-0 animate-in slide-in-from-bottom-4 duration-300 bg-gradient-to-br from-background to-muted/30">
         <CardContent className="p-6">
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             {/* Left Column - Header and Goals */}
             <div>
               {/* Header */}
               <div className="flex justify-between items-start mb-6">
                 <div className="flex-1">
                   <div className="flex items-center gap-3 mb-4">
                     <div className="h-10 w-10 bg-gradient-to-br from-accent to-accent/80 rounded-full flex items-center justify-center">
                       <Gift className="h-5 w-5 text-accent-foreground" />
                     </div>
                     <div>
                                               <h2 className="text-2xl font-bold text-primary mb-1">
                          {discountSettings.title}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {discountSettings.description.replace('10%', `${discountSettings.percentage}%`)}
                        </p>
                     </div>
                   </div>
                 </div>
                 <Button
                   variant="ghost"
                   size="sm"
                   onClick={handleCollapse}
                   className="h-8 w-8 p-0 hover:bg-muted rounded-full"
                 >
                   <X className="h-4 w-4" />
                 </Button>
               </div>

               {/* Goal Options */}
               <div className="space-y-3 mb-6">
                 {wellnessGoals.map((goal) => (
                   <label
                     key={goal}
                     className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                       selectedGoal === goal
                         ? "border-accent bg-accent/5 shadow-md"
                         : "border-border hover:border-accent/50 hover:bg-muted/30"
                     }`}
                   >
                     <div className="relative">
                       <input
                         type="radio"
                         name="wellness-goal"
                         value={goal}
                         checked={selectedGoal === goal}
                         onChange={() => handleGoalSelect(goal)}
                                                   className="h-4 w-4 text-accent border-2 border-border focus:ring-0"
                       />
                       
                     </div>
                     <span className="text-sm font-medium text-foreground">{goal}</span>
                   </label>
                 ))}
               </div>

               {/* CTA Button */}
               <Button
                 onClick={handleGetDiscount}
                 disabled={!selectedGoal}
                 className="w-full bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent text-accent-foreground font-bold py-3 text-base rounded-lg mb-4 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                                   <Gift className="mr-2 h-4 w-4" />
                  Get your {discountSettings.percentage}% off
               </Button>
             </div>

             {/* Right Column - Social Proof and Visual */}
             <div className="flex flex-col justify-center">
               <div className="text-center bg-muted/30 rounded-lg p-6">
                 <div className="flex items-center justify-center gap-2 mb-3">
                   <div className="flex -space-x-2">
                     {[...Array(3)].map((_, i) => (
                       <div key={i} className="h-8 w-8 bg-gradient-to-br from-accent to-accent/80 rounded-full border-2 border-background"></div>
                     ))}
                   </div>
                   <span className="text-sm font-semibold text-muted-foreground">
                     +{shopperCount - 3} others
                   </span>
                 </div>
                                   <p className="text-sm font-semibold text-muted-foreground mb-3">
                    {shopperCount} {discountSettings.socialProof?.message || "shoppers have unlocked 10% off in the past 24 hours!"}
                  </p>
                  <div className="bg-gradient-to-r from-accent/20 to-accent/10 rounded-lg p-4">
                    <div className="text-2xl font-bold text-accent mb-1">{discountSettings.percentage}% OFF</div>
                    <div className="text-xs text-muted-foreground">Limited Time Offer</div>
                  </div>
               </div>
             </div>
           </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PopupOffer; 