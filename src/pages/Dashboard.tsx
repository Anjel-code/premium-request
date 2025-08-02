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
  MessageSquare
} from "lucide-react";
import Navigation from "@/components/Navigation";

interface Order {
  id: string;
  title: string;
  status: 'initial_review' | 'processing' | 'sourcing' | 'completed';
  dateCreated: Date;
  estimatedCompletion: Date;
  budget: string;
  progress: number;
  lastUpdate: string;
}

const Dashboard = () => {
  const [orders] = useState<Order[]>([
    {
      id: 'ORD-001',
      title: 'Professional Camera Equipment',
      status: 'processing',
      dateCreated: new Date('2024-01-15'),
      estimatedCompletion: new Date('2024-01-25'),
      budget: '$2,500 - $3,000',
      progress: 65,
      lastUpdate: 'Research completed, evaluating top 3 options'
    },
    {
      id: 'ORD-002', 
      title: 'Home Office Furniture Set',
      status: 'sourcing',
      dateCreated: new Date('2024-01-20'),
      estimatedCompletion: new Date('2024-02-05'),
      budget: '$1,200 - $1,500',
      progress: 85,
      lastUpdate: 'Negotiating with suppliers, delivery scheduled'
    },
    {
      id: 'ORD-003',
      title: 'Vintage Watch Collection Item',
      status: 'initial_review',
      dateCreated: new Date('2024-01-22'),
      estimatedCompletion: new Date('2024-02-15'),
      budget: '$5,000 - $8,000',
      progress: 25,
      lastUpdate: 'Authentication research in progress'
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
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-32 pb-20 px-6">
        <div className="container mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-primary mb-2">Orders Dashboard</h1>
            <p className="text-lg text-muted-foreground">
              Track your requests and communicate with our team
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-elegant">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                    <p className="text-2xl font-bold text-primary">{totalOrders}</p>
                  </div>
                  <Package className="h-8 w-8 text-accent" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-elegant">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Orders</p>
                    <p className="text-2xl font-bold text-primary">{activeOrders}</p>
                  </div>
                  <Clock className="h-8 w-8 text-accent" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-elegant">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold text-primary">{completedOrders}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-accent" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-elegant">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Progress</p>
                    <p className="text-2xl font-bold text-primary">{avgProgress}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-accent" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Orders List */}
          <div className="grid gap-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-primary">Your Orders</h2>
              <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link to="/order">New Request</Link>
              </Button>
            </div>

            {orders.map((order) => (
              <Card key={order.id} className="border-0 shadow-elegant hover:shadow-premium transition-shadow cursor-pointer">
                <Link to={`/ticket/${order.id}`}>
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl mb-2">{order.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">Order ID: {order.id}</p>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(order.status)}
                          {formatStatus(order.status)}
                        </div>
                      </Badge>
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
          </div>

          {orders.length === 0 && (
            <Card className="border-0 shadow-elegant">
              <CardContent className="p-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-primary mb-2">No Orders Yet</h3>
                <p className="text-muted-foreground mb-6">
                  You haven't submitted any requests yet. Start your first order to see it here.
                </p>
                <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Link to="/order">Create Your First Request</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;