import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Loader2, 
  Mail, 
  Send, 
  Users, 
  Clock, 
  ShoppingCart, 
  Gift,
  AlertCircle,
  CheckCircle,
  XCircle,
  Trash2
} from "lucide-react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, where, getDocs, writeBatch, addDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { sendEmail } from "@/lib/mailjet";

interface EmailSubscriber {
  id: string;
  email: string;
  timestamp: any;
  source: string;
  status: string;
  emailSent: boolean;
  discountCodeSent: boolean;
  cartReminderSent: boolean;
  abandonmentEmailSent: boolean;
  lastActivity: any;
  cartItems: any[];
  purchaseHistory: any[];
  tags: string[];
}

interface EmailCampaign {
  id: string;
  type: 'discount_code' | 'cart_reminder' | 'abandonment';
  subject: string;
  content: string;
  discountCode?: string;
  discountPercentage?: number;
  scheduledFor?: any;
  sentAt?: any;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  recipients: string[];
  sentCount: number;
  openCount: number;
  clickCount: number;
}

const AdminEmailMarketing: React.FC = () => {
  const [subscribers, setSubscribers] = useState<EmailSubscriber[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCampaignType, setSelectedCampaignType] = useState<'discount_code' | 'cart_reminder' | 'abandonment'>('discount_code');
  const [campaignSubject, setCampaignSubject] = useState('');
  const [campaignContent, setCampaignContent] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState(10);
  const [isSending, setIsSending] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [deletingSubscriber, setDeletingSubscriber] = useState<string | null>(null);

  // Fetch subscribers
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "emailMarketing"), orderBy("timestamp", "desc")),
      (querySnapshot) => {
        const subs: EmailSubscriber[] = [];
        querySnapshot.forEach((doc) => {
          subs.push({ id: doc.id, ...doc.data() } as EmailSubscriber);
        });
        setSubscribers(subs);
      }
    );

    return unsubscribe;
  }, []);

  // Load default email templates
  useEffect(() => {
    loadDefaultTemplates();
  }, [selectedCampaignType]);

  const loadDefaultTemplates = () => {
    switch (selectedCampaignType) {
      case 'discount_code':
        setCampaignSubject('🎁 Your 10% Discount Code is Here!');
        setCampaignContent(`Hi there!

Thank you for joining our wellness community! 

Here's your exclusive 10% discount code: **${discountCode || 'WELLNESS10'}**

Use this code on your first order to save 10% on everything!

Shop now: [Your Store Link]

Best regards,
The Wellness Team`);
        break;
      
      case 'cart_reminder':
        setCampaignSubject('🛒 Don\'t forget your cart items!');
        setCampaignContent(`Hi there!

We noticed you have some amazing products waiting in your cart!

Don't miss out on these wellness essentials. Complete your purchase now and start your wellness journey today.

View your cart: [Cart Link]

Best regards,
The Wellness Team`);
        break;
      
      case 'abandonment':
        setCampaignSubject('🔥 Special 20% Off - Limited Time!');
        setCampaignContent(`Hi there!

We miss you! 🥺

We noticed you haven't completed your purchase yet. As a special thank you for your interest, we're offering you an exclusive 20% discount!

Use code: **${discountCode || 'COMEBACK20'}**

This offer expires in 48 hours, so don't wait!

Shop now: [Your Store Link]

Best regards,
The Wellness Team`);
        break;
    }
  };

  const generateDiscountCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setDiscountCode(code);
  };

  const getSubscribersForCampaign = (type: string): EmailSubscriber[] => {
    let eligibleSubs: EmailSubscriber[] = [];
    
    switch (type) {
      case 'discount_code':
        eligibleSubs = subscribers.filter(sub => !sub.discountCodeSent);
        break;
      case 'cart_reminder':
        eligibleSubs = subscribers.filter(sub => sub.cartItems.length > 0 && !sub.cartReminderSent);
        break;
      case 'abandonment':
        eligibleSubs = subscribers.filter(sub => !sub.abandonmentEmailSent && sub.purchaseHistory.length === 0);
        break;
      default:
        return [];
    }
    
    // If specific users are selected, filter to only those users
    if (selectedUsers.length > 0) {
      eligibleSubs = eligibleSubs.filter(sub => selectedUsers.includes(sub.id));
    }
    
    return eligibleSubs;
  };

  const sendCampaign = async () => {
    if (!campaignSubject || !campaignContent) {
      alert('Please fill in all fields');
      return;
    }

    const eligibleSubscribers = getSubscribersForCampaign(selectedCampaignType);
    
    if (eligibleSubscribers.length === 0) {
      alert('No eligible subscribers for this campaign type');
      return;
    }

    setIsSending(true);

    try {
      // Create campaign record
      const campaignData: Omit<EmailCampaign, 'id'> = {
        type: selectedCampaignType,
        subject: campaignSubject,
        content: campaignContent,
        discountPercentage: discountPercentage,
        scheduledFor: new Date(),
        sentAt: new Date(),
        status: 'sent',
        recipients: eligibleSubscribers.map(sub => sub.email),
        sentCount: eligibleSubscribers.length,
        openCount: 0,
        clickCount: 0
      };

      // Only add discountCode if it has a value
      if (discountCode && discountCode.trim()) {
        campaignData.discountCode = discountCode.trim();
      }

      const campaignRef = await addDoc(collection(db, "emailCampaigns"), campaignData);

      // Send actual emails via Mailjet
      let successCount = 0;
      let failCount = 0;

      for (const subscriber of eligibleSubscribers) {
        try {
          // Convert plain text to HTML for better email formatting
          const htmlContent = campaignContent
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\[(.*?)\]/g, '<a href="#" style="color: #007bff; text-decoration: underline;">$1</a>');

          const emailSent = await sendEmail({
            to: subscriber.email,
            subject: campaignSubject,
            htmlContent: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                  <h1 style="margin: 0; font-size: 24px;">🎁 Quibble Wellness Store</h1>
                </div>
                <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                  ${htmlContent}
                  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                  <p style="text-align: center; color: #666; font-size: 12px;">
                    © 2025 Quibble Wellness Store. All rights reserved.
                  </p>
                </div>
              </div>
            `,
            fromEmail: 'info@quibble.online',
            fromName: 'Quibble Wellness Store'
          });

          if (emailSent) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          console.error(`Failed to send email to ${subscriber.email}:`, error);
          failCount++;
        }
      }

      // Update subscriber status
      const batch = writeBatch(db);
      eligibleSubscribers.forEach(sub => {
        const subRef = doc(db, "emailMarketing", sub.id);
        const updates: Partial<EmailSubscriber> = {};
        
        switch (selectedCampaignType) {
          case 'discount_code':
            updates.discountCodeSent = true;
            break;
          case 'cart_reminder':
            updates.cartReminderSent = true;
            break;
          case 'abandonment':
            updates.abandonmentEmailSent = true;
            break;
        }
        
        batch.update(subRef, updates);
      });

      await batch.commit();

      // Show results
      if (failCount === 0) {
        alert(`🎉 Campaign sent successfully! All ${successCount} emails delivered via Mailjet.`);
      } else {
        alert(`📧 Campaign completed with ${successCount} successful sends and ${failCount} failures. Check console for details.`);
      }
      
      // Reset form
      setCampaignSubject('');
      setCampaignContent('');
      setDiscountCode('');
      
    } catch (error) {
      console.error('Error sending campaign:', error);
      alert('Error sending campaign. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const deleteSubscriber = async (subscriberId: string, email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} from the email list? This action cannot be undone.`)) {
      return;
    }

    setDeletingSubscriber(subscriberId);
    
    try {
      await deleteDoc(doc(db, "emailMarketing", subscriberId));
      
      // Remove from local state
      setSubscribers(prev => prev.filter(sub => sub.id !== subscriberId));
      
      // Remove from selected users if they were selected
      setSelectedUsers(prev => prev.filter(id => id !== subscriberId));
      
      alert(`Successfully removed ${email} from the email list.`);
    } catch (error) {
      console.error('Error deleting subscriber:', error);
      alert('Error deleting subscriber. Please try again.');
    } finally {
      setDeletingSubscriber(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getCampaignTypeLabel = (type: string) => {
    switch (type) {
      case 'discount_code': return 'Discount Code';
      case 'cart_reminder': return 'Cart Reminder';
      case 'abandonment': return 'Abandonment';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <h3 className="text-sm font-medium text-green-800">Real Email Sending Active</h3>
            <p className="text-sm text-green-700">
              ✅ Connected to Mailjet via local backend proxy - Real emails are now being sent to subscribers!
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-primary">Email Marketing Dashboard</h2>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {subscribers.length} subscribers
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium">Total Subscribers</span>
            </div>
            <p className="text-2xl font-bold">{subscribers.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium">Discount Codes Sent</span>
            </div>
            <p className="text-2xl font-bold">
              {subscribers.filter(s => s.discountCodeSent).length}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-orange-500" />
              <span className="text-sm font-medium">Cart Reminders Sent</span>
            </div>
            <p className="text-2xl font-bold">
              {subscribers.filter(s => s.cartReminderSent).length}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium">Abandonment Emails</span>
            </div>
            <p className="text-2xl font-bold">
              {subscribers.filter(s => s.abandonmentEmailSent).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Creator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Create Email Campaign
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Campaign Type</label>
              <Select value={selectedCampaignType} onValueChange={(value: any) => setSelectedCampaignType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="discount_code">Discount Code (10% off)</SelectItem>
                  <SelectItem value="cart_reminder">Cart Reminder (11 hours)</SelectItem>
                  <SelectItem value="abandonment">Abandonment (20% off, 22 hours)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Eligible Subscribers</label>
              <div className="text-sm text-muted-foreground">
                {getSubscribersForCampaign(selectedCampaignType).length} subscribers
              </div>
            </div>
          </div>

          {/* Individual User Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Select Specific Users (Optional)</label>
            <div className="max-h-40 overflow-y-auto border rounded-lg p-3 space-y-2">
              {subscribers.map((subscriber) => (
                <div key={subscriber.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={subscriber.id}
                    checked={selectedUsers.includes(subscriber.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers([...selectedUsers, subscriber.id]);
                      } else {
                        setSelectedUsers(selectedUsers.filter(id => id !== subscriber.id));
                      }
                    }}
                    className="rounded"
                  />
                  <label htmlFor={subscriber.id} className="text-sm text-muted-foreground">
                    {subscriber.email}
                  </label>
                </div>
              ))}
            </div>
            <div className="text-xs text-muted-foreground">
              {selectedUsers.length > 0 
                ? `Selected ${selectedUsers.length} users` 
                : 'Leave unchecked to send to all eligible subscribers'
              }
            </div>
          </div>

          {selectedCampaignType === 'discount_code' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Discount Code</label>
                <div className="flex gap-2">
                  <Input
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    placeholder="WELLNESS10"
                  />
                  <Button onClick={generateDiscountCode} variant="outline" size="sm">
                    Generate
                  </Button>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Discount Percentage</label>
                <Input
                  type="number"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(parseInt(e.target.value) || 10)}
                  min="1"
                  max="100"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Email Subject</label>
            <Input
              value={campaignSubject}
              onChange={(e) => setCampaignSubject(e.target.value)}
              placeholder="Enter email subject..."
            />
          </div>

          <div>
            <label className="text-sm font-medium">Email Content</label>
            <Textarea
              value={campaignContent}
              onChange={(e) => setCampaignContent(e.target.value)}
              placeholder="Enter email content..."
              rows={8}
            />
          </div>

          <Button
            onClick={sendCampaign}
            disabled={isSending || !campaignSubject || !campaignContent}
            className="w-full"
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending Real Emails...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Real Emails via Mailjet
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Subscribers List */}
      <Card>
        <CardHeader>
          <CardTitle>Email Subscribers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Source
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Discount Sent
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Cart Reminder
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Abandonment
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-border">
                {subscribers.map((subscriber) => (
                  <tr key={subscriber.id}>
                    <td className="px-4 py-3 text-sm font-medium">
                      {subscriber.email}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(subscriber.status)}
                        <span className="capitalize">{subscriber.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {subscriber.source}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant={subscriber.discountCodeSent ? "default" : "secondary"}>
                        {subscriber.discountCodeSent ? "Sent" : "Pending"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant={subscriber.cartReminderSent ? "default" : "secondary"}>
                        {subscriber.cartReminderSent ? "Sent" : "Pending"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant={subscriber.abandonmentEmailSent ? "default" : "secondary"}>
                        {subscriber.abandonmentEmailSent ? "Sent" : "Pending"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {subscriber.timestamp?.toDate ? 
                        subscriber.timestamp.toDate().toLocaleDateString() : 
                        'N/A'
                      }
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteSubscriber(subscriber.id, subscriber.email)}
                        disabled={deletingSubscriber === subscriber.id}
                        className="h-8 w-8 p-0"
                      >
                        {deletingSubscriber === subscriber.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminEmailMarketing; 