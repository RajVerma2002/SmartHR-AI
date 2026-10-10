import { Menu, Moon, Sun, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur lg:px-8">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="text-muted-foreground lg:hidden">
          <Menu size={22} />
        </button>
        <div>
          <p className="text-sm text-muted-foreground">Welcome back,</p>
          <p className="font-display text-base font-semibold leading-tight">{user?.name}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </Button>
        <Button variant="outline" size="sm" onClick={logout}>
          <LogOut size={16} /> Logout
        </Button>
      </div>
    </header>
  );
}
