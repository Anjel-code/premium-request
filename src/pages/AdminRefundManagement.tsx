import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Clock,
  DollarSign,
  Package,
  Calendar,
  User,
  MessageSquare,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Settings
} from "lucide-react";
import { 
  getRefundRequests, 
  approveRefund, 
  rejectRefund, 
  processRefund, 
  StoreOrder 
} from "@/lib/storeUtils";
import { db } from "@/firebase";

interface AdminRefundManagementProps {
  user?: {
    uid: string;
    email: string;
    displayName: string;
  } | null;
  appId?: string;
}

const AdminRefundManagement: React.FC<AdminRefundManagementProps> = ({ user, appId }) => {
  const navigate = useNavigate();
  const [refundRequests, setRefundRequests] = useState<StoreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<StoreOrder | null>(null);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | "process" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingAction, setProcessingAction] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !appId) {
      setLoading(false);
      return;
    }

    const loadRefundRequests = async () => {
      try {
        setLoading(true);
        const requests = await getRefundRequests(appId);
        setRefundRequests(requests);
      } catch (err) {
        console.error("Error loading refund requests:", err);
        setError("Failed to load refund requests. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadRefundRequests();
  }, [user, appId]);

  const handleAction = async () => {
    if (!selectedOrder || !user || !appId || actionType === null) {
      return;
    }

    try {
      setProcessingAction(true);
      
      switch (actionType) {
        case "approve":
          await approveRefund(
            appId,
            selectedOrder.id,
            selectedOrder.userId,
            selectedOrder.userEmail,
            selectedOrder.userName,
            selectedOrder.productName,
            selectedOrder.totalAmount,
            user.uid,
            user.displayName
          );
          setSuccessMessage("Refund approved successfully!");
          break;
          
        case "reject":
          if (!rejectionReason.trim()) {
            setError("Please provide a reason for rejection.");
            return;
          }
          await rejectRefund(
            appId,
            selectedOrder.id,
            selectedOrder.userId,
            selectedOrder.userEmail,
            selectedOrder.userName,
            selectedOrder.productName,
            user.uid,
            user.displayName,
            rejectionReason.trim()
          );
          setSuccessMessage("Refund rejected successfully!");
          break;
          
        case "process":
          await processRefund(
            appId,
            selectedOrder.id,
            selectedOrder.userId,
            selectedOrder.userEmail,
            selectedOrder.userName,
            selectedOrder.productName,
            selectedOrder.totalAmount,
            user.uid,
            user.displayName
          );
          setSuccessMessage("Refund processed successfully!");
          break;
      }
      
      setShowActionDialog(false);
      setRejectionReason("");
      setSelectedOrder(null);
      setActionType(null);
      
      // Refresh the requests list
      const requests = await getRefundRequests(appId);
      setRefundRequests(requests);
    } catch (err) {
      console.error("Error processing refund action:", err);
      setError("Failed to process refund action. Please try again.");
    } finally {
      setProcessingAction(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-800";
      case "shipped": return "bg-blue-100 text-blue-800";
      case "delivered": return "bg-purple-100 text-purple-800";
      case "refunded": return "bg-red-100 text-red-800";
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
                You need to be logged in to access refund management.
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

  const pendingRequests = refundRequests.filter(req => req.refundStatus === "requested");
  const approvedRequests = refundRequests.filter(req => req.refundStatus === "approved");
  const processedRequests = refundRequests.filter(req => req.refundStatus === "processed");
  const rejectedRequests = refundRequests.filter(req => req.refundStatus === "rejected");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">Refund Management</h1>
            <p className="text-muted-foreground">
              Manage refund requests from customers
            </p>
          </div>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              <span className="text-muted-foreground">Loading refund requests...</span>
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && (
          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending ({pendingRequests.length})
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex items-center gap-2">
                <ThumbsUp className="h-4 w-4" />
                Approved ({approvedRequests.length})
              </TabsTrigger>
              <TabsTrigger value="processed" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Processed ({processedRequests.length})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="flex items-center gap-2">
                <ThumbsDown className="h-4 w-4" />
                Rejected ({rejectedRequests.length})
              </TabsTrigger>
            </TabsList>

            {/* Pending Requests */}
            <TabsContent value="pending" className="space-y-4">
              {pendingRequests.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Pending Requests</h3>
                    <p className="text-muted-foreground">
                      There are no pending refund requests at this time.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                pendingRequests.map((order) => (
                  <Card key={order.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-primary">
                              {order.productName}
                            </h3>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                            <Badge className={getRefundStatusColor(order.refundStatus || "requested")}>
                              {order.refundStatus?.charAt(0).toUpperCase() + order.refundStatus?.slice(1)}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mb-4">
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
                        
                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            onClick={() => {
                              setSelectedOrder(order);
                              setActionType("approve");
                              setShowActionDialog(true);
                            }}
                            className="flex items-center gap-2"
                            size="sm"
                          >
                            <ThumbsUp className="h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedOrder(order);
                              setActionType("reject");
                              setShowActionDialog(true);
                            }}
                            variant="destructive"
                            className="flex items-center gap-2"
                            size="sm"
                          >
                            <ThumbsDown className="h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Approved Requests */}
            <TabsContent value="approved" className="space-y-4">
              {approvedRequests.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <ThumbsUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Approved Requests</h3>
                    <p className="text-muted-foreground">
                      There are no approved refund requests at this time.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                approvedRequests.map((order) => (
                  <Card key={order.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-primary">
                              {order.productName}
                            </h3>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                            <Badge className={getRefundStatusColor(order.refundStatus || "approved")}>
                              {order.refundStatus?.charAt(0).toUpperCase() + order.refundStatus?.slice(1)}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              <span>${order.totalAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>{order.userName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(order.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Settings className="h-4 w-4" />
                              <span>By: {order.refundProcessedBy}</span>
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          onClick={() => {
                            setSelectedOrder(order);
                            setActionType("process");
                            setShowActionDialog(true);
                          }}
                          className="flex items-center gap-2"
                          size="sm"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Process Refund
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Processed Requests */}
            <TabsContent value="processed" className="space-y-4">
              {processedRequests.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Processed Requests</h3>
                    <p className="text-muted-foreground">
                      There are no processed refund requests at this time.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                processedRequests.map((order) => (
                  <Card key={order.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-primary">
                              {order.productName}
                            </h3>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                            <Badge className={getRefundStatusColor(order.refundStatus || "processed")}>
                              {order.refundStatus?.charAt(0).toUpperCase() + order.refundStatus?.slice(1)}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              <span>${order.totalAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>{order.userName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(order.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Settings className="h-4 w-4" />
                              <span>By: {order.refundProcessedBy}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Rejected Requests */}
            <TabsContent value="rejected" className="space-y-4">
              {rejectedRequests.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <ThumbsDown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Rejected Requests</h3>
                    <p className="text-muted-foreground">
                      There are no rejected refund requests at this time.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                rejectedRequests.map((order) => (
                  <Card key={order.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-primary">
                              {order.productName}
                            </h3>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                            <Badge className={getRefundStatusColor(order.refundStatus || "rejected")}>
                              {order.refundStatus?.charAt(0).toUpperCase() + order.refundStatus?.slice(1)}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mb-4">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              <span>${order.totalAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>{order.userName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(order.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Settings className="h-4 w-4" />
                              <span>By: {order.refundProcessedBy}</span>
                            </div>
                          </div>

                          {order.refundReason && (
                            <div className="bg-muted/50 p-3 rounded-lg">
                              <p className="text-sm font-medium mb-1">Rejection Reason:</p>
                              <p className="text-sm text-muted-foreground">{order.refundReason}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Action Dialog */}
        <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {actionType === "approve" && "Approve Refund"}
                {actionType === "reject" && "Reject Refund"}
                {actionType === "process" && "Process Refund"}
              </DialogTitle>
              <DialogDescription>
                {actionType === "approve" && "This will approve the refund request and restore stock."}
                {actionType === "reject" && "This will reject the refund request. Please provide a reason."}
                {actionType === "process" && "This will process the refund payment to the customer."}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {selectedOrder && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">{selectedOrder.productName}</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Order ID: {selectedOrder.id}</div>
                    <div>Amount: ${selectedOrder.totalAmount.toFixed(2)}</div>
                    <div>Customer: {selectedOrder.userName}</div>
                    <div>Email: {selectedOrder.userEmail}</div>
                  </div>
                </div>
              )}
              
              {actionType === "reject" && (
                <div className="space-y-2">
                  <Label htmlFor="rejection-reason">Reason for Rejection *</Label>
                  <Textarea
                    id="rejection-reason"
                    placeholder="Please explain why you're rejecting this refund request..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowActionDialog(false);
                  setRejectionReason("");
                  setSelectedOrder(null);
                  setActionType(null);
                }}
                disabled={processingAction}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAction}
                disabled={
                  processingAction || 
                  (actionType === "reject" && !rejectionReason.trim())
                }
                className="flex items-center gap-2"
                variant={actionType === "reject" ? "destructive" : "default"}
              >
                {processingAction ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {actionType === "approve" && <ThumbsUp className="h-4 w-4" />}
                    {actionType === "reject" && <ThumbsDown className="h-4 w-4" />}
                    {actionType === "process" && <CheckCircle className="h-4 w-4" />}
                    {actionType === "approve" && "Approve"}
                    {actionType === "reject" && "Reject"}
                    {actionType === "process" && "Process"}
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

export default AdminRefundManagement; 