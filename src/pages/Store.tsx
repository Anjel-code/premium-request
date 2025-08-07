import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Star,
  Truck,
  Shield,
  CheckCircle,
  ShoppingCart,
  Heart,
  Share2,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  Play,
  CreditCard,
  Lock,
  Loader2,
  Settings,
  Edit,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  createStoreOrder,
  createStoreOrderNotification,
} from "@/lib/storeUtils";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import PopupOffer from "@/components/PopupOffer";
import AdminStoreEditor from "@/components/AdminStoreEditor";
import ReviewsEditor from "@/components/ReviewsEditor";
import { isAdmin } from "@/lib/userUtils";

// Product data interface - this will be easily configurable
interface ProductData {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  images: string[];
  videos: string[];
  rating: number;
  reviewCount: number;
  benefits: string[];
  features: string[];
  specifications: Record<string, string>;
  reviews: Review[];
  faqs: FAQ[];
  stockCount: number;
  shippingInfo: string;
  guarantee: string;
  returnPolicy: string;
}

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
  image?: string;
  productImage?: string;
  profileImage?: string;
}

interface FAQ {
  question: string;
  answer: string;
}

// Mock product data - this will be easily replaceable for different products
const mockProductData: ProductData = {
  id: "premium-wireless-headphones",
  name: "Premium Wireless Noise-Canceling Headphones",
  description:
    "Experience crystal-clear sound with our premium wireless headphones featuring active noise cancellation, 30-hour battery life, and premium comfort for all-day wear.",
  price: 199.99,
  originalPrice: 299.99,
  images: [
    "/placeholder.svg",
    "/placeholder.svg",
    "/placeholder.svg",
    "/placeholder.svg",
  ],
  videos: ["https://www.youtube.com/embed/dQw4w9WgXcQ"],
  rating: 4.8,
  reviewCount: 1247,
  benefits: [
    "Active noise cancellation for immersive listening",
    "30-hour battery life with quick charge",
    "Premium comfort with memory foam ear cushions",
    "Bluetooth 5.0 with stable connection",
  ],
  features: [
    "Active Noise Cancellation",
    "30-Hour Battery Life",
    "Quick Charge (10 min = 5 hours)",
    "Bluetooth 5.0",
    "Touch Controls",
    "Built-in Microphone",
    "Foldable Design",
    "Carrying Case Included",
  ],
  specifications: {
    "Driver Size": "40mm",
    "Frequency Response": "20Hz - 20kHz",
    Impedance: "32Ω",
    Sensitivity: "110dB",
    "Battery Life": "30 hours",
    "Charging Time": "2 hours",
    Weight: "250g",
    Connection: "Bluetooth 5.0",
  },
          reviews: [
          {
            id: "1",
            name: "Sarah M.",
            rating: 5,
            comment:
              "These headphones are incredible! The noise cancellation is amazing and the battery life is exactly as advertised. Worth every penny!",
            date: "2024-01-15",
            verified: true,
            productImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop",
            profileImage: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
          },
          {
            id: "2",
            name: "Mike R.",
            rating: 5,
            comment:
              "Best headphones I've ever owned. The sound quality is outstanding and they're so comfortable I forget I'm wearing them.",
            date: "2024-01-10",
            verified: true,
            productImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop",
            profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
          },
          {
            id: "3",
            name: "Jennifer L.",
            rating: 4,
            comment:
              "Great sound quality and very comfortable. The only minor issue is the touch controls can be a bit sensitive sometimes.",
            date: "2024-01-08",
            verified: true,
            productImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop",
            profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
          },
          {
            id: "4",
            name: "David K.",
            rating: 5,
            comment:
              "Absolutely love these headphones! The sound quality is crystal clear and the noise cancellation works perfectly for my daily commute.",
            date: "2024-01-05",
            verified: true,
            productImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop",
            profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
          },
          {
            id: "5",
            name: "Emma T.",
            rating: 5,
            comment:
              "Perfect for work calls and music. The microphone quality is excellent and the battery lasts all day. Highly recommend!",
            date: "2024-01-03",
            verified: true,
            productImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop",
            profileImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
          },
        ],
  faqs: [
    {
      question: "How long does shipping take?",
      answer:
        "We offer free 3-day shipping on all orders. Express shipping is available for an additional fee.",
    },
    {
      question: "What's included in the warranty?",
      answer:
        "All products come with a 1-year manufacturer warranty covering defects in materials and workmanship.",
    },
    {
      question: "Can I return the product if I'm not satisfied?",
      answer:
        "Yes! We offer a 30-day money-back guarantee. If you're not completely satisfied, return the product for a full refund.",
    },
    {
      question: "Do you ship internationally?",
      answer:
        "Currently, we ship to the United States, Canada, and select European countries. Contact us for international shipping options.",
    },
  ],
  stockCount: 15,
  shippingInfo: "Free 3-day shipping",
  guarantee: "30-day money-back guarantee",
  returnPolicy: "Easy returns within 30 days",
};

interface StoreProps {
  user?: {
    uid: string;
    email: string;
    displayName: string;
  } | null;
  appId?: string;
}

const Store: React.FC<StoreProps> = ({ user, appId }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPopupOffer, setShowPopupOffer] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showReviewsEditor, setShowReviewsEditor] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [visibleReviews, setVisibleReviews] = useState(12);
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toast } = useToast();

  // Check if user is admin by querying the database
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
        
        if (adminStatus) {
          console.log('🔧 Admin role confirmed - Edit Store button should be visible');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdminUser(false);
      } finally {
        setIsCheckingAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user?.uid]);

  // Load product data - check for admin-saved data first, then fall back to mock data
  const loadProductData = (): ProductData => {
    const adminProduct = localStorage.getItem('adminStoreProduct');
    if (adminProduct) {
      try {
        return JSON.parse(adminProduct);
      } catch (error) {
        console.error('Error parsing admin product data:', error);
      }
    }
    return mockProductData;
  };

  const product = loadProductData();
  
  // Check if wellness discount is applied and not yet used
  const wellnessDiscountApplied = localStorage.getItem('wellnessDiscountApplied') === 'true';
  const wellnessDiscountUsed = localStorage.getItem('wellnessDiscountUsed') === 'true';
  
  // Load discount offer settings
  const loadDiscountOffer = () => {
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
      goals: [
        "Build some serious strength",
        "Manage my weight",
        "Get my digestion in check",
        "Support overall wellness & energy"
      ],
      socialProof: {
        shopperCount: 125,
        message: "shoppers have unlocked 10% off in the past 24 hours!"
      }
    };
  };

  const discountOffer = loadDiscountOffer();
  
  // Get the actual discount percentage that was applied (from localStorage)
  const appliedDiscountPercentage = localStorage.getItem('wellnessDiscountPercentage');
  const wellnessDiscountPercentage = appliedDiscountPercentage 
    ? parseInt(appliedDiscountPercentage) 
    : discountOffer.percentage;
  
  // Calculate final price with wellness discount if applied and not used
  const finalPrice = (wellnessDiscountApplied && !wellnessDiscountUsed && discountOffer.enabled)
    ? product.price * (1 - wellnessDiscountPercentage / 100)
    : product.price;
    
  const discountPercentage = Math.round(
    ((product.originalPrice - product.price) / product.originalPrice) * 100
  );

  const handleBuyNow = () => {
    // Validate stock availability
    if (quantity > product.stockCount) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${product.stockCount} items available in stock.`,
        variant: "destructive",
      });
      return;
    }

    // Create order info for direct purchase (not cart)
    const orderInfo = {
      orderId: `direct_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      items: [{
        name: product.name,
        price: finalPrice,
        quantity,
        image: product.images[0],
      }],
      totalPrice: finalPrice * quantity,
      createdAt: new Date().toISOString(),
    };

    // Store in sessionStorage for checkout page
    sessionStorage.setItem("directOrderInfo", JSON.stringify(orderInfo));
    
    // Navigate to checkout page
    navigate("/checkout");
  };

  const handleAddToCart = () => {
    // Validate stock availability
    if (quantity > product.stockCount) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${product.stockCount} items available in stock.`,
        variant: "destructive",
      });
      return;
    }

    addToCart({
      productId: product.id,
      name: product.name,
      price: finalPrice,
      quantity,
      image: product.images[0],
    });

    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleGoalSelect = (goal: string) => {
    console.log("Selected wellness goal:", goal);
    // You can store this in localStorage or send to your backend
    localStorage.setItem("userWellnessGoal", goal);
  };

  const handlePopupClose = () => {
    setShowPopupOffer(false);
  };

  const handleEditStore = () => {
    if (isAdminUser) {
      setIsEditing(true);
    } else {
      toast({
        title: "Access Denied",
        description: "You don't have admin privileges.",
        variant: "destructive",
      });
    }
  };

  const handleSaveStore = (updatedProduct: ProductData, updatedDiscountOffer: any) => {
    // The AdminStoreEditor already saves to localStorage
    // Here we can add additional logic like saving to database
    setIsEditing(false);
    
    // Reload the page to reflect changes
    window.location.reload();
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveReviews = (updatedReviews: Review[]) => {
    const updatedProduct = { ...product, reviews: updatedReviews };
    localStorage.setItem('adminStoreProduct', JSON.stringify(updatedProduct));
    setShowReviewsEditor(false);
  };

  const handleCancelReviews = () => {
    setShowReviewsEditor(false);
  };

  const handleLoadMoreReviews = () => {
    const remainingReviews = product.reviews.length - visibleReviews;
    const nextBatch = Math.min(12, remainingReviews);
    setVisibleReviews(prev => prev + nextBatch);
  };

  const nextImage = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setSelectedImage((prev) => (prev + 1) % product.images.length);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const prevImage = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setSelectedImage(
      (prev) => (prev - 1 + product.images.length) % product.images.length
    );
    setTimeout(() => setIsTransitioning(false), 300);
  };

  // Show popup after 3 seconds only if discount hasn't been applied or used
  useEffect(() => {
    const wellnessDiscountApplied = localStorage.getItem('wellnessDiscountApplied') === 'true';
    const wellnessDiscountUsed = localStorage.getItem('wellnessDiscountUsed') === 'true';
    
    if (!wellnessDiscountApplied || wellnessDiscountUsed || !discountOffer.enabled) {
      return; // Don't show popup if discount is applied and used, disabled, or if it was never applied
    }
    
    const timer = setTimeout(() => {
      setShowPopupOffer(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [discountOffer.enabled]);

  // If in reviews editing mode, show the reviews editor
  if (showReviewsEditor) {
    return (
      <ReviewsEditor
        reviews={product.reviews}
        onSave={handleSaveReviews}
        onCancel={handleCancelReviews}
      />
    );
  }

  // If in editing mode, show the admin editor
  if (isEditing) {
    return (
      <AdminStoreEditor
        product={product}
        onSave={handleSaveStore}
        onCancel={handleCancelEdit}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
            <Button
              onClick={handleEditStore}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
            >
              <Edit className="h-4 w-4" />
              Edit Store
            </Button>
          </div>
        </div>
      ) : null}

      {showPopupOffer && (
        <PopupOffer
          onClose={handlePopupClose}
          onGoalSelect={handleGoalSelect}
        />
      )}
      {/* Hero Section */}
      <section className="pt-24 pb-12 px-6">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className={`w-full h-full object-cover cursor-zoom-in transition-all duration-300 ease-in-out ${
                    isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
                  }`}
                />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                  <ZoomIn className="h-8 w-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95 disabled:pointer-events-none [&:not(:disabled)]:active:animate-none"
                  onClick={prevImage}
                  disabled={isTransitioning}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95 disabled:pointer-events-none [&:not(:disabled)]:active:animate-none"
                  onClick={nextImage}
                  disabled={isTransitioning}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Thumbnail Images */}
              <div className="flex gap-2 overflow-x-auto overflow-y-hidden p-1">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (isTransitioning) return;
                      setIsTransitioning(true);
                      setSelectedImage(index);
                      setTimeout(() => setIsTransitioning(false), 300);
                    }}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ease-in-out transform hover:scale-105 disabled:pointer-events-none ${
                      selectedImage === index
                        ? "border-accent scale-105"
                        : "border-transparent hover:border-muted-foreground/20"
                    }`}
                    disabled={isTransitioning}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-primary mb-2">
                  {product.name}
                </h1>

                {/* Rating and Reviews */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(product.rating)
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {product.rating} ({product.reviewCount} reviews)
                  </span>
                </div>

                {/* Pricing */}
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl font-bold text-primary">
                    ${finalPrice.toFixed(2)}
                  </span>
                  <span className="text-lg text-muted-foreground line-through">
                    ${product.originalPrice}
                  </span>
                  <div className="flex gap-2">
                    <Badge variant="destructive" className="text-sm">
                      Save {discountPercentage}%
                    </Badge>
                    {(wellnessDiscountApplied && !wellnessDiscountUsed) && (
                      <Badge variant="secondary" className="text-sm bg-accent text-accent-foreground">
                        +{wellnessDiscountPercentage}% Off
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Stock Alert */}
                {product.stockCount <= 20 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-6">
                    <p className="text-sm text-orange-800">
                      ⚠️ Only {product.stockCount} left in stock!
                    </p>
                  </div>
                )}

                {/* Key Benefits */}
                <div className="space-y-2 mb-6">
                  {product.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">
                        {benefit}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Quantity Selector */}
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-sm font-medium">Quantity:</span>
                  <div className="flex items-center border rounded-lg">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3"
                      disabled={quantity <= 1}
                    >
                      -
                    </Button>
                    <span className="px-4 py-2 text-sm font-medium">
                      {quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(Math.min(product.stockCount, quantity + 1))}
                      className="px-3"
                      disabled={quantity >= product.stockCount}
                    >
                      +
                    </Button>
                  </div>
                  {quantity >= product.stockCount && (
                    <span className="text-sm text-orange-600 font-medium">
                      Max available: {product.stockCount}
                    </span>
                  )}
                </div>

                                 {/* Primary CTA */}
                 <Button
                   onClick={handleBuyNow}
                   disabled={isProcessing || quantity > product.stockCount}
                   size="lg"
                   className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6 mb-4"
                 >
                   {isProcessing ? (
                     <>
                       <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                       Processing...
                     </>
                   ) : (
                     <>
                       <CreditCard className="mr-2 h-5 w-5" />
                       Buy Now - ${(finalPrice * quantity).toFixed(2)}
                     </>
                   )}
                 </Button>

                 {/* Add to Cart Button */}
                 <Button
                   onClick={handleAddToCart}
                   disabled={isProcessing || quantity > product.stockCount}
                   variant="outline"
                   size="lg"
                   className="w-full border-accent text-accent hover:bg-accent/10 text-lg py-6 mb-4"
                 >
                   <ShoppingCart className="mr-2 h-5 w-5" />
                   Add to Cart - ${(finalPrice * quantity).toFixed(2)}
                 </Button>

                                 {/* Secondary Actions */}
                 <div className="flex gap-2">
                   <Button
                     variant="ghost"
                     size="lg"
                     className="flex-1"
                     onClick={() => setIsWishlisted(!isWishlisted)}
                   >
                     <Heart
                       className={`mr-2 h-5 w-5 ${
                         isWishlisted ? "fill-red-500 text-red-500" : ""
                       }`}
                     />
                     {isWishlisted ? "Wishlisted" : "Wishlist"}
                   </Button>
                   <Button variant="ghost" size="lg">
                     <Share2 className="mr-2 h-5 w-5" />
                     Share
                   </Button>
                 </div>

                {/* Trust Indicators */}
                <div className="space-y-3 pt-6 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Truck className="h-4 w-4" />
                    <span>{product.shippingInfo}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <span>{product.guarantee}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <CreditCard className="h-4 w-4 text-green-600" />
                      <span className="text-xs text-muted-foreground">
                        Visa
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CreditCard className="h-4 w-4 text-blue-600" />
                      <span className="text-xs text-muted-foreground">
                        Mastercard
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Lock className="h-4 w-4 text-green-600" />
                      <span className="text-xs text-muted-foreground">
                        SSL Secure
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Information */}
      <section className="py-12 px-6 bg-muted/30">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Product Description */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-primary mb-4">
                  Product Description
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Features */}
              <div>
                <h3 className="text-xl font-semibold text-primary mb-4">
                  Key Features
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {product.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Specifications */}
              <div>
                <h3 className="text-xl font-semibold text-primary mb-4">
                  Technical Specifications
                </h3>
                <div className="bg-white rounded-lg border">
                  {Object.entries(product.specifications).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className="flex justify-between py-3 px-4 border-b last:border-b-0"
                      >
                        <span className="font-medium text-sm">{key}</span>
                        <span className="text-sm text-muted-foreground">
                          {value}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Product Videos */}
              {product.videos.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-primary mb-4">
                    Product Video
                  </h3>
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                    <iframe
                      src={product.videos[0]}
                      title="Product Video"
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
            </div>
            {/* Empty column for grid layout */}
            <div className="hidden lg:block"></div>
          </div>
        </div>
      </section>

      {/* Customer Reviews Section - Masonry Layout */}
      <section className="py-12 px-6 bg-muted/20">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-primary">
              Reviews
            </h2>
            {isAdminUser && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReviewsEditor(true)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Reviews
              </Button>
            )}
          </div>
          
                     {/* Custom Masonry Layout */}
           <div className="flex gap-6">
             {/* Column 1 - Tall cards */}
             <div className="flex-1 space-y-6">
               {product.reviews.slice(0, visibleReviews).map((review, index) => {
                 if (index % 4 !== 0) return null; // Only show cards for column 1
                 return (
                   <div key={review.id} className="transform transition-all duration-300 hover:scale-105">
                     <Card className="border shadow-sm bg-white overflow-hidden h-[500px]">
                       <div className="w-full">
                         <img
                           src={review.productImage || review.image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop"}
                           alt="Product"
                           className="w-full object-cover h-80"
                         />
                       </div>
                       <CardContent className="p-3">
                         <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                           "{review.comment}"
                         </p>
                         <div className="flex items-center gap-3">
                           <div className="flex-shrink-0">
                             <img
                               src={review.profileImage || review.image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face"}
                               alt={review.name}
                               className="w-8 h-8 rounded-full object-cover"
                             />
                           </div>
                           <div className="flex-1">
                             <span className="text-sm font-medium text-foreground">
                               {review.name}
                             </span>
                             <div className="flex items-center gap-2 mt-1">
                               <div className="flex items-center gap-1">
                                 {[...Array(5)].map((_, i) => (
                                   <Star
                                     key={i}
                                     className={`h-3 w-3 ${
                                       i < review.rating
                                         ? "text-yellow-400 fill-current"
                                         : "text-gray-300"
                                     }`}
                                   />
                                 ))}
                               </div>
                               {review.verified && (
                                 <CheckCircle className="h-3 w-3 text-green-600" />
                               )}
                             </div>
                           </div>
                           <span className="text-xs text-muted-foreground">
                             {new Date(review.date).toLocaleDateString()}
                           </span>
                         </div>
                       </CardContent>
                     </Card>
                   </div>
                 );
               })}
             </div>

             {/* Column 2 - Short cards */}
             <div className="flex-1 space-y-6">
               {product.reviews.slice(0, visibleReviews).map((review, index) => {
                 if (index % 4 !== 1) return null; // Only show cards for column 2
                 return (
                   <div key={review.id} className="transform transition-all duration-300 hover:scale-105">
                     <Card className="border shadow-sm bg-white overflow-hidden h-[450px]">
                       <div className="w-full">
                         <img
                           src={review.productImage || review.image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop"}
                           alt="Product"
                           className="w-full object-cover h-72"
                         />
                       </div>
                       <CardContent className="p-3">
                         <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                           "{review.comment}"
                         </p>
                         <div className="flex items-center gap-3">
                           <div className="flex-shrink-0">
                             <img
                               src={review.profileImage || review.image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face"}
                               alt={review.name}
                               className="w-8 h-8 rounded-full object-cover"
                             />
                           </div>
                           <div className="flex-1">
                             <span className="text-sm font-medium text-foreground">
                               {review.name}
                             </span>
                             <div className="flex items-center gap-2 mt-1">
                               <div className="flex items-center gap-1">
                                 {[...Array(5)].map((_, i) => (
                                   <Star
                                     key={i}
                                     className={`h-3 w-3 ${
                                       i < review.rating
                                         ? "text-yellow-400 fill-current"
                                         : "text-gray-300"
                                     }`}
                                   />
                                 ))}
                               </div>
                               {review.verified && (
                                 <CheckCircle className="h-3 w-3 text-green-600" />
                               )}
                             </div>
                           </div>
                           <span className="text-xs text-muted-foreground">
                             {new Date(review.date).toLocaleDateString()}
                           </span>
                         </div>
                       </CardContent>
                     </Card>
                   </div>
                 );
               })}
             </div>

             {/* Column 3 - Tall cards */}
             <div className="flex-1 space-y-6">
               {product.reviews.slice(0, visibleReviews).map((review, index) => {
                 if (index % 4 !== 2) return null; // Only show cards for column 3
                 return (
                   <div key={review.id} className="transform transition-all duration-300 hover:scale-105">
                     <Card className="border shadow-sm bg-white overflow-hidden h-[500px]">
                       <div className="w-full">
                         <img
                           src={review.productImage || review.image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop"}
                           alt="Product"
                           className="w-full object-cover h-80"
                         />
                       </div>
                       <CardContent className="p-3">
                         <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                           "{review.comment}"
                         </p>
                         <div className="flex items-center gap-3">
                           <div className="flex-shrink-0">
                             <img
                               src={review.profileImage || review.image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face"}
                               alt={review.name}
                               className="w-8 h-8 rounded-full object-cover"
                             />
                           </div>
                           <div className="flex-1">
                             <span className="text-sm font-medium text-foreground">
                               {review.name}
                             </span>
                             <div className="flex items-center gap-2 mt-1">
                               <div className="flex items-center gap-1">
                                 {[...Array(5)].map((_, i) => (
                                   <Star
                                     key={i}
                                     className={`h-3 w-3 ${
                                       i < review.rating
                                         ? "text-yellow-400 fill-current"
                                         : "text-gray-300"
                                     }`}
                                   />
                                 ))}
                               </div>
                               {review.verified && (
                                 <CheckCircle className="h-3 w-3 text-green-600" />
                               )}
                             </div>
                           </div>
                           <span className="text-xs text-muted-foreground">
                             {new Date(review.date).toLocaleDateString()}
                           </span>
                         </div>
                       </CardContent>
                     </Card>
                   </div>
                 );
               })}
             </div>

             {/* Column 4 - Short cards */}
             <div className="flex-1 space-y-6">
               {product.reviews.slice(0, visibleReviews).map((review, index) => {
                 if (index % 4 !== 3) return null; // Only show cards for column 4
                 return (
                   <div key={review.id} className="transform transition-all duration-300 hover:scale-105">
                     <Card className="border shadow-sm bg-white overflow-hidden h-[450px]">
                       <div className="w-full">
                         <img
                           src={review.productImage || review.image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop"}
                           alt="Product"
                           className="w-full object-cover h-72"
                         />
                       </div>
                       <CardContent className="p-3">
                         <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                           "{review.comment}"
                         </p>
                         <div className="flex items-center gap-3">
                           <div className="flex-shrink-0">
                             <img
                               src={review.profileImage || review.image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face"}
                               alt={review.name}
                               className="w-8 h-8 rounded-full object-cover"
                             />
                           </div>
                           <div className="flex-1">
                             <span className="text-sm font-medium text-foreground">
                               {review.name}
                             </span>
                             <div className="flex items-center gap-2 mt-1">
                               <div className="flex items-center gap-1">
                                 {[...Array(5)].map((_, i) => (
                                   <Star
                                     key={i}
                                     className={`h-3 w-3 ${
                                       i < review.rating
                                         ? "text-yellow-400 fill-current"
                                         : "text-gray-300"
                                     }`}
                                   />
                                 ))}
                               </div>
                               {review.verified && (
                                 <CheckCircle className="h-3 w-3 text-green-600" />
                               )}
                             </div>
                           </div>
                           <span className="text-xs text-muted-foreground">
                             {new Date(review.date).toLocaleDateString()}
                           </span>
                         </div>
                       </CardContent>
                     </Card>
                   </div>
                 );
               })}
             </div>
                       </div>

          {/* Load More Button */}
          {visibleReviews < product.reviews.length && (
            <div className="flex justify-center mt-8">
              <Button
                onClick={handleLoadMoreReviews}
                variant="outline"
                size="lg"
                className="px-8 py-3"
              >
                Load More Reviews
                <span className="ml-2 text-sm text-muted-foreground">
                  ({product.reviews.length - visibleReviews} remaining)
                </span>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 px-6">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-primary text-center mb-8">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="space-y-4">
            {product.faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border rounded-lg"
              >
                <AccordionTrigger className="px-6 py-4 text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-12 px-6 bg-accent/5">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl font-bold text-primary mb-4">
            Ready to Experience Premium Quality?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust our products. Order
            now and enjoy free shipping with our 30-day money-back guarantee.
          </p>
                     <Button
             onClick={handleBuyNow}
             disabled={quantity > product.stockCount}
             size="lg"
             className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6"
           >
             <CreditCard className="mr-2 h-5 w-5" />
             Buy Now - ${finalPrice.toFixed(2)}
           </Button>
        </div>
      </section>
    </div>
  );
};

export default Store;
