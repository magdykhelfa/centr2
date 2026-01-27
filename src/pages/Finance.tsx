import { useEffect, useState } from "react";
import { Wallet, TrendingUp, TrendingDown, CreditCard, Plus, Edit, Trash2, Users, Calendar, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Transaction = { 
  id: number; type: "income" | "expense" | "teacher_payment"; 
  amount: number; date: string; status: "completed" | "partial"; 
  student?: string; teacherName?: string; description?: string; 
  groupId?: string; teacherShare?: number; 
};

export default function Finance() {
  const [allStudents] = useState(() => JSON.parse(localStorage.getItem("students-data") || "[]"));
  const [groups] = useState(() => JSON.parse(localStorage.getItem("groups-data") || "[]"));
  const [teachers] = useState(() => JSON.parse(localStorage.getItem("teachers-data") || "[]"));
  const [transactions, setTransactions] = useState<Transaction[]>(() => JSON.parse(localStorage.getItem("finance-transactions") || "[]"));
  
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [form, setForm] = useState<Omit<Transaction, "id">>({ 
    type: "income", amount: 0, date: new Date().toISOString().split('T')[0], 
    status: "completed", student: "", teacherName: "", description: "", groupId: "", teacherShare: 0 
  });

  useEffect(() => { localStorage.setItem("finance-transactions", JSON.stringify(transactions)); }, [transactions]);

  const handleSave = () => {
  let finalForm = { ...form };
  
  if (form.type === "teacher_payment") {
    // لو المدرس "ليه" فلوس (إثبات حصة)
    if (form.description === "is_session") {
      finalForm.teacherShare = Number(form.amount);
      finalForm.amount = 0; // الخزنة لا تتأثر
      finalForm.description = "إثبات استحقاق حصة";
    } 
    // لو المدرس "صرف" فلوس (دفع نقدي)
    else if (form.description === "is_payment") {
      finalForm.teacherShare = 0;
      finalForm.amount = Number(form.amount); // يخصم من الخزنة
      finalForm.description = "صرف نقدي للمدرس";
    }
  }
  // ... باقي كود الدفع للطلاب كما هو
  setTransactions((prev) => [...prev, { ...finalForm, id: Date.now() } as Transaction]);
  setOpenDialog(false);
  setForm({ type: "income", amount: 0, date: new Date().toISOString().split('T')[0], status: "completed", student: "", teacherName: "", description: "", groupId: "", teacherShare: 0 });
};

        const filterStudentsByGroup = (groupId: string) => {
          const groupName = groups.find((g: any) => String(g.id) === groupId)?.name;

          const res = allStudents.filter((s: any) =>
            s.enrolledGroups?.includes(groupName)
          );

          setFilteredStudents(res);
        };


  const totalIncome = transactions.filter(t => t.type === "income").reduce((a, b) => a + b.amount, 0);
  const totalExpenses = transactions.filter(t => t.type !== "income").reduce((a, b) => a + b.amount, 0);

  return (
    <div className="space-y-6 p-4" dir="rtl text-right">
      {/* Header */}
      <div className="flex flex-row-reverse items-center justify-between bg-white p-6 rounded-2xl shadow-sm border">
        <Button size="lg" className="font-black gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg" onClick={() => { setForm({type: "income", amount: 0, date: new Date().toISOString().split('T')[0], status: "completed", student: "", teacherName: "", description: "", groupId: "", teacherShare: 0}); setOpenDialog(true); }}>
          <Plus className="w-5 h-5" /> تسجيل معاملة جديدة
        </Button>
        <div className="text-right">
          <h1 className="text-3xl font-black text-slate-800">الإدارة المالية</h1>
          <p className="text-muted-foreground font-bold">تنظيم الحسابات والمستحقات</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="إجمالي الدخل" value={totalIncome} icon={<TrendingUp />} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard title="المصروفات" value={totalExpenses} icon={<TrendingDown />} color="text-red-600" bg="bg-red-50" />
        <StatCard title="صافي الربح" value={totalIncome - totalExpenses} icon={<Wallet />} color="text-blue-600" bg="bg-blue-50" />
        <StatCard title="تحصيل معلق" value={transactions.filter(t=>t.status==='partial').reduce((a,b)=>a+b.amount,0)} icon={<CreditCard />} color="text-amber-600" bg="bg-amber-50" />
      </div>

      <Tabs defaultValue="students_report" className="w-full">
        <TabsList className="flex flex-row-reverse w-full h-14 bg-slate-100 rounded-xl p-1 font-black shadow-inner">
          <TabsTrigger value="students_report" className="flex-1 rounded-lg">كشف الطلاب</TabsTrigger>
          <TabsTrigger value="teachers_report" className="flex-1 rounded-lg">كشف المدرسين</TabsTrigger>
          <TabsTrigger value="pending" className="flex-1 rounded-lg">المتأخرات</TabsTrigger>
          <TabsTrigger value="history" className="flex-1 rounded-lg">سجل الخزينة</TabsTrigger>
        </TabsList>

        {/* 1. كشف الطلاب */}
        <TabsContent value="students_report">
          <Card className="border-none shadow-xl mt-4 overflow-hidden">
            <CardHeader className="flex flex-row-reverse items-center justify-between border-b bg-slate-50/50 p-4">
              <div className="flex gap-2">
                <Select value={String(selectedMonth)} onValueChange={(v)=>setSelectedMonth(Number(v))}>
                  <SelectTrigger className="w-32 font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent className="text-right">{Array.from({length:12}).map((_,i)=><SelectItem key={i} value={String(i+1)}>شهر {i+1}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={String(selectedYear)} onValueChange={(v)=>setSelectedYear(Number(v))}>
                  <SelectTrigger className="w-32 font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent className="text-right"><SelectItem value="2025">2025</SelectItem><SelectItem value="2026">2026</SelectItem></SelectContent>
                </Select>
              </div>
              <CardTitle className="font-black text-xl text-right">تحصيل الطلاب الشهري</CardTitle>
            </CardHeader>
            <Table>
              <TableHeader><TableRow className="bg-slate-50">
                <TableHead className="text-right font-black">الحالة</TableHead>
                <TableHead className="text-right font-black">التاريخ</TableHead>
                <TableHead className="text-right font-black">المبلغ</TableHead>
                <TableHead className="text-right font-black">المجموعة</TableHead>
                <TableHead className="text-right font-black">اسم الطالب</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {transactions.filter(t => t.type === 'income' && new Date(t.date).getMonth() + 1 === selectedMonth).map(t => (
                  <TableRow key={t.id} className="font-bold text-right">
                    <TableCell><Badge className={t.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>{t.status === 'completed' ? 'تم' : 'جزئي'}</Badge></TableCell>
                    <TableCell>{t.date}</TableCell>
                    <TableCell className="text-emerald-600">{t.amount} ج.م</TableCell>
                    <TableCell>{groups.find(g=>String(g.id)===t.groupId)?.name || "عام"}</TableCell>
                    <TableCell>{t.student}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* 2. كشف المدرسين المطور */}
        <TabsContent value="teachers_report">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {teachers.map((teach: any) => {
              // التعديل هنا: بنجمع كل الـ teacherShare سواء من الطلاب أو من "إثبات حصة" بالمربع
              const earned = transactions
                .filter(t => t.teacherName === teach.name)
                .reduce((acc, t) => acc + (t.teacherShare || 0), 0);
              
              // حساب ما تم صرفه فعلياً (العمليات اللي نقصت الخزينة)
              const paid = transactions
                .filter(t => t.teacherName === teach.name && t.type === "teacher_payment")
                .reduce((acc, t) => acc + (t.amount || 0), 0);
              
              const balance = earned - paid;

              return (
                <Card key={teach.id} className="border-none shadow-lg overflow-hidden transition-all hover:shadow-xl">
                  <div className={`h-2 ${balance > 0 ? 'bg-amber-500' : 'bg-blue-600'}`} />
                  <CardContent className="p-6">
                    <div className="flex flex-row-reverse justify-between items-start mb-6">
                      <div className="flex flex-row-reverse gap-4">
                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
                          <Users className="w-8 h-8" />
                        </div>
                        <div className="text-right">
                          <p className="font-black text-xl text-slate-800">{teach.name}</p>
                          <p className="font-bold text-slate-400 text-sm">{teach.subject}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-blue-200 text-blue-700 font-bold px-3 py-1">
                        {teach.contractType === 'percentage' ? `نسبة ${teach.rate}%` : `ثابت ${teach.rate} ج`}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100 text-center">
                        <p className="text-[10px] font-black text-emerald-600 mb-1">إجمالي له</p>
                        <p className="font-black text-lg text-emerald-700">{earned}</p>
                      </div>
                      <div className="bg-red-50 p-3 rounded-2xl border border-red-100 text-center">
                        <p className="text-[10px] font-black text-red-600 mb-1">قبض فعلياً</p>
                        <p className="font-black text-lg text-red-700">{paid}</p>
                      </div>
                      <div className="bg-slate-900 p-3 rounded-2xl text-center shadow-md">
                        <p className="text-[10px] font-black text-slate-300 mb-1">المتبقي له</p>
                        <p className="font-black text-lg text-white">{balance}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* 4. سجل الخزينة */}
        <TabsContent value="history">
          <Card className="mt-4 shadow-xl border-none overflow-hidden">
            <Table>
              <TableHeader><TableRow className="bg-slate-50">
                <TableHead className="text-right font-black">حذف</TableHead>
                <TableHead className="text-right font-black">التاريخ</TableHead>
                <TableHead className="text-right font-black">المبلغ</TableHead>
                <TableHead className="text-right font-black">النوع</TableHead>
                <TableHead className="text-right font-black">البيان</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {transactions.sort((a,b)=>b.id-a.id).map(t => (
                  <TableRow key={t.id} className="font-bold text-right">
                    <TableCell><Button size="icon" variant="ghost" onClick={()=>setTransactions(transactions.filter(x=>x.id!==t.id))}><Trash2 className="w-4 h-4 text-red-500" /></Button></TableCell>
                    <TableCell className="text-xs text-slate-500">{t.date}</TableCell>
                    <TableCell className={t.type==='income'?'text-emerald-600':'text-red-600'}>{t.amount} ج.م</TableCell>
                    <TableCell><Badge variant="outline" className={t.type==='income'?'text-emerald-600':'text-red-600'}>{t.type==='income'?'إيراد':'صرف'}</Badge></TableCell>
                    <TableCell>{t.type==='income' ? `طالب: ${t.student}` : t.teacherName || t.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: إضافة معاملة */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-md text-right" dir="rtl">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="font-black text-2xl text-right w-full">تسجيل مالي جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4 text-right">
            <div>
              <Label className="font-bold">نوع المعاملة</Label>
              <Select value={form.type} onValueChange={(v:any)=>setForm({...form, type:v})}>
                <SelectTrigger className="text-right font-bold"><SelectValue /></SelectTrigger>
                <SelectContent className="text-right font-bold">
                  <SelectItem value="income">دفع طالب</SelectItem>
                  <SelectItem value="expense">مصروف عام</SelectItem>
                  <SelectItem value="teacher_payment">استحقاق مدرس</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
               <div><Label className="font-bold">المبلغ</Label><Input type="number" className="font-black text-right" value={form.amount} onChange={e=>setForm({...form, amount:+e.target.value})} /></div>
               <div><Label className="font-bold">التاريخ</Label><Input type="date" className="font-bold text-right" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} /></div>
            </div>
            
            {form.type === 'income' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="font-bold">المجموعة</Label>
                  <Select onValueChange={v=>{setForm({...form, groupId:v}); filterStudentsByGroup(v);}}>
                    <SelectTrigger className="text-right font-bold"><SelectValue placeholder="اختر" /></SelectTrigger>
                    <SelectContent className="text-right font-bold">
                      {groups.map((g:any)=><SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="font-bold">الطالب</Label>
                  <Select onValueChange={v=>setForm({...form, student:v})}>
                    <SelectTrigger className="text-right font-bold"><SelectValue placeholder="اختر" /></SelectTrigger>
                    <SelectContent className="text-right font-bold">
                      {filteredStudents.map((s:any)=><SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {form.type === 'teacher_payment' && (
  <div className="space-y-4 border-2 border-dashed border-blue-100 p-4 rounded-xl bg-slate-50/50">
    <div>
      <Label className="font-bold">المدرس</Label>
      <Select onValueChange={v => setForm({ ...form, teacherName: v })}>
        <SelectTrigger className="text-right font-bold bg-white">
          <SelectValue placeholder="اختر المدرس" />
        </SelectTrigger>
        <SelectContent className="text-right font-bold">
          {teachers.map((t: any) => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>

    <div className="grid grid-cols-1 gap-2">
      {/* الخيار الأول: إثبات استحقاق حصة */}
      <div 
        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${form.description === "is_session" ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white"}`}
        onClick={() => setForm({ ...form, description: "is_session" })}
      >
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${form.description === "is_session" ? "border-emerald-500" : "border-slate-300"}`}>
          {form.description === "is_session" && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
        </div>
        <div className="text-right">
          <p className="font-black text-slate-700 text-sm">تسجيل "حصة مستحقة" للمدرس</p>
          <p className="text-[10px] text-emerald-600 font-bold">(بيزود خانة "إجمالي له")</p>
        </div>
      </div>

      {/* الخيار الثاني: دفع نقدي كاش */}
      <div 
        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${form.description === "is_payment" ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white"}`}
        onClick={() => setForm({ ...form, description: "is_payment" })}
      >
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${form.description === "is_payment" ? "border-blue-500" : "border-slate-300"}`}>
          {form.description === "is_payment" && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
        </div>
        <div className="text-right">
          <p className="font-black text-slate-700 text-sm">تسجيل "دفع كاش" للمدرس</p>
          <p className="text-[10px] text-blue-600 font-bold">(بيزود خانة "قبض فعلياً")</p>
        </div>
      </div>
    </div>
  </div>
)}

{/* خانة الملاحظات بتظهر بس لو مش استحقاق مدرس */}
{form.type !== 'teacher_payment' && (
  <div>
    <Label className="font-bold">ملاحظات</Label>
    <Input 
      className="font-bold text-right" 
      value={form.description} 
      onChange={e => setForm({ ...form, description: e.target.value })} 
    />
  </div>
)}

<div>
  <Label className="font-bold">حالة الدفع</Label>
  <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
    <SelectTrigger className="text-right font-bold"><SelectValue /></SelectTrigger>
    <SelectContent className="text-right font-bold">
      <SelectItem value="completed">تم بالكامل</SelectItem>
      <SelectItem value="partial">جزئي (متبقي)</SelectItem>
    </SelectContent>
  </Select>
</div>

<Button 
  onClick={handleSave} 
  className="w-full font-black py-7 text-lg bg-blue-600 hover:bg-blue-700 mt-4 shadow-lg active:scale-95 transition-transform"
>
  حفظ المعاملة
</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ title, value, icon, color, bg }: any) {
  return (
    <Card className={`border-none shadow-md ${bg}`}>
      <CardContent className="p-6 flex flex-row-reverse justify-between items-center text-right">
        <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center border border-white shadow-sm`}>{icon}</div>
        <div><p className="text-sm font-bold text-slate-500 mb-1">{title}</p><p className={`text-2xl font-black ${color}`}>{value.toLocaleString()} ج.م</p></div>
      </CardContent>
    </Card>
  );
}