import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "primary" | "secondary" | "success" | "warning" | "info";
}

const variantStyles = {
  default: "bg-white text-slate-900 border-slate-200 shadow-sm",
  primary: "bg-blue-600 text-white border-blue-500",
  secondary: "bg-purple-600 text-white border-purple-500",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200", // أخضر مريح للعين
  warning: "bg-amber-50 text-amber-700 border-amber-200", // أصفر للمتأخرات والغياب
  info: "bg-blue-50 text-blue-700 border-blue-200", // أزرق للإيرادات
};

const iconStyles = {
  default: "bg-slate-100 text-slate-600",
  primary: "bg-white/20 text-white",
  secondary: "bg-white/20 text-white",
  success: "bg-emerald-500 text-white",
  warning: "bg-amber-500 text-white",
  info: "bg-blue-500 text-white",
};

export function StatCard({ title, value, icon: Icon, trend, variant = "default" }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl p-6 border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
        variantStyles[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={cn(
            "text-xs font-black mb-1 uppercase tracking-wider",
            variant === "default" ? "text-slate-500" : "opacity-90"
          )}>
            {title}
          </p>
          <p className="text-3xl font-black tracking-tight">{value}</p>
          
          {trend && (
            <div className={cn(
              "text-[10px] mt-3 flex items-center gap-1 font-bold px-2 py-1 rounded-full w-fit",
              trend.isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            )}>
              <span>{trend.isPositive ? "↑" : "↓"}</span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="opacity-70 font-medium text-[9px]">عن السابق</span>
            </div>
          )}
        </div>
        
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
          iconStyles[variant]
        )}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}