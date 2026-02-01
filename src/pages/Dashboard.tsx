import { useEffect, useState } from "react";
import { Users, UsersRound, ClipboardCheck, Wallet, TrendingUp, TrendingDown, BookOpen, CalendarDays } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { TodaySchedule } from "@/components/dashboard/TodaySchedule";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { AttendanceChart } from "@/components/dashboard/AttendanceChart";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { QuickActions } from "@/components/dashboard/QuickActions";

const getStatsFromStorage = () => {
  const students = JSON.parse(localStorage.getItem("students-data") || "[]");
  const groups = JSON.parse(localStorage.getItem("groups-data") || "[]");
  const attendance = JSON.parse(localStorage.getItem("attendance-data") || "{}");
  const finance = JSON.parse(localStorage.getItem("finance-transactions") || "[]");
  const exams = JSON.parse(localStorage.getItem("exams-data") || "[]");
  const sessions = JSON.parse(localStorage.getItem("sessions-data") || "[]");
  
  const today = new Date().toISOString().split("T")[0];
  const currentMonth = new Date().getMonth();

  const todaySessionsCount = sessions.filter((s: any) => s.date === today).length;
  const todayExamsCount = exams.filter((e: any) => e.date === today).length;

  let present = 0;
  let absent = 0;
  const existingStudentIds = new Set(students.map((s: any) => s.id.toString()));

  Object.keys(attendance).forEach((groupName) => {
    const groupRecords = attendance[groupName];
    Object.keys(groupRecords).forEach((studentId) => {
      if (existingStudentIds.has(studentId.toString())) {
        if (groupRecords[studentId]?.status === "present") present++;
        if (groupRecords[studentId]?.status === "absent") absent++;
      }
    });
  });

  const revenueMonth = finance
    .filter((f: any) => f.type === "income" && new Date(f.date).getMonth() === currentMonth)
    .reduce((acc: number, f: any) => acc + (Number(f.amount) || 0), 0);
  
  const pendingPayments = finance
    .filter((f: any) => f.status === "partial" || f.status === "unpaid")
    .reduce((acc: number, f: any) => acc + (Number(f.amount) || 0), 0);

  const newStudentsMonth = students.filter((s: any) => {
    const createdAt = s.createdAt ? new Date(s.createdAt) : new Date();
    return createdAt.getMonth() === currentMonth;
  }).length;

  return { 
    students: students.length, 
    groups: groups.length, 
    todayAttendance: present, 
    todayAbsence: absent, 
    todaySessions: todaySessionsCount + todayExamsCount,
    revenueMonth, 
    pendingPayments, 
    newStudentsMonth 
  };
};

export default function Dashboard() {
  const [stats, setStats] = useState(getStatsFromStorage());

  useEffect(() => { 
    const updateStats = () => setStats(getStatsFromStorage());
    window.addEventListener("storage", updateStats); 
    const interval = setInterval(updateStats, 2000); 
    return () => { 
      window.removeEventListener("storage", updateStats); 
      clearInterval(interval); 
    }; 
  }, []);

  return (
    <div className="space-y-2 animate-in fade-in duration-500">
      {/* Header: تقليص المساحات وحجم الخطوط */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-blue-50 rounded-lg">
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-800">مرحباً مجدداً</h1>
            <p className="text-[10px] text-muted-foreground font-bold">ملخص الأداء والنشاط لليوم</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border">
          <CalendarDays className="w-3 h-3 text-slate-400" />
          <span className="font-black text-xs text-slate-600">
            {new Date().toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" })}
          </span>
        </div>
      </div>
      
      {/* Stats Grid: جعلها 4 في الصف للديسكتوب لتقليل الطول الرأسي */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <StatCard title="إجمالي الطلاب" value={stats.students} icon={Users} />
        <StatCard title="مجموعات مفعلة" value={stats.groups} icon={UsersRound} />
        <StatCard title="حضور اليوم" value={stats.todayAttendance} icon={ClipboardCheck} variant="success" />
        <StatCard title="مواعيد اليوم" value={stats.todaySessions} icon={BookOpen} variant="info" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <StatCard title="غياب اليوم" value={stats.todayAbsence} icon={TrendingDown} variant="warning" />
        <StatCard title="إيراد الشهر" value={`${stats.revenueMonth.toLocaleString()}`} icon={Wallet} variant="success" />
        <StatCard title="المتأخرات" value={`${stats.pendingPayments.toLocaleString()}`} icon={Wallet} variant="warning" />
        <StatCard title="طلاب الشهر" value={stats.newStudentsMonth} icon={TrendingUp} variant="info" />
      </div>

      {/* الرسوم البيانية والجداول في تخطيط أكثر كثافة */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-2">
        {/* المحتوى الرئيسي: الجدول والرسومات */}
        <div className="xl:col-span-8 space-y-2">
          <TodaySchedule />
          <div className="grid md:grid-cols-2 gap-2">
            <div className="bg-white p-1 rounded-lg border shadow-sm"><AttendanceChart /></div>
            <div className="bg-white p-1 rounded-lg border shadow-sm"><RevenueChart /></div>
          </div>
        </div>

        {/* الجانب: إجراءات سريعة ونشاط */}
        <div className="xl:col-span-4 space-y-2">
          <QuickActions />
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}