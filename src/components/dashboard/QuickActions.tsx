import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, ClipboardCheck, CreditCard, GraduationCap, Zap } from "lucide-react"; // استيراد أيقونة المدرس
import { useNavigate } from "react-router-dom";

const actions = [
  { label: "إضافة طالب", icon: UserPlus, path: "/students", variant: "default" as const },
  { label: "تسجيل حضور", icon: ClipboardCheck, path: "/attendance", variant: "default" as const },
  { label: "تسجيل دفعة", icon: CreditCard, path: "/finance", variant: "default" as const },
  { label: "إضافة مدرس", icon: GraduationCap, path: "/Teachers", variant: "default" as const }, // التعديل هنا
];

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <Card className="card-hover">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-black">
          <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          إجراءات سريعة
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className="h-auto py-4 flex-col gap-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300 font-bold border-2"
              onClick={() => navigate(action.path)}
            >
              <action.icon className="w-6 h-6" />
              <span className="text-xs md:text-sm">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}