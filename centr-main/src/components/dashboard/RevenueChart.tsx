import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Wallet, AlertCircle } from "lucide-react";

export function RevenueChart() {
  // 1. جلب بيانات المالية الحقيقية
  const finance = JSON.parse(localStorage.getItem("finance-transactions") || "[]");

  // 2. معالجة البيانات لتجميع الإيرادات حسب الشهر
  const monthlyData: Record<string, number> = {};
  const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

  finance.forEach((transaction: any) => {
    if (transaction.type === "income") {
      const date = new Date(transaction.date);
      const monthName = monthNames[date.getMonth()];
      monthlyData[monthName] = (monthlyData[monthName] || 0) + (Number(transaction.amount) || 0);
    }
  });

  // تحويل الكائن إلى مصفوفة للرسم البياني (عرض آخر 6 شهور فيها بيانات)
  const chartData = Object.keys(monthlyData).map(month => ({
    month: month,
    الإيرادات: monthlyData[month]
  }));

  return (
    <Card className="card-hover">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-black">
          <Wallet className="w-5 h-5 text-emerald-500" />
          الإيرادات الشهرية الحقيقية
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[250px] flex flex-col items-center justify-center bg-slate-50 rounded-lg border-2 border-dashed gap-2">
            <AlertCircle className="w-8 h-8 text-slate-300" />
            <p className="text-muted-foreground font-bold italic">لا توجد بيانات مالية مسجلة بعد</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12, fontWeight: 'bold' }} 
                stroke="#666"
              />
              <YAxis 
                tick={{ fontSize: 12 }} 
                stroke="#666" 
                tickFormatter={(value) => `${value}`} 
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  fontWeight: "bold"
                }}
                formatter={(value) => [`${value} ج.م`, "الإيرادات"]}
              />
              <Area
                type="monotone"
                dataKey="الإيرادات"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}