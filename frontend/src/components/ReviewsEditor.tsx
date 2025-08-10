import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  Plus,
  X,
  Save,
  Edit,
  Star,
  CheckCircle,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";


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

interface ReviewsEditorProps {
  reviews: Review[];
  onSave: (reviews: Review[]) => void;
  onCancel: () => void;
}

const ReviewsEditor: React.FC<ReviewsEditorProps> = ({
  reviews,
  onSave,
  onCancel,
}) => {
  const { toast } = useToast();
  const [editedReviews, setEditedReviews] = useState<Review[]>([...reviews]);
  const [editingReview, setEditingReview] = useState<string | null>(null);

  const handleReviewChange = (reviewId: string, field: keyof Review, value: any) => {
    setEditedReviews(prev =>
      prev.map(review =>
        review.id === reviewId
          ? { ...review, [field]: value }
          : review
      )
    );
  };

  const addReview = () => {
    const newReview: Review = {
      id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: "",
      rating: 5,
      comment: "",
      date: new Date().toISOString().split('T')[0],
      verified: true,
      image: "",
      productImage: "",
      profileImage: "",
    };
    setEditedReviews(prev => [...prev, newReview]);
    setEditingReview(newReview.id);
  };

  const removeReview = (reviewId: string) => {
    setEditedReviews(prev => prev.filter(review => review.id !== reviewId));
    if (editingReview === reviewId) {
      setEditingReview(null);
    }
  };

  const handleSave = () => {
    // Validate reviews
    const invalidReviews = editedReviews.filter(
      review => !review.name.trim() || !review.comment.trim()
    );

    if (invalidReviews.length > 0) {
      toast({
        title: "Validation Error",
        description: "All reviews must have a name and comment.",
        variant: "destructive",
      });
      return;
    }

    onSave(editedReviews);
    toast({
      title: "Success",
      description: "Reviews have been updated successfully.",
    });
  };

  const renderStars = (rating: number, onChange?: (rating: number) => void) => (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i + 1)}
          className={`h-5 w-5 ${
            i < rating
              ? "text-yellow-400 fill-current"
              : "text-gray-300"
          } ${onChange ? "hover:scale-110 transition-transform" : ""}`}
        >
          <Star className="h-full w-full" />
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Star className="h-6 w-6 text-primary" />
                <h1 className="text-3xl font-bold">Reviews Editor</h1>
              </div>
              <Badge variant="secondary">Admin Mode</Badge>
            </div>
            <div className="flex items-center gap-2">
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

          {/* Reviews List */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Customer Reviews</h2>
              <Button
                onClick={addReview}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Review
              </Button>
            </div>

            {editedReviews.map((review) => (
              <Card key={review.id} className="border">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Review #{review.id.split('_')[1]}</span>
                        {review.verified && (
                          <Badge variant="outline" className="text-xs">
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingReview(
                          editingReview === review.id ? null : review.id
                        )}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeReview(review.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {editingReview === review.id ? (
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`name-${review.id}`}>Customer Name</Label>
                        <Input
                          id={`name-${review.id}`}
                          value={review.name}
                          onChange={(e) => handleReviewChange(review.id, 'name', e.target.value)}
                          placeholder="Enter customer name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`date-${review.id}`}>Review Date</Label>
                        <Input
                          id={`date-${review.id}`}
                          type="date"
                          value={review.date}
                          onChange={(e) => handleReviewChange(review.id, 'date', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Rating</Label>
                      {renderStars(review.rating, (rating) => 
                        handleReviewChange(review.id, 'rating', rating)
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`comment-${review.id}`}>Review Comment</Label>
                      <Textarea
                        id={`comment-${review.id}`}
                        value={review.comment}
                        onChange={(e) => handleReviewChange(review.id, 'comment', e.target.value)}
                        placeholder="Enter review comment"
                        rows={3}
                      />
                    </div>



                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`verified-${review.id}`}
                        checked={review.verified}
                        onCheckedChange={(checked) => 
                          handleReviewChange(review.id, 'verified', checked)
                        }
                      />
                      <Label htmlFor={`verified-${review.id}`}>Verified Purchase</Label>
                    </div>
                  </CardContent>
                ) : (
                  <CardContent>
                    <div className="flex items-start gap-4">
                      {review.profileImage && (
                        <div className="flex-shrink-0">
                          <img
                            src={review.profileImage}
                            alt={review.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {renderStars(review.rating)}
                          {review.verified && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                          "{review.comment}"
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {review.name}
                            </span>
                            {review.verified && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(review.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}

            {editedReviews.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Reviews Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Add your first customer review to build trust with potential customers.
                  </p>
                  <Button onClick={addReview}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Review
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewsEditor; 