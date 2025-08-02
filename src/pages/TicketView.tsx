import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  Package, 
  Send, 
  User,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import Navigation from "@/components/Navigation";

interface ChatMessage {
  id: number;
  sender: 'client' | 'team';
  senderName: string;
  message: string;
  timestamp: Date;
  attachments?: string[];
}

const TicketView = () => {
  const { ticketId } = useParams();
  const [newMessage, setNewMessage] = useState('');
  
  // Mock data - in real app this would come from API
  const orderDetails = {
    id: ticketId || 'ORD-001',
    title: 'Professional Camera Equipment',
    status: 'processing',
    dateCreated: new Date('2024-01-15'),
    estimatedCompletion: new Date('2024-01-25'),
    budget: '$2,500 - $3,000',
    progress: 65,
    description: 'Looking for a professional camera setup for product photography. Need camera body, lenses (macro and standard), lighting equipment, and tripod. Quality is priority over price.',
    requirements: [
      'Full-frame camera body (Canon or Sony preferred)',
      'Macro lens for detailed product shots', 
      'Standard 24-70mm lens',
      'Professional lighting kit with softboxes',
      'Sturdy tripod with adjustable height',
      'Memory cards and backup battery'
    ],
    assignedTeam: 'Photography Equipment Specialists'
  };

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      sender: 'team',
      senderName: 'Sarah Johnson',
      message: 'Hi! I\'ve been assigned to your camera equipment request. I\'ve reviewed your requirements and have some excellent options to discuss.',
      timestamp: new Date('2024-01-16T10:00:00'),
    },
    {
      id: 2,
      sender: 'team',
      senderName: 'Sarah Johnson', 
      message: 'Based on your needs, I\'m recommending the Sony A7R V for the camera body - it excels at product photography with its 61MP sensor. For lenses, I\'ve found the Sony FE 90mm f/2.8 Macro and Sony FE 24-70mm f/2.8 GM II.',
      timestamp: new Date('2024-01-16T10:15:00'),
    },
    {
      id: 3,
      sender: 'client',
      senderName: 'You',
      message: 'That sounds perfect! What about the lighting setup? I want to make sure the colors are accurate for product shots.',
      timestamp: new Date('2024-01-16T14:30:00'),
    },
    {
      id: 4,
      sender: 'team',
      senderName: 'Sarah Johnson',
      message: 'Great question! For color accuracy, I\'m recommending the Godox SL-60W LED lights with softboxes. They have excellent CRI ratings (96+) and consistent color temperature. I\'m also including a color checker for calibration.',
      timestamp: new Date('2024-01-17T09:00:00'),
    }
  ]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: chatMessages.length + 1,
      sender: 'client',
      senderName: 'You',
      message: newMessage,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, message]);
    setNewMessage('');

    // Simulate team response
    setTimeout(() => {
      const response: ChatMessage = {
        id: chatMessages.length + 2,
        sender: 'team',
        senderName: 'Sarah Johnson',
        message: 'Thanks for your message! I\'ll review this and get back to you shortly with an update.',
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, response]);
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'initial_review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'sourcing': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'initial_review': return <Clock className="h-4 w-4" />;
      case 'processing': return <AlertCircle className="h-4 w-4" />;
      case 'sourcing': return <Package className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-6">
            <Button asChild variant="outline" className="mb-4">
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-4xl font-bold text-primary mb-2">{orderDetails.title}</h1>
            <p className="text-lg text-muted-foreground">Order ID: {orderDetails.id}</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Order Details */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="border-0 shadow-elegant">
                <CardHeader>
                  <CardTitle>Order Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Badge className={getStatusColor(orderDetails.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(orderDetails.status)}
                      {formatStatus(orderDetails.status)}
                    </div>
                  </Badge>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Progress</span>
                      <span className="text-sm font-medium">{orderDetails.progress}%</span>
                    </div>
                    <Progress value={orderDetails.progress} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-elegant">
                <CardHeader>
                  <CardTitle>Order Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Created:</span>
                    <span>{orderDetails.dateCreated.toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Expected:</span>
                    <span>{orderDetails.estimatedCompletion.toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Budget:</span>
                    <span>{orderDetails.budget}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Team:</span>
                    <span>{orderDetails.assignedTeam}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-elegant">
                <CardHeader>
                  <CardTitle>Original Request</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{orderDetails.description}</p>
                  <div>
                    <h4 className="font-medium mb-2">Requirements:</h4>
                    <ul className="text-sm space-y-1">
                      {orderDetails.requirements.map((req, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 text-accent mt-1 flex-shrink-0" />
                          <span className="text-muted-foreground">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chat Interface */}
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-premium h-[700px] flex flex-col">
                <CardHeader className="border-b border-border">
                  <CardTitle>Team Communication</CardTitle>
                </CardHeader>
                
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {chatMessages.map((message) => (
                    <div key={message.id} className={`flex ${message.sender === 'client' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] ${message.sender === 'client' ? 'order-2' : 'order-1'}`}>
                        <div className={`px-4 py-3 rounded-lg ${
                          message.sender === 'client' 
                            ? 'bg-accent text-accent-foreground' 
                            : 'bg-muted text-foreground'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium">{message.senderName}</span>
                            <span className="text-xs opacity-70">
                              {message.timestamp.toLocaleDateString()} {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed">{message.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="border-t border-border p-6">
                  <div className="flex gap-2">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message to the team..."
                      className="flex-1 min-h-[80px] resize-none"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button 
                      onClick={handleSendMessage}
                      size="lg"
                      className="bg-accent hover:bg-accent/90 text-accent-foreground px-4 self-end"
                      disabled={!newMessage.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Press Enter to send, Shift+Enter for new line
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketView;