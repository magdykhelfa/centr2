import { 
  LayoutDashboard, 
  Users, 
  UsersRound, 
  ClipboardCheck, 
  BookOpen, 
  GraduationCap, 
  Wallet, 
  UserCheck, 
  Bell, 
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const menuItems = [
  { title: "لوحة التحكم", url: "/", icon: LayoutDashboard },
  { title: "الطلاب", url: "/students", icon: Users },
  { title: "المجموعات", url: "/groups", icon: UsersRound },
  { title: "الحضور", url: "/attendance", icon: ClipboardCheck },
  { title: "الحصص", url: "/sessions", icon: BookOpen },
  { title: "الامتحانات", url: "/exams", icon: GraduationCap },
  { title: "الحسابات", url: "/finance", icon: Wallet },
  { title: "أولياء الأمور", url: "/parents", icon: UserCheck },
  { title: "التنبيهات", url: "/alerts", icon: Bell },
  { title: "التقارير", url: "/reports", icon: FileText },
];

const bottomMenuItems = [
  { title: "الإعدادات", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        "fixed right-0 top-0 z-40 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 flex flex-col",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-sidebar-border">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow flex-shrink-0">
          <GraduationCap className="w-6 h-6 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="font-bold text-lg text-sidebar-foreground">المدرس الذكي</h1>
            <p className="text-xs text-sidebar-foreground/60">نظام إدارة التعليم</p>
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -left-3 top-20 w-6 h-6 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
      >
        {collapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </Button>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.url;
            return (
              <li key={item.url}>
                <NavLink
                  to={item.url}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow"
                      : "hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5 flex-shrink-0 transition-transform duration-200",
                    !isActive && "group-hover:scale-110"
                  )} />
                  {!collapsed && (
                    <span className="font-medium animate-fade-in">{item.title}</span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t border-sidebar-border p-3">
        <ul className="space-y-1">
          {bottomMenuItems.map((item) => {
            const isActive = location.pathname === item.url;
            return (
              <li key={item.url}>
                <NavLink
                  to={item.url}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span className="font-medium">{item.title}</span>}
                </NavLink>
              </li>
            );
          })}
          <li>
            <button
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 w-full hover:bg-destructive/20 text-sidebar-foreground/80 hover:text-destructive"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium">تسجيل الخروج</span>}
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
}
