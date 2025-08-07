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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  createStoreOrder,
  createStoreOrderNotification,
} from "@/lib/storeUtils";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";

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
    },
    {
      id: "2",
      name: "Mike R.",
      rating: 5,
      comment:
        "Best headphones I've ever owned. The sound quality is outstanding and they're so comfortable I forget I'm wearing them.",
      date: "2024-01-10",
      verified: true,
    },
    {
      id: "3",
      name: "Jennifer L.",
      rating: 4,
      comment:
        "Great sound quality and very comfortable. The only minor issue is the touch controls can be a bit sensitive sometimes.",
      date: "2024-01-08",
      verified: true,
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
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toast } = useToast();

  const product = mockProductData;
  const discountPercentage = Math.round(
    ((product.originalPrice - product.price) / product.originalPrice) * 100
  );

  const handleBuyNow = () => {
    // Create order info for direct purchase (not cart)
    const orderInfo = {
      orderId: `direct_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      items: [{
        name: product.name,
        price: product.price,
        quantity,
        image: product.images[0],
      }],
      totalPrice: product.price * quantity,
      createdAt: new Date().toISOString(),
    };

    // Store in sessionStorage for checkout page
    sessionStorage.setItem("directOrderInfo", JSON.stringify(orderInfo));
    
    // Navigate to checkout page
    navigate("/checkout");
  };

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      image: product.images[0],
    });

    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
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

  return (
    <div className="min-h-screen bg-background">
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
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-4 w-4 transition-transform duration-200" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                </Button>
              </div>

              {/* Thumbnail Images */}
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (isTransitioning) return;
                      setIsTransitioning(true);
                      setSelectedImage(index);
                      setTimeout(() => setIsTransitioning(false), 300);
                    }}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ease-in-out transform hover:scale-105 ${
                      selectedImage === index
                        ? "border-accent scale-105"
                        : "border-transparent hover:border-muted-foreground/20"
                    }`}
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
                    ${product.price}
                  </span>
                  <span className="text-lg text-muted-foreground line-through">
                    ${product.originalPrice}
                  </span>
                  <Badge variant="destructive" className="text-sm">
                    Save {discountPercentage}%
                  </Badge>
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
                    >
                      -
                    </Button>
                    <span className="px-4 py-2 text-sm font-medium">
                      {quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3"
                    >
                      +
                    </Button>
                  </div>
                </div>

                                 {/* Primary CTA */}
                 <Button
                   onClick={handleBuyNow}
                   disabled={isProcessing}
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
                       Buy Now - ${(product.price * quantity).toFixed(2)}
                     </>
                   )}
                 </Button>

                 {/* Add to Cart Button */}
                 <Button
                   onClick={handleAddToCart}
                   disabled={isProcessing}
                   variant="outline"
                   size="lg"
                   className="w-full border-accent text-accent hover:bg-accent/10 text-lg py-6 mb-4"
                 >
                   <ShoppingCart className="mr-2 h-5 w-5" />
                   Add to Cart - ${(product.price * quantity).toFixed(2)}
                 </Button>

                {/* Secondary Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
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
                  <Button variant="outline" size="lg">
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

            {/* Customer Reviews */}
            <div>
              <h3 className="text-xl font-semibold text-primary mb-4">
                Customer Reviews
              </h3>
              <div className="space-y-4">
                {product.reviews.map((review) => (
                  <Card key={review.id} className="border-0 shadow-elegant">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
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
                          <Badge variant="outline" className="text-xs">
                            Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        "{review.comment}"
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {review.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.date).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
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
             size="lg"
             className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6"
           >
             <CreditCard className="mr-2 h-5 w-5" />
             Buy Now - ${product.price}
           </Button>
        </div>
      </section>
    </div>
  );
};

export default Store;
