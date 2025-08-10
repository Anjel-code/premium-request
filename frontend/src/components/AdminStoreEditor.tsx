import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  X,
  Save,
  Edit,
  Eye,
  DollarSign,
  Percent,
  Gift,
  Settings,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateProductStock } from "@/lib/storeUtils";

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

interface DiscountOffer {
  enabled: boolean;
  percentage: number;
  title: string;
  description: string;
  goals: string[];
  socialProof: {
    shopperCount: number;
    message: string;
  };
}

interface AdminStoreEditorProps {
  product: ProductData;
  appId?: string;
  onSave: (updatedProduct: ProductData, discountOffer: DiscountOffer) => void;
  onCancel: () => void;
}

const AdminStoreEditor: React.FC<AdminStoreEditorProps> = ({
  product,
  appId,
  onSave,
  onCancel,
}) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProduct, setEditedProduct] = useState<ProductData>({ ...product });
  const [discountOffer, setDiscountOffer] = useState<DiscountOffer>({
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
  });

  const handleInputChange = (field: keyof ProductData, value: any) => {
    setEditedProduct(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNumberInputChange = (field: keyof ProductData, value: string) => {
    const numValue = parseFloat(value) || 0;
    handleInputChange(field, numValue);
  };

  const handleArrayInputChange = (field: keyof ProductData, index: number, value: string) => {
    const array = [...(editedProduct[field] as string[])];
    array[index] = value;
    handleInputChange(field, array);
  };

  const addArrayItem = (field: keyof ProductData) => {
    const array = [...(editedProduct[field] as string[])];
    array.push("");
    handleInputChange(field, array);
  };

  const removeArrayItem = (field: keyof ProductData, index: number) => {
    const array = [...(editedProduct[field] as string[])];
    array.splice(index, 1);
    handleInputChange(field, array);
  };

  const handleSpecificationChange = (key: string, value: string) => {
    const specs = { ...editedProduct.specifications };
    if (value.trim() === "") {
      delete specs[key];
    } else {
      specs[key] = value;
    }
    handleInputChange('specifications', specs);
  };

  const addSpecification = () => {
    const newKey = `New Specification ${Object.keys(editedProduct.specifications).length + 1}`;
    const specs = { ...editedProduct.specifications, [newKey]: "" };
    handleInputChange('specifications', specs);
  };

  const removeSpecification = (key: string) => {
    const specs = { ...editedProduct.specifications };
    delete specs[key];
    handleInputChange('specifications', specs);
  };

  const handleDiscountChange = (field: keyof DiscountOffer, value: any) => {
    setDiscountOffer(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDiscountGoalChange = (index: number, value: string) => {
    const goals = [...discountOffer.goals];
    goals[index] = value;
    handleDiscountChange('goals', goals);
  };

  const addDiscountGoal = () => {
    const goals = [...discountOffer.goals, ""];
    handleDiscountChange('goals', goals);
  };

  const removeDiscountGoal = (index: number) => {
    const goals = [...discountOffer.goals];
    goals.splice(index, 1);
    handleDiscountChange('goals', goals);
  };

  const handleSave = () => {
    // Validate required fields
    if (!editedProduct.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Product name is required.",
        variant: "destructive",
      });
      return;
    }

    if (editedProduct.price <= 0) {
      toast({
        title: "Validation Error",
        description: "Product price must be greater than 0.",
        variant: "destructive",
      });
      return;
    }

    // Save to localStorage for now (in a real app, this would save to a database)
    localStorage.setItem('adminStoreProduct', JSON.stringify(editedProduct));
    localStorage.setItem('adminDiscountOffer', JSON.stringify(discountOffer));

    onSave(editedProduct, discountOffer);
    
    toast({
      title: "Success",
      description: "Store content has been updated successfully.",
    });
  };

  const handlePreview = () => {
    // Save current state and switch to preview mode
    localStorage.setItem('adminStoreProduct', JSON.stringify(editedProduct));
    localStorage.setItem('adminDiscountOffer', JSON.stringify(discountOffer));
    // Call onCancel to exit edit mode and show preview
    onCancel();
  };

  const handleUpdateStock = async (newStockCount: number) => {
    if (!appId) {
      toast({
        title: "Error",
        description: "App ID not available. Cannot update stock.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateProductStock(appId, product.id, newStockCount);
      toast({
        title: "Stock Updated",
        description: `Stock count updated to ${newStockCount} items.`,
      });
    } catch (error) {
      console.error("Error updating stock:", error);
      toast({
        title: "Error",
        description: "Failed to update stock. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Settings className="h-6 w-6 text-primary" />
                <h1 className="text-3xl font-bold">Store Editor</h1>
              </div>
              <Badge variant="secondary">Admin Mode</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handlePreview}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Preview
              </Button>
              <Button
                onClick={handleSave}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
              <Button
                variant="outline"
                onClick={onCancel}
              >
                Cancel
              </Button>
            </div>
          </div>

          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="discount">Discount Offer</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            {/* Basic Information */}
            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Product Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Product Name</Label>
                      <Input
                        id="name"
                        value={editedProduct.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter product name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="id">Product ID</Label>
                      <Input
                        id="id"
                        value={editedProduct.id}
                        onChange={(e) => handleInputChange('id', e.target.value)}
                        placeholder="Enter product ID"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Product Description</Label>
                    <Textarea
                      id="description"
                      value={editedProduct.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Enter product description"
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rating">Rating</Label>
                      <Input
                        id="rating"
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={editedProduct.rating}
                        onChange={(e) => handleNumberInputChange('rating', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reviewCount">Review Count</Label>
                      <Input
                        id="reviewCount"
                        type="number"
                        min="0"
                        value={editedProduct.reviewCount}
                        onChange={(e) => handleNumberInputChange('reviewCount', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stockCount">Stock Count</Label>
                      <Input
                        id="stockCount"
                        type="number"
                        min="0"
                        value={editedProduct.stockCount}
                        onChange={(e) => handleNumberInputChange('stockCount', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pricing */}
            <TabsContent value="pricing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pricing Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Current Price ($)</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={editedProduct.price}
                        onChange={(e) => handleNumberInputChange('price', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="originalPrice">Original Price ($)</Label>
                      <Input
                        id="originalPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        value={editedProduct.originalPrice}
                        onChange={(e) => handleNumberInputChange('originalPrice', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="shippingInfo">Shipping Info</Label>
                      <Input
                        id="shippingInfo"
                        value={editedProduct.shippingInfo}
                        onChange={(e) => handleInputChange('shippingInfo', e.target.value)}
                        placeholder="e.g., Free 3-day shipping"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="guarantee">Guarantee</Label>
                      <Input
                        id="guarantee"
                        value={editedProduct.guarantee}
                        onChange={(e) => handleInputChange('guarantee', e.target.value)}
                        placeholder="e.g., 30-day money-back guarantee"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="returnPolicy">Return Policy</Label>
                      <Input
                        id="returnPolicy"
                        value={editedProduct.returnPolicy}
                        onChange={(e) => handleInputChange('returnPolicy', e.target.value)}
                        placeholder="e.g., Easy returns within 30 days"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stock Management */}
              <Card>
                <CardHeader>
                  <CardTitle>Stock Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stockCount">Current Stock Count</Label>
                      <Input
                        id="stockCount"
                        type="number"
                        min="0"
                        value={editedProduct.stockCount}
                        onChange={(e) => handleNumberInputChange('stockCount', e.target.value)}
                        placeholder="Enter stock count"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Database Stock Update</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          placeholder="New stock count"
                          id="dbStockCount"
                        />
                        <Button
                          onClick={() => {
                            const input = document.getElementById('dbStockCount') as HTMLInputElement;
                            const newStock = parseInt(input.value);
                            if (!isNaN(newStock) && newStock >= 0) {
                              handleUpdateStock(newStock);
                              input.value = '';
                            }
                          }}
                          className="flex items-center gap-2"
                        >
                          Update DB
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>• Local stock count: Updates the product data in localStorage</p>
                    <p>• Database stock update: Updates the real-time stock count in the database</p>
                    <p>• Database stock takes precedence over local stock for all users</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>



            {/* Content */}
            <TabsContent value="content" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Product Benefits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editedProduct.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={benefit}
                        onChange={(e) => handleArrayInputChange('benefits', index, e.target.value)}
                        placeholder="Enter benefit"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeArrayItem('benefits', index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => addArrayItem('benefits')}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Benefit
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Product Features</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editedProduct.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={feature}
                        onChange={(e) => handleArrayInputChange('features', index, e.target.value)}
                        placeholder="Enter feature"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeArrayItem('features', index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => addArrayItem('features')}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Feature
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Technical Specifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(editedProduct.specifications).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Input
                        value={key}
                        onChange={(e) => {
                          const specs = { ...editedProduct.specifications };
                          delete specs[key];
                          specs[e.target.value] = value;
                          handleInputChange('specifications', specs);
                        }}
                        placeholder="Specification name"
                        className="w-1/3"
                      />
                      <Input
                        value={value}
                        onChange={(e) => handleSpecificationChange(key, e.target.value)}
                        placeholder="Specification value"
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeSpecification(key)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={addSpecification}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Specification
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Discount Offer */}
            <TabsContent value="discount" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5" />
                    Discount Offer Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="discount-enabled"
                      checked={discountOffer.enabled}
                      onCheckedChange={(checked) => handleDiscountChange('enabled', checked)}
                    />
                    <Label htmlFor="discount-enabled">Enable Discount Offer</Label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="discount-percentage">Discount Percentage</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="discount-percentage"
                          type="number"
                          min="0"
                          max="100"
                          value={discountOffer.percentage}
                          onChange={(e) => handleDiscountChange('percentage', parseInt(e.target.value) || 0)}
                        />
                        <Percent className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discount-title">Offer Title</Label>
                    <Input
                      id="discount-title"
                      value={discountOffer.title}
                      onChange={(e) => handleDiscountChange('title', e.target.value)}
                      placeholder="e.g., What's Your #1 Wellness Goal?"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discount-description">Offer Description</Label>
                    <Textarea
                      id="discount-description"
                      value={discountOffer.description}
                      onChange={(e) => handleDiscountChange('description', e.target.value)}
                      placeholder="e.g., Help us personalize your journey and get 10% off your first order."
                      rows={3}
                    />
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-base font-medium">Wellness Goals</Label>
                    <div className="space-y-2 mt-2">
                      {discountOffer.goals.map((goal, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            value={goal}
                            onChange={(e) => handleDiscountGoalChange(index, e.target.value)}
                            placeholder="Enter wellness goal"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeDiscountGoal(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        onClick={addDiscountGoal}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Goal
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-base font-medium">Social Proof</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div className="space-y-2">
                        <Label htmlFor="shopper-count">Shopper Count</Label>
                        <Input
                          id="shopper-count"
                          type="number"
                          min="0"
                          value={discountOffer.socialProof.shopperCount}
                          onChange={(e) => handleDiscountChange('socialProof', {
                            ...discountOffer.socialProof,
                            shopperCount: parseInt(e.target.value) || 0
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="social-message">Message</Label>
                        <Input
                          id="social-message"
                          value={discountOffer.socialProof.message}
                          onChange={(e) => handleDiscountChange('socialProof', {
                            ...discountOffer.socialProof,
                            message: e.target.value
                          })}
                          placeholder="e.g., shoppers have unlocked 10% off in the past 24 hours!"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Advanced */}
            <TabsContent value="advanced" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Advanced Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <p>Advanced settings and data export options will be available here.</p>
                    <p>This could include:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Export product data to JSON</li>
                      <li>Import product data from file</li>
                      <li>Reset to default values</li>
                      <li>Bulk edit options</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminStoreEditor; 