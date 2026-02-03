import { useEffect, useState } from "react";
import {
  Users,
  UsersRound,
  ClipboardCheck,
  Wallet,
  TrendingUp,
  Calendar as CalendarIcon,
  Info,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { TodaySchedule } from "@/components/dashboard/TodaySchedule";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { AttendanceChart } from "@/components/dashboard/AttendanceChart";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const getStatsFromStorage = (selectedDate: Date) => {
  const selectedISO = selectedDate.toISOString().split("T")[0];
  const today = new Date();
  const todayISO = today.toISOString().split("T")[0];
  const isToday = selectedISO === todayISO;

  const students = JSON.parse(localStorage.getItem("students-data") || "[]");
  const groups = JSON.parse(localStorage.getItem("groups-data") || "[]");
  const attendance = JSON.parse(localStorage.getItem("attendance-data") || "{}");
  const finance = JSON.parse(localStorage.getItem("finance-transactions") || "[]");

  // حضور اليوم المختار
  const dayRecords = attendance[selectedISO] || {};
  const presentStudents: any[] = [];

  Object.keys(dayRecords).forEach((groupName) => {
    const groupStudents = dayRecords[groupName];
    Object.keys(groupStudents).forEach((studentId) => {
      const record = groupStudents[studentId];
      if (record && record.status === "present") {
        const studentInfo = students.find((s: any) => s.id.toString() === studentId.toString());
        if (studentInfo) {
          presentStudents.push({
            name: studentInfo.name,
            detail: `مجموعة: ${groupName} | الساعة: ${record.time || "---"}`,
          });
        }
      }
    });
  });

  // إيرادات اليوم المختار
  const dayIncomeDetails = finance.filter(
    (f: any) => f.date === selectedISO && f.type === "income"
  );
  const revenueDay = dayIncomeDetails.reduce(
    (acc: number, f: any) => acc + (Number(f.amount) || 0),
    0
  );

  // إيرادات الشهر (نفس الشهر اللي فيه اليوم المختار)
  const selectedMonth = selectedDate.getMonth() + 1;
  const selectedYear = selectedDate.getFullYear();
  const monthIncomeDetails = finance.filter((f: any) => {
    const d = new Date(f.date);
    return f.type === "income" && d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
  });
  const revenueMonth = monthIncomeDetails.reduce(
    (acc: number, f: any) => acc + (Number(f.amount) || 0),
    0
  );

  // طلاب جدد في الشهر
  const newStudentsCount = students.filter((s: any) => {
    const d = new Date(s.createdAt || new Date());
    return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
  }).length;

  return {
    studentsCount: students.length,
    groupsCount: groups.length,
    studentsList: students,
    groupsList: groups,
    presentStudents,
    monthIncomeDetails,
    dayIncomeDetails,
    revenueDay,
    revenueMonth,
    newStudentsCount,
    isToday,
  };
};

export default function Dashboard() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  const [stats, setStats] = useState(() => getStatsFromStorage(today));

  const [detailConfig, setDetailConfig] = useState<{
    open: boolean;
    title: string;
    data: any[];
    type: "money" | "info";
  }>({
    open: false,
    title: "",
    data: [],
    type: "info",
  });

  useEffect(() => {
    const update = () => {
      setStats(getStatsFromStorage(selectedDate));
    };

    update();

    // تحديث دوري (كل 4 ثوانٍ) - مفيد خاصة لو اليوم الحالي مختار
    const interval = setInterval(() => {
      const now = new Date();
      if (now.toDateString() === selectedDate.toDateString()) {
        update();
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [selectedDate]);

  const openDetails = (title: string, data: any[], type: "money" | "info" = "info") => {
    setDetailConfig({ open: true, title, data, type });
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3 rounded-xl border shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-600 rounded-lg text-white">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">لوحة التحكم</h1>
            <p className="text-[10px] text-muted-foreground font-bold">
              إحصائيات {stats.isToday ? "اليوم" : format(selectedDate, "EEEE d MMMM yyyy", { locale: ar })}
            </p>
          </div>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal gap-2 min-w-[240px] text-sm",
                "border-slate-300 hover:bg-slate-50"
              )}
            >
              <CalendarIcon className="h-4 w-4 opacity-70" />
              {format(selectedDate, "EEEE d MMMM yyyy", { locale: ar })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              initialFocus
              className="rounded-md border"
              locale={ar as any}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Cards Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div
          onClick={() =>
            openDetails(
              "قائمة الطلاب",
              stats.studentsList.map((s) => ({ name: s.name, detail: s.phone }))
            )
          }
          className="cursor-pointer hover:opacity-90 transition-opacity"
        >
          <StatCard title="إجمالي الطلاب" value={stats.studentsCount} icon={Users} />
        </div>
        <div
          onClick={() =>
            openDetails(
              "المجموعات المفعلة",
              stats.groupsList.map((g) => ({ name: g.name, detail: `المدرس: ${g.teacherName}` }))
            )
          }
          className="cursor-pointer hover:opacity-90 transition-opacity"
        >
          <StatCard title="مجموعات مفعلة" value={stats.groupsCount} icon={UsersRound} />
        </div>
        <div
          onClick={() => openDetails("حضور اليوم", stats.presentStudents)}
          className="cursor-pointer hover:opacity-90 transition-opacity"
        >
          <StatCard
            title="حضور اليوم"
            value={stats.presentStudents.length}
            icon={ClipboardCheck}
            variant="success"
          />
        </div>
      </div>

      {/* Cards Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div
          onClick={() => openDetails("تفاصيل إيرادات اليوم", stats.dayIncomeDetails, "money")}
          className="cursor-pointer hover:opacity-90 transition-opacity"
        >
          <StatCard
            title={stats.isToday ? "إيراد اليوم" : "إيراد اليوم المختار"}
            value={`${stats.revenueDay} ج`}
            icon={Wallet}
            variant="success"
          />
        </div>
        <div
          onClick={() =>
            openDetails(`إيرادات شهر ${selectedDate.getMonth() + 1}`, stats.monthIncomeDetails, "money")
          }
          className="cursor-pointer hover:opacity-90 transition-opacity"
        >
          <StatCard
            title="إيراد الشهر"
            value={`${stats.revenueMonth} ج`}
            icon={TrendingUp}
            variant="info"
          />
        </div>
        <StatCard
          title="طلاب جدد"
          value={stats.newStudentsCount}
          icon={UsersRound}
          variant="info"
        />
      </div>

      {/* Charts & Actions Section */}
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

      {/* Details Dialog */}
      <Dialog
        open={detailConfig.open}
        onOpenChange={(o) => setDetailConfig({ ...detailConfig, open: o })}
      >
        <DialogContent
          className="max-w-md bg-white p-0 rounded-2xl overflow-hidden border-none"
          dir="rtl"
        >
          <DialogHeader className="bg-slate-50 p-4 border-b">
            <DialogTitle className="text-blue-700 font-black text-sm flex items-center gap-2">
              <Info className="w-4 h-4" /> {detailConfig.title}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto p-2">
            <Table>
              <TableBody>
                {detailConfig.data.length > 0 ? (
                  detailConfig.data.map((item, i) => (
                    <TableRow key={i} className="hover:bg-slate-50/50 border-slate-100">
                      <TableCell className="font-bold text-xs py-3">
                        {item.name || item.studentName || item.description || "عملية مالية"}
                      </TableCell>
                      <TableCell className="text-xs text-blue-600 font-black text-left py-3">
                        {detailConfig.type === "money" ? `${item.amount} ج` : item.detail}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell className="text-center py-10 text-slate-400 font-bold">
                      لا توجد بيانات متاحة حالياً
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}