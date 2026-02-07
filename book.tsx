import { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, Edit, Trash2, ShoppingCart, RefreshCw, Archive, Calendar as CalendarIcon, FileText, DollarSign } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle 
} from "@/components/ui/alert-dialog";

const BOOKS_KEY = "books-data";
const TEACHERS_KEY = "teachers-data";
const STUDENTS_KEY = "students-data";
const GROUPS_KEY = "groups-data";
const BOOKS_SALES_KEY = "books-sales-data"; // سجل مبيعات مستقل

export default function Books() {
  const [books, setBooks] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]); // حالة سجل المبيعات
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // تاريخ اليوم للفلترة
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBookId, setEditingBookId] = useState<number | null>(null);
  const [isSellDialogOpen, setIsSellDialogOpen] = useState(false);
  
  const [sellData, setSellData] = useState({ 
    bookId: '', 
    quantity: 1, 
    buyerId: '', 
    buyerType: 'student',
    stage: '',
    grade: '',
    group: ''
  });

  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const emptyForm = { 
    name: "", 
    type: "book", 
    price: 0, 
    cost: 0, 
    quantity: 0, 
    source: "center", 
    teacherId: "", 
    teacherShare: 0, 
    description: "" 
  };
  const [form, setForm] = useState(emptyForm);

  const loadData = () => {
    const b = JSON.parse(localStorage.getItem(BOOKS_KEY) || "[]").filter((book: any) => !book.isArchived);
    const s = JSON.parse(localStorage.getItem(BOOKS_SALES_KEY) || "[]");
    setBooks(b);
    setSales(s);
    setTeachers(JSON.parse(localStorage.getItem(TEACHERS_KEY) || "[]"));
    setStudents(JSON.parse(localStorage.getItem(STUDENTS_KEY) || "[]"));
    setGroups(JSON.parse(localStorage.getItem(GROUPS_KEY) || "[]"));
  };

  useEffect(() => {
    loadData();
    const handleStorageChange = () => loadData();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // تحديث المخزون في التخزين المحلي عند التغيير
  useEffect(() => {
    if(books.length > 0) {
        localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
    }
  }, [books]);

  const handleSave = () => {
    if (!form.name || form.price <= 0 || form.quantity < 0) return toast.error('يرجى التأكد من الاسم والسعر والكمية');
    if (form.source === 'teacher' && (!form.teacherId || form.teacherShare <= 0)) return toast.error('يرجى تحديد المدرس ونسبته');

    if (editingBookId) {
      const updated = books.map(b => b.id === editingBookId ? { ...b, ...form } : b);
      setBooks(updated);
      localStorage.setItem(BOOKS_KEY, JSON.stringify(updated));
      toast.success('تم التحديث بنجاح');
    } else {
      const newList = [...books, { ...form, id: Date.now(), createdAt: new Date().toISOString() }];
      setBooks(newList);
      localStorage.setItem(BOOKS_KEY, JSON.stringify(newList));
      toast.success('تمت الإضافة بنجاح');
    }
    setIsDialogOpen(false);
    setForm(emptyForm);
  };

  const handleDelete = (book: any) => {
    setBooks(books.filter(b => b.id !== book.id));
    toast.error('تم الحذف');
  };

  const handleSell = () => {
    const book = books.find(b => b.id.toString() === sellData.bookId);
    if (!book || sellData.quantity > book.quantity) return toast.error('الكمية المتاحة لا تكفي');

    const profitPerUnit = book.price - book.cost;
    const totalProfit = profitPerUnit * sellData.quantity;
    const teacherIncome = book.source === 'teacher' ? totalProfit * (book.teacherShare / 100) : 0;
    const centerIncome = (book.price * sellData.quantity) - teacherIncome;

    // 1. تحديث المخزون
    const updatedBooks = books.map(b => b.id === book.id ? { ...b, quantity: b.quantity - sellData.quantity } : b);
    setBooks(updatedBooks);
    localStorage.setItem(BOOKS_KEY, JSON.stringify(updatedBooks));

    // 2. تسجيل العملية في سجل مبيعات المذكرات المستقل
    const newSale = {
      id: Date.now(),
      bookName: book.name,
      quantity: sellData.quantity,
      totalPrice: book.price * sellData.quantity,
      buyerName: sellData.buyerType === 'student' 
        ? (students.find(s => s.id.toString() === sellData.buyerId)?.name || 'طالب غير معروف') 
        : 'مشتري خارجي',
      date: new Date().toISOString().split('T')[0],
      centerShare: centerIncome,
      teacherShare: teacherIncome
    };

    const updatedSales = [newSale, ...sales];
    setSales(updatedSales);
    localStorage.setItem(BOOKS_SALES_KEY, JSON.stringify(updatedSales));

    toast.success('تمت عملية البيع وتسجيلها بالسجل المالي للمذكرات');
    setIsSellDialogOpen(false);
    setSellData({ ...sellData, bookId: '', buyerId: '' });
  };

  // إحصائيات
  const totalInventory = books.reduce((sum, b) => sum + b.quantity, 0);
  const totalValue = books.reduce((sum, b) => sum + (b.price * b.quantity), 0);
  
  // فلترة المبيعات حسب التاريخ المختار
  const filteredSales = sales.filter(s => s.date === selectedDate);
  const dailyTotal = filteredSales.reduce((sum, s) => sum + s.totalPrice, 0);

  return (
    <div className="p-6 space-y-6 font-cairo" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-3xl shadow-sm border border-slate-100 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <BookOpen className="text-primary" /> إدارة الكتب والمذكرات
          </h1>
          <p className="text-muted-foreground font-bold text-sm">نظام مستقل للمخزون وحسابات المبيعات اليومية</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={loadData} className="gap-2 font-bold border-slate-200 text-slate-600">
            <RefreshCw className="w-4 h-4" /> تحديث
          </Button>
          <Button variant="outline" onClick={() => setIsSellDialogOpen(true)} className="gap-2 font-bold border-green-500 text-green-600 hover:bg-green-50">
            <ShoppingCart className="w-4 h-4" /> بيع مذكرات
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 font-black shadow-lg shadow-primary/20" onClick={() => {setForm(emptyForm); setEditingBookId(null)}}>
                <Plus className="w-4 h-4" /> إضافة صنف
              </Button>
            </DialogTrigger>
            <DialogContent className="text-right max-w-md rounded-3xl">
              <DialogHeader><DialogTitle className="font-black text-right">بيانات الصنف بالمخزن</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <Label className="font-bold">اسم الكتاب أو المذكرة</Label>
                  <Input placeholder="مثال: مذكرة الفيزياء - تالتة ثانوي" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="font-bold text-right rounded-xl border-slate-200"/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-right">
                    <Label className="font-bold">سعر البيع</Label>
                    <Input type="number" value={form.price || ''} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="font-bold text-center rounded-xl"/>
                  </div>
                  <div className="space-y-1.5 text-right">
                    <Label className="font-bold">تكلفة الصنف</Label>
                    <Input type="number" value={form.cost || ''} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} className="font-bold text-center rounded-xl"/>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-right">
                    <Label className="font-bold">الكمية بالمخزن</Label>
                    <Input type="number" value={form.quantity || ''} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} className="font-bold text-center rounded-xl"/>
                  </div>
                  <div className="space-y-1.5 text-right">
                    <Label className="font-bold">النوع</Label>
                    <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                      <SelectTrigger className="font-bold text-right rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent className="font-bold text-right">
                        <SelectItem value="book">كتاب خارجي</SelectItem>
                        <SelectItem value="notebook">مذكرة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5 text-right">
                  <Label className="font-bold">جهة التوريد</Label>
                  <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                    <SelectTrigger className="font-bold text-right rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent className="font-bold text-right">
                      <SelectItem value="center">السنتر (ربح كامل)</SelectItem>
                      <SelectItem value="teacher">مدرس (يوجد عمولة)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.source === 'teacher' && (
                  <div className="grid grid-cols-2 gap-4 p-3 bg-blue-50 rounded-2xl border border-blue-100">
                    <div className="space-y-1.5 text-right">
                      <Label className="font-bold text-xs">المدرس</Label>
                      <Select value={form.teacherId} onValueChange={(v) => setForm({ ...form, teacherId: v })}>
                        <SelectTrigger className="font-bold h-9 text-xs rounded-lg"><SelectValue placeholder="اختر المدرس" /></SelectTrigger>
                        <SelectContent className="font-bold text-right">
                          {teachers.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5 text-right">
                      <Label className="font-bold text-xs">نسبته %</Label>
                      <Input type="number" value={form.teacherShare || ''} onChange={(e) => setForm({ ...form, teacherShare: Number(e.target.value) })} className="h-9 font-bold text-center rounded-lg"/>
                    </div>
                  </div>
                )}
                <Button onClick={handleSave} className="w-full font-black text-lg py-6 rounded-2xl">حفظ البيانات</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* كروت الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none rounded-3xl shadow-lg shadow-blue-200">
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="font-bold text-blue-100 opacity-80 text-sm">إجمالي المخزون الحالي</p>
              <h3 className="text-3xl font-black">{totalInventory} نسخة</h3>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center"><BookOpen /></div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 text-white border-none rounded-3xl shadow-lg shadow-slate-200">
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="font-bold text-slate-300 opacity-80 text-sm">القيمة السوقية للمخزن</p>
              <h3 className="text-3xl font-black">{totalValue.toLocaleString()} ج.م</h3>
            </div>
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center"><DollarSign /></div>
          </CardContent>
        </Card>
      </div>

      {/* جدول الكتب الحالي */}
      <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-white border-b p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input className="pr-10 bg-slate-50 border-none rounded-xl font-bold" placeholder="ابحث عن كتاب أو مذكرة بالمخزن..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="text-right font-black">الصنف</TableHead>
                <TableHead className="text-center font-black">السعر</TableHead>
                <TableHead className="text-center font-black">المتوفر</TableHead>
                <TableHead className="text-center font-black">المصدر</TableHead>
                <TableHead className="text-left font-black">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {books.filter(b => b.name.includes(searchQuery)).map((book) => (
                <TableRow key={book.id}>
                  <TableCell className="font-black text-slate-700">{book.name}</TableCell>
                  <TableCell className="text-center font-bold text-green-600">{book.price} ج</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={book.quantity < 5 ? "destructive" : "secondary"} className="rounded-lg font-black">{book.quantity} ق</Badge>
                  </TableCell>
                  <TableCell className="text-center text-xs font-bold text-slate-500">
                    {book.source === 'teacher' ? 'مدرس' : 'إدارة'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setForm(book); setEditingBookId(book.id); setIsDialogOpen(true); }} className="h-8 w-8 text-blue-500 hover:bg-blue-50"><Edit size={16} /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(book)} className="h-8 w-8 text-red-400 hover:text-red-500"><Trash2 size={16} /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* سجل المبيعات اليومي (القسم الجديد والمستقل) */}
      <Card className="rounded-3xl border-none shadow-xl overflow-hidden bg-white border border-slate-100">
        <CardHeader className="bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between p-6 gap-4">
          <div>
            <CardTitle className="font-black text-xl flex items-center gap-2">
              <FileText className="text-primary w-5 h-5" /> سجل المبيعات والعمليات المالية
            </CardTitle>
            <p className="text-slate-400 text-xs font-bold mt-1 text-right">يتم تصفير العرض يومياً بناءً على التاريخ المختار</p>
          </div>
          <div className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/10">
            <div className="text-right">
              <Label className="text-[10px] text-primary font-black block mb-1">فلترة بالتاريخ</Label>
              <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-white text-black h-9 text-xs font-black rounded-xl border-none w-36" />
            </div>
            <div className="border-r border-white/20 h-10 mx-2"></div>
            <div className="text-center min-w-[100px]">
              <p className="text-[10px] font-black text-green-400 mb-1">إجمالي اليوم</p>
              <p className="text-xl font-black">{dailyTotal.toLocaleString()} ج</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="text-right font-black">البيان</TableHead>
                <TableHead className="text-right font-black">المشتري</TableHead>
                <TableHead className="text-center font-black">الكمية</TableHead>
                <TableHead className="text-center font-black">المبلغ</TableHead>
                <TableHead className="text-center font-black text-blue-600">صافي السنتر</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.length > 0 ? (
                filteredSales.map((sale) => (
                  <TableRow key={sale.id} className="font-bold border-b border-slate-50">
                    <TableCell className="text-slate-700">{sale.bookName}</TableCell>
                    <TableCell className="text-slate-500 text-xs">{sale.buyerName}</TableCell>
                    <TableCell className="text-center">{sale.quantity}</TableCell>
                    <TableCell className="text-center text-green-600">{sale.totalPrice} ج</TableCell>
                    <TableCell className="text-center bg-blue-50/30 text-blue-700">{sale.centerShare.toFixed(1)} ج</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-16">
                    <div className="flex flex-col items-center opacity-20">
                      <CalendarIcon size={48} />
                      <p className="font-black mt-2">لا توجد عمليات بيع مسجلة لهذا اليوم</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* نافذة البيع السريع */}
      <Dialog open={isSellDialogOpen} onOpenChange={setIsSellDialogOpen}>
        <DialogContent className="text-right max-w-lg rounded-3xl">
          <DialogHeader><DialogTitle className="font-black text-right">إتمام عملية بيع</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-1.5 text-right">
              <Label className="font-bold">اختر المذكرة / الكتاب</Label>
              <Select value={sellData.bookId} onValueChange={(v) => setSellData({ ...sellData, bookId: v })}>
                <SelectTrigger className="font-bold text-right rounded-xl h-12"><SelectValue placeholder="ابحث عن الصنف..." /></SelectTrigger>
                <SelectContent className="font-bold text-right">
                  {books.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name} (المتاح: {b.quantity})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 text-right">
                <Label className="font-bold">الكمية المباعة</Label>
                <Input type="number" min="1" value={sellData.quantity} onChange={(e) => setSellData({ ...sellData, quantity: Number(e.target.value) })} className="font-bold text-center rounded-xl h-12"/>
              </div>
              <div className="space-y-1.5 text-right">
                <Label className="font-bold">نوع المشتري</Label>
                <Select value={sellData.buyerType} onValueChange={(v) => setSellData({ ...sellData, buyerType: v, buyerId: '', stage: '', grade: '', group: '' })}>
                  <SelectTrigger className="font-bold text-right rounded-xl h-12"><SelectValue /></SelectTrigger>
                  <SelectContent className="font-bold text-right text-xs">
                    <SelectItem value="student">طالب من السنتر</SelectItem>
                    <SelectItem value="general">مشتري خارجي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {sellData.buyerType === 'student' && (
              <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <div className="grid grid-cols-3 gap-2 text-right">
                  <div className="space-y-1"><Label className="text-[10px] font-black">المرحلة</Label>
                    <Select onValueChange={(v) => setSellData({ ...sellData, stage: v, grade: '', group: '' })}>
                      <SelectTrigger className="h-8 text-xs font-black"><SelectValue placeholder="اختر" /></SelectTrigger>
                      <SelectContent><SelectItem value="primary">ابتدائي</SelectItem><SelectItem value="middle">إعدادي</SelectItem><SelectItem value="high">ثانوي</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label className="text-[10px] font-black">الصف</Label>
                    <Select disabled={!sellData.stage} onValueChange={(v) => setSellData({ ...sellData, grade: v, group: '' })}>
                      <SelectTrigger className="h-8 text-xs font-black"><SelectValue placeholder="اختر" /></SelectTrigger>
                      <SelectContent>
                        {sellData.stage === 'primary' ? [1,2,3,4,5,6].map(g => <SelectItem key={g} value={g.toString()}>{g}</SelectItem>) : [1,2,3].map(g => <SelectItem key={g} value={g.toString()}>{g}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label className="text-[10px] font-black">المجموعة</Label>
                    <Select disabled={!sellData.grade} onValueChange={(v) => setSellData({ ...sellData, group: v })}>
                      <SelectTrigger className="h-8 text-xs font-black"><SelectValue placeholder="اختر" /></SelectTrigger>
                      <SelectContent>
                        {groups.filter(g => g.stage === sellData.stage && g.grade.toString() === sellData.grade).map(g => <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5 text-right">
                  <Label className="font-black text-sm">اسم الطالب</Label>
                  <Select value={sellData.buyerId} onValueChange={(v) => setSellData({ ...sellData, buyerId: v })}>
                    <SelectTrigger className="font-bold text-right rounded-xl h-11"><SelectValue placeholder="ابحث عن الاسم..." /></SelectTrigger>
                    <SelectContent className="font-bold text-right max-h-[200px]">
                      {students.filter(s => s.stage === sellData.stage && s.grade.toString() === sellData.grade && s.enrolledGroups.includes(sellData.group)).map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <Button onClick={handleSell} className="w-full font-black text-xl py-7 rounded-2xl bg-green-600 hover:bg-green-700 shadow-lg shadow-green-100">تأكيد عملية البيع</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}