import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Package,
  Calendar,
  User,
  MessageSquare
} from "lucide-react";
import { getRefundableOrders, requestRefund, StoreOrder, getRefundRequests } from "@/lib/storeUtils";
import { db } from "@/firebase";
// Define the UserProfile interface
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  roles: string[];
  photoURL?: string;
}

interface RefundPageProps {
  user?: UserProfile | null;
  appId?: string;
}

const RefundPage: React.FC<RefundPageProps> = ({ user, appId }) => {
  const navigate = useNavigate();
  const [refundableOrders, setRefundableOrders] = useState<StoreOrder[]>([]);
  const [refundHistory, setRefundHistory] = useState<StoreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<StoreOrder | null>(null);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [submittingRefund, setSubmittingRefund] = useState(false);
  const [refundSuccess, setRefundSuccess] = useState(false);

  useEffect(() => {
    if (!user || !appId) {
      setLoading(false);
      return;
    }

    const loadRefundableOrders = async () => {
      try {
        setLoading(true);
        const orders = await getRefundableOrders(appId, user.uid);
        setRefundableOrders(orders);
        
        // Also load all refund requests for history
        const allRefunds = await getRefundRequests(appId);
        const userRefunds = allRefunds.filter(refund => refund.userId === user.uid);
        setRefundHistory(userRefunds);
      } catch (err) {
        console.error("Error loading refundable orders:", err);
        setError("Failed to load your orders. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadRefundableOrders();
  }, [user, appId]);

  const handleRequestRefund = async () => {
    if (!selectedOrder || !user || !appId || !refundReason.trim()) {
      return;
    }

    try {
      setSubmittingRefund(true);
      await requestRefund(
        appId,
        selectedOrder.id,
        user.uid,
        user.email,
        user.displayName,
        selectedOrder.productName,
        selectedOrder.totalAmount,
        refundReason.trim()
      );
      
      setRefundSuccess(true);
      setShowRefundDialog(false);
      setRefundReason("");
      setSelectedOrder(null);
      
      // Refresh the orders list
      const orders = await getRefundableOrders(appId, user.uid);
      setRefundableOrders(orders);
    } catch (err) {
      console.error("Error requesting refund:", err);
      setError("Failed to submit refund request. Please try again.");
    } finally {
      setSubmittingRefund(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-800";
      case "shipped": return "bg-blue-100 text-blue-800";
      case "delivered": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getRefundStatusColor = (refundStatus: string) => {
    switch (refundStatus) {
      case "requested": return "bg-yellow-100 text-yellow-800";
      case "approved": return "bg-green-100 text-green-800";
      case "processed": return "bg-blue-100 text-blue-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground mb-4">
                You need to be logged in to access refund requests.
              </p>
              <Button onClick={() => navigate("/")}>
                Go to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 self-start"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary">Refund Requests</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Request refunds for your completed orders
            </p>
          </div>
        </div>

        {/* Success Alert */}
        {refundSuccess && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-sm sm:text-base text-green-800">
              Your refund request has been submitted successfully! We'll review it within 2-3 business days and notify you of the decision.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-sm sm:text-base text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              <span className="text-sm sm:text-base text-muted-foreground">Loading your orders...</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && refundableOrders.length === 0 && refundHistory.length === 0 && (
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 sm:p-8 text-center">
              <Package className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">No Refundable Orders</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                Refunds are only available for orders that have been shipped or delivered. 
                Orders that are still pending or paid but not yet shipped are not eligible for refunds.
              </p>
              <Button onClick={() => navigate("/dashboard/orders")}>
                View All Orders
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty State - Only if no refundable orders but has history */}
        {!loading && refundableOrders.length === 0 && refundHistory.length > 0 && (
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 sm:p-8 text-center">
              <Package className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">No New Refundable Orders</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                You don't have any new orders eligible for refunds, but you can view your refund history below.
              </p>
              <Button onClick={() => navigate("/dashboard/orders")}>
                View All Orders
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Orders List */}
        {!loading && refundableOrders.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-lg sm:text-xl font-semibold">
                Eligible Orders ({refundableOrders.length})
              </h2>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 self-start sm:self-auto"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>

            {refundableOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-2">
                        <h3 className="text-base sm:text-lg font-semibold text-primary">
                          {order.productName}
                        </h3>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          <span>${order.totalAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          <span>Qty: {order.quantity}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(order.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{order.userName}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowRefundDialog(true);
                        }}
                        className="flex items-center gap-2"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Request Refund
                      </Button>
                      <Button
                        onClick={() => navigate(`/customer-refund-chat/${order.id}`)}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Chat with Support
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Refund History */}
        {!loading && refundHistory.length > 0 && (
          <div className="space-y-4 mt-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-lg sm:text-xl font-semibold">
                Refund History ({refundHistory.length})
              </h2>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 self-start sm:self-auto"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>

            {refundHistory.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-2">
                        <h3 className="text-base sm:text-lg font-semibold text-primary">
                          {order.productName}
                        </h3>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                        <Badge className={getRefundStatusColor(order.refundStatus || "requested")}>
                          {order.refundStatus?.charAt(0).toUpperCase() + order.refundStatus?.slice(1)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          <span>${order.totalAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          <span>Qty: {order.quantity}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(order.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{order.userName}</span>
                        </div>
                      </div>

                      {order.refundReason && (
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <p className="text-sm font-medium mb-1">Refund Reason:</p>
                          <p className="text-sm text-muted-foreground">{order.refundReason}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={() => navigate(`/customer-refund-chat/${order.id}`)}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <MessageSquare className="h-4 w-4" />
                        View Chat History
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Refund Request Dialog */}
        <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
          <DialogContent className="max-w-md mx-4">
            <DialogHeader>
              <DialogTitle>Request Refund</DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                Please provide a reason for your refund request. We'll review it within 2-3 business days.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {selectedOrder && (
                <div className="bg-muted/50 p-3 sm:p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 text-sm sm:text-base">{selectedOrder.productName}</h4>
                  <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                    <div>Order ID: {selectedOrder.id}</div>
                    <div>Amount: ${selectedOrder.totalAmount.toFixed(2)}</div>
                    <div>Quantity: {selectedOrder.quantity}</div>
                    <div>Order Date: {formatDate(selectedOrder.createdAt)}</div>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="refund-reason" className="text-sm sm:text-base">Reason for Refund *</Label>
                <Textarea
                  id="refund-reason"
                  placeholder="Please explain why you're requesting a refund..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={4}
                  className="resize-none text-sm sm:text-base"
                />
              </div>
            </div>
            
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRefundDialog(false);
                  setRefundReason("");
                  setSelectedOrder(null);
                }}
                disabled={submittingRefund}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRequestRefund}
                disabled={!refundReason.trim() || submittingRefund}
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                {submittingRefund ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4" />
                    Submit Request
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default RefundPage; 