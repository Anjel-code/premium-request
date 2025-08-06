import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
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
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
  userRole?: "user" | "admin" | "team";
}

const userMenuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Orders", url: "/dashboard/orders", icon: Package },
  { title: "Notifications", url: "/dashboard/notifications", icon: Bell },
  { title: "Support", url: "/dashboard/support", icon: MessageSquare },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

const adminMenuItems = [
  { title: "Admin Panel", url: "/admin", icon: Shield },
  { title: "Team Portal", url: "/team", icon: Users },
];

export function DashboardLayout({
  children,
  userRole = "user",
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

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
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {sidebarOpen && <span className="ml-3">{item.title}</span>}
            </Link>
          ))}

          {userRole === "admin" && (
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
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard/notifications">
                <Bell className="h-5 w-5" />
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
