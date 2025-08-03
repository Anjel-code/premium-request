import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, AlertCircle } from "lucide-react";

const DashboardNotifications = () => {
  const notifications = [
    { id: 1, type: 'status', title: 'Order TKT-2024-001 Status Update', message: 'Your order is now in processing stage', time: '2 hours ago', read: false },
    { id: 2, type: 'payment', title: 'Payment Received', message: 'Payment for TKT-2024-002 confirmed', time: '1 day ago', read: true },
    { id: 3, type: 'support', title: 'Support Ticket Response', message: 'Team member responded to your query', time: '3 days ago', read: true },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-primary">Notifications</h1>
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card key={notification.id} className={`border-0 shadow-elegant ${!notification.read ? 'bg-accent/5' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-accent/10 rounded-full">
                    {notification.type === 'status' && <CheckCircle className="h-5 w-5 text-accent" />}
                    {notification.type === 'payment' && <CheckCircle className="h-5 w-5 text-green-600" />}
                    {notification.type === 'support' && <Bell className="h-5 w-5 text-blue-600" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{notification.title}</h3>
                    <p className="text-muted-foreground mb-2">{notification.message}</p>
                    <span className="text-sm text-muted-foreground">{notification.time}</span>
                  </div>
                  {!notification.read && <Badge variant="outline" className="text-accent border-accent">New</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardNotifications;