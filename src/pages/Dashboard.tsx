import { useEffect, useState } from "react";
import { Users, UsersRound, ClipboardCheck, Wallet, TrendingUp, Calendar, Info } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { TodaySchedule } from "@/components/dashboard/TodaySchedule";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { AttendanceChart } from "@/components/dashboard/AttendanceChart";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const getStatsFromStorage = (selectedMonth: number, selectedYear: number) => {
  const students = JSON.parse(localStorage.getItem("students-data") || "[]");
  const groups = JSON.parse(localStorage.getItem("groups-data") || "[]");
  const attendance = JSON.parse(localStorage.getItem("attendance-data") || "{}");
  const finance = JSON.parse(localStorage.getItem("finance-transactions") || "[]");
  
  const todayISO = new Date().toISOString().split("T")[0];

  // --- إصلاح منطق الحضور بناءً على كود صفحة التحضير ---
  const presentStudents: any[] = [];
  
  // نلف على المجموعات (المفاتيح الأساسية في attendance-data)
  Object.keys(attendance).forEach(groupName => {
    const groupRecords = attendance[groupName]; // هذا يحتوي على الطلاب { studentId: { status, time } }
    
    Object.keys(groupRecords).forEach(studentId => {
      const record = groupRecords[studentId];
      
      // بما أن كود التحضير لا يخزن تاريخاً، سنعتبر كل ما هو موجود حالياً في الحضور هو "حضور اليوم"
      // (كما يعمل كود صفحة التحضير في عرض الإحصائيات هناك)
      if (record && record.status === "present") {
        const studentInfo = students.find((s: any) => s.id.toString() === studentId.toString());
        presentStudents.push({ 
          name: studentInfo?.name || `طالب كود ${studentId}`, 
          detail: `مجموعة: ${groupName} | الساعة: ${record.time || 'غير مسجل'}` 
        });
      }
    });
  });

  const todayIncomeDetails = finance.filter((f: any) => f.date === todayISO && f.type === "income");
  
  const monthIncomeDetails = finance.filter((f: any) => {
    const d = new Date(f.date);
    return f.type === "income" && (d.getMonth() + 1) === selectedMonth && d.getFullYear() === selectedYear;
  });

  const newStudentsCount = students.filter((s: any) => {
    const d = new Date(s.createdAt || new Date());
    return (d.getMonth() + 1) === selectedMonth && d.getFullYear() === selectedYear;
  }).length;

  return { 
    studentsCount: students.length,
    groupsCount: groups.length,
    studentsList: students,
    groupsList: groups,
    presentStudents,
    todayIncomeDetails,
    monthIncomeDetails,
    revenueToday: todayIncomeDetails.reduce((acc: number, f: any) => acc + (Number(f.amount) || 0), 0),
    revenueMonth: monthIncomeDetails.reduce((acc: number, f: any) => acc + (Number(f.amount) || 0), 0),
    newStudentsCount
  };
};

export default function Dashboard() {
  const [viewDate, setViewDate] = useState({
    month: Number(localStorage.getItem('selectedMonth')) || new Date().getMonth() + 1,
    year: Number(localStorage.getItem('selectedYear')) || new Date().getFullYear()
  });

  const [stats, setStats] = useState(getStatsFromStorage(viewDate.month, viewDate.year));
  const [detailConfig, setDetailConfig] = useState<{open: boolean, title: string, data: any[], type: 'money' | 'info'}>({
    open: false, title: '', data: [], type: 'info'
  });

  useEffect(() => { 
    localStorage.setItem('selectedMonth', viewDate.month.toString());
    localStorage.setItem('selectedYear', viewDate.year.toString());
    const update = () => setStats(getStatsFromStorage(viewDate.month, viewDate.year));
    update();
    const interval = setInterval(update, 2000); 
    return () => clearInterval(interval); 
  }, [viewDate]);

  const openDetails = (title: string, data: any[], type: 'money' | 'info' = 'info') => {
    setDetailConfig({ open: true, title, data, type });
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500" dir="rtl">
      {/* Header & Global Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3 rounded-xl border shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-600 rounded-lg text-white"><Calendar className="w-5 h-5" /></div>
          <div>
            <h1 className="text-xl font-black text-slate-800">لوحة التحكم</h1>
            <p className="text-[10px] text-muted-foreground font-bold">تغيير الشهر يغير حسابات الشهر فقط، الحضور دائم لليوم</p>
          </div>
        </div>
        <div className="flex gap-2 bg-slate-50 p-1 rounded-lg border">
          <select className="text-xs font-bold p-1 border rounded bg-white" value={viewDate.month} onChange={(e) => setViewDate({...viewDate, month: Number(e.target.value)})}>
            {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>شهر {i+1}</option>)}
          </select>
          <select className="text-xs font-bold p-1 border rounded bg-white" value={viewDate.year} onChange={(e) => setViewDate({...viewDate, year: Number(e.target.value)})}>
            {[2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
      
      {/* الرو الأول: الإحصائيات العامة والحضور */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div onClick={() => openDetails("قائمة كل الطلاب", stats.studentsList.map(s => ({name: s.name, detail: s.phone})))} className="cursor-pointer active:scale-95 transition-all">
          <StatCard title="إجمالي الطلاب" value={stats.studentsCount} icon={Users} />
        </div>
        <div onClick={() => openDetails("المجموعات المسجلة", stats.groupsList.map(g => ({name: g.name, detail: g.teacherName})))} className="cursor-pointer active:scale-95 transition-all">
          <StatCard title="مجموعات مفعلة" value={stats.groupsCount} icon={UsersRound} />
        </div>
        <div onClick={() => openDetails("تفاصيل حضور اليوم", stats.presentStudents)} className="cursor-pointer active:scale-95 transition-all">
          <StatCard title="حضور اليوم" value={stats.presentStudents.length} icon={ClipboardCheck} variant="success" />
        </div>
      </div>

      {/* الرو الثاني: الماليات والطلاب الجدد */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div onClick={() => openDetails("مقبوضات اليوم", stats.todayIncomeDetails, 'money')} className="cursor-pointer active:scale-95 transition-all">
          <StatCard title="إيراد اليوم" value={`${stats.revenueToday} ج`} icon={Wallet} variant="success" />
        </div>
        <div onClick={() => openDetails(`دخل شهر ${viewDate.month}`, stats.monthIncomeDetails, 'money')} className="cursor-pointer active:scale-95 transition-all">
          <StatCard title="إيراد الشهر" value={`${stats.revenueMonth} ج`} icon={TrendingUp} variant="info" />
        </div>
        <StatCard title="طلاب جدد (شهر 0{viewDate.month})" value={stats.newStudentsCount} icon={UsersRound} variant="info" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8 space-y-4">
          <TodaySchedule />
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white p-2 rounded-xl border shadow-sm"><AttendanceChart /></div>
            <div className="bg-white p-2 rounded-xl border shadow-sm"><RevenueChart /></div>
          </div>
        </div>
        <div className="xl:col-span-4 space-y-4">
          <QuickActions />
          <RecentActivity />
        </div>
      </div>

      {/* نافذة التفاصيل */}
      <Dialog open={detailConfig.open} onOpenChange={(o) => setDetailConfig({...detailConfig, open: o})}>
        <DialogContent className="max-w-md rounded-2xl" dir="rtl">
          <DialogHeader className="border-b pb-3 mb-2">
            <DialogTitle className="text-blue-600 font-black flex items-center gap-2">
              <Info className="w-5 h-5" /> {detailConfig.title}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[50vh] overflow-y-auto pr-1">
            <Table>
              <TableHeader><TableRow className="bg-slate-50"><TableHead className="text-right font-bold">الاسم/البيان</TableHead><TableHead className="text-right font-bold">التفاصيل</TableHead></TableRow></TableHeader>
              <TableBody>
                {detailConfig.data.length > 0 ? detailConfig.data.map((item, i) => (
                  <TableRow key={i} className="hover:bg-slate-50">
                    <TableCell className="font-bold text-[12px] py-3">{item.name || item.description}</TableCell>
                    <TableCell className="text-[12px] py-3 font-medium text-blue-600">
                      {detailConfig.type === 'money' ? `${item.amount} ج.م` : (item.detail || "---")}
                    </TableCell>
                  </TableRow>
                )) : <TableRow><TableCell colSpan={2} className="text-center py-10 text-slate-400 font-bold text-xs">لا يوجد بيانات</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}