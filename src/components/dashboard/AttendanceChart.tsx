import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, AlertCircle } from "lucide-react";

export function AttendanceChart() {
  // 1. جلب بيانات الحضور والطلاب الفعلية
  const attendance = JSON.parse(localStorage.getItem("attendance-data") || "{}");
  const students = JSON.parse(localStorage.getItem("students-data") || "[]");

  // 2. تحويل البيانات لشكل إحصائي للمجموعات
  const chartData = Object.keys(attendance).map((groupName) => {
    const presentCount = Object.keys(attendance[groupName]).length;
    
    // حساب عدد طلاب المجموعة الكلي عشان نعرف نسبة الحضور (اختياري)
    const totalInGroup = students.filter((s: any) => 
      s.enrolledGroups?.includes(groupName)
    ).length;

    return {
      name: groupName,
      حضور: presentCount,
      الكل: totalInGroup
    };
  });

  return (
    <Card className="card-hover">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-black">
          <TrendingUp className="w-5 h-5 text-primary" />
          معدل الحضور لكل مجموعة
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[250px] flex flex-col items-center justify-center bg-slate-50 rounded-lg border-2 border-dashed gap-2">
            <AlertCircle className="w-8 h-8 text-slate-300" />
            <p className="text-muted-foreground font-bold italic">لا يوجد حضور مسجل اليوم</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={80} 
                tick={{ fontSize: 12, fontWeight: 'bold' }}
              />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  fontWeight: "bold"
                }}
              />
              <Bar 
                dataKey="حضور" 
                fill="hsl(var(--primary))" 
                radius={[0, 4, 4, 0]} 
                barSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}