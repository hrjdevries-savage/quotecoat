import { User, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";

export function AppHeader() {
  const { user, signOut } = useAuth();
  const { orgId } = useApp();

  if (!user) return null;

  return (
    <header className="flex h-16 items-center justify-between border-b border-border/20 bg-background/95 backdrop-blur px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="rounded-2xl" />
        <div className="h-6 w-px bg-border/20" />
        <div>
          <h1 className="font-semibold text-lg">Dashboard</h1>
          <p className="text-xs text-muted-foreground">Welkom terug</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Organization indicator */}
        {orgId && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-2xl">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-xs font-medium text-muted-foreground">
              Org: {orgId.slice(0, 8)}...
            </span>
          </div>
        )}

        {/* Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="h-10 w-auto px-3 rounded-2xl hover:bg-accent/50"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium leading-none">
                    {user.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-64 rounded-2xl shadow-lg border-border/20"
          >
            <DropdownMenuLabel className="pb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
                  <User className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-medium">{user.email?.split('@')[0] || 'User'}</p>
                  <p className="text-xs text-muted-foreground font-normal">
                    {user.email}
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="rounded-xl">
              <Settings className="h-4 w-4 mr-3" />
              Instellingen
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={signOut} 
              className="text-destructive hover:text-destructive rounded-xl"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Uitloggen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}