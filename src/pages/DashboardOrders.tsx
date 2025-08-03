import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";

const DashboardOrders = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-primary">All Orders</h1>
        <Card className="border-0 shadow-elegant">
          <CardContent className="p-6">
            <p className="text-muted-foreground">Full order management interface with filters and search...</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DashboardOrders;