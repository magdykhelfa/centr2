import { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, Edit, Trash2, ShoppingCart, RefreshCw, Archive, Calendar as CalendarIcon, FileText, DollarSign, Box } from 'lucide-react';
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
const BOOKS_SALES_KEY = "books-sales-data";

export default function Books() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'sales'>('inventory'); // الحالة الجديدة للتبديل
  const [books, setBooks] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]); 
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); 
  
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

    const updatedBooks = books.map(b => b.id === book.id ? { ...b, quantity: b.quantity - sellData.quantity } : b);
    setBooks(updatedBooks);
    localStorage.setItem(BOOKS_KEY, JSON.stringify(updatedBooks));

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

  const totalInventory = books.reduce((sum, b) => sum + b.quantity, 0);
  const totalValue = books.reduce((sum, b) => sum + (b.price * b.quantity), 0);
  
  const filteredSales = sales.filter(s => s.date === selectedDate);
  const dailyTotal = filteredSales.reduce((sum, s) => sum + s.totalPrice, 0);

  return (
    <div className="p-3 space-y-4 font-cairo bg-slate-50 min-h-screen" dir="rtl">
      {/* رأس الصفحة المصغر */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100 gap-3">
        <div>
          <h1 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <BookOpen className="text-primary w-5 h-5" /> إدارة الكتب والمذكرات
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsSellDialogOpen(true)} className="h-8 text-[11px] font-bold border-green-500 text-green-600">
            <ShoppingCart className="w-3.5 h-3.5 ml-1" /> بيع مذكرات
          </Button>
          <Button size="sm" className="h-8 text-[11px] font-black shadow-md" onClick={() => {setForm(emptyForm); setEditingBookId(null); setIsDialogOpen(true)}}>
            <Plus className="w-3.5 h-3.5 ml-1" /> إضافة صنف
          </Button>
        </div>
      </div>

      {/* أزرار التبديل (Tabs) */}
      <div className="flex gap-2 bg-slate-200/50 p-1 rounded-xl w-fit border border-slate-200">
        <button 
          onClick={() => setActiveTab('inventory')}
          className={`px-6 py-1.5 rounded-lg text-xs font-black transition-all ${activeTab === 'inventory' ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}`}
        >
          <Box className="w-3.5 h-3.5 inline-block ml-1" /> سجل المخزن
        </button>
        <button 
          onClick={() => setActiveTab('sales')}
          className={`px-6 py-1.5 rounded-lg text-xs font-black transition-all ${activeTab === 'sales' ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}`}
        >
          <DollarSign className="w-3.5 h-3.5 inline-block ml-1" /> سجل المبيعات
        </button>
      </div>

      {/* المحتوى المتغير */}
      <div className="animate-in fade-in duration-300">
        {activeTab === 'inventory' ? (
          <div className="space-y-4">
            {/* إحصائيات مصغرة */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-sm">
                    <p className="text-[10px] font-bold opacity-80">المخزون</p>
                    <p className="text-lg font-black">{totalInventory} نسخة</p>
                </div>
                <div className="bg-slate-800 p-3 rounded-2xl text-white shadow-sm">
                    <p className="text-[10px] font-bold opacity-80">القيمة</p>
                    <p className="text-lg font-black">{totalValue.toLocaleString()} ج</p>
                </div>
            </div>

            <Card className="rounded-2xl border-none shadow-sm overflow-hidden bg-white">
              <div className="p-2 border-b">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <Input className="h-8 pr-9 text-xs bg-slate-50 border-none font-bold" placeholder="بحث في المخزن..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
              </div>
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="text-right text-[11px] font-black h-9">الصنف</TableHead>
                    <TableHead className="text-center text-[11px] font-black h-9">السعر</TableHead>
                    <TableHead className="text-center text-[11px] font-black h-9">المتوفر</TableHead>
                    <TableHead className="text-left text-[11px] font-black h-9 pl-4">إجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {books.filter(b => b.name.includes(searchQuery)).map((book) => (
                    <TableRow key={book.id} className="h-10">
                      <TableCell className="text-[12px] font-bold py-2">{book.name}</TableCell>
                      <TableCell className="text-center text-[11px] font-black text-green-600">{book.price} ج</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={book.quantity < 5 ? "destructive" : "secondary"} className="text-[9px] px-1.5 py-0 font-black">{book.quantity}</Badge>
                      </TableCell>
                      <TableCell className="pl-4">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => { setForm(book); setEditingBookId(book.id); setIsDialogOpen(true); }} className="p-1 text-blue-500 hover:bg-blue-50 rounded"><Edit size={14} /></button>
                          <button onClick={() => handleDelete(book)} className="p-1 text-red-400 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        ) : (
          <Card className="rounded-2xl border-none shadow-sm overflow-hidden bg-white border border-slate-100">
            <CardHeader className="bg-slate-900 text-white p-4">
              <div className="flex justify-between items-center gap-4">
                <div className="flex flex-col gap-1">
                  <Label className="text-[10px] font-black opacity-60">فلترة التاريخ</Label>
                  <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-white/10 text-white h-7 text-[10px] border-none font-black w-32" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black text-green-400 opacity-80">إجمالي اليوم</p>
                  <p className="text-lg font-black">{dailyTotal.toLocaleString()} ج</p>
                </div>
              </div>
            </CardHeader>
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="text-right text-[11px] font-black h-9">البيان</TableHead>
                  <TableHead className="text-center text-[11px] font-black h-9">الكمية</TableHead>
                  <TableHead className="text-center text-[11px] font-black h-9">المبلغ</TableHead>
                  <TableHead className="text-left text-[11px] font-black h-9 pl-4 text-blue-600">الصافي</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.length > 0 ? (
                  filteredSales.map((sale) => (
                    <TableRow key={sale.id} className="h-10">
                      <TableCell className="py-2">
                        <p className="text-[11px] font-bold leading-none">{sale.bookName}</p>
                        <p className="text-[9px] text-slate-400 mt-1">{sale.buyerName}</p>
                      </TableCell>
                      <TableCell className="text-center text-[11px] font-bold">{sale.quantity}</TableCell>
                      <TableCell className="text-center text-[11px] font-black">{sale.totalPrice} ج</TableCell>
                      <TableCell className="text-left pl-4 text-[11px] font-black text-blue-700">{sale.centerShare.toFixed(1)} ج</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={4} className="text-center py-10 text-[11px] font-bold text-slate-400">لا مبيعات اليوم</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* باقي الـ Dialogs (إضافة وبيع) كما هي بدون أي تغيير في المحتوى */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="text-right max-w-sm rounded-2xl p-5">
          <DialogHeader><DialogTitle className="font-black text-right text-sm">بيانات الصنف بالمخزن</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-3">
            <div className="space-y-1"><Label className="font-bold text-xs">الاسم</Label><Input placeholder="اسم الكتاب" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9 text-xs font-bold rounded-lg"/></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="font-bold text-xs text-right block">سعر البيع</Label><Input type="number" value={form.price || ''} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="h-9 text-xs text-center font-bold rounded-lg"/></div>
              <div className="space-y-1"><Label className="font-bold text-xs text-right block">التكلفة</Label><Input type="number" value={form.cost || ''} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} className="h-9 text-xs text-center font-bold rounded-lg"/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="font-bold text-xs text-right block">الكمية</Label><Input type="number" value={form.quantity || ''} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} className="h-9 text-xs text-center font-bold rounded-lg"/></div>
              <div className="space-y-1"><Label className="font-bold text-xs text-right block">النوع</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger className="font-bold h-9 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent className="font-bold text-right"><SelectItem value="book">كتاب</SelectItem><SelectItem value="notebook">مذكرة</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label className="font-bold text-xs">جهة التوريد</Label>
              <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                <SelectTrigger className="font-bold h-9 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent className="font-bold text-right"><SelectItem value="center">السنتر</SelectItem><SelectItem value="teacher">مدرس</SelectItem></SelectContent>
              </Select>
            </div>
            {form.source === 'teacher' && (
              <div className="grid grid-cols-2 gap-3 p-2 bg-blue-50 rounded-lg">
                <Select value={form.teacherId} onValueChange={(v) => setForm({ ...form, teacherId: v })}><SelectTrigger className="h-8 text-xs font-bold"><SelectValue placeholder="المدرس" /></SelectTrigger><SelectContent>{teachers.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}</SelectContent></Select>
                <Input type="number" placeholder="نسبته %" value={form.teacherShare || ''} onChange={(e) => setForm({ ...form, teacherShare: Number(e.target.value) })} className="h-8 text-xs text-center font-bold"/>
              </div>
            )}
            <Button onClick={handleSave} className="w-full font-black text-sm h-10 rounded-lg">حفظ البيانات</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSellDialogOpen} onOpenChange={setIsSellDialogOpen}>
        <DialogContent className="text-right max-w-sm rounded-2xl p-5">
          <DialogHeader><DialogTitle className="font-black text-right text-sm">إتمام عملية بيع</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-3">
            <Select value={sellData.bookId} onValueChange={(v) => setSellData({ ...sellData, bookId: v })}>
              <SelectTrigger className="h-10 text-xs font-bold rounded-lg"><SelectValue placeholder="اختر الصنف..." /></SelectTrigger>
              <SelectContent className="font-bold text-right">{books.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name} ({b.quantity})</SelectItem>)}</SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" min="1" value={sellData.quantity} onChange={(e) => setSellData({ ...sellData, quantity: Number(e.target.value) })} className="h-10 text-xs text-center font-bold rounded-lg"/>
              <Select value={sellData.buyerType} onValueChange={(v) => setSellData({ ...sellData, buyerType: v, buyerId: '' })}><SelectTrigger className="h-10 text-xs font-bold rounded-lg"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="student">طالب</SelectItem><SelectItem value="general">خارجي</SelectItem></SelectContent></Select>
            </div>
            {sellData.buyerType === 'student' && (
                <div className="p-3 bg-slate-50 rounded-lg space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                        <Select onValueChange={(v) => setSellData({ ...sellData, stage: v, grade: '' })}><SelectTrigger className="h-8 text-xs font-bold"><SelectValue placeholder="المرحلة" /></SelectTrigger><SelectContent><SelectItem value="primary">ابتدائي</SelectItem><SelectItem value="middle">إعدادي</SelectItem><SelectItem value="high">ثانوي</SelectItem></SelectContent></Select>
                        <Select onValueChange={(v) => setSellData({ ...sellData, grade: v })}><SelectTrigger className="h-8 text-xs font-bold"><SelectValue placeholder="الصف" /></SelectTrigger><SelectContent>{sellData.stage === 'primary' ? [1,2,3,4,5,6].map(g => <SelectItem key={g} value={g.toString()}>{g}</SelectItem>) : [1,2,3].map(g => <SelectItem key={g} value={g.toString()}>{g}</SelectItem>)}</SelectContent></Select>
                    </div>
                    <Select value={sellData.buyerId} onValueChange={(v) => setSellData({ ...sellData, buyerId: v })}>
                        <SelectTrigger className="h-10 text-xs font-bold"><SelectValue placeholder="اسم الطالب..." /></SelectTrigger>
                        <SelectContent className="font-bold text-right">{students.filter(s => s.stage === sellData.stage && s.grade.toString() === sellData.grade).map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
            )}
            <Button onClick={handleSell} className="w-full font-black text-sm h-11 bg-green-600 hover:bg-green-700 rounded-lg shadow-lg shadow-green-100 mt-2">تأكيد عملية البيع</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}