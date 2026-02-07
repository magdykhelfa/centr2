import { useState, useEffect } from 'react';
import { Plus, Edit, Calculator, Users, Wallet, Trash2, AlertCircle, UserCheck, Receipt, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch"; 
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from 'sonner';
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FINANCE_KEY = "finance-transactions";
const STUDENTS_KEY = "students-data";
const TEACHERS_KEY = "teachers-data";
const USERS_KEY = "edu_users";

export default function Finance() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isStudentSettingsOpen, setIsStudentSettingsOpen] = useState(false);
  const [isTeacherFinanceOpen, setIsTeacherFinanceOpen] = useState(false);
  const [isIncomeDetailsOpen, setIsIncomeDetailsOpen] = useState(false);
  const [isExpenseDetailsOpen, setIsExpenseDetailsOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiverFilter, setReceiverFilter] = useState('all');

  const [studentForm, setStudentForm] = useState({
    id: '', name: '', subscriptionType: 'per_lesson', packagePrice: 0,
    discountPercentage: 0, selectedSubjects: [] as any[], 
    isPackageFree: false, lastUpdateDate: '', notes: '', manualDebt: 0,
    receiver: ''
  });

  const [teacherFinForm, setTeacherFinForm] = useState({
    id: '', name: '', salaryType: 'fixed', fixedSalary: 0, 
    pricePerLesson: 0, lessonsCount: 0, percentage: 0, notes: '',
    receiver: ''
  });

  const [form, setForm] = useState({ 
    type: 'income', amount: 0, description: '', 
    date: new Date().toISOString().split('T')[0], student: '', category: 'general' 
  });

  // جيب المستخدم الحالي من localStorage
const currentUserRaw = localStorage.getItem('currentUser');
let currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null;

// لو مفيش currentUser، جرب نجيب أول مستخدم من edu_users كـ fallback (مؤقت)
if (!currentUser && users.length > 0) {
  currentUser = users[0]; // أول مستخدم (ممكن تغيره لاحقًا)
}

const currentUserId = currentUser?.id?.toString() || currentUser?.user || 'unknown';
const currentUserName = currentUser?.name || currentUser?.user || 'غير معروف';
  useEffect(() => {
    const loadData = () => {
      setTransactions(JSON.parse(localStorage.getItem(FINANCE_KEY) || "[]"));
      setStudents(JSON.parse(localStorage.getItem(STUDENTS_KEY) || "[]"));
      setTeachers(JSON.parse(localStorage.getItem(TEACHERS_KEY) || "[]"));
      setUsers(JSON.parse(localStorage.getItem(USERS_KEY) || "[]"));
    };
    loadData();
  }, []);

  const saveData = (newTransactions: any[], newStudents?: any[]) => {
    setTransactions(newTransactions);
    localStorage.setItem(FINANCE_KEY, JSON.stringify(newTransactions));
    if (newStudents) {
      setStudents(newStudents);
      localStorage.setItem(STUDENTS_KEY, JSON.stringify(newStudents));
    }
  };

  const calculateStudentRequired = (s: any) => {
    if (!s || s.isPackageFree) return 0;
    if (s.subscriptionType === 'per_lesson') {
      return (s.selectedSubjects || []).reduce((total: number, sub: any) => 
        total + ((sub.lessonPrice || 0) * (sub.lessonsCount || 0)), 0);
    }
    if (s.subscriptionType === 'full_package') return (s.packagePrice || 0);
    if (s.subscriptionType === 'discounted_package') {
      const price = s.packagePrice || 0;
      return price - (price * (s.discountPercentage || 0) / 100);
    }
    return 0;
  };

  const calculateTeacherDues = (t: any) => {
    if (t.salaryType === 'fixed') return t.fixedSalary || 0;
    if (t.salaryType === 'per_lesson') return (t.pricePerLesson || 0) * (t.lessonsCount || 0);
    if (t.salaryType === 'percentage') {
      const total = (t.pricePerLesson || 0) * (t.lessonsCount || 0);
      return (total * (t.percentage || 0)) / 100;
    }
    return 0;
  };

  const handleSaveTransaction = () => {
    // التحقق من صلاحية التعديل
    if (editingTransaction) {
      const canEditAny = currentUser?.permissions?.canDeleteAny === true;

      if (!canEditAny) {
        const createdBy = editingTransaction.receiver || editingTransaction.userId || 'unknown';
        if (createdBy !== currentUserId) {
          return toast.error('لا يمكنك تعديل هذه العملية لأنها ليست من إضافتك');
        }
      }
    }

    let updated;
    if (editingTransaction) {
      updated = transactions.map(t => t.id === editingTransaction.id ? { ...form, id: t.id } : t);
      toast.success('تم تعديل العملية');
    } else {
      updated = [...transactions, { 
        ...form, 
        id: Date.now(),
        receiver: currentUserId  // تلقائي: ID المستخدم الحالي
      }];
      toast.success('تم إضافة العملية للخزينة');
    }
    saveData(updated);
    setIsDialogOpen(false);
  };

  const handleDeleteTransaction = (id: number) => {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return toast.error('العملية غير موجودة');

    const canDeleteAny = currentUser?.permissions?.canDeleteAny === true;

    if (!canDeleteAny) {
      const createdBy = transaction.receiver || transaction.userId || 'unknown';
      if (createdBy !== currentUserId) {
        return toast.error('لا يمكنك حذف هذه العملية لأنها ليست من إضافتك');
      }
    }

    const updatedTx = transactions.filter(t => t.id !== id);
    
    let updatedStudents = [...students];
    if (transaction.student) {
      updatedStudents = students.map(s => 
        s.id.toString() === transaction.student 
        ? { ...s, lastUpdateDate: new Date().toISOString().split('T')[0] } 
        : s
      );
      toast.info(`تم حذف العملية وتحديث حساب الطالب`);
    } else {
      toast.success('تم حذف العملية من الخزينة');
    }

    setTransactions(updatedTx);
    localStorage.setItem(FINANCE_KEY, JSON.stringify(updatedTx));
    
    if (transaction.student) {
      setStudents(updatedStudents);
      localStorage.setItem(STUDENTS_KEY, JSON.stringify(updatedStudents));
    }
  };

  const handleSaveStudentFinance = () => {
    if (!studentForm.id) return toast.error('يرجى اختيار طالب أولاً');
    const required = calculateStudentRequired(studentForm);
    const paidAmount = required - (studentForm.manualDebt || 0);

    let updatedTx = [...transactions];
    if (paidAmount > 0) {
      updatedTx.push({
        id: Date.now(), 
        type: 'income', 
        amount: paidAmount,
        description: `سداد اشتراك - طالب: ${studentForm.name}`,
        date: selectedDate, 
        student: studentForm.id, 
        category: 'درس',
        receiver: currentUserId  // تلقائي: ID المستخدم الحالي
      });
    }

    const updatedSt = students.map(s => 
      s.id.toString() === studentForm.id ? { ...s, ...studentForm, lastUpdateDate: selectedDate } : s
    );
    
    saveData(updatedTx, updatedSt);
    setIsStudentSettingsOpen(false);
    toast.success('تم تحصيل المبلغ وتحديث الحساب');
  };

  const handleSaveTeacherPayment = () => {
    if (!teacherFinForm.id) return toast.error('يرجى اختيار مدرس');
    const amount = calculateTeacherDues(teacherFinForm);
    if (amount <= 0) return toast.error('المبلغ المستحق صفر');

    const newTx = {
      id: Date.now(), 
      type: 'expense', 
      amount,
      description: `صرف مستحقات مدرس: ${teacherFinForm.name} (${teacherFinForm.notes || 'بدون ملاحظات'})`,
      date: selectedDate, 
      category: 'رواتب',
      receiver: currentUserId  // تلقائي: ID المستخدم الحالي
    };
    
    saveData([...transactions, newTx]);
    setIsTeacherFinanceOpen(false);
    toast.success(`تم صرف ${amount} ج للمدرس`);
  };

  const handleSubjectToggle = (teacher: any) => {
    const isSelected = studentForm.selectedSubjects.some(sub => sub.teacherId === teacher.id);
    setStudentForm({
      ...studentForm,
      selectedSubjects: isSelected 
        ? studentForm.selectedSubjects.filter(sub => sub.teacherId !== teacher.id)
        : [...studentForm.selectedSubjects, { 
            teacherId: teacher.id, 
            subjectName: teacher.subject, 
            lessonPrice: teacher.lessonPrice || 0, 
            lessonsCount: teacher.lessonsPerMonth || 4 
          }]
    });
  };

  const filteredTransactions = transactions.filter(t => t.date === selectedDate);

  const displayedTransactions = receiverFilter === 'all' 
    ? filteredTransactions 
    : filteredTransactions.filter(t => t.receiver === receiverFilter);

  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  const getReceiverDetails = (type: 'income' | 'expense') => {
    const typeTransactions = filteredTransactions.filter(t => t.type === type);
    const receivers = [...new Set(typeTransactions.map(t => t.receiver).filter(r => r))];
    return receivers.map(receiverId => {
      const receiverTx = typeTransactions.filter(t => t.receiver === receiverId);
      const total = receiverTx.reduce((sum, t) => sum + t.amount, 0);
      const receiverName = users.find(u => u.id.toString() === receiverId)?.name || 'غير معروف';
      return { receiverId, receiverName, total, transactions: receiverTx };
    }).filter(r => r.total > 0);
  };

  const incomeDetails = getReceiverDetails('income');
  const expenseDetails = getReceiverDetails('expense');

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
        <div className="text-right">
          <h1 className="text-2xl font-black text-slate-800">الإدارة المالية المركزية</h1>
          <p className="text-muted-foreground font-bold text-xs uppercase opacity-70">التحصيل، الرواتب، وحركة الخزينة</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-dashed border-slate-300">
            <span className="text-sm font-bold text-slate-700">التاريخ:</span>
            <Input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-44"
            />
          </div>

          <Button variant="outline" className="gap-2 font-black border-orange-600 text-orange-600 hover:bg-orange-50" onClick={() => setIsTeacherFinanceOpen(true)}>
            <Wallet className="w-4 h-4" /> حساب مدرس
          </Button>
          <Button variant="outline" className="gap-2 font-black border-blue-600 text-blue-600 hover:bg-blue-50" onClick={() => setIsStudentSettingsOpen(true)}>
            <Users className="w-4 h-4" /> تحصيل طالب
          </Button>
          <Button className="gap-2 font-black bg-slate-900 shadow-lg" onClick={() => {setEditingTransaction(null); setForm({ type: 'income', amount: 0, description: '', date: selectedDate, student: '', category: 'general' }); setIsDialogOpen(true);}}>
            <Plus className="w-4 h-4" /> حركة خزينة
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard value={totalIncome} label="إجمالي المقبوضات (اليوم)" type="income" icon={<ArrowUpCircle className="w-5 h-5" />} onClick={() => setIsIncomeDetailsOpen(true)} />
        <SummaryCard value={totalExpenses} label="إجمالي المصروفات (اليوم)" type="expense" icon={<ArrowDownCircle className="w-5 h-5" />} onClick={() => setIsExpenseDetailsOpen(true)} />
        <SummaryCard value={totalIncome - totalExpenses} label="صافي الخزينة (اليوم)" type="profit" icon={<Receipt className="w-5 h-5" />} />
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="students" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="students" className="font-bold">حسابات الطلاب</TabsTrigger>
          <TabsTrigger value="teachers" className="font-bold">حسابات المدرسين</TabsTrigger>
          <TabsTrigger value="transactions" className="font-bold">سجل العمليات</TabsTrigger>
        </TabsList>

        <TabsContent value="students">
          <Card className="border-none shadow-sm overflow-hidden">
            <Table className="w-full text-right" dir="rtl">
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="text-right">الطالب</TableHead>
                  <TableHead className="text-right">نظام الاشتراك</TableHead>
                  <TableHead className="text-right">المطلوب</TableHead>
                  <TableHead className="text-right">المدفوع</TableHead>
                  <TableHead className="text-right">المتبقي</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s) => {
                  const paid = transactions.filter(t => t.type === 'income' && t.student === s.id.toString()).reduce((sum, t) => sum + t.amount, 0);
                  const required = calculateStudentRequired(s);
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-bold">{s.name}</TableCell>
                      <TableCell className="text-xs font-bold text-slate-500">{s.subscriptionType === 'per_lesson' ? 'بالحصة' : 'باكدج'}</TableCell>
                      <TableCell className="font-bold text-blue-700">{required} ج</TableCell>
                      <TableCell className="font-bold text-green-600">{paid} ج</TableCell>
                      <TableCell className={`font-black ${required - paid > 0 ? 'text-red-600' : 'text-slate-400'}`}>{required - paid} ج</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="teachers">
          <Card className="border-none shadow-sm overflow-hidden">
            <Table className="w-full text-right" dir="rtl">
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="text-right">المدرس</TableHead>
                  <TableHead className="text-right">المادة</TableHead>
                  <TableHead className="text-right">نظام المحاسبة</TableHead>
                  <TableHead className="text-right">المستحق الحالي</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-bold">{t.name}</TableCell>
                    <TableCell className="text-xs font-bold text-slate-500">{t.subject}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {t.salaryType === 'fixed' ? 'راتب ثابت' : t.salaryType === 'per_lesson' ? 'بالحصة' : 'نسبة مئوية'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-black text-orange-600">{calculateTeacherDues(t)} ج</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <div className="flex justify-end mb-4">
            <select 
              className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-sm font-bold text-blue-600 outline-none"
              value={receiverFilter} 
              onChange={(e) => setReceiverFilter(e.target.value)}
            >
              <option value="all">جميع المستلمين</option>
              {users
                .filter((u: any) => u.permissions?.finance)
                .map((u: any) => (
                  <option key={u.id} value={u.id.toString()}>
                    {u.name}
                  </option>
                ))
              }
            </select>
          </div>

          <Card className="border-none shadow-sm overflow-hidden">
            <Table className="w-full text-right" dir="rtl">
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">المستلم</TableHead>
                  <TableHead className="text-right">البيان</TableHead>
                  <TableHead className="text-right">المبلغ</TableHead>
                  <TableHead className="text-center">إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedTransactions.slice().reverse().map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-xs font-bold">{t.date}</TableCell>
                    <TableCell className="font-medium">{t.receiver ? users.find((u: any) => u.id.toString() === t.receiver)?.name || '-' : '-'}</TableCell>
                    <TableCell className="font-medium">{t.description}</TableCell>
                    <TableCell className={`font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{t.amount} ج</TableCell>
                    <TableCell className="flex justify-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => { setEditingTransaction(t); setForm(t); setIsDialogOpen(true); }}>
                        <Edit className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteTransaction(t.id)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: تحصيل اشتراك طالب */}
      <Dialog open={isStudentSettingsOpen} onOpenChange={setIsStudentSettingsOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto text-right p-4" dir="rtl">
          <DialogHeader className="border-b pb-3 mb-4">
            <DialogTitle className="font-black flex items-center gap-2 text-blue-600">
              <UserCheck /> تحصيل رسوم الطالب
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-3 space-y-3 bg-slate-50 p-4 rounded-xl border">
              <Label className="font-bold text-xs">1. ابحث عن الطالب</Label>
              <Input placeholder="بحث..." className="h-9 text-xs" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <div className="h-[300px] overflow-y-auto border rounded-lg bg-white p-1">
                {students.filter(s => s.name.includes(searchTerm)).map(s => (
                  <div key={s.id} onClick={() => setStudentForm({ ...studentForm, ...s, id: s.id.toString(), manualDebt: 0 })}
                    className={`p-2 cursor-pointer rounded-md text-xs font-bold mb-1 transition-colors ${studentForm.id === s.id.toString() ? 'bg-blue-600 text-white' : 'hover:bg-blue-50 text-slate-600'}`}>
                    {s.name}
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-9 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl border shadow-sm items-end">
                <div className="space-y-1">
                  <Label className="font-bold text-xs">نظام المحاسبة</Label>
                  <Select value={studentForm.subscriptionType} onValueChange={(v) => setStudentForm({...studentForm, subscriptionType: v})}>
                    <SelectTrigger className="h-10 text-xs font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per_lesson">تلقائي (بالحصة)</SelectItem>
                      <SelectItem value="full_package">مبلغ ثابت (باكدج)</SelectItem>
                      <SelectItem value="discounted_package">باكدج مع خصم</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="font-bold text-xs text-red-600">المتبقي (دين سابق)</Label>
                  <Input type="number" value={studentForm.manualDebt} onChange={(e) => setStudentForm({...studentForm, manualDebt: Number(e.target.value)})} className="h-10 font-black text-red-600" />
                </div>
                <div className="space-y-1">
                  <Label className="font-bold text-xs">ملاحظات التحصيل</Label>
                  <Input value={studentForm.notes} onChange={(e) => setStudentForm({...studentForm, notes: e.target.value})} className="h-10 text-xs" />
                </div>
                {/* خانة المستلم بالاسم وتلقائية */}
                <div className="space-y-1">
                  <Label className="font-bold text-xs">المستلم</Label>
                  <div className="h-10 px-3 flex items-center bg-slate-100 rounded-lg border text-xs font-bold text-slate-700">
                    {currentUserName}
                  </div>
                </div>
              </div>

              {studentForm.subscriptionType !== 'per_lesson' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-orange-50/40 p-4 rounded-xl border border-orange-100 animate-in fade-in zoom-in-95 duration-200">
                  <div className="space-y-1">
                    <Label className="font-bold text-xs text-orange-700">سعر الباكدج بالكامل</Label>
                    <Input type="number" value={studentForm.packagePrice} onChange={(e) => setStudentForm({...studentForm, packagePrice: Number(e.target.value)})} className="h-10 bg-white" />
                  </div>
                  {studentForm.subscriptionType === 'discounted_package' && (
                    <div className="space-y-1">
                      <Label className="font-bold text-xs text-orange-700">نسبة الخصم (%)</Label>
                      <Input type="number" value={studentForm.discountPercentage} onChange={(e) => setStudentForm({...studentForm, discountPercentage: Number(e.target.value)})} className="h-10 bg-white" />
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                  <Label className="font-black text-sm text-blue-800">تفاصيل الحصص للمواد المختارة</Label>
                  <div className="flex items-center gap-2 bg-purple-50 p-1 px-3 rounded-full border border-purple-100">
                    <Label className="font-black text-purple-700 text-[10px]">إعفاء مجاني</Label>
                    <Switch checked={studentForm.isPackageFree} onCheckedChange={(v) => setStudentForm({...studentForm, isPackageFree: v})} className="scale-75" />
                  </div>
                </div>
                
                <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="w-10"></TableHead>
                        <TableHead className="text-right">المادة</TableHead>
                        <TableHead className="text-center">السعر</TableHead>
                        <TableHead className="text-center">العدد</TableHead>
                        <TableHead className="text-left px-6">إجمالي</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teachers.map((teacher) => {
                        const subData = studentForm.selectedSubjects.find(sub => sub.teacherId === teacher.id);
                        const isSelected = !!subData;
                        return (
                          <TableRow key={teacher.id} className={isSelected ? "bg-blue-50/20" : "opacity-50"}>
                            <TableCell className="p-2"><Checkbox checked={isSelected} onCheckedChange={() => handleSubjectToggle(teacher)} /></TableCell>
                            <TableCell className="p-2 font-bold text-xs">{teacher.subject}</TableCell>
                            <TableCell className="p-2">
                              <Input 
                                type="number" 
                                disabled={!isSelected} 
                                value={isSelected ? subData.lessonPrice : ""} 
                                onChange={(e) => {
                                  const updated = studentForm.selectedSubjects.map(s => 
                                    s.teacherId === teacher.id ? {...s, lessonPrice: Number(e.target.value)} : s
                                  );
                                  setStudentForm({...studentForm, selectedSubjects: updated});
                                }} 
                                className="h-8 text-center text-xs font-black w-20 mx-auto" 
                              />
                            </TableCell>
                            <TableCell className="p-2">
                              <Input 
                                type="number" 
                                disabled={!isSelected} 
                                value={isSelected ? subData.lessonsCount : ""} 
                                onChange={(e) => {
                                  const updated = studentForm.selectedSubjects.map(s => 
                                    s.teacherId === teacher.id ? {...s, lessonsCount: Number(e.target.value)} : s
                                  );
                                  setStudentForm({...studentForm, selectedSubjects: updated});
                                }} 
                                className="h-8 text-center text-xs font-black w-16 mx-auto" 
                              />
                            </TableCell>
                            <TableCell className="p-2 text-left px-6 font-black text-blue-700">
                              {isSelected ? (subData.lessonPrice * subData.lessonsCount) : 0} ج
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex gap-4 items-stretch h-16 pt-2">
                  <div className="flex-1 bg-slate-900 text-white p-3 px-6 rounded-xl flex items-center justify-between shadow-xl">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400">الصافي للتحصيل:</p>
                      <p className="text-2xl font-black text-green-400">
                        {calculateStudentRequired(studentForm) - (studentForm.manualDebt || 0)} ج.م
                      </p>
                    </div>
                    <Calculator className="w-8 h-8 opacity-20" />
                  </div>
                  <Button 
                    className="flex-[0.6] bg-blue-600 hover:bg-blue-700 font-black rounded-xl text-lg shadow-xl" 
                    onClick={handleSaveStudentFinance}
                  >
                    حفظ الدفع
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: حساب المدرس */}
      <Dialog open={isTeacherFinanceOpen} onOpenChange={setIsTeacherFinanceOpen}>
        <DialogContent className="max-w-4xl text-right" dir="rtl">
          <DialogHeader className="border-b pb-3 mb-4">
            <DialogTitle className="font-black flex items-center gap-2 text-orange-600">
              <Wallet /> تسوية وصرف مستحقات المدرس
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-4 bg-slate-50 p-4 rounded-xl border">
              <Label className="font-bold text-xs mb-2 block">اختر المدرس</Label>
              <div className="h-[300px] overflow-y-auto space-y-1">
                {teachers.map(t => (
                  <div 
                    key={t.id} 
                    onClick={() => setTeacherFinForm({ ...teacherFinForm, ...t, id: t.id.toString() })}
                    className={`p-3 rounded-lg text-xs font-black cursor-pointer transition-all ${teacherFinForm.id === t.id.toString() ? 'bg-orange-600 text-white shadow-md' : 'bg-white border hover:bg-orange-50'}`}
                  >
                    {t.name}
                  </div>
                ))}
              </div>
            </div>
            <div className="md:col-span-8 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                <div className="space-y-1">
                  <Label className="text-xs font-bold">نظام الدفع للمدرس</Label>
                  <Select value={teacherFinForm.salaryType} onValueChange={(v) => setTeacherFinForm({...teacherFinForm, salaryType: v})}>
                    <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">راتب ثابت</SelectItem>
                      <SelectItem value="per_lesson">بالحصة</SelectItem>
                      <SelectItem value="percentage">نسبة مئوية من الإجمالي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* خانة المستلم بالاسم وتلقائية */}
                <div className="space-y-1">
                  <Label className="text-xs font-bold">المستلم</Label>
                  <div className="h-10 px-3 flex items-center bg-slate-100 rounded-lg border text-xs font-bold text-slate-700">
                    {currentUserName}
                  </div>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs font-bold">ملاحظات الصرف</Label>
                  <Input value={teacherFinForm.notes} onChange={(e) => setTeacherFinForm({...teacherFinForm, notes: e.target.value})} className="bg-white" placeholder="مثال: شهر يناير.." />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {teacherFinForm.salaryType === 'fixed' && (
                  <div className="col-span-3 space-y-1">
                    <Label className="text-xs font-bold">الراتب الثابت المتفق عليه</Label>
                    <Input type="number" value={teacherFinForm.fixedSalary} onChange={(e) => setTeacherFinForm({...teacherFinForm, fixedSalary: Number(e.target.value)})} />
                  </div>
                )}
                {teacherFinForm.salaryType !== 'fixed' && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-orange-700">سعر الحصة</Label>
                      <Input type="number" value={teacherFinForm.pricePerLesson} onChange={(e) => setTeacherFinForm({...teacherFinForm, pricePerLesson: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-orange-700">عدد الحصص</Label>
                      <Input type="number" value={teacherFinForm.lessonsCount} onChange={(e) => setTeacherFinForm({...teacherFinForm, lessonsCount: Number(e.target.value)})} />
                    </div>
                    {teacherFinForm.salaryType === 'percentage' && (
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-orange-700">النسبة (%)</Label>
                        <Input type="number" value={teacherFinForm.percentage} onChange={(e) => setTeacherFinForm({...teacherFinForm, percentage: Number(e.target.value)})} />
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="bg-slate-900 p-6 rounded-2xl flex items-center justify-between text-white shadow-2xl">
                <div>
                  <p className="text-xs font-bold text-slate-400">إجمالي المستحق للمدرس الآن:</p>
                  <p className="text-4xl font-black text-orange-400">
                    {calculateTeacherDues(teacherFinForm)} <span className="text-lg">ج.م</span>
                  </p>
                </div>
                <Button 
                  className="bg-orange-600 hover:bg-orange-700 font-black px-10 h-14 rounded-xl text-lg shadow-lg" 
                  onClick={handleSaveTeacherPayment}
                >
                  تأكيد صرف المستحقات
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: إضافة حركة خزينة عامة */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="text-right" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-black">تسجيل حركة مالية</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-bold">النوع</Label>
                <Select value={form.type} onValueChange={(v) => setForm({...form, type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">إيراد (+)</SelectItem>
                    <SelectItem value="expense">مصروف (-)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-bold">المبلغ</Label>
                <Input type="number" value={form.amount} onChange={(e) => setForm({...form, amount: Number(e.target.value)})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-bold">البيان / الوصف</Label>
              <Input value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="font-bold">التاريخ</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} />
            </div>
            {/* خانة المستلم بالاسم وتلقائية */}
            <div className="space-y-2">
              <Label className="font-bold">المستلم</Label>
              <div className="h-10 px-3 flex items-center bg-slate-100 rounded-lg border text-xs font-bold text-slate-700">
                {currentUserName}
              </div>
            </div>
            <Button 
              className="w-full bg-slate-900 font-black h-12 rounded-xl shadow-lg" 
              onClick={handleSaveTransaction}
            >
              حفظ في الخزينة
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: تفاصيل المقبوضات */}
      <Dialog open={isIncomeDetailsOpen} onOpenChange={setIsIncomeDetailsOpen}>
        <DialogContent className="max-w-4xl text-right" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-black">تفاصيل المقبوضات اليوم</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              {incomeDetails.map((detail, index) => (
                <AccordionItem key={detail.receiverId} value={`item-${index}`}>
                  <AccordionTrigger className="font-bold">
                    {detail.receiverName} - إجمالي: {detail.total} ج
                  </AccordionTrigger>
                  <AccordionContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">البيان</TableHead>
                          <TableHead className="text-right">المبلغ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detail.transactions.map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell>{tx.description}</TableCell>
                            <TableCell className="text-green-600">{tx.amount} ج</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: تفاصيل المصروفات */}
      <Dialog open={isExpenseDetailsOpen} onOpenChange={setIsExpenseDetailsOpen}>
        <DialogContent className="max-w-4xl text-right" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-black">تفاصيل المصروفات اليوم</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              {expenseDetails.map((detail, index) => (
                <AccordionItem key={detail.receiverId} value={`item-${index}`}>
                  <AccordionTrigger className="font-bold">
                    {detail.receiverName} - إجمالي: {detail.total} ج
                  </AccordionTrigger>
                  <AccordionContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">البيان</TableHead>
                          <TableHead className="text-right">المبلغ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detail.transactions.map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell>{tx.description}</TableCell>
                            <TableCell className="text-red-600">{tx.amount} ج</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({ value, label, type, icon, onClick }: { value: number, label: string, type: 'income' | 'expense' | 'profit', icon: any, onClick?: () => void }) {
  const colors = { 
    income: 'bg-green-50 text-green-700 border-green-100', 
    expense: 'bg-red-50 text-red-700 border-red-100', 
    profit: 'bg-blue-50 text-blue-700 border-blue-100' 
  };
  return (
    <Card className={`${colors[type]} border shadow-sm rounded-2xl overflow-hidden cursor-pointer`} onClick={onClick}>
      <CardContent className="p-5 flex items-center justify-between">
        <div className="text-right">
          <div className="text-2xl font-black">{value} ج</div>
          <div className="text-xs font-bold opacity-70 mt-1">{label}</div>
        </div>
        <div className="opacity-20">{icon}</div>
      </CardContent>
    </Card>
  );
}