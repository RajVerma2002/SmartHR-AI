import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, CalendarCheck, CalendarDays, Wallet,
  UserPlus, FileSearch, MessageSquareText, Sparkles, Settings, X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const ALL = ["Super Admin", "HR Manager", "Employee", "Applicant"];
const MANAGERS = ["Super Admin", "HR Manager"];

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ALL },
  { to: "/employees", label: "Employees", icon: Users, roles: MANAGERS },
  { to: "/attendance", label: "Attendance", icon: CalendarCheck, roles: ALL },
  { to: "/leaves", label: "Leaves", icon: CalendarDays, roles: ALL },
  { to: "/payroll", label: "Payroll", icon: Wallet, roles: MANAGERS },
  { to: "/applicants", label: "Applicants", icon: UserPlus, roles: MANAGERS },
  { to: "/resume-screening", label: "Resume Screening", icon: FileSearch, roles: MANAGERS },
  { to: "/interview-generator", label: "Interview Generator", icon: Sparkles, roles: MANAGERS },
  { to: "/chatbot", label: "AI HR Chatbot", icon: MessageSquareText, roles: ALL },
  { to: "/settings", label: "Settings", icon: Settings, roles: ALL },
];

export default function Sidebar({ mobileOpen, onClose }) {
  const { user } = useAuth();
  const items = nav.filter((n) => n.roles.includes(user?.role));

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="font-display text-base font-semibold text-white">SmartHR AI</p>
              <p className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">HR Management</p>
            </div>
          </div>
          <button onClick={onClose} className="text-sidebar-foreground/70 lg:hidden">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground/80 hover:bg-white/5 hover:text-white"
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-white">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{user?.name}</p>
              <p className="truncate text-xs text-sidebar-foreground/60">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
