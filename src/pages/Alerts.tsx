import { useEffect, useState } from "react";
import { Bell, AlertTriangle, Calendar, CreditCard, UserX, Check, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type AlertType = "absence" | "payment" | "session" | "exam";
type Priority = "high" | "medium" | "low";
type Alert = { id: string; type: AlertType; title: string; message: string; time: string; priority: Priority; read: boolean; };

const iconMap = { absence: UserX, payment: CreditCard, session: Calendar, exam: Trophy };
const priorityColors = { high: "border-r-4 border-r-destructive bg-destructive/5", medium: "border-r-4 border-r-warning bg-warning/5", low: "border-r-4 border-r-blue-500 bg-blue-50/30" };

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    // 1. سحب البيانات الخام من كل الأقسام
    const students = JSON.parse(localStorage.getItem("students-data") || "[]");
    const attendance = JSON.parse(localStorage.getItem("attendance-data") || "{}");
    const exams = JSON.parse(localStorage.getItem("exams-data") || "[]");
    const transactions = JSON.parse(localStorage.getItem("finance-transactions") || "[]");
    const readAlerts = JSON.parse(localStorage.getItem("read-alerts-ids") || "[]");

    const liveAlerts: Alert[] = [];
    const today = new Date().toLocaleDateString('en-CA');

    // --- أ: تنبيهات الغياب (High Priority) ---
    students.forEach((st: any) => {
      const groupAtt = attendance[st.group] || {};
      if (!groupAtt[st.id]) { // لو مش متسجل حضور
        liveAlerts.push({
          id: `abs-${st.id}-${today}`,
          type: "absence",
          title: "غياب طالب اليوم",
          message: `الطالب ${st.name} غائب عن مجموعة ${st.group}`,
          time: "اليوم",
          priority: "high",
          read: readAlerts.includes(`abs-${st.id}-${today}`)
        });
      }
    });

    // --- ب: تنبيهات المالية (Medium Priority) ---
    const debtors = students.filter((st: any) => {
      const stDebt = transactions.filter((t: any) => t.student === st.name && t.status === "partial").reduce((acc: number, t: any) => acc + (Number(t.amount) || 0), 0);
      return stDebt > 0;
    });
    if (debtors.length > 0) {
      liveAlerts.push({
        id: `fin-${today}`,
        type: "payment",
        title: "تحصيل متأخرات",
        message: `يوجد ${debtors.length} طلاب لديهم مبالغ مالية لم تسدد بعد`,
        time: "تحديث لحظي",
        priority: "medium",
        read: readAlerts.includes(`fin-${today}`)
      });
    }

    // --- ج: تنبيهات التفوق (Low/Info Priority) ---
    exams.filter((ex: any) => ex.status === "graded").forEach((ex: any) => {
      const tops = Object.entries(ex.grades || {}).filter(([_, grade]) => Number(grade) >= Number(ex.totalMarks));
      if (tops.length > 0) {
        liveAlerts.push({
          id: `exam-${ex.id}`,
          type: "exam",
          title: "لوحة الشرف",
          message: `${tops.length} طلاب قفلوا امتحان ${ex.subject} بمجموعة ${ex.group}`,
          time: ex.date,
          priority: "low",
          read: readAlerts.includes(`exam-${ex.id}`)
        });
      }
    });

    setAlerts(liveAlerts.sort((a, b) => (a.read === b.read ? 0 : a.read ? 1 : -1)));
  }, []);

  const markAsRead = (id: string) => {
    const readIds = JSON.parse(localStorage.getItem("read-alerts-ids") || "[]");
    if (!readIds.includes(id)) {
      const newReadIds = [...readIds, id];
      localStorage.setItem("read-alerts-ids", JSON.stringify(newReadIds));
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
    }
  };

  const markAllAsRead = () => {
    const allIds = alerts.map(a => a.id);
    localStorage.setItem("read-alerts-ids", JSON.stringify(allIds));
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-primary/10">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2 text-primary"><Bell className="w-6 h-6 animate-swing" /> التنبيهات الذكية</h1>
          <p className="text-muted-foreground text-xs font-bold font-egyptian">تحليل تلقائي لبيانات السنتر اليوم</p>
        </div>
        <Button variant="outline" className="gap-2 font-black border-primary text-primary h-11" onClick={markAllAsRead}>
          <Check className="w-4 h-4" /> تحديد الكل كمقروء
        </Button>
      </div>

      <div className="space-y-3">
        {alerts.length === 0 && (
          <div className="text-center py-20 bg-muted/20 rounded-[2rem] border border-dashed">
            <p className="text-muted-foreground font-bold">لا توجد تنبيهات حالياً.. كل شيء مستقر ✅</p>
          </div>
        )}
        {alerts.map((alert) => {
          const Icon = iconMap[alert.type];
          return (
            <Card key={alert.id} className={cn("border-none shadow-sm transition-all rounded-2xl overflow-hidden", priorityColors[alert.priority], alert.read && "opacity-60 grayscale-[0.5]")}>
              <CardContent className="flex items-center gap-4 py-4 px-6">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm", 
                  alert.priority === "high" ? "bg-destructive text-white" : 
                  alert.priority === "medium" ? "bg-warning text-white" : "bg-blue-500 text-white")}>
                  <Icon className="w-6 h-6" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-slate-800 text-md">{alert.title}</h3>
                    {!alert.read && <Badge className="bg-primary text-[9px] h-4">جديد</Badge>}
                  </div>
                  <p className="text-sm font-bold text-muted-foreground mt-0.5">{alert.message}</p>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-2 font-black uppercase tracking-tighter">
                    <Calendar className="w-3 h-3" /> {alert.time}
                  </div>
                </div>

                <Button variant="ghost" size="sm" className="font-black text-primary hover:bg-primary/5" onClick={() => markAsRead(alert.id)} disabled={alert.read}>
                  {alert.read ? "تم الاطلاع" : "مشاهدة"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}