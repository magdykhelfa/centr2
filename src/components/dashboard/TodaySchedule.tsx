import { Clock, BookOpen, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function TodaySchedule() {
  // 1. جلب الحصص الفعلية من جدول الحصص (sessions-data)
  const sessions = JSON.parse(localStorage.getItem("sessions-data") || "[]");
  
  // 2. الحصول على تاريخ اليوم بنفس الصيغة المخزنة (YYYY-MM-DD)
  const todayDate = new Date().toISOString().split('T')[0];
  const todayNameAr = new Intl.DateTimeFormat('ar-EG', { weekday: 'long' }).format(new Date());

  // 3. فلترة الحصص اللي تاريخها هو "النهاردة"
  const todaySessions = sessions.filter((s: any) => s.date === todayDate);

  return (
    <Card className="card-hover shadow-lg border-none">
      <CardHeader className="pb-3 bg-slate-50/50 rounded-t-2xl">
        <CardTitle className="flex items-center gap-2 text-lg font-black text-slate-800">
          <Clock className="w-5 h-5 text-blue-600" />
          حصص اليوم ({todayNameAr})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        {todaySessions.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed rounded-xl flex flex-col items-center gap-2 bg-slate-50/30">
            <CalendarDays className="w-10 h-10 text-slate-300" />
            <p className="text-muted-foreground font-bold italic">لا توجد حصص مجدولة لهذا اليوم</p>
          </div>
        ) : (
          todaySessions.map((session: any) => (
            <div
              key={session.id}
              className="flex items-center gap-4 p-4 rounded-xl bg-white hover:bg-blue-50/50 transition-all border border-slate-100 shadow-sm border-r-4 border-r-blue-600"
            >
              <div className="w-20 h-14 rounded-lg bg-blue-600 flex flex-col items-center justify-center text-white shadow-sm">
                <span className="text-[9px] font-bold uppercase opacity-80">الوقت</span>
                <span className="font-black text-[11px]" dir="ltr">{session.startTime}</span>
              </div>
              <div className="flex-1">
                <h4 className="font-black text-slate-800 text-base">{session.group}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px] font-bold border-blue-100 text-blue-600 bg-blue-50">
                    <BookOpen className="w-3 h-3 ml-1" />
                    {session.topic || "بدون عنوان"}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <p className="text-[10px] font-black text-slate-400">{session.teacherName}</p>
                <Badge className={session.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700" + " border-none font-bold text-[10px]"}>
                  {session.status === "completed" ? "تمت" : "قادمة"}
                </Badge>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}