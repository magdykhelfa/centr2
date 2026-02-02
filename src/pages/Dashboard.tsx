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
  
  const today = new Date();
  const todayISO = today.toISOString().split("T")[0];

  // --- منطق الحضور الذكي ---
  const presentStudents: any[] = [];
  
  // نحدد هل الشهر المختار هو الشهر الحالي فعلاً؟
  const isCurrentSelection = (today.getMonth() + 1) === selectedMonth && today.getFullYear() === selectedYear;

  Object.keys(attendance).forEach(groupName => {
    const groupRecords = attendance[groupName];
    Object.keys(groupRecords).forEach(studentId => {
      const record = groupRecords[studentId];
      
      if (record && record.status === "present") {
        // 1. إذا كان السجل يحتوي على تاريخ، نقارنه باليوم
        // 2. إذا لم يحتوي على تاريخ (مثل كودك الحالي)، نظهره فقط إذا كان المستخدم يختار الشهر الحالي
        const isToday = record.date === todayISO;
        const noDateAndCurrentMonth = !record.date && isCurrentSelection;

        if (isToday || noDateAndCurrentMonth) {
           const studentInfo = students.find((s: any) => s.id.toString() === studentId.toString());
           presentStudents.push({ 
             name: studentInfo?.name || `طالب كود ${studentId}`, 
             detail: `مجموعة: ${groupName} | الساعة: ${record.time || '---'}` 
           });
        }
      }
    });
  });

  // إيرادات اليوم (تظهر فقط إذا كان الشهر المختار هو الشهر الحالي)
  const revenueToday = isCurrentSelection 
    ? finance.filter((f: any) => f.date === todayISO && f.type === "income").reduce((acc: number, f: any) => acc + (Number(f.amount) || 0), 0)
    : 0;

  // إيرادات الشهر (تعتمد كلياً على الفلتر)
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
    monthIncomeDetails,
    revenueToday,
    revenueMonth: monthIncomeDetails.reduce((acc: number, f: any) => acc + (Number(f.amount) || 0), 0),
    newStudentsCount
  };
};

export default function Dashboard() {
  const [viewDate, setViewDate] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  const [stats, setStats] = useState(getStatsFromStorage(viewDate.month, viewDate.year));
  const [detailConfig, setDetailConfig] = useState<{open: boolean, title: string, data: any[], type: 'money' | 'info'}>({
    open: false, title: '', data: [], type: 'info'
  });

  useEffect(() => { 
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3 rounded-xl border shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-600 rounded-lg text-white"><Calendar className="w-5 h-5" /></div>
          <div>
            <h1 className="text-xl font-black text-slate-800">لوحة التحكم </h1>
            <p className="text-[10px] text-muted-foreground font-bold font-sans">
              يتم عرض حضور وإيراد اليوم عند اختيار شهر {new Date().getMonth() + 1} فقط
            </p>
          </div>
        </div>
        
        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
          <select className="text-xs font-bold p-1 border rounded bg-white" value={viewDate.month} onChange={(e) => setViewDate({...viewDate, month: Number(e.target.value)})}>
            {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>شهر {i+1}</option>)}
          </select>
          <select className="text-xs font-bold p-1 border rounded bg-white" value={viewDate.year} onChange={(e) => setViewDate({...viewDate, year: Number(e.target.value)})}>
            {[2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
      
      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div onClick={() => openDetails("الطلاب", stats.studentsList.map(s => ({name: s.name, detail: s.phone})))} className="cursor-pointer">
          <StatCard title="إجمالي الطلاب" value={stats.studentsCount} icon={Users} />
        </div>
        <div onClick={() => openDetails("المجموعات", stats.groupsList.map(g => ({name: g.name, detail: g.teacherName})))} className="cursor-pointer">
          <StatCard title="مجموعات مفعلة" value={stats.groupsCount} icon={UsersRound} />
        </div>
        <div onClick={() => openDetails("حضور اليوم", stats.presentStudents)} className="cursor-pointer">
          <StatCard title="حضور اليوم" value={stats.presentStudents.length} icon={ClipboardCheck} variant="success" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard title="إيراد اليوم" value={`${stats.revenueToday} ج`} icon={Wallet} variant="success" />
        <div onClick={() => openDetails(`إيراد شهر ${viewDate.month}`, stats.monthIncomeDetails, 'money')} className="cursor-pointer">
          <StatCard title="إيراد الشهر" value={`${stats.revenueMonth} ج`} icon={TrendingUp} variant="info" />
        </div>
        <StatCard title="طلاب جدد" value={stats.newStudentsCount} icon={UsersRound} variant="info" />
      </div>

      {/* Charts & Table */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8 space-y-4">
          <TodaySchedule />
          <div className="grid md:grid-cols-2 gap-4">
             <AttendanceChart />
             <RevenueChart />
          </div>
        </div>
        <div className="xl:col-span-4 space-y-4">
          <QuickActions />
          <RecentActivity />
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={detailConfig.open} onOpenChange={(o) => setDetailConfig({...detailConfig, open: o})}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader className="border-b pb-2"><DialogTitle className="text-blue-600 font-black text-sm flex items-center gap-2"><Info className="w-4 h-4" /> {detailConfig.title}</DialogTitle></DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableBody>
                {detailConfig.data.length > 0 ? detailConfig.data.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-bold text-xs">{item.name || item.description}</TableCell>
                    <TableCell className="text-xs text-blue-600 font-medium text-left">{detailConfig.type === 'money' ? `${item.amount} ج` : item.detail}</TableCell>
                  </TableRow>
                )) : <TableRow><TableCell className="text-center py-10 text-slate-400">لا توجد بيانات لهذا الاختيار</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}