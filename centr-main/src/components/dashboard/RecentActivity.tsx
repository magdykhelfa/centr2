import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, UserPlus, CreditCard, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function RecentActivity() {
  // 1. جلب البيانات الفعلية من المخزن
  const students = JSON.parse(localStorage.getItem("students-data") || "[]");
  const attendance = JSON.parse(localStorage.getItem("attendance-data") || "{}");
  const finance = JSON.parse(localStorage.getItem("finance-transactions") || "[]");

  const dynamicActivities: any[] = [];

  // 2. إضافة آخر الطلاب المسجلين
  students.slice(-2).forEach((s: any) => {
    dynamicActivities.push({
      id: `st-${s.id}`,
      message: `تسجيل طالب جديد: ${s.name}`,
      time: "مُسجل حديثاً",
      icon: UserPlus,
      color: "text-green-600",
      timestamp: s.createdAt || Date.now()
    });
  });

  // 3. إضافة آخر عمليات الحضور
  Object.keys(attendance).forEach((groupName) => {
    const groupRecords = attendance[groupName];
    Object.keys(groupRecords).forEach((studentId) => {
      const student = students.find((s: any) => s.id.toString() === studentId);
      if (student) {
        dynamicActivities.push({
          id: `att-${studentId}-${groupName}`,
          message: `حضور ${student.name} - ${groupName}`,
          time: groupRecords[studentId].time,
          icon: ClipboardCheck,
          color: "text-blue-600",
          timestamp: Date.now() // كنشاط لحظي
        });
      }
    });
  });

  // 4. إضافة آخر الدفعات المالية
  finance.slice(-2).forEach((f: any) => {
    dynamicActivities.push({
      id: `fin-${f.id}`,
      message: `تحصيل ${f.amount} ج.م من ${f.studentName || 'طالب'}`,
      time: f.date,
      icon: CreditCard,
      color: "text-emerald-600",
      timestamp: new Date(f.date).getTime()
    });
  });

  // ترتيب من الأحدث للأقدم وأخذ آخر 5 فقط
  const finalActivities = dynamicActivities
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  return (
    <Card className="card-hover">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-black">
          <Activity className="w-5 h-5 text-primary" />
          آخر النشاطات الحقيقية
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {finalActivities.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground font-bold italic">لا توجد نشاطات مسجلة حالياً</p>
            </div>
          ) : (
            finalActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 border-b border-slate-50 pb-3 last:border-0">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center bg-muted/50",
                  activity.color
                )}>
                  <activity.icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">{activity.message}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">{activity.time}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}