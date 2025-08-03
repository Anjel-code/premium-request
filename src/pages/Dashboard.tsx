import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  Package, 
  DollarSign,
  Calendar,
  MessageSquare,
  Target,
  Award,
  Zap,
  Star
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import AnimatedCounter from "@/components/AnimatedCounter";

interface Order {
  id: string;
  ticketNumber: string;
  title: string;
  status: 'initial_review' | 'processing' | 'sourcing' | 'completed';
  dateCreated: Date;
  estimatedCompletion: Date;
  budget: string;
  progress: number;
  lastUpdate: string;
  timeRemaining?: string;
  isPaid?: boolean;
}

const Dashboard = () => {
  const [orders] = useState<Order[]>([
    {
      id: 'ORD-001',
      ticketNumber: 'TKT-2024-001',
      title: 'Professional Camera Equipment',
      status: 'processing',
      dateCreated: new Date('2024-01-15'),
      estimatedCompletion: new Date('2024-01-25'),
      budget: '$2,500 - $3,000',
      progress: 65,
      lastUpdate: 'Research completed, evaluating top 3 options',
      timeRemaining: '3 days 12 hours',
      isPaid: true
    },
    {
      id: 'ORD-002', 
      ticketNumber: 'TKT-2024-002',
      title: 'Home Office Furniture Set',
      status: 'sourcing',
      dateCreated: new Date('2024-01-20'),
      estimatedCompletion: new Date('2024-02-05'),
      budget: '$1,200 - $1,500',
      progress: 85,
      lastUpdate: 'Negotiating with suppliers, delivery scheduled',
      timeRemaining: '12 days 8 hours',
      isPaid: true
    },
    {
      id: 'ORD-003',
      ticketNumber: 'TKT-2024-003',
      title: 'Vintage Watch Collection Item',
      status: 'initial_review',
      dateCreated: new Date('2024-01-22'),
      estimatedCompletion: new Date('2024-02-15'),
      budget: '$5,000 - $8,000',
      progress: 25,
      lastUpdate: 'Authentication research in progress',
      isPaid: false
    }
  ]);

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

  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const activeOrders = orders.filter(o => o.status !== 'completed').length;
  const avgProgress = Math.round(orders.reduce((acc, o) => acc + o.progress, 0) / orders.length);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Dashboard Overview</h1>
          <p className="text-lg text-muted-foreground">
            Track your requests, manage settings, and stay connected with our team
          </p>
        </div>

        {/* Enhanced Statistics Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-elegant hover:shadow-premium transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <AnimatedCounter 
                    end={totalOrders} 
                    className="text-2xl font-bold text-primary" 
                    duration={1500}
                  />
                </div>
                <Package className="h-8 w-8 text-accent animate-bounce-subtle" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-elegant hover:shadow-premium transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Orders</p>
                  <AnimatedCounter 
                    end={activeOrders} 
                    className="text-2xl font-bold text-primary" 
                    duration={1500}
                  />
                </div>
                <Clock className="h-8 w-8 text-accent animate-pulse-glow" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-elegant hover:shadow-premium transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <AnimatedCounter 
                    end={completedOrders} 
                    className="text-2xl font-bold text-primary" 
                    duration={1500}
                  />
                </div>
                <CheckCircle className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-elegant hover:shadow-premium transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Progress</p>
                  <AnimatedCounter 
                    end={avgProgress} 
                    suffix="%" 
                    className="text-2xl font-bold text-primary" 
                    duration={1500}
                  />
                </div>
                <TrendingUp className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gamification Elements */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-elegant bg-gradient-gold/10">
            <CardContent className="p-6 text-center">
              <Target className="h-12 w-12 text-accent mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Completion Rate</h3>
              <AnimatedCounter 
                end={92} 
                suffix="%" 
                className="text-3xl font-bold text-accent" 
                duration={2000}
              />
              <p className="text-sm text-muted-foreground mt-2">Keep up the great work!</p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-elegant bg-gradient-gold/10">
            <CardContent className="p-6 text-center">
              <Award className="h-12 w-12 text-accent mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Loyalty Level</h3>
              <div className="text-3xl font-bold text-accent mb-2">Gold</div>
              <Progress value={75} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">25% to Platinum</p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-elegant bg-gradient-gold/10">
            <CardContent className="p-6 text-center">
              <Star className="h-12 w-12 text-accent mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Satisfaction Score</h3>
              <div className="flex justify-center mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-6 w-6 fill-accent text-accent" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">Excellent feedback!</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <div className="grid gap-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-primary">Recent Orders</h2>
            <Button asChild variant="premium">
              <Link to="/order">New Request</Link>
            </Button>
          </div>

          {orders.slice(0, 3).map((order) => (
            <Card key={order.id} className="border-0 shadow-elegant hover:shadow-premium transition-all duration-300 cursor-pointer hover:scale-[1.02]">
              <Link to={`/ticket/${order.id}`}>
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl mb-2">{order.title}</CardTitle>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>Ticket: {order.ticketNumber}</span>
                        <span>Order ID: {order.id}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={getStatusColor(order.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(order.status)}
                          {formatStatus(order.status)}
                        </div>
                      </Badge>
                      {order.isPaid && <Badge variant="outline" className="text-green-600 border-green-600">Paid</Badge>}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Created:</span>
                        <span>{order.dateCreated.toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Expected:</span>
                        <span>{order.estimatedCompletion.toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Budget:</span>
                        <span>{order.budget}</span>
                      </div>
                      {order.timeRemaining && (
                        <div className="flex items-center gap-2 text-sm">
                          <Zap className="h-4 w-4 text-accent" />
                          <span className="text-muted-foreground">Time Remaining:</span>
                          <span className="text-accent font-medium">{order.timeRemaining}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-muted-foreground">Progress</span>
                          <span className="text-sm font-medium">{order.progress}%</span>
                        </div>
                        <Progress value={order.progress} className="h-2" />
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <span className="text-muted-foreground">Last Update:</span>
                          <p className="text-foreground mt-1">{order.lastUpdate}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
          
          <div className="text-center">
            <Button asChild variant="outline">
              <Link to="/dashboard/orders">View All Orders</Link>
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;