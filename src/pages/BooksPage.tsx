import { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, Edit, Trash2, ShoppingCart, RefreshCw, Archive } from 'lucide-react';
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
const FINANCE_KEY = "finance-transactions";

export default function Books() {
  const [books, setBooks] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
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

  const loadBooks = () => {
    const b = JSON.parse(localStorage.getItem(BOOKS_KEY) || "[]").filter((book: any) => !book.isArchived);
    setBooks(b);
  };

  useEffect(() => {
    loadBooks();
    setTeachers(JSON.parse(localStorage.getItem(TEACHERS_KEY) || "[]"));
    setStudents(JSON.parse(localStorage.getItem(STUDENTS_KEY) || "[]"));
    setGroups(JSON.parse(localStorage.getItem(GROUPS_KEY) || "[]"));
    // مستمع للتحديث التلقائي عند تغيير البيانات من صفحات أخرى
    const handleStorageChange = () => loadBooks();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
    window.dispatchEvent(new Event("storage"));
  }, [books]);

  const handleSave = () => {
    if (!form.name || form.price <= 0 || form.quantity < 0) return toast.error('يرجى التأكد من الاسم والسعر والكمية');
    if (form.source === 'teacher' && (!form.teacherId || form.teacherShare <= 0)) return toast.error('يرجى تحديد المدرس ونسبته');

    if (editingBookId) {
      setBooks(books.map(b => b.id === editingBookId ? { ...b, ...form } : b));
      toast.success('تم التحديث بنجاح');
    } else {
      setBooks([...books, { ...form, id: Date.now(), createdAt: new Date().toISOString() }]);
      toast.success('تمت الإضافة بنجاح');
    }

    setIsDialogOpen(false);
    setForm(emptyForm);
  };

  const handleDelete = (book: any) => {
    setItemToDelete(book);
    setShowDeleteAlert(true);
  };

  const archiveItem = (book: any) => {
    const allBooks = JSON.parse(localStorage.getItem(BOOKS_KEY) || "[]");
    const updated = allBooks.map((b: any) => b.id === book.id ? { ...b, isArchived: true, archivedAt: new Date().toISOString() } : b);
    localStorage.setItem(BOOKS_KEY, JSON.stringify(updated));
    setBooks(updated.filter((b: any) => !b.isArchived));
    toast.success('تم أرشفة الكتاب');
    setShowDeleteAlert(false);
  };

  const permanentlyDelete = (book: any) => {
    setBooks(books.filter(b => b.id !== book.id));
    toast.error('تم الحذف النهائي');
    setShowDeleteAlert(false);
  };

  const handleSell = () => {
    const book = books.find(b => b.id.toString() === sellData.bookId);
    if (!book || sellData.quantity > book.quantity) return toast.error('الكمية المتاحة لا تكفي');

    const profitPerUnit = book.price - book.cost;
    const totalProfit = profitPerUnit * sellData.quantity;
    const teacherIncome = book.source === 'teacher' ? totalProfit * (book.teacherShare / 100) : 0;
    const centerIncome = (book.price * sellData.quantity) - teacherIncome;

    setBooks(books.map(b => b.id === book.id ? { ...b, quantity: b.quantity - sellData.quantity } : b));

    const transactions = JSON.parse(localStorage.getItem(FINANCE_KEY) || "[]");
    transactions.push({
      id: Date.now(),
      type: 'income',
      amount: centerIncome,
      description: `بيع ${book.name} - عدد ${sellData.quantity}`,
      date: new Date().toISOString().split('T')[0]
    });
    if (teacherIncome > 0) {
      transactions.push({
        id: Date.now() + 1,
        type: 'income',
        amount: teacherIncome,
        description: `عمولة من بيع ${book.name}`,
        date: new Date().toISOString().split('T')[0],
        teacher: book.teacherId
      });
    }
    localStorage.setItem(FINANCE_KEY, JSON.stringify(transactions));

    toast.success('تمت عملية البيع');
    setIsSellDialogOpen(false);
  };

  // إحصائيات سريعة
  const totalInventory = books.reduce((sum, b) => sum + b.quantity, 0);
  const totalValue = books.reduce((sum, b) => sum + (b.price * b.quantity), 0);
  const lowStock = books.filter(b => b.quantity < 5).length;

  // بحث شامل
  const filteredBooks = books.filter(book =>
    book.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (book.source === 'teacher' && teachers.find(t => t.id.toString() === book.teacherId)?.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-800">إدارة الكتب والمذكرات</h1>
          <p className="text-muted-foreground font-bold text-sm">تتبع المخزون، المبيعات، وعمولات المدرسين</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadBooks} className="gap-2 font-bold border-primary text-primary hover:bg-primary/5">
            <RefreshCw className="w-4 h-4" /> تحديث
          </Button>
          <Button variant="outline" onClick={() => setIsSellDialogOpen(true)} className="gap-2 font-bold border-primary text-primary hover:bg-primary/5">
            <ShoppingCart className="w-4 h-4" /> بيع سريع
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 font-black" onClick={() => {setForm(emptyForm); setEditingBookId(null)}}>
                <Plus className="w-4 h-4" /> إضافة صنف جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="text-right max-w-md">
              <DialogHeader><DialogTitle className="font-black text-right">بيانات الكتاب / المذكرة</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <Label className="font-bold">اسم الكتاب أو المذكرة</Label>
                  <Input placeholder="مثال: مذكرة الكيمياء - الصف الأول" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="font-bold text-right"/>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="font-bold">سعر البيع للطالب</Label>
                    <Input type="number" placeholder="0.00" value={form.price || ''} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="font-bold text-center"/>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold">تكلفة الطباعة/الشراء</Label>
                    <Input type="number" placeholder="0.00" value={form.cost || ''} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} className="font-bold text-center"/>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="font-bold">الكمية المتوفرة</Label>
                    <Input type="number" placeholder="كم نسخة؟" value={form.quantity || ''} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} className="font-bold text-center"/>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold">النوع</Label>
                    <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                      <SelectTrigger className="font-bold text-right"><SelectValue /></SelectTrigger>
                      <SelectContent className="font-bold text-right">
                        <SelectItem value="book">كتاب خارجي</SelectItem>
                        <SelectItem value="notebook">مذكرة مدرس</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-bold">جهة التوريد (المصدر)</Label>
                  <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                    <SelectTrigger className="font-bold text-right"><SelectValue /></SelectTrigger>
                    <SelectContent className="font-bold text-right">
                      <SelectItem value="center">ملك للسنتر (الربح بالكامل لنا)</SelectItem>
                      <SelectItem value="teacher">تبع مدرس (توجد عمولة)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {form.source === 'teacher' && (
                  <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg">
                    <div className="space-y-1.5">
                      <Label className="font-bold text-xs text-blue-600">المدرس صاحب الحق</Label>
                      <Select value={form.teacherId} onValueChange={(v) => setForm({ ...form, teacherId: v })}>
                        <SelectTrigger className="font-bold h-8 text-xs"><SelectValue placeholder="اختر المدرس" /></SelectTrigger>
                        <SelectContent className="font-bold text-right">
                          {teachers.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-bold text-xs text-blue-600">نسبة المدرس من الربح %</Label>
                      <Input type="number" value={form.teacherShare || ''} onChange={(e) => setForm({ ...form, teacherShare: Number(e.target.value) })} className="h-8 font-bold text-center"/>
                    </div>
                  </div>
                )}
                
                <Button onClick={handleSave} className="w-full font-black text-lg py-6 bg-blue-600 hover:bg-blue-700">
                  {editingBookId ? "حفظ التعديلات" : "تأكيد إضافة المخزون"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <h3 className="font-black text-lg text-blue-800">{totalInventory}</h3>
            <p className="text-sm font-bold text-blue-600">إجمالي المخزون</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <h3 className="font-black text-lg text-green-800">{totalValue} ج</h3>
            <p className="text-sm font-bold text-green-600">قيمة المخزون</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 text-center">
            <h3 className="font-black text-lg text-red-800">{lowStock}</h3>
            <p className="text-sm font-bold text-red-600">أصناف منخفضة المخزون</p>
          </CardContent>
        </Card>
      </div>

      {/* شاشة البيع السريع */}
      <Dialog open={isSellDialogOpen} onOpenChange={setIsSellDialogOpen}>
    <DialogContent className="text-right max-w-lg">
      <DialogHeader><DialogTitle className="font-black text-right">إتمام عملية بيع</DialogTitle></DialogHeader>
      <div className="space-y-4 pt-4">
        <Label className="font-bold">اختر المذكرة المبيعة</Label>
        <Select value={sellData.bookId} onValueChange={(v) => setSellData({ ...sellData, bookId: v })}>
          <SelectTrigger className="font-bold text-right"><SelectValue placeholder="بحث عن كتاب..." /></SelectTrigger>
          <SelectContent className="font-bold text-right">
            {books.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name} (متاح: {b.quantity})</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5 text-right">
            <Label className="font-bold">الكمية</Label>
            <Input type="number" min="1" value={sellData.quantity} onChange={(e) => setSellData({ ...sellData, quantity: Number(e.target.value) })} className="font-bold text-center"/>
          </div>
          <div className="space-y-1.5 text-right">
            <Label className="font-bold">المشتري</Label>
            <Select value={sellData.buyerType} onValueChange={(v) => setSellData({ ...sellData, buyerType: v, buyerId: '', stage: '', grade: '', group: '' })}>
              <SelectTrigger className="font-bold text-right"><SelectValue /></SelectTrigger>
              <SelectContent className="font-bold text-right">
                <SelectItem value="student">طالب مسجل</SelectItem>
                <SelectItem value="general">خارجي</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {sellData.buyerType === 'student' && (
          <div className="space-y-4 border-t pt-4">
            <Label className="font-bold">فلترة الطلاب</Label>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="font-bold text-xs">المرحلة</Label>
                <Select value={sellData.stage} onValueChange={(v) => setSellData({ ...sellData, stage: v, grade: '', group: '' })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="اختر" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">ابتدائي</SelectItem>
                    <SelectItem value="middle">إعدادي</SelectItem>
                    <SelectItem value="high">ثانوي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="font-bold text-xs">الصف</Label>
                <Select value={sellData.grade} onValueChange={(v) => setSellData({ ...sellData, grade: v, group: '' })} disabled={!sellData.stage}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="اختر" /></SelectTrigger>
                  <SelectContent>
                    {sellData.stage === 'primary' && [1,2,3,4,5,6].map(g => <SelectItem key={g} value={g.toString()}>{g}</SelectItem>)}
                    {(sellData.stage === 'middle' || sellData.stage === 'high') && [1,2,3].map(g => <SelectItem key={g} value={g.toString()}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="font-bold text-xs">المجموعة</Label>
                <Select value={sellData.group} onValueChange={(v) => setSellData({ ...sellData, group: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="اختر" /></SelectTrigger>
                  <SelectContent>
                    {groups.filter(g => g.stage === sellData.stage && g.grade.toString() === sellData.grade).map(g => <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-bold">اختر الطالب</Label>
              <Select value={sellData.buyerId} onValueChange={(v) => setSellData({ ...sellData, buyerId: v })}>
                <SelectTrigger className="font-bold text-right"><SelectValue placeholder="اختر الطالب" /></SelectTrigger>
                <SelectContent className="font-bold text-right">
                  {students.filter(s => 
                    s.stage === sellData.stage && 
                    s.grade.toString() === sellData.grade && 
                    s.enrolledGroups.includes(sellData.group)
                  ).map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <Button onClick={handleSell} className="w-full font-black text-lg py-6 bg-green-600 hover:bg-green-700">تأكيد البيع وتسجيل الإيراد</Button>
      </div>
    </DialogContent>
  </Dialog>

      <Card className="border-none shadow-xl bg-white overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input className="pr-10" placeholder="البحث بالاسم أو النوع أو المدرس..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="text-right font-black">اسم الصنف</TableHead>
                <TableHead className="text-right font-black">السعر</TableHead>
                <TableHead className="text-right font-black">المخزون</TableHead>
                <TableHead className="text-right font-black">المصدر</TableHead>
                <TableHead className="text-left font-black">إجراءات</TableHead>
              </TableRow>

            </TableHeader>
            <TableBody>
              {books.filter(b => b.name.includes(searchQuery)).map((book) => (
                <TableRow key={book.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-black text-slate-800">{book.name}</span>
                      <span className="text-[10px] font-bold text-slate-400">{book.type === 'book' ? 'كتاب' : 'مذكرة'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-green-700">{book.price} ج.م</TableCell>
                  <TableCell>
                    <Badge variant={book.quantity < 5 ? "destructive" : "secondary"} className="font-bold">
                      {book.quantity} نسخة
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-bold text-slate-600">
                      {book.source === 'teacher' ? `مدرس: ${teachers.find(t => t.id.toString() === book.teacherId)?.name}` : 'إدارة السنتر'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setForm(book); setEditingBookId(book.id); setIsDialogOpen(true); }} className="h-8 w-8 text-blue-600 hover:bg-blue-50"><Edit size={16} /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(book)} className="h-8 w-8 text-red-400 hover:text-red-600"><Trash2 size={16} /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}