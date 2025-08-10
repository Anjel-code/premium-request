import * as React from "react";
import { useState, useEffect } from "react";
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
  Edit,
  Volume2,
  Maximize2,
  X,
  CreditCard as CreditCardIcon,
  Truck as TruckIcon,
  RotateCcw,
  Crown,
  TrendingUp,
  FileText,
  Zap,
  Wrench,
  Video,
  Rocket,
  Clock,
  Users,
  Award,
  ArrowLeft,
  Home,
  Menu,
  User,
  Info,
  MessageCircle,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import {
  createStoreOrder,
  createStoreOrderNotification,
  getProductStock,
  updateProductStock,
  reserveStock,
  releaseReservedStock,
} from "@/lib/storeUtils";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import PopupOffer from "@/components/PopupOffer";
import AdminStoreEditor from "@/components/AdminStoreEditor";
import ReviewsEditor from "@/components/ReviewsEditor";
import VideoEditor from "@/components/VideoEditor";
import Footer from "@/components/Footer";
import { isAdmin } from "@/lib/userUtils";
import { checkStorageQuota, clearAllStorage } from "@/lib/storageUtils";
import { trackUserActivity } from "@/lib/liveViewUtils";
import { collection, query, where, onSnapshot, getDocs, deleteDoc, addDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { MediaBackground, MediaImage } from "@/components/ui/MediaImage";
import { getMediaAsset } from "@/lib/mediaAssets";

// Product data interface - this will be easily configurable
interface VideoReview {
  id: string;
  thumbnail: string;
  videoUrl: string;
  testimonial: string;
  customerName: string;
}

interface ProductData {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  images: string[];
  videos: string[];
  videoReviews: VideoReview[];
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
    "product-main-image",
    "product-gallery-1",
    "product-gallery-2",
    "product-gallery-3",
  ],
  videos: ["product-video"],
  videoReviews: [
    {
      id: "1",
      thumbnail: "video-review-thumb-1",
      videoUrl: "video-review-1",
      testimonial: "These headphones are incredible! The noise cancellation is amazing.",
      customerName: "Sarah M.",
    },
    {
      id: "2",
      thumbnail: "video-review-thumb-2",
      videoUrl: "video-review-2",
      testimonial: "Best headphones I've ever owned. So comfortable!",
      customerName: "Mike R.",
    },
    {
      id: "3",
      thumbnail: "video-review-thumb-3",
      videoUrl: "video-review-3",
      testimonial: "Perfect for work calls and music. Highly recommend!",
      customerName: "Jennifer L.",
    },
    {
      id: "4",
      thumbnail: "video-review-thumb-4",
      videoUrl: "video-review-4",
      testimonial: "Absolutely love these headphones! Crystal clear sound.",
      customerName: "David K.",
    },
    {
      id: "5",
      thumbnail: "video-review-thumb-5",
      videoUrl: "video-review-5",
      testimonial: "The battery life is incredible. Lasts all day!",
      customerName: "Emma T.",
    },
  ],
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
            productImage: "review-product-image",
            profileImage: "review-profile-1",
          },
          {
            id: "2",
            name: "Mike R.",
            rating: 5,
            comment:
              "Best headphones I've ever owned. The sound quality is outstanding and they're so comfortable I forget I'm wearing them.",
            date: "2024-01-10",
            verified: true,
            productImage: "review-product-image",
            profileImage: "review-profile-2",
          },
          {
            id: "3",
            name: "Jennifer L.",
            rating: 4,
            comment:
              "Great sound quality and very comfortable. The only minor issue is the touch controls can be a bit sensitive sometimes.",
            date: "2024-01-08",
            verified: true,
            productImage: "review-product-image",
            profileImage: "review-profile-3",
          },
          {
            id: "4",
            name: "David K.",
            rating: 5,
            comment:
              "Absolutely love these headphones! The sound quality is crystal clear and the noise cancellation works perfectly for my daily commute.",
            date: "2024-01-05",
            verified: true,
            productImage: "review-product-image",
            profileImage: "review-profile-4",
          },
          {
            id: "5",
            name: "Emma T.",
            rating: 5,
            comment:
              "Perfect for work calls and music. The microphone quality is excellent and the battery lasts all day. Highly recommend!",
            date: "2024-01-03",
            verified: true,
            productImage: "review-product-image",
            profileImage: "review-profile-5",
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
  console.log('🚀 [Store] Component is rendering!');
  console.log('🚀 [Store] User:', user);
  console.log('🚀 [Store] AppId:', appId);
  const navigate = useNavigate();
  const { addToCart, items, addToWishlist, removeFromWishlist, isInWishlist, setIsCartOpen, totalItems } = useCart();
  const { toast } = useToast();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingReviews, setIsEditingReviews] = useState(false);
  const [isEditingVideos, setIsEditingVideos] = useState(false);
  const [showPopupOffer, setShowPopupOffer] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<string>("");
  const [realTimeStock, setRealTimeStock] = useState<number | null>(null);
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoReview | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [displayedReviews, setDisplayedReviews] = useState(3);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [loyaltyLevel, setLoyaltyLevel] = useState({ level: "Bronze", discount: 0 });
  const [carouselRef, setCarouselRef] = useState<HTMLDivElement | null>(null);
  const [storageWarning, setStorageWarning] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);
  const [showLoyaltyInfo, setShowLoyaltyInfo] = useState(false);
  const [showLoyaltyFab, setShowLoyaltyFab] = useState(true);
  const [shareLoading, setShareLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

                  /**
                 * BeforeAfterSlider Component
                 *
                 * This component creates a draggable slider that shows two images side-by-side
                 * for the 30-day money-back guarantee section. It demonstrates the "before"
                 * and "after" states of using the product.
                 *
                 * IMAGE SOURCES:
                 * - leftImage: Uses "guarantee-before-image" asset for "Before" state
                 * - rightImage: Uses "guarantee-after-image" asset for "After" state
                 *
                 * These are dedicated assets specifically for the guarantee section,
                 * separate from the product gallery images. To update these images,
                 * modify the UploadThing links in mediaAssets.ts for these specific assets.
                 */
  const BeforeAfterSlider: React.FC<{
    leftImage: string;
    rightImage: string;
    leftLabel?: string;
    rightLabel?: string;
  }> = ({ leftImage, rightImage, leftLabel = "Before", rightLabel = "After" }) => {
    const [position, setPosition] = useState(50); // percent
    const containerRef = React.useRef<HTMLDivElement | null>(null);

    const onPointerMove = (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
      setPosition(Math.round((x / rect.width) * 100));
    };

    const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      onPointerMove(e.clientX);
    };

    const handlePointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
      if (e.buttons !== 1) return; // dragging
      onPointerMove(e.clientX);
    };

    const handleTouchMove: React.TouchEventHandler<HTMLDivElement> = (e) => {
      if (!containerRef.current) return;
      onPointerMove(e.touches[0].clientX);
    };

    return (
      <div
        ref={containerRef}
        className="relative w-full aspect-[16/10] overflow-hidden rounded-xl border border-border bg-muted select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onTouchMove={handleTouchMove}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={position}
      >
        {/* Right image as the base */}
        <MediaImage
          assetId={rightImage}
          alt={rightLabel}
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Left image clipped to the same scale as the right using clip-path */}
        <div
          className="absolute inset-0 w-full h-full will-change-transform"
          style={{ clipPath: `polygon(0% 0%, ${position}% 0%, ${position}% 100%, 0% 100%)` }}
        >
          <MediaImage
            assetId={leftImage}
            alt={leftLabel}
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        </div>

        {/* Divider handle */}
        <div
          className="absolute top-0 bottom-0 w-1 sm:w-1.5 bg-primary/90 shadow-[0_0_0_2px_rgba(255,255,255,0.8)]"
          style={{ left: `calc(${position}% - 0.5px)` }}
        >
          <div className="absolute -left-3 sm:-left-3 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground rounded-full h-6 w-6 sm:h-7 sm:w-7 flex items-center justify-center shadow-lg border border-primary/60">
            <span className="text-xs">↔</span>
          </div>
        </div>

        {/* Labels */}
        <div className="absolute left-3 top-3 px-2 py-1 rounded bg-secondary text-secondary-foreground text-[10px] sm:text-xs font-semibold shadow">
          {leftLabel}
        </div>
        <div className="absolute right-3 top-3 px-2 py-1 rounded bg-secondary text-secondary-foreground text-[10px] sm:text-xs font-semibold shadow">
          {rightLabel}
        </div>
      </div>
    );
  };

  // Check if user is admin by querying the database
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.uid) {
        setIsUserAdmin(false);
        setIsCheckingAdmin(false);
        return;
      }

      try {
        const adminStatus = await isAdmin(user.uid);
        setIsUserAdmin(adminStatus);
        
        if (adminStatus) {
          console.log('🔧 Admin role confirmed - Edit Store button should be visible');
        }
        setIsCheckingAdmin(false);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsUserAdmin(false);
        setIsCheckingAdmin(false);
      }
    };

    checkAdminStatus();
    
    // Track view activity with location if user is logged in
    if (user && appId) {
      trackUserActivity(
        appId,
        user.uid,
        user.email,
        user.displayName,
        "view"
      );
    }
  }, [user?.uid, user, appId]);

  // Check storage quota and show warning if needed
  useEffect(() => {
    const checkStorage = () => {
      const quota = checkStorageQuota();
      const localStorageMB = quota.localStorage / (1024 * 1024);
      
      // Show warning if localStorage is more than 4MB (approaching 5MB limit)
      if (localStorageMB > 4) {
        setStorageWarning(true);
      }
    };

    checkStorage();
  }, []);

  // Fetch user orders to calculate loyalty level
  useEffect(() => {
    const fetchUserOrders = async () => {
      if (!user?.uid || !appId) {
        setLoyaltyLevel({ level: "Silver", discount: 0 });
        return;
      }

      try {
        const ordersRef = collection(db, `artifacts/${appId}/public/data/store-orders`);
        const userOrdersQuery = query(ordersRef, where("userId", "==", user.uid));
        
        const unsubscribe = onSnapshot(userOrdersQuery, (snapshot) => {
          const orders = snapshot.docs.map(doc => doc.data());
          setUserOrders(orders);
          
          // Calculate loyalty level based on purchase count (aligned with Dashboard)
          const purchaseCount = orders.length;
          let level = "Silver";
          let discount = 0;
          if (purchaseCount >= 5) {
            level = "Diamond";
            discount = 15;
          } else if (purchaseCount === 4) {
            level = "80% Diamond";
            discount = 15;
          } else if (purchaseCount === 3) {
            level = "Platinum";
            discount = 10;
          } else if (purchaseCount === 2) {
            level = "50% Platinum";
            discount = 10;
          } else if (purchaseCount === 1) {
            level = "Gold";
            discount = 5;
          } else {
            level = "Silver";
            discount = 0;
          }
          setLoyaltyLevel({ level, discount });
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching user orders:", error);
        setLoyaltyLevel({ level: "Silver", discount: 0 });
      }
    };

    fetchUserOrders();
  }, [user?.uid, appId]);

  // Load product data - check for admin-saved data first, then fall back to mock data
  const loadProductData = (): ProductData => {
    const adminProduct = localStorage.getItem('adminStoreProduct');
    console.log('[Store] Admin product from localStorage:', adminProduct);
    
    if (adminProduct) {
      try {
        const parsedProduct = JSON.parse(adminProduct);
        console.log('[Store] Parsed admin product:', parsedProduct);
        console.log('[Store] Admin product images:', parsedProduct.images);
        
        // Ensure videoReviews property exists
        if (!parsedProduct.videoReviews) {
          parsedProduct.videoReviews = mockProductData.videoReviews;
        }
        return parsedProduct;
      } catch (error) {
        console.error('Error parsing admin product data:', error);
      }
    }
    
    console.log('[Store] Using mock product data:', mockProductData);
    console.log('[Store] Mock product images:', mockProductData.images);
    return mockProductData;
  };

  const product = loadProductData();
  console.log('[Store] Final product data:', product);
  console.log('[Store] Product images array:', product.images);
  console.log('[Store] Current image index:', currentImageIndex);
  console.log('[Store] Current image asset ID:', product.images[currentImageIndex]);
  
  // Load real-time stock from database
  const loadRealTimeStock = async () => {
    if (!appId) return;
    
    try {
      setIsLoadingStock(true);
      const stockCount = await getProductStock(appId, product.id);
      setRealTimeStock(stockCount);
    } catch (error) {
      console.error("Error loading stock:", error);
      setRealTimeStock(product.stockCount); // Fallback to mock data
    } finally {
      setIsLoadingStock(false);
    }
  };
  
  // Calculate available stock considering items already in cart and real-time stock
  const getAvailableStock = () => {
    const itemsInCart = items.find(item => item.productId === product.id);
    const cartQuantity = itemsInCart ? itemsInCart.quantity : 0;
    const currentStock = realTimeStock !== null ? realTimeStock : product.stockCount;
    return Math.max(0, currentStock - cartQuantity);
  };
  
  const availableStock = getAvailableStock();
  
  // Load real-time stock on component mount
  useEffect(() => {
    loadRealTimeStock();
  }, [appId, product.id]);
  
  // Recalculate available stock when cart items change
  useEffect(() => {
    const newAvailableStock = getAvailableStock();
    if (quantity > newAvailableStock) {
      setQuantity(newAvailableStock);
    }
  }, [items, product.id]);
  
  // Ensure quantity doesn't exceed available stock
  useEffect(() => {
    if (quantity > availableStock) {
      setQuantity(availableStock);
      toast({
        title: "Quantity Adjusted",
        description: `Quantity has been adjusted to available stock (${availableStock}).`,
        variant: "default",
      });
    }
  }, [availableStock, quantity, toast]);
  
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
  
  // Calculate final price with wellness discount and loyalty discount
  let finalPrice = product.price;
  
  // Apply wellness discount if available
  if (wellnessDiscountApplied && !wellnessDiscountUsed && discountOffer.enabled) {
    finalPrice = Math.round((finalPrice * (1 - wellnessDiscountPercentage / 100)) * 100) / 100;
  }
  
  // Apply loyalty discount
  if (loyaltyLevel.discount > 0) {
    finalPrice = Math.round((finalPrice * (1 - loyaltyLevel.discount / 100)) * 100) / 100;
  }
    
  const discountPercentage = Math.round(
    ((product.originalPrice - product.price) / product.originalPrice) * 100
  );

  const handleBuyNow = () => {
    // Validate stock availability
    if (quantity > availableStock) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${availableStock} items available in stock. Please reduce quantity.`,
        variant: "destructive",
      });
      // Reset quantity to available stock
      setQuantity(availableStock);
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

    const handleAddToCart = async () => {
    // Validate stock availability
    if (quantity > availableStock) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${availableStock} items available in stock. Please reduce quantity.`,
        variant: "destructive",
      });
      // Reset quantity to available stock
      setQuantity(availableStock);
      return;
    }

    try {
      // Reserve stock in database
      if (appId) {
        const stockReserved = await reserveStock(appId, product.id, quantity);
        if (!stockReserved) {
          toast({
            title: "Stock Unavailable",
            description: "Not enough stock available. Please reduce quantity or try again later.",
            variant: "destructive",
          });
          return;
        }
      }

      // Track cart activity with location if user is logged in
      if (user && appId) {
        await trackUserActivity(
          appId,
          user.uid,
          user.email,
          user.displayName,
          "cart"
        );
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
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Unable to add item to cart. Please try again.",
        variant: "destructive",
      });
    }
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
    if (isUserAdmin) {
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
    setIsEditingReviews(false);
  };

  const handleCancelReviews = () => {
    setIsEditingReviews(false);
  };

  const handleSaveVideos = (updatedVideos: VideoReview[]) => {
    const updatedProduct = { ...product, videoReviews: updatedVideos };
    localStorage.setItem('adminStoreProduct', JSON.stringify(updatedProduct));
    setIsEditingVideos(false);
  };

  const handleCancelVideos = () => {
    setIsEditingVideos(false);
  };

  const handleClearStorage = () => {
    if (confirm('This will clear all stored data including admin settings, cart, and preferences. Are you sure?')) {
      clearAllStorage();
      window.location.reload();
    }
  };

  const handleCheckStorage = () => {
    const quota = checkStorageQuota();
    const localStorageMB = (quota.localStorage / (1024 * 1024)).toFixed(2);
    const sessionStorageMB = (quota.sessionStorage / (1024 * 1024)).toFixed(2);
    
    alert(`Storage Usage:\nlocalStorage: ${localStorageMB}MB\nsessionStorage: ${sessionStorageMB}MB`);
  };

  /**
   * Fixes corrupted product images by updating the media asset IDs in localStorage
   *
   * This function addresses the issue where product data contains invalid or missing
   * media asset IDs, causing images and videos to fail to load. It replaces these
   * with the correct asset IDs that match the available media assets in the system.
   *
   * What it fixes:
   * - Product main images and gallery images
   * - Product videos
   * - Video review thumbnails and video URLs
   * - Review product images and profile images
   *
   * IMPORTANT: The first two images (product-main-image, product-gallery-1) are also
   * used in the 30-day guarantee section's BeforeAfterSlider component:
   * - product.images[0] → "Before" image (left side of guarantee slider)
   * - product.images[1] → "After" image (right side of guarantee slider)
   *
   * After fixing, it shows a success message and reloads the page to apply changes.
   *
   * Usage: Click the "Fix Images" button in the admin controls panel when
   * product images are not displaying correctly due to corrupted asset IDs.
   */
  const fixProductImages = () => {
    console.log('🔧 [Store] Fixing product images...');
    const adminProduct = localStorage.getItem('adminStoreProduct');
    if (adminProduct) {
      try {
        const parsedProduct = JSON.parse(adminProduct);
        console.log('🔧 [Store] Current product data:', parsedProduct);
        
        // Update the images array to use correct media asset IDs
        parsedProduct.images = [
          "product-main-image",      // Main product image + Guarantee "Before" image
          "product-gallery-1",       // Gallery image 1 + Guarantee "After" image  
          "product-gallery-2",       // Gallery image 2
          "product-gallery-3"        // Gallery image 3
        ];
        
        // Update the videos array to use correct media asset IDs
        parsedProduct.videos = ["product-video"];
        
        // Update video review thumbnails
        if (parsedProduct.videoReviews && Array.isArray(parsedProduct.videoReviews)) {
          parsedProduct.videoReviews.forEach((review: any, index: number) => {
            review.thumbnail = `video-review-thumb-${index + 1}`;
            review.videoUrl = `video-review-${index + 1}`;
          });
          console.log('🔧 [Store] Fixed video reviews:', parsedProduct.videoReviews);
        }
        
        // Update review images
        if (parsedProduct.reviews && Array.isArray(parsedProduct.reviews)) {
          parsedProduct.reviews.forEach((review: any, index: number) => {
            review.productImage = "review-product-image";
            review.profileImage = `review-profile-${index + 1}`;
          });
          console.log('🔧 [Store] Fixed reviews:', parsedProduct.reviews);
        }
        
        localStorage.setItem('adminStoreProduct', JSON.stringify(parsedProduct));
        console.log('🔧 [Store] Product images fixed! Updated localStorage.');
        
        // Show success message
        toast({
          title: "Images Fixed!",
          description: "Product images have been updated with correct media asset IDs.",
          duration: 3000,
        });
        
        // Reload after a short delay to ensure everything is updated
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error) {
        console.error('Error fixing product images:', error);
        toast({
          title: "Error",
          description: "Failed to fix product images. Check console for details.",
          variant: "destructive",
          duration: 3000,
        });
      }
    } else {
      console.log('🔧 [Store] No adminStoreProduct found in localStorage');
      toast({
        title: "No Data Found",
        description: "No product data found to fix. Please edit the store first.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleVideoClick = (video: VideoReview) => {
    setSelectedVideo(video);
    setShowVideoModal(true);
  };

  const handleCloseVideoModal = () => {
    setShowVideoModal(false);
    setSelectedVideo(null);
  };

  const handleLoadMoreReviews = () => {
    const remainingReviews = product.reviews.length - displayedReviews;
    const nextBatch = Math.min(12, remainingReviews);
    setDisplayedReviews(prev => prev + nextBatch);
  };

  // Auto-scroll carousel functionality
  useEffect(() => {
    if (!carouselRef) return;

    const cardWidth = 320; // Width of each video card (w-80 = 320px)
    const cardGap = 16; // Gap between cards (gap-4 = 16px)
    const totalCardWidth = cardWidth + cardGap; // Total width including gap
    const scrollInterval = 3000; // Scroll every 3 seconds
    let scrollTimer: NodeJS.Timeout;
    let isPaused = false;
    let currentCardIndex = 0;

    const scrollToNextCard = () => {
      if (!carouselRef || isPaused) return;

      // Calculate the exact position for the next card
      currentCardIndex = (currentCardIndex + 1) % (product.videoReviews?.length || 1);
      const targetScroll = currentCardIndex * totalCardWidth;
      
      // If we've reached the end of the visible set, reset to beginning
      if (currentCardIndex === 0) {
        // Reset to beginning without animation for seamless loop
        carouselRef.scrollLeft = 0;
        // Wait a bit then scroll to first card
        setTimeout(() => {
          if (carouselRef) {
            carouselRef.scrollTo({
              left: totalCardWidth,
              behavior: 'smooth'
            });
          }
        }, 100);
        return;
      }
      
      // Smooth scroll to exact card position
      carouselRef.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    };

    // Pause on hover
    const handleMouseEnter = () => {
      isPaused = true;
    };

    const handleMouseLeave = () => {
      isPaused = false;
    };

    carouselRef.addEventListener('mouseenter', handleMouseEnter);
    carouselRef.addEventListener('mouseleave', handleMouseLeave);

    // Start the auto-scroll timer
    scrollTimer = setInterval(scrollToNextCard, scrollInterval);

    return () => {
      if (scrollTimer) {
        clearInterval(scrollTimer);
      }
      carouselRef.removeEventListener('mouseenter', handleMouseEnter);
      carouselRef.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [carouselRef, product.videoReviews]);

  const nextImage = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const prevImage = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentImageIndex(
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
  if (isEditingReviews) {
    return (
      <ReviewsEditor
        reviews={product.reviews}
        onSave={handleSaveReviews}
        onCancel={handleCancelReviews}
      />
    );
  }

  // If in video editing mode, show the video editor
  if (isEditingVideos) {
    return (
      <VideoEditor
        videos={product.videoReviews}
        onSave={handleSaveVideos}
        onCancel={handleCancelVideos}
      />
    );
  }

  // If in editing mode, show the admin editor
  if (isEditing) {
    return (
      <AdminStoreEditor
        product={product}
        appId={appId}
        onSave={handleSaveStore}
        onCancel={handleCancelEdit}
      />
    );
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    closeMobileMenu();
  };

  // Helper function to detect if a URL is a GIF
  const isGif = (url: string): boolean => {
    if (url.startsWith('data:')) {
      // Check if it's a GIF data URL
      return url.includes('image/gif') || url.includes('data:image/gif');
    }
    
    // Check if it's a GIF file URL
    if (url.toLowerCase().endsWith('.gif') || url.toLowerCase().includes('.gif')) {
      return true;
    }
    
    // Check if it's a known GIF asset from our media library
    // The product-video is actually a GIF despite being called "video"
    if (url.includes('bwRfX2qUMqkgpPfWw6SyR3TUAuSe5zs8BOwjo27Ld4ZNnKMH')) {
      return true;
    }
    
    return false;
  };

  // Helper function to render video or GIF content
  const renderVideoContent = (url: string, className: string = "w-full h-full object-cover", controls: boolean = true) => {
    // Check if this is a media asset ID (not a full URL)
    const isMediaAssetId = !url.startsWith('http') && !url.startsWith('data:') && !url.startsWith('/');
    const mediaAsset = isMediaAssetId ? getMediaAsset(url) : undefined;
    const videoUrl = mediaAsset ? mediaAsset.uploadLink : url;
    
    if (isGif(videoUrl)) {
      // Render GIF as image with proper TikTok-like resolution handling
      return (
        <img
          src={videoUrl}
          alt="Product demonstration"
          className={className}
        />
      );
    } else if (videoUrl.startsWith('data:')) {
      // Local video file
      return (
        <video 
          src={videoUrl} 
          controls={controls} 
          className={className}
        />
      );
    } else {
      // External video (YouTube, etc.)
      return (
        <iframe
          src={videoUrl}
          title="Product Video"
          className={className}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }
  };

  // Wishlist functionality using CartContext
  const handleWishlistToggle = () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to save items to your wishlist.",
        variant: "destructive",
      });
      return;
    }

    if (isInWishlist("premium-headphones")) {
      removeFromWishlist("premium-headphones");
      toast({
        title: "Removed from wishlist",
        description: "Product removed from your wishlist.",
      });
    } else {
      addToWishlist({
        productId: "premium-headphones",
        name: product.name,
        price: product.price,
        image: product.images[0],
      });
      toast({
        title: "Added to wishlist",
        description: "Product added to your wishlist!",
      });
    }
  };

  // Share functionality
  const handleShare = async () => {
    setShareLoading(true);
    
    try {
      await copyToClipboard(window.location.href);
      toast({
        title: "Link copied!",
        description: "Product link copied to clipboard.",
      });
    } catch (error) {
      console.error("Error copying link:", error);
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    } finally {
      setShareLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard!",
        description: "Link copied successfully.",
      });
    } catch (error) {
      console.error("Failed to copy:", error);
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
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
            className="flex items-center gap-2 text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <Menu className="h-5 w-5" />
            <span className="text-sm font-medium">Menu</span>
            </Button>
          <div className="text-lg font-bold text-primary">Store</div>
          {/* Cart Button for Mobile */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCartOpen(true)}
            className="relative"
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
              >
                {totalItems}
              </Badge>
            )}
          </Button>
          </div>
        </div>

      {/* Desktop Navigation Header */}
      <div className="hidden lg:block fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-6 py-2">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-primary">
              Quibble
            </Link>

            <div className="flex items-center space-x-8">
              <Link
                to="/"
                className="transition-colors text-foreground hover:text-primary"
              >
                Home
              </Link>
              <Link
                to="/store"
                className="transition-colors text-primary"
              >
                Store
              </Link>
              <Link
                to="/about"
                className="transition-colors text-foreground hover:text-primary"
              >
                About
              </Link>
              <Link
                to="/contact"
                className="transition-colors text-foreground hover:text-primary"
              >
                Contact
              </Link>
              {user && (
                <Link
                  to="/dashboard"
                  className="transition-colors text-foreground hover:text-primary"
                >
                  Dashboard
                </Link>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {/* Cart Button for Desktop */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCartOpen(true)}
                className="relative"
              >
                <ShoppingCart className="h-4 w-4" />
                {totalItems > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                  >
                    {totalItems}
                  </Badge>
                )}
              </Button>
              
              {user ? (
                <Button
                  onClick={() => navigate('/dashboard')}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <User className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={() => navigate('/')}
                  variant="ghost"
                  size="sm"
                  className="font-medium"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Menu */}
      <div className={`lg:hidden fixed inset-0 z-50 transition-opacity duration-300 ${
        mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50"
          onClick={closeMobileMenu}
        ></div>
        
        {/* Sidebar */}
        <div className={`absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-xl transform transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
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
              onClick={() => handleNavigation('/about')}
            >
              <Info className="h-5 w-5" />
              <span>About</span>
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12 text-left"
              onClick={() => handleNavigation('/contact')}
            >
              <MessageCircle className="h-5 w-5" />
              <span>Contact Us</span>
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

      {/* Add top padding for desktop to account for fixed header */}
      <div className="hidden lg:block pt-16"></div>

      {/* 
        Admin Controls Section
        Provides admin-only tools for managing the store:
        - Edit Store: Modify product details, pricing, descriptions
        - Check Storage: Monitor browser storage usage and quotas
        - Clear Storage: Remove all stored data (useful for troubleshooting)
        - Fix Images: Update corrupted media asset IDs with correct ones
        
        These controls are positioned in the top-right corner for easy access
        and are only visible to authenticated admin users.
      */}
      {isUserAdmin ? (
        <div className="fixed top-4 right-4 z-50">
          <div className="flex flex-col items-end gap-2">
            <Badge variant="secondary" className="text-xs">
              Admin
            </Badge>
            {/* Admin Controls Help - Quick reference for admin users */}
            <div className="text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-center max-w-48">
              <p className="font-medium mb-1">Admin Controls:</p>
              <p className="text-xs">• Edit Store: Modify product details</p>
              <p className="text-xs">• Check Storage: Monitor browser storage</p>
              <p className="text-xs">• Clear Storage: Remove all stored data</p>
              <p className="text-xs">• Fix Images: Update media asset IDs</p>
            </div>
            {/* Primary action: Edit store content and settings */}
            <Button
              onClick={handleEditStore}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
            >
              <Edit className="h-4 w-4" />
              Edit Store
            </Button>
            {/* Utility buttons for admin maintenance tasks */}
            <div className="flex gap-2">
              {/* Monitor browser storage usage and quotas */}
              <Button
                onClick={handleCheckStorage}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                Check Storage
              </Button>
              {/* Remove all stored data (useful for troubleshooting) */}
              <Button
                onClick={handleClearStorage}
                variant="outline"
                size="sm"
                className="text-xs text-red-600 hover:text-red-700"
              >
                Clear Storage
              </Button>
              {/* Fix corrupted media asset IDs */}
              <Button
                onClick={fixProductImages}
                variant="outline"
                size="sm"
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                <Wrench className="h-3 w-3 mr-1" />
                Fix Images
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {showPopupOffer && (
        <PopupOffer
          onClose={handlePopupClose}
          onGoalSelect={handleGoalSelect}
        />
      )}

      {/* Storage Warning */}
      {storageWarning && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">⚠️ Storage Warning</span>
            <button
              onClick={() => setStorageWarning(false)}
              className="text-orange-700 hover:text-orange-900"
            >
              ×
            </button>
          </div>
          <p className="text-xs mt-1">
            Browser storage is getting full. Some features may not work properly.
            {isUserAdmin && (
              <button
                onClick={handleClearStorage}
                className="ml-2 underline hover:no-underline"
              >
                Clear storage
              </button>
            )}
          </p>
        </div>
      )}



      {/* Product Section */}
      <section id="product-section" className="pt-16 sm:pt-24 pb-12 sm:pb-20 px-4 sm:px-6 bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
              {/* Left Column - Product Images */}
              <div className="lg:sticky lg:top-24 lg:self-start order-1 lg:order-1">
              {/* Product Images */}
              <div className="space-y-4 sm:space-y-6">
                {(() => {
                  console.log('🎯 [Store] About to render main product image with assetId:', product.images[currentImageIndex]);
                  return null;
                })()}
                <div className="relative aspect-square bg-gradient-to-br from-muted/50 to-muted rounded-xl sm:rounded-2xl overflow-hidden shadow-lg sm:shadow-2xl shadow-black/10 border border-border/50">
                  <MediaImage
                    assetId={product.images[currentImageIndex]}
                    alt={product.name}
                    className={`w-full h-full object-cover cursor-zoom-in transition-all duration-500 ease-out ${
                      isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 sm:p-3 shadow-lg cursor-pointer" onClick={() => setIsModalOpen(true)}>
                      <ZoomIn className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white backdrop-blur-sm transition-all duration-300 ease-out transform hover:scale-110 active:scale-95 disabled:pointer-events-none shadow-lg border border-border/20"
                    onClick={prevImage}
                    disabled={isTransitioning}
                  >
                    <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white backdrop-blur-sm transition-all duration-300 ease-out transform hover:scale-110 active:scale-95 disabled:pointer-events-none shadow-lg border border-border/20"
                    onClick={nextImage}
                    disabled={isTransitioning}
                  >
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </Button>
                </div>

                {/* Thumbnail Images */}
                <div className="flex gap-2 sm:gap-3 overflow-x-auto overflow-y-hidden p-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        if (isTransitioning) return;
                        setIsTransitioning(true);
                        setCurrentImageIndex(index);
                        setTimeout(() => setIsTransitioning(false), 300);
                      }}
                      className={`flex-shrink-0 w-16 h-16 sm:w-24 sm:h-24 rounded-lg sm:rounded-xl overflow-hidden border-2 transition-all duration-300 ease-out transform hover:scale-110 disabled:pointer-events-none shadow-md ${
                        currentImageIndex === index
                          ? "border-primary scale-110 shadow-lg shadow-primary/20"
                          : "border-border/30 hover:border-primary/50 hover:shadow-lg"
                      }`}
                      disabled={isTransitioning}
                    >
                      <MediaImage
                        assetId={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Product Info */}
              <div className="space-y-6 sm:space-y-8 order-2 lg:order-2">
              <div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
                  <Badge variant="secondary" className="bg-secondary/10 text-secondary border-secondary/20 flex items-center gap-1 text-xs sm:text-sm hover:text-white cursor-pointer">
                    <Crown className="h-3 w-3 text-secondary" />
                    Premium Quality
                  </Badge>
                  <Badge variant="outline" className="text-xs border-primary/30 text-primary flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-primary" />
                    Best Seller
                  </Badge>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-3 leading-tight">
                  {product.name}
                </h1>

                {/* Rating and Reviews */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 sm:h-5 sm:w-5 ${
                            i < Math.floor(product.rating)
                              ? "text-primary fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-base sm:text-lg font-semibold text-primary">
                        {product.rating}
                      </span>
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        {product.reviewCount} verified reviews
                      </span>
                    </div>
                  </div>
                  <div className="hidden sm:block h-8 w-px bg-border"></div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-secondary" />
                    <span className="text-xs sm:text-sm text-muted-foreground">Verified Purchase</span>
                  </div>
                </div>

                                {/* Pricing */}
                <div className="bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8">
                  <div className="flex items-baseline gap-2 sm:gap-4 mb-3">
                    <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary">
                      ${finalPrice.toFixed(2)}
                    </span>
                    <span className="text-lg sm:text-xl lg:text-2xl text-muted-foreground line-through">
                      ${product.originalPrice}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <Badge variant="secondary" className="text-xs sm:text-sm px-2 sm:px-3 py-1 bg-secondary text-white">
                      Save ${(product.originalPrice - finalPrice).toFixed(2)} ({discountPercentage}% OFF)
                  </Badge>
                    {(wellnessDiscountApplied && !wellnessDiscountUsed) && (
                      <Badge variant="secondary" className="text-xs sm:text-sm px-2 sm:px-3 py-1 bg-orange-500 text-white">
                        +{wellnessDiscountPercentage}% Extra Off
                      </Badge>
                    )}
                    {loyaltyLevel.discount > 0 && (
                      <Badge
                        variant="secondary"
                        className="text-xs sm:text-sm px-2 sm:px-3 py-1 bg-secondary text-secondary-foreground border border-secondary/30"
                      >
                        <Award className="h-3 w-3 mr-1" />
                        {loyaltyLevel.level} Rank - {loyaltyLevel.discount}% Off
                      </Badge>
                    )}
                  </div>
                  <div className="mt-3 text-xs sm:text-sm text-muted-foreground flex flex-wrap items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-1">
                      <CreditCardIcon className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                      <span>Secure payment</span>
                    </div>
                    <span className="text-muted-foreground/50">•</span>
                    <div className="flex items-center gap-1">
                      <TruckIcon className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                      <span>Free shipping</span>
                    </div>
                    <span className="text-muted-foreground/50">•</span>
                    <div className="flex items-center gap-1">
                      <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                      <span>30-day returns</span>
                    </div>
                  </div>
                </div>

                {/* Stock Alert */}
                {isLoadingStock ? (
                  <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-primary rounded-full animate-ping"></div>
                      <p className="text-xs sm:text-sm font-medium text-primary">
                        ⚠️ Loading stock information...
                      </p>
                    </div>
                  </div>
                ) : (availableStock <= 20 && availableStock > 0) && (
                  <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-6 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-primary rounded-full animate-ping"></div>
                      <p className="text-xs sm:text-sm font-medium text-primary">
                        ⚠️ Only {availableStock} left in stock! Order now to secure yours.
                      </p>
                    </div>
                  </div>
                )}

                {/* Key Benefits */}
                <div className="bg-white border border-border/50 rounded-lg sm:rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-sm">
                  <h3 className="text-base sm:text-lg font-semibold text-primary mb-4">✨ Why Choose This Product?</h3>
                  <div className="grid gap-3">
                    {product.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-secondary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-primary">
                          {benefit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quantity Selector */}
                <div className="bg-white border border-border/50 rounded-lg sm:rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-base sm:text-lg font-semibold text-primary">Quantity</span>
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      {realTimeStock !== null ? realTimeStock : product.stockCount} available
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center justify-center border border-border rounded-lg sm:rounded-xl overflow-hidden bg-white">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-3 sm:px-4 py-2 sm:py-3 hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={quantity <= 1}
                      >
                        <span className="text-lg sm:text-xl font-semibold text-muted-foreground">−</span>
                      </Button>
                      <span className={`px-4 sm:px-6 py-2 sm:py-3 text-base sm:text-lg font-bold bg-muted/20 min-w-[50px] sm:min-w-[60px] text-center border-x border-border ${
                        quantity >= availableStock ? 'text-red-600' : 'text-primary'
                      }`}>
                        {quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                        className="px-3 sm:px-4 py-2 sm:py-3 hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={quantity >= availableStock}
                      >
                        <span className="text-lg sm:text-xl font-semibold text-muted-foreground">+</span>
                      </Button>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        {availableStock - quantity} left in stock
                      </span>
                      {quantity >= availableStock && (
                        <span className="text-xs sm:text-sm text-red-600 font-medium bg-red-50 px-2 sm:px-3 py-1 rounded-full">
                          Max available: {availableStock}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                                                 {/* Primary CTA */}
                <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                                  <Button
                    onClick={handleBuyNow}
                    disabled={isProcessing || quantity > availableStock}
                  size="lg"
                    className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground text-lg sm:text-xl py-6 sm:py-8 rounded-xl sm:rounded-2xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 transform hover:scale-[1.02] font-bold"
                >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6 animate-spin text-white" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        Buy Now - ${(finalPrice * quantity).toFixed(2)}
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleAddToCart}
                    disabled={isProcessing || quantity > availableStock}
                    variant="outline"
                    size="lg"
                    className="w-full border-2 border-primary/30 text-primary hover:bg-primary/5 hover:text-primary text-base sm:text-lg py-5 sm:py-6 rounded-xl sm:rounded-2xl transition-all duration-300 transform hover:scale-[1.02] font-semibold"
                  >
                    <ShoppingCart className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Add to Cart - ${(finalPrice * quantity).toFixed(2)}
                  </Button>
                </div>

                                                 {/* Secondary Actions */}
                <div className="flex gap-2 sm:gap-3">
                  <Button
                    variant="ghost"
                    size="lg"
                    className="flex-1 bg-white border border-border/50 hover:bg-primary/5 hover:border-primary/30 transition-all duration-300 rounded-lg sm:rounded-xl text-xs sm:text-sm"
                    onClick={handleWishlistToggle}
                  >
                    <Heart
                      className={`mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 transition-all duration-300 ${
                        isInWishlist("premium-headphones") ? "fill-primary text-primary scale-110" : "text-muted-foreground"
                      }`}
                    />
                    <span className="text-muted-foreground">{isInWishlist("premium-headphones") ? "Wishlisted" : "Wishlist"}</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="lg"
                    className="flex-1 bg-white border border-border/50 hover:bg-primary/5 hover:border-primary/30 transition-all duration-300 rounded-lg sm:rounded-xl text-xs sm:text-sm"
                    onClick={handleShare}
                    disabled={shareLoading}
                  >
                    {shareLoading ? (
                      <Loader2 className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin text-muted-foreground" />
                    ) : (
                      <Share2 className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    )}
                    <span className="text-muted-foreground">{shareLoading ? "Sharing..." : "Share"}</span>
                  </Button>
                  {loyaltyLevel.level === 'Bronze' && (
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setShowLoyaltyInfo(true)}
                      className="flex-1 border-secondary/40 text-secondary hover:bg-secondary/10 hover:text-secondary rounded-lg sm:rounded-xl text-xs sm:text-sm"
                    >
                      <Award className="mr-2 h-4 w-4" /> Explore Ranked Discounts
                    </Button>
                  )}
                </div>

                {/* Trust Indicators */}
                <div className="bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20 rounded-lg sm:rounded-2xl p-4 sm:p-6 mt-6 sm:mt-8">
                  <h3 className="text-base sm:text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-secondary" />
                    Trust & Security
                  </h3>
                  <div className="grid gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg border border-primary/20">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary rounded-full flex items-center justify-center">
                        <Truck className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-medium text-primary">{product.shippingInfo}</span>
                        <p className="text-xs text-muted-foreground">Fast & reliable delivery</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg border border-primary/20">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-secondary rounded-full flex items-center justify-center">
                        <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-medium text-primary">{product.guarantee}</span>
                        <p className="text-xs text-muted-foreground">Risk-free purchase</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-3 sm:gap-6 pt-2">
                      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-2">
                        <div className="flex items-center gap-1 sm:gap-2 bg-white/70 px-2 sm:px-3 py-1 sm:py-2 rounded-lg">
                          <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-accent" />
                          <span className="text-xs font-medium text-primary">Visa</span>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 bg-white/70 px-2 sm:px-3 py-1 sm:py-2 rounded-lg">
                          <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-accent" />
                          <span className="text-xs font-medium text-primary">Mastercard</span>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 bg-white/70 px-2 sm:px-3 py-1 sm:py-2 rounded-lg">
                          <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-accent" />
                          <span className="text-xs font-medium text-primary">Amex</span>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 bg-white/70 px-2 sm:px-3 py-1 sm:py-2 rounded-lg">
                          <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-accent" />
                          <span className="text-xs font-medium text-primary">Discover</span>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 bg-white/70 px-2 sm:px-3 py-1 sm:py-2 rounded-lg">
                          <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-accent" />
                          <span className="text-xs font-medium text-primary">PayPal</span>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 bg-white/70 px-2 sm:px-3 py-1 sm:py-2 rounded-lg">
                          <Lock className="h-3 w-3 sm:h-4 sm:w-4 text-accent" />
                          <span className="text-xs font-medium text-primary">SSL Secure</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-center pt-2">
                      <p className="text-xs text-muted-foreground">Powered by Stripe</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Information */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-br from-muted/20 via-background to-muted/10">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-16 sm:space-y-24">
            {/* Before/After Guarantee Section */}
            <div className="bg-white rounded-lg sm:rounded-2xl p-4 sm:p-8 shadow-lg border border-border/50">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10 items-center">
                <div>
                  <h2 className="text-3xl sm:text-5xl font-extrabold leading-tight text-primary tracking-tight">
                    30 DAY MONEY BACK GUARANTEE
              </h2>
                  <p className="mt-4 text-muted-foreground text-sm sm:text-base max-w-prose">
                    If you are not completely satisfied, return your product within 30 days for a full refund. We stand behind the quality and results.
                  </p>
                </div>
                                {/*
                  30-DAY GUARANTEE SLIDER
                  This slider shows the "Before" and "After" states of using the product.

                  IMAGE SOURCES (dedicated guarantee assets):
                  - leftImage: "guarantee-before-image" (Before state)
                  - rightImage: "guarantee-after-image" (After state)

                  These are dedicated assets specifically for the guarantee section,
                  separate from the product gallery images.
                */}
                <div>
                  <BeforeAfterSlider
                    leftImage="guarantee-before-image"
                    rightImage="guarantee-after-image"
                    leftLabel="Before"
                    rightLabel="After"
                  />
                </div>
              </div>
            </div>

            <div className="px-0">
              <p className="text-muted-foreground leading-relaxed text-base sm:text-lg">
                {product.description}
              </p>
            </div>

            {/* Features (no card background, full-width) */}
            <div className="px-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {product.features.map((feature, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-3 p-3 sm:p-4 rounded-lg bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20 hover:from-primary/10 hover:to-secondary/10 hover:border-primary/40 hover:shadow-lg transition-all duration-300 transform hover:scale-105 animate-in slide-in-from-bottom-4 fade-in-0 feature-glow"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-secondary rounded-full flex items-center justify-center flex-shrink-0 animate-pulse hover:icon-rotate">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-primary">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Specifications */}
            <div className="px-0">
              <div className="rounded-lg sm:rounded-xl border border-border overflow-hidden">
                {Object.entries(product.specifications).map(
                  ([key, value], index) => (
                    <div
                      key={key}
                      className={`flex flex-col sm:flex-row sm:justify-between py-3 sm:py-4 px-4 sm:px-6 hover:bg-muted/30 transition-all duration-300 animate-in slide-in-from-right-4 fade-in-0 spec-bounce ${
                         index !== Object.entries(product.specifications).length - 1
                           ? "border-b border-border"
                           : ""
                       }`}
                      style={{ animationDelay: `${index * 150}ms` }}
                    >
                      <span className="font-semibold text-primary text-sm sm:text-base mb-1 sm:mb-0 hover:text-primary/80 transition-colors duration-200">{key}</span>
                      <span className="text-xs sm:text-sm font-medium text-muted-foreground bg-white/70 px-2 sm:px-3 py-1 rounded-full self-start sm:self-auto hover:bg-white hover:shadow-sm transition-all duration-200 transform hover:scale-105 hover:spec-bounce">
                        {value}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* As Seen On + Ticker (appears before Product Video) */}
            <div className="max-w-7xl mx-auto px-0">
              <div className="text-center text-2xl sm:text-3xl font-extrabold text-primary mb-4 sm:mb-6">As Seen On</div>
              <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 mb-6 sm:mb-8">
                {['SHAPE','APTA','USA TODAY','BBC','FORBES'].map((name) => (
                  <span
                    key={name}
                    className="text-xl sm:text-2xl font-black tracking-widest text-foreground/80 opacity-80 select-none"
                    style={{ filter: 'grayscale(100%)' }}
                  >
                    {name}
                  </span>
                ))}
              </div>
              <div className="relative w-screen -mx-[calc((100vw-100%)/2)] bg-secondary text-secondary-foreground py-2 sm:py-3 border-y border-secondary/40">
                {/* two synchronized tracks fill the whole viewport width and loop seamlessly */}
                <div className="marquee font-semibold uppercase tracking-wide text-xs sm:text-sm h-5 sm:h-6">
                  <div className="marquee__track">
                    <span className="marquee__item">Empower Your Life</span>
                    <span className="marquee__item">Revitalize Your Body</span>
                    <span className="marquee__item">Recover Smarter</span>
                    <span className="marquee__item">Empower Your Life</span>
                    <span className="marquee__item">Revitalize Your Body</span>
                    <span className="marquee__item">Recover Smarter</span>
                    <span className="marquee__item">Empower Your Life</span>
                    <span className="marquee__item">Revitalize Your Body</span>
                    <span className="marquee__item">Recover Smarter</span>
                    <span className="marquee__item">Empower Your Life</span>
                    <span className="marquee__item">Revitalize Your Body</span>
                    <span className="marquee__item">Recover Smarter</span>
                    <span className="marquee__item">Empower Your Life</span>
                    <span className="marquee__item">Revitalize Your Body</span>
                    <span className="marquee__item">Recover Smarter</span>
                    <span className="marquee__item">Empower Your Life</span>
                    <span className="marquee__item">Revitalize Your Body</span>
                    <span className="marquee__item">Recover Smarter</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Video + Accent Panel (full-width square composition) */}
            {product.videos.length > 0 && (
              <div className="max-w-7xl mx-auto px-0">
                {/* Mobile: Stacked layout (video on top, panel below) */}
                <div className="block lg:hidden">
                  {/* Video on top - Mobile optimized for TikTok-like resolution */}
                  <div className="w-full px-4">
                    <div className="w-full overflow-hidden rounded-t-lg bg-black shadow-lg" style={{ aspectRatio: '9/16', minHeight: '400px' }}>
                      {renderVideoContent(product.videos[0], "w-full h-full object-cover")}
                    </div>
                  </div>
                  {/* Purple panel below - no gap, constrained width */}
                  <div className="w-full px-4">
                    <div className="w-full bg-secondary text-secondary-foreground py-8 sm:py-12 rounded-b-lg">
                      <div className="max-w-2xl mx-auto px-4">
                        <h3 className="text-2xl sm:text-3xl font-extrabold leading-tight">Feel The Difference</h3>
                        <p className="mt-3 sm:mt-4 text-sm sm:text-base opacity-90">
                          Discover how consistent, targeted recovery elevates your daily routine. Our device combines engineered pressure, heat management, and ergonomic design to help loosen tight muscles and restore natural mobility in minutes.
                        </p>
                        <p className="mt-3 text-sm sm:text-base opacity-90">
                          Whether you are preparing for a workout, resetting after sitting all day, or winding down before bed, a few focused minutes can change the way your body feels. Most people notice improved range of motion, less stiffness, and a calmer, more relaxed state right away.
                        </p>
                        <p className="mt-3 text-sm sm:text-base opacity-90">
                          Built with premium materials and tuned for everyday use, it is designed to be quiet, powerful, and reliable. And if you do not love it, our 30‑day money‑back guarantee makes it completely risk‑free to try.
                        </p>
                        <div className="mt-5 sm:mt-6 flex flex-wrap gap-2">
                          <span className="px-3 py-1 rounded-full bg-secondary-foreground/10 text-secondary-foreground text-xs sm:text-sm font-semibold">Premium Build</span>
                          <span className="px-3 py-1 rounded-full bg-secondary-foreground/10 text-secondary-foreground text-xs sm:text-sm font-semibold">Fast Relief</span>
                          <span className="px-3 py-1 rounded-full bg-secondary-foreground/10 text-secondary-foreground text-xs sm:text-sm font-semibold">Trusted by Pros</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Desktop: Side-by-side layout */}
                <div className="hidden lg:block relative" style={{ minHeight: '800px' }}>
                  {/* Left: video - Height reduced by 1/4 for PC */}
                  <div className="absolute inset-y-0 left-0 w-1/2">
                    <div className="w-full h-full overflow-hidden rounded-none border-0 bg-black">
                      {renderVideoContent(product.videos[0], "w-full h-full object-cover")}
                    </div>
                  </div>
                  {/* Right: promo panel */}
                  <div className="absolute inset-y-0 right-0 w-1/2">
                    <div className="w-full h-full rounded-none bg-secondary text-secondary-foreground p-6 sm:p-10 flex flex-col justify-center border-0 overflow-y-auto">
                      <h3 className="text-2xl sm:text-4xl font-extrabold leading-tight">Feel The Difference</h3>
                      <p className="mt-3 sm:mt-4 text-sm sm:text-base opacity-90">
                        Discover how consistent, targeted recovery elevates your daily routine. Our device combines engineered pressure, heat management, and ergonomic design to help loosen tight muscles and restore natural mobility in minutes.
                      </p>
                      <p className="mt-3 text-sm sm:text-base opacity-90">
                        Whether you are preparing for a workout, resetting after sitting all day, or winding down before bed, a few focused minutes can change the way your body feels. Most people notice improved range of motion, less stiffness, and a calmer, more relaxed state right away.
                      </p>
                      <p className="mt-3 text-sm sm:text-base opacity-90">
                        Built with premium materials and tuned for everyday use, it is designed to be quiet, powerful, and reliable. And if you do not love it, our 30‑day money‑back guarantee makes it completely risk‑free to try.
                      </p>
                      <div className="mt-5 sm:mt-6 flex flex-wrap gap-2">
                        <span className="px-3 py-1 rounded-full bg-secondary-foreground/10 text-secondary-foreground text-xs sm:text-sm font-semibold">Premium Build</span>
                        <span className="px-3 py-1 rounded-full bg-secondary-foreground/10 text-secondary-foreground text-xs sm:text-sm font-semibold">Fast Relief</span>
                        <span className="px-3 py-1 rounded-full bg-secondary-foreground/10 text-secondary-foreground text-xs sm:text-sm font-semibold">Trusted by Pros</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Video Reviews Carousel */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/10">
        <div className="container mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8">
            <div className="text-center sm:text-left flex-1 mb-4 sm:mb-0">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-3 sm:mb-4 flex items-center justify-center sm:justify-start gap-3">
                <Video className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                Real Customer Stories
              </h2>
              <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto sm:mx-0">
                See what our customers are saying about their experience with our premium headphones
              </p>
            </div>
            {isUserAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingVideos(true)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4 text-primary" />
                Edit Videos
              </Button>
            )}
          </div>
          <div className="relative">
            <div 
              ref={setCarouselRef}
              className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 group [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              style={{ 
                scrollBehavior: 'smooth'
              }}
            >
              {/* Create infinite scroll by repeating videos multiple times */}
              {Array.from({ length: 5 }, (_, repeatIndex) => 
                (product.videoReviews || []).map((video, index) => (
                  <div 
                    key={`${video.id}-${repeatIndex}-${index}`} 
                    className="flex-shrink-0 w-56 sm:w-64"
                  >
                                         <div 
                      className="group relative bg-white rounded-lg sm:rounded-xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105"
                       onClick={() => handleVideoClick(video)}
                       onMouseEnter={() => setHoveredVideo(video.id)}
                       onMouseLeave={() => setHoveredVideo(null)}
                     >
                       <div className="aspect-[9/16] bg-muted relative">
                         <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                         
                         {/* Video Player - Shows on hover */}
                         {hoveredVideo === video.id && (
                           <div className="absolute inset-0 bg-black animate-in fade-in duration-300">
                             {renderVideoContent(video.videoUrl, "w-full h-full object-cover", false)}
                           </div>
                         )}
                         
                         {/* Thumbnail - Shows when not hovered */}
                         {hoveredVideo !== video.id && (
                           <>
                             {/* Play overlay indicator */}
                             <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center">
                                <Play className="h-5 w-5 sm:h-6 sm:w-6 text-black ml-1" />
                               </div>
                             </div>
                             
                            <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 right-2 sm:right-3">
                               <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-1">
                                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors">
                                    <Play className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                                   </div>
                                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors">
                                    <Volume2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                                   </div>
                                 </div>
                                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors">
                                  <Maximize2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                                 </div>
                               </div>
                             </div>
                             <MediaImage
                               assetId={video.thumbnail}
                               alt={`Video testimonial by ${video.customerName}`}
                               className="w-full h-full object-cover"
                             />
                           </>
                         )}
                       </div>
                      <div className="p-2 sm:p-3">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          "{video.testimonial}"
                        </p>
                        <p className="text-xs text-muted-foreground mt-2 font-medium">
                          - {video.customerName}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Bundle Section - Clean & Effective Results */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-br from-muted/20 via-background to-muted/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            {/* Left: Text Content */}
            <div className="space-y-6 sm:space-y-8">
              <div>
                <p className="text-sm sm:text-base font-semibold text-secondary uppercase tracking-wide mb-2">WITH THE BUNDLE</p>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-primary leading-tight">
                  Clean & Effective Results Guaranteed
                </h2>
              </div>
              
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                Experience the <span className="font-semibold text-primary">Uproot Clean Complete Package</span> - your all-in-one solution for comprehensive cleaning. This premium bundle includes everything you need to transform your space into a pristine, hair-free sanctuary.
              </p>
              
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                Our complete package features a compact precision tool for hard-to-reach spots, a powerful cleaning weapon for stubborn fur, a double-width cleaner for larger areas, and a professional-grade deshedder. Each component is engineered for maximum effectiveness and durability.
              </p>
              
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-primary mb-4">Designed to clean:</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  {[
                    { name: 'Carpets', icon: '🟦' },
                    { name: 'Cars', icon: '🚗' },
                    { name: 'Dogs', icon: '🐕' },
                    { name: 'Cats', icon: '🐱' },
                    { name: 'Wiry Coats', icon: '🌀' },
                    { name: 'Double Coats', icon: '⚡' },
                    { name: 'Long Coats', icon: '✨' },
                    { name: 'Furniture', icon: '🛋️' },
                    { name: 'Bedding', icon: '🛏️' }
                  ].map((item) => (
                    <div key={item.name} className="flex items-center gap-2 p-2 sm:p-3 rounded-lg bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20">
                      <span className="text-lg sm:text-xl">{item.icon}</span>
                      <span className="text-sm sm:text-base font-medium text-primary">{item.name}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-4 text-secondary font-semibold">
                  <span className="text-lg">✨</span>
                  <span className="text-sm sm:text-base">And much more!</span>
                </div>
              </div>
            </div>
            
            {/* Right: Dynamic Visual */}
            <div className="relative">
              <div className="aspect-[4/3] sm:aspect-[3/2] rounded-xl overflow-hidden shadow-2xl border border-border/50">
                <div className="w-full h-full bg-gradient-to-br from-secondary/20 to-primary/20 relative">
                  {/* Placeholder for dynamic visual - replace with actual video/image */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-secondary/20 rounded-full flex items-center justify-center mx-auto">
                        <Play className="h-8 w-8 sm:h-10 sm:w-10 text-secondary ml-1" />
                      </div>
                      <p className="text-sm sm:text-base font-medium text-primary">Product Demonstration</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Watch how our bundle transforms cleaning</p>
                    </div>
                  </div>
                  
                  {/* Overlay elements to simulate the cleaning effect */}
                  <div className="absolute top-4 left-4 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-secondary rounded-full"></div>
                  </div>
                  
                  {/* Simulated cleaning path */}
                  <div className="absolute top-1/2 left-1/4 w-1/2 h-1 bg-secondary/40 rounded-full transform -translate-y-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Reviews Section - Masonry Layout */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-muted/20">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-4 sm:mb-0">
              Reviews
            </h2>
            {isUserAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingReviews(true)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4 text-primary" />
                Edit Reviews
              </Button>
            )}
          </div>
          
          {/* Mobile Grid Layout */}
          <div className="grid grid-cols-1 sm:hidden gap-4">
            {product.reviews.slice(0, displayedReviews).map((review, index) => (
              <div key={review.id} className="transform transition-all duration-300 hover:scale-105">
                <Card className="border shadow-sm bg-white overflow-hidden">
                  <div className="w-full">
                    <MediaImage
                      assetId={review.productImage || review.image || "review-product-image"}
                      alt="Product"
                      className="w-full object-cover h-48"
                    />
                  </div>
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                      "{review.comment}"
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <MediaImage
                          assetId={review.profileImage || review.image || "review-profile-fallback"}
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
                                    ? "text-primary fill-current"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          {review.verified && (
                            <CheckCircle className="h-3 w-3 text-secondary" />
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
            ))}
          </div>

          {/* Desktop Masonry Layout */}
          <div className="hidden sm:flex gap-4 lg:gap-6">
             {/* Column 1 - Tall cards */}
                         <div className="flex-1 space-y-4 lg:space-y-6">
              {product.reviews.slice(0, displayedReviews).map((review, index) => {
                 if (index % 4 !== 0) return null; // Only show cards for column 1
                 return (
                   <div key={review.id} className="transform transition-all duration-300 hover:scale-105">
                     <Card className="border shadow-sm bg-white overflow-hidden h-[500px]">
                       <div className="w-full">
                         <MediaImage
                           assetId={review.productImage || review.image || "review-product-image"}
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
                             <MediaImage
                               assetId={review.profileImage || review.image || "review-profile-fallback"}
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
                                         ? "text-primary fill-current"
                                         : "text-gray-300"
                                     }`}
                                   />
                                 ))}
                               </div>
                               {review.verified && (
                                 <CheckCircle className="h-3 w-3 text-secondary" />
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
            <div className="flex-1 space-y-4 lg:space-y-6">
              {product.reviews.slice(0, displayedReviews).map((review, index) => {
                 if (index % 4 !== 1) return null; // Only show cards for column 2
                 return (
                   <div key={review.id} className="transform transition-all duration-300 hover:scale-105">
                     <Card className="border shadow-sm bg-white overflow-hidden h-[450px]">
                       <div className="w-full">
                         <MediaImage
                           assetId={review.productImage || review.image || "review-product-image"}
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
                             <MediaImage
                               assetId={review.profileImage || review.image || "review-profile-fallback"}
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
                                         ? "text-primary fill-current"
                                         : "text-gray-300"
                                     }`}
                                   />
                                 ))}
                               </div>
                               {review.verified && (
                                 <CheckCircle className="h-3 w-3 text-secondary" />
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
            <div className="flex-1 space-y-4 lg:space-y-6">
              {product.reviews.slice(0, displayedReviews).map((review, index) => {
                 if (index % 4 !== 2) return null; // Only show cards for column 3
                 return (
                   <div key={review.id} className="transform transition-all duration-300 hover:scale-105">
                     <Card className="border shadow-sm bg-white overflow-hidden h-[500px]">
                       <div className="w-full">
                         <MediaImage
                           assetId={review.productImage || review.image || "review-product-image"}
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
                             <MediaImage
                               assetId={review.profileImage || review.image || "review-profile-fallback"}
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
                                         ? "text-primary fill-current"
                                         : "text-gray-300"
                                       }`}
                                   />
                                 ))}
                               </div>
                               {review.verified && (
                                 <CheckCircle className="h-3 w-3 text-secondary" />
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
            <div className="flex-1 space-y-4 lg:space-y-6">
              {product.reviews.slice(0, displayedReviews).map((review, index) => {
                 if (index % 4 !== 3) return null; // Only show cards for column 4
                 return (
                   <div key={review.id} className="transform transition-all duration-300 hover:scale-105">
                     <Card className="border shadow-sm bg-white overflow-hidden h-[450px]">
                       <div className="w-full">
                         <MediaImage
                           assetId={review.productImage || review.image || "review-product-image"}
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
                             <MediaImage
                               assetId={review.profileImage || review.image || "review-profile-fallback"}
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
                                         ? "text-primary fill-current"
                                         : "text-gray-300"
                                     }`}
                                   />
                                 ))}
                               </div>
                               {review.verified && (
                                 <CheckCircle className="h-3 w-3 text-secondary" />
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
          {displayedReviews < product.reviews.length && (
            <div className="flex justify-center mt-6 sm:mt-8">
              <Button
                onClick={handleLoadMoreReviews}
                variant="outline"
                size="lg"
                className="px-6 sm:px-8 py-2 sm:py-3"
              >
                Load More Reviews
                <span className="ml-2 text-xs sm:text-sm text-muted-foreground">
                  ({product.reviews.length - displayedReviews} remaining)
                </span>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-xl sm:text-2xl font-bold text-primary text-center mb-6 sm:mb-8">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="space-y-3 sm:space-y-4">
            {product.faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border rounded-lg"
              >
                <AccordionTrigger className="px-4 sm:px-6 py-3 sm:py-4 text-left text-sm sm:text-base">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="px-4 sm:px-6 pb-3 sm:pb-4 text-muted-foreground text-sm">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

            {/* Final CTA Section */}
      <section className="py-20 sm:py-28 md:py-32 px-4 sm:px-6 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 shadow-2xl border border-primary/10">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-primary mb-4 sm:mb-6 flex items-center justify-center gap-2 sm:gap-3">
                <Rocket className="h-6 w-6 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary" />
                Ready to Experience Premium Quality?
              </h2>
              <p className="text-sm sm:text-base md:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
                Join thousands of satisfied customers who trust our products. Order
                now and enjoy free shipping with our 30-day money-back guarantee.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                          <Button
                  onClick={handleBuyNow}
                  disabled={quantity > availableStock}
            size="lg"
                  className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground text-base sm:text-lg md:text-xl px-6 sm:px-8 md:px-12 py-4 sm:py-6 md:py-8 rounded-xl sm:rounded-2xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 transform hover:scale-105 font-bold"
          >
                  <CreditCard className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                  Buy Now - ${finalPrice.toFixed(2)}
                </Button>
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 md:gap-6 text-xs sm:text-sm text-muted-foreground">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-secondary" />
                    <span>Free Shipping</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                    <span>30-Day Returns</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Lock className="h-3 w-3 sm:h-4 sm:w-4 text-secondary" />
                    <span>Secure Payment</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Video Modal */}
      {showVideoModal && selectedVideo && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b">
              <h3 className="text-base sm:text-lg font-semibold">Video Testimonial</h3>
              <div className="flex gap-2">
                {isUserAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowVideoModal(false);
                      setIsEditingVideos(true);
                    }}
                    className="flex items-center gap-2 text-xs sm:text-sm"
                  >
                    <Edit className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                    Edit Video
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseVideoModal}
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
            <div className="p-3 sm:p-4">
              <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-3 sm:mb-4">
                {isGif(selectedVideo.videoUrl) ? (
                  // GIF - display as image
                  <img
                    src={selectedVideo.videoUrl}
                    alt={`Video testimonial by ${selectedVideo.customerName}`}
                    className="w-full h-full object-cover"
                  />
                ) : selectedVideo.videoUrl.startsWith('data:') ? (
                   // Local video file
                   <video
                     src={selectedVideo.videoUrl}
                     controls
                     className="w-full h-full"
                   />
                 ) : (
                   // YouTube or external video
                   <iframe
                     src={`${selectedVideo.videoUrl}?rel=0&modestbranding=1`}
                     title={`Video testimonial by ${selectedVideo.customerName}`}
                     className="w-full h-full"
                     frameBorder="0"
                     allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                     allowFullScreen
                     sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                   />
                 )}
               </div>
              <div className="space-y-2">
                <p className="text-base sm:text-lg font-medium text-primary">
                  {selectedVideo.customerName}
                </p>
                <p className="text-sm sm:text-base text-muted-foreground italic">
                  "{selectedVideo.testimonial}"
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loyalty Floating Action Button (FAB) */}
      {showLoyaltyFab && (
        <div className="fixed bottom-6 right-6 z-50 hidden md:block">
          <div className="relative">
            {/* Pulse ring */}
            <span className="pointer-events-none absolute inset-0 rounded-full bg-secondary/40 animate-ping" />
            {/* Main FAB */}
            <Button
              aria-label="Explore ranked discounts"
              onClick={() => setShowLoyaltyInfo(true)}
              className="relative h-16 w-16 rounded-full bg-secondary text-secondary-foreground shadow-lg hover:shadow-xl hover:bg-secondary/90"
            >
              <DollarSign className="h-8 w-8" />
            </Button>
            {/* Close dot touching the FAB */}
            <button
              type="button"
              onClick={() => setShowLoyaltyFab(false)}
              aria-label="Hide discount helper"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 rounded-full bg-background border border-border text-muted-foreground hover:bg-muted flex items-center justify-center shadow"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
      {/* Loyalty Info Dialog */}
      <Dialog open={showLoyaltyInfo} onOpenChange={setShowLoyaltyInfo}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Award className="h-5 w-5" /> Unlock Ranked Discounts
            </DialogTitle>
            <DialogDescription>
              The more you purchase, the higher your rank and the bigger your permanent savings on every future order.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between rounded-lg border border-border p-3 bg-muted/20">
                <div className="flex items-center gap-2 flex-1">
                  <Shield className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <Badge className="bg-secondary text-secondary-foreground w-20 text-center flex items-center justify-center">Silver</Badge>
                  <span className="text-muted-foreground">0 purchases</span>
                </div>
                <span className="text-xs text-muted-foreground ml-4">0% off</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3 bg-muted/20">
                <div className="flex items-center gap-2 flex-1">
                  <Award className="h-4 w-4 text-accent flex-shrink-0" />
                  <Badge className="bg-secondary text-secondary-foreground w-20 text-center flex items-center justify-center">Gold</Badge>
                  <span className="text-muted-foreground">1+ purchases</span>
                </div>
                <span className="text-xs font-medium text-secondary ml-4">5% off</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3 bg-muted/20">
                <div className="flex items-center gap-2 flex-1">
                  <Star className="h-4 w-4 text-primary flex-shrink-0" />
                  <Badge className="bg-secondary text-secondary-foreground w-20 text-center flex items-center justify-center">Platinum</Badge>
                  <span className="text-muted-foreground">3+ purchases</span>
                </div>
                <span className="text-xs font-medium text-secondary ml-4">10% off</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3 bg-muted/20">
                <div className="flex items-center gap-2 flex-1">
                  <Crown className="h-4 w-4 text-secondary flex-shrink-0" />
                  <Badge className="bg-secondary text-secondary-foreground w-20 text-center flex items-center justify-center">Diamond</Badge>
                  <span className="text-muted-foreground">5+ purchases</span>
                </div>
                <span className="text-xs font-medium text-secondary ml-4">15% off</span>
              </div>
            </div>
            <div className="rounded-lg border border-secondary/30 bg-secondary/10 p-3 text-xs text-muted-foreground">
              Tip: Your discount stacks after any wellness intro offer. Discounts apply automatically at checkout.
            </div>
          </div>
          <DialogFooter className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setShowLoyaltyInfo(false)}>
              Close
            </Button>
            <Button onClick={() => { setShowLoyaltyInfo(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
              Start Shopping
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 border-0 bg-transparent">
          <div className="relative w-full h-full flex items-center justify-center">
            <MediaImage
              assetId={product.images[currentImageIndex]}
              alt={product.name}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white border-0"
              onClick={() => setIsModalOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Store;
