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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div
        className={`hidden lg:flex ${
          sidebarOpen ? "w-60" : "w-14"
        } transition-all duration-300 bg-card border-r flex-col`}
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
        <header className="h-16 border-b bg-card px-4 lg:px-6 flex items-center justify-between">
          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileMenu}
              className="flex items-center gap-2 text-primary hover:text-primary/80"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          <h1 className="text-lg lg:text-xl font-semibold text-primary">Quibble</h1>

          <div className="flex items-center gap-2 lg:gap-4">
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
            <Button variant="outline" size="sm" asChild className="hidden sm:flex">
              <Link to="/">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Link>
            </Button>
          </div>
        </header>

        {/* Mobile Sidebar Menu */}
        <div className={`lg:hidden fixed inset-0 z-50 transition-opacity duration-300 ${
          mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeMobileMenu}
          ></div>

          {/* Sidebar */}
          <div className={`absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-xl transform transition-transform duration-300 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-primary">Dashboard Menu</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeMobileMenu}
                className="p-2"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Navigation Links */}
            <div className="p-4 space-y-2">
              {/* Home Link */}
              <Link
                to="/"
                onClick={closeMobileMenu}
                className="flex items-center px-3 py-3 rounded-md text-sm font-medium transition-colors hover:bg-accent/20"
              >
                <Home className="h-5 w-5 flex-shrink-0" />
                <span className="ml-3">Home</span>
              </Link>

              {userMenuItems.map((item) => (
                <Link
                  key={item.title}
                  to={item.url}
                  onClick={closeMobileMenu}
                  className={`flex items-center px-3 py-3 rounded-md text-sm font-medium transition-colors ${
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
                  <span className="ml-3">{item.title}</span>
                </Link>
              ))}

              {/* Analytics menu item for admins only */}
              {isAdmin && (
                <Link
                  key={analyticsMenuItem.title}
                  to={analyticsMenuItem.url}
                  onClick={closeMobileMenu}
                  className={`flex items-center px-3 py-3 rounded-md text-sm font-medium transition-colors ${
                    isActive(analyticsMenuItem.url)
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/20"
                  }`}
                >
                  <analyticsMenuItem.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="ml-3">{analyticsMenuItem.title}</span>
                </Link>
              )}

              {/* Live View menu item for admins only */}
              {isAdmin && (
                <Link
                  key={liveViewMenuItem.title}
                  to={liveViewMenuItem.url}
                  onClick={closeMobileMenu}
                  className={`flex items-center px-3 py-3 rounded-md text-sm font-medium transition-colors ${
                    isActive(liveViewMenuItem.url)
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/20"
                  }`}
                >
                  <liveViewMenuItem.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="ml-3">{liveViewMenuItem.title}</span>
                </Link>
              )}

              {/* Database Management menu item for admins only */}
              {isAdmin && (
                <Link
                  key={databaseManagementMenuItem.title}
                  to={databaseManagementMenuItem.url}
                  onClick={closeMobileMenu}
                  className={`flex items-center px-3 py-3 rounded-md text-sm font-medium transition-colors ${
                    isActive(databaseManagementMenuItem.url)
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/20"
                  }`}
                >
                  <databaseManagementMenuItem.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="ml-3">{databaseManagementMenuItem.title}</span>
                </Link>
              )}

              {isAdmin && (
                <>
                  <div className="border-t pt-4 mt-4">
                    {adminMenuItems.map((item) => (
                      <Link
                        key={item.title}
                        to={item.url}
                        onClick={closeMobileMenu}
                        className={`flex items-center px-3 py-3 rounded-md text-sm font-medium transition-colors ${
                          isActive(item.url)
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-accent/20"
                        }`}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        <span className="ml-3">{item.title}</span>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
              <div className="text-sm text-muted-foreground text-center">
                Dashboard Navigation
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
