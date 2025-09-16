import { Home, Mail, FileText } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navigationItems = [
  { title: "Home", url: "/home", icon: Home },
  { title: "Inbox", url: "/inbox", icon: Mail },
  { title: "Quotes", url: "/quotes", icon: FileText },
];

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => 
    currentPath === path || currentPath.startsWith(path + '/');

  const getNavClasses = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-accent text-accent-foreground font-medium" 
      : "hover:bg-accent/50 hover:text-accent-foreground";

  return (
    <Sidebar className="border-r border-border/20">
      <SidebarHeader className="p-6 border-b border-border/20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-sm">
            <span className="text-primary-foreground font-bold text-sm">C24</span>
          </div>
          <div>
            <h2 className="font-semibold text-lg">Coat24</h2>
            <p className="text-xs text-muted-foreground">Quote Management</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4">
        <SidebarMenu className="space-y-1">
          {navigationItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild className="h-11 rounded-2xl">
                <NavLink 
                  to={item.url} 
                  end 
                  className={({ isActive }) => getNavClasses({ isActive })}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.title}</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}