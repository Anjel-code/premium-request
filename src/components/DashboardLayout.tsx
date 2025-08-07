import { ReactNode, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Home,
  Menu,
  X,
  LayoutDashboard,
  Package,
  Settings,
  HelpCircle,
  Shield,
  MessageSquare,
  Users,
  BarChart3,
  Activity,
  Database,
  RefreshCw,
} from "lucide-react";
import { getUnreadNotificationCount } from "../lib/notificationUtils";

interface DashboardLayoutProps {
  children: ReactNode;
  userRole?: "user" | "admin" | "team";
  user?: any;
  appId?: string;
}

const userMenuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Orders", url: "/dashboard/orders", icon: Package },
  { title: "Refunds", url: "/refunds", icon: RefreshCw },
  { title: "Notifications", url: "/dashboard/notifications", icon: Bell },
  { title: "Support", url: "/dashboard/support", icon: MessageSquare },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

const adminMenuItems = [
  { title: "Admin Panel", url: "/admin", icon: Shield },
  { title: "Refund Management", url: "/admin/refunds", icon: RefreshCw },
  { title: "Team Portal", url: "/team", icon: Users },
];

const analyticsMenuItem = { title: "Analytics", url: "/analytics", icon: BarChart3 };
const liveViewMenuItem = { title: "Live View", url: "/live-view", icon: Activity };
const databaseManagementMenuItem = { title: "Database", url: "/database-management", icon: Database };

export function DashboardLayout({
  children,
  userRole = "user",
  user,
  appId,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  // Fetch notification count
  useEffect(() => {
    if (!user || !appId) return;

    const fetchNotificationCount = async () => {
      try {
        const count = await getUnreadNotificationCount(appId, user.uid);
        setNotificationCount(count);
      } catch (error) {
        console.warn("Failed to fetch notification count:", error);
      }
    };

    fetchNotificationCount();

    // Set up interval to refresh notification count
    const interval = setInterval(fetchNotificationCount, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [user, appId]);

  // Determine admin status robustly
  const isAdmin = userRole === "admin" || (user?.roles && user.roles.includes("admin"));

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-60" : "w-14"
        } transition-all duration-300 bg-card border-r flex flex-col`}
      >
        <div className="p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full"
          >
            {sidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>

        <nav className="flex-1 px-2 space-y-1">
          {userMenuItems.map((item) => (
            <Link
              key={item.title}
              to={item.url}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive(item.url)
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/20"
              }`}
            >
              <div className="relative overflow-visible">
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {item.title === "Notifications" && notificationCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs min-w-[20px] bg-primary text-primary-foreground"
                  >
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </Badge>
                )}
              </div>
              {sidebarOpen && <span className="ml-3">{item.title}</span>}
            </Link>
          ))}

          {/* Analytics menu item for admins only */}
          {isAdmin && (
            <Link
              key={analyticsMenuItem.title}
              to={analyticsMenuItem.url}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive(analyticsMenuItem.url)
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/20"
              }`}
            >
              <analyticsMenuItem.icon className="h-5 w-5 flex-shrink-0" />
              {sidebarOpen && <span className="ml-3">{analyticsMenuItem.title}</span>}
            </Link>
          )}

          {/* Live View menu item for admins only */}
          {isAdmin && (
            <Link
              key={liveViewMenuItem.title}
              to={liveViewMenuItem.url}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive(liveViewMenuItem.url)
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/20"
              }`}
            >
              <liveViewMenuItem.icon className="h-5 w-5 flex-shrink-0" />
              {sidebarOpen && <span className="ml-3">{liveViewMenuItem.title}</span>}
            </Link>
          )}

          {/* Database Management menu item for admins only */}
          {isAdmin && (
            <Link
              key={databaseManagementMenuItem.title}
              to={databaseManagementMenuItem.url}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive(databaseManagementMenuItem.url)
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/20"
              }`}
            >
              <databaseManagementMenuItem.icon className="h-5 w-5 flex-shrink-0" />
              {sidebarOpen && <span className="ml-3">{databaseManagementMenuItem.title}</span>}
            </Link>
          )}

          {isAdmin && (
            <>
              <div className="border-t pt-4 mt-4">
                {adminMenuItems.map((item) => (
                  <Link
                    key={item.title}
                    to={item.url}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive(item.url)
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/20"
                    }`}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {sidebarOpen && <span className="ml-3">{item.title}</span>}
                  </Link>
                ))}
              </div>
            </>
          )}
        </nav>
      </div>

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b bg-card px-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-primary">Quibble</h1>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="relative overflow-visible">
              <Link to="/dashboard/notifications">
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs min-w-[20px] bg-primary text-primary-foreground"
                  >
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </Badge>
                )}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Link>
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
