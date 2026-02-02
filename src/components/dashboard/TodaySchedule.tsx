import { Clock, BookOpen, CalendarDays, Users, MapPin, GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function TodaySchedule() {
  // 1. جلب البيانات
  const groups = JSON.parse(localStorage.getItem("groups-data") || "[]");
  
  // 2. دالة تحويل كود الصف لاسم مفهوم (نفس المنطق في صفحة المجموعات)
  const getGradeLabel = (stage: string, grade: any) => {
    if (!stage || !grade) return "غير محدد";
    const stages: any = { primary: "ابتدائي", middle: "إعدادي", high: "ثانوي" };
    const ordinals = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس"];
    const stageLabel = stages[stage] || "";
    return `الصف ${ordinals[Number(grade) - 1] || grade} ${stageLabel}`;
  };

  // 3. دالة الحصول على اليوم بأسماء ثابتة لمعالجة الهمزات
  const getTodayName = () => {
    const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    return days[new Date().getDay()];
  };

  const todayName = getTodayName();
  const cleanText = (text: string) => text.replace(/[أإآ]/g, "ا").trim();

  // 4. فلترة المجموعات
  const todayGroups = groups.filter((group: any) => {
    if (!group.days || !Array.isArray(group.days)) return false;
    return group.days.some((day: string) => cleanText(day) === cleanText(todayName));
  }).sort((a: any, b: any) => (a.startTime || "").localeCompare(b.startTime || ""));

  const formatTime12 = (time: string) => {
    if (!time) return "---";
    const [h, m] = time.split(':');
    let hour = parseInt(h);
    const suffix = hour >= 12 ? "م" : "ص";
    hour = hour % 12 || 12;
    return `${hour}:${m} ${suffix}`;
  };

  return (
    <Card className="shadow-lg border-none overflow-hidden bg-white">
      <CardHeader className="pb-3 bg-slate-50 border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-lg font-black text-slate-800">
            <Clock className="w-5 h-5 text-blue-600" />
            حصص اليوم
          </CardTitle>
          <Badge className="bg-blue-600 font-bold px-4">{todayName}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        {todayGroups.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-2xl flex flex-col items-center gap-3 bg-slate-50/50">
            <CalendarDays className="w-8 h-8 text-slate-300" />
            <p className="text-slate-500 font-bold text-sm">لا توجد حصص مجدولة ليوم {todayName}</p>
          </div>
        ) : (
          todayGroups.map((group: any) => (
            <div
              key={group.id}
              className="group flex items-center gap-4 p-4 rounded-xl bg-white hover:bg-blue-50/40 transition-all border border-slate-100 shadow-sm border-r-4 border-r-blue-600"
            >
              {/* وقت الحصة */}
              <div className="w-16 h-14 rounded-lg bg-slate-900 flex flex-col items-center justify-center text-white transition-colors group-hover:bg-blue-600 shadow-sm">
                <span className="text-[10px] font-black" dir="ltr">{formatTime12(group.startTime)}</span>
                <span className="text-[8px] font-bold opacity-60">البداية</span>
              </div>

              {/* تفاصيل المجموعة والصف */}
              <div className="flex-1 space-y-1">
                <h4 className="font-black text-slate-800 text-sm">{group.name}</h4>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  <span className="text-[10px] text-blue-700 font-bold flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
                    {getGradeLabel(group.stage, group.grade)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-slate-400" />
                    {group.subject}
                  </span>
                </div>
              </div>

              {/* المدرس والمكان */}
              <div className="text-left shrink-0">
                <p className="text-[10px] font-black text-slate-700 mb-1">{group.teacherName}</p>
                <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                  <MapPin className="w-2.5 h-2.5" />
                  {group.hallName || "غير محدد"}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}