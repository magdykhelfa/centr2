import { useEffect, useState } from "react";
import { Users, UsersRound, ClipboardCheck, Wallet, TrendingUp, TrendingDown, BookOpen } from "lucide-react";
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
  
  // جلب بيانات الحصص من المفتاح الصحيح
  const sessions = JSON.parse(localStorage.getItem("sessions-data") || "[]");
  
  const today = new Date().toISOString().split("T")[0]; // صيغة YYYY-MM-DD
  const currentMonth = new Date().getMonth();

  // --- حساب حصص اليوم ---
  // بندور في جدول الـ sessions اللي إنت بعتهولي وبنشوف التاريخ مطابق للنهاردة ولا لأ
  const todaySessionsCount = sessions.filter((s: any) => s.date === today).length;
  
  // إضافة الامتحانات لو فيه امتحانات النهاردة بردو
  const todayExamsCount = exams.filter((e: any) => e.date === today).length;

  // --- حساب الحضور والغياب ---
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

  // --- الحسابات المالية ---
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
    todaySessions: todaySessionsCount + todayExamsCount, // العداد هيقرأ مجموعهم
    revenueMonth, 
    pendingPayments, 
    newStudentsMonth 
  };
};

export default function Dashboard() {
  const [stats, setStats] = useState(getStatsFromStorage());

  useEffect(() => { 
    const updateStats = () => {
      setStats(getStatsFromStorage());
    };

    // التحديث عند تغيير التخزين من تابة تانية
    window.addEventListener("storage", updateStats); 
    
    // تحديث دوري سريع للتأكد من المزامنة اللحظية
    const interval = setInterval(updateStats, 1000); 

    return () => { 
      window.removeEventListener("storage", updateStats); 
      clearInterval(interval); 
    }; 
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800">مرحباً 👋</h1>
          <p className="text-muted-foreground font-bold">إليك ملخص دقيق لنشاط السنتر اليوم</p>
        </div>
        <div className="bg-white p-3 rounded-2xl shadow-sm border text-center min-w-[200px]">
          <p className="text-xs text-muted-foreground font-bold uppercase mb-1">تاريخ اليوم</p>
          <p className="font-black text-primary">
            {new Date().toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
      </div>
      
      {/* الصف الأول: الطلاب والمجموعات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي الطلاب" value={stats.students} icon={Users} />
        <StatCard title="المجموعات" value={stats.groups} icon={UsersRound} />
        <StatCard title="حضور اليوم" value={stats.todayAttendance} icon={ClipboardCheck} variant="success" />
        <StatCard title="إيراد الشهر" value={`${stats.revenueMonth.toLocaleString()} ج.م`} icon={Wallet} variant="info" />
      </div>

      {/* الصف الثاني: الحصص والغياب والمتاخرات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="مواعيد اليوم" value={stats.todaySessions} icon={BookOpen} />
        <StatCard title="غياب اليوم" value={stats.todayAbsence} icon={TrendingDown} variant="warning" />
        <StatCard title="المتأخرات" value={`${stats.pendingPayments.toLocaleString()} ج.م`} icon={Wallet} variant="warning" />
        <StatCard title="طلاب جدد" value={stats.newStudentsMonth} icon={TrendingUp} variant="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TodaySchedule />
          <div className="grid md:grid-cols-2 gap-6">
            <AttendanceChart />
            <RevenueChart />
          </div>
        </div>
        <div className="space-y-6">
          <QuickActions />
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}