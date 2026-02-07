import { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, Edit, Trash2, ShoppingCart, FileText, Box } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';

const BOOKS_KEY = "books-data";
const TEACHERS_KEY = "teachers-data";
const STUDENTS_KEY = "students-data";
const GROUPS_KEY = "groups-data";
const BOOKS_SALES_KEY = "books-sales-data";
const BOOKS_OPERATIONS_KEY = "books-operations-data";
const USERS_KEY = "edu_users";

export default function Books() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'sales'>('inventory');
  const [books, setBooks] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [operations, setOperations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const [searchQueryInventory, setSearchQueryInventory] = useState("");
  const [searchQuerySales, setSearchQuerySales] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedUserInventory, setSelectedUserInventory] = useState<string>("all");
  const [selectedUserSales, setSelectedUserSales] = useState<string>("all");

  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [editingBookId, setEditingBookId] = useState<number | null>(null);

  const [isSellDialogOpen, setIsSellDialogOpen] = useState(false);
  const [isEditSaleDialogOpen, setIsEditSaleDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<any>(null);

  const [sellData, setSellData] = useState({
    bookId: '',
    quantity: 1,
    buyerId: '',
    buyerType: 'student',
    stage: '',
    grade: '',
    group: '',
    buyerName: '',
    receiver: '',
    studentSearch: ''
  });

  const emptyForm = {
    name: "",
    type: "book",
    price: 0,
    cost: 0,
    quantity: 0,
    source: "center",
    teacherId: "",
    teacherShare: 0,
    description: "",
    addedBy: ""
  };
  const [form, setForm] = useState(emptyForm);

  // المستخدم الحالي (من localStorage بعد اللوجن)
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const currentUserId = currentUser?.id?.toString() || currentUser?.user || 'unknown';
  const currentUserName = currentUser?.name || currentUser?.user || 'المستخدم الحالي';

  const loadData = () => {
    try {
      const b = JSON.parse(localStorage.getItem(BOOKS_KEY) || "[]") || [];
      const s = JSON.parse(localStorage.getItem(BOOKS_SALES_KEY) || "[]") || [];
      const ops = JSON.parse(localStorage.getItem(BOOKS_OPERATIONS_KEY) || "[]") || [];
      const t = JSON.parse(localStorage.getItem(TEACHERS_KEY) || "[]") || [];
      const st = JSON.parse(localStorage.getItem(STUDENTS_KEY) || "[]") || [];
      const g = JSON.parse(localStorage.getItem(GROUPS_KEY) || "[]") || [];
      const u = JSON.parse(localStorage.getItem(USERS_KEY) || "[]") || [];

      setBooks(Array.isArray(b) ? b.filter((book: any) => !book?.isArchived) : []);
      setSales(Array.isArray(s) ? s : []);
      setOperations(Array.isArray(ops) ? ops : []);
      setTeachers(Array.isArray(t) ? t : []);
      setStudents(Array.isArray(st) ? st : []);
      setGroups(Array.isArray(g) ? g : []);
      setUsers(Array.isArray(u) ? u : []);
    } catch (e) {
      console.error("خطأ أثناء تحميل البيانات", e);
    }
  };

  useEffect(() => {
    loadData();
    const handleStorageChange = () => loadData();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (Array.isArray(books) && books.length > 0) {
      localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
    }
  }, [books]);

  const addOperation = (type: string, details: any) => {
    const receiverName = users.find(u => u.id.toString() === details.receiverId)?.name || details.receiver || currentUserName;
    const newOp = {
      id: Date.now(),
      type,
      date: new Date().toISOString(),
      userId: details.receiverId || currentUserId,
      details: { ...details, receiver: receiverName }
    };
    const updatedOps = [newOp, ...operations];
    setOperations(updatedOps);
    localStorage.setItem(BOOKS_OPERATIONS_KEY, JSON.stringify(updatedOps));
  };

  const handleSaveBook = () => {
    if (!form.name || form.price <= 0 || form.quantity < 0) return toast.error('يرجى التأكد من الاسم والسعر والكمية');
    if (form.source === 'teacher' && (!form.teacherId || form.teacherShare <= 0)) return toast.error('يرجى تحديد المدرس ونسبته');

    // التحقق من صلاحية التعديل
    if (editingBookId !== null) {
      const book = books.find(b => b.id === editingBookId);
      if (book && book.addedBy !== currentUserId && !currentUser?.permissions?.canDeleteAny) {
        return toast.error('لا يمكنك تعديل هذا الصنف لأنه ليس من إضافتك');
      }
    }

    if (editingBookId !== null) {
      setBooks(books.map(b => b.id === editingBookId ? { ...b, ...form, addedBy: currentUserId } : b));
      toast.success('تم التحديث بنجاح');
    } else {
      const newBook = { 
        ...form, 
        id: Date.now(), 
        createdAt: new Date().toISOString(),
        addedBy: currentUserId  // تلقائي: المستخدم الحالي
      };
      setBooks([...books, newBook]);
      toast.success('تمت الإضافة بنجاح');
      addOperation("add", newBook);
    }
    setIsAddEditDialogOpen(false);
    setForm(emptyForm);
    setEditingBookId(null);
  };

  const handleDeleteBook = (book: any) => {
    if (book.addedBy !== currentUserId && !currentUser?.permissions?.canDeleteAny) {
      return toast.error('لا يمكنك حذف هذا الصنف لأنه ليس من إضافتك');
    }

    setBooks(books.filter(b => b.id !== book.id));
    toast.error('تم الحذف');
  };

  const handleSell = (isEdit = false, originalSaleId?: number) => {
    const book = books.find(b => b.id.toString() === sellData.bookId);
    if (!book) return toast.error('الصنف غير موجود');

    if (!isEdit && sellData.quantity > book.quantity) return toast.error('الكمية المتاحة لا تكفي');

    const buyerName = sellData.buyerType === 'student'
      ? students.find(s => s.id.toString() === sellData.buyerId)?.name || 'طالب غير معروف'
      : sellData.buyerName || 'غير معروف';

    const profitPerUnit = book.price - book.cost;
    const totalProfit = profitPerUnit * sellData.quantity;
    const teacherIncome = book.source === 'teacher' ? totalProfit * (book.teacherShare / 100) : 0;
    const centerIncome = (book.price * sellData.quantity) - teacherIncome;

    const updatedBooks = books.map(b =>
      b.id === book.id ? { ...b, quantity: b.quantity - sellData.quantity } : b
    );
    setBooks(updatedBooks);

    const saleData = {
      bookId: book.id,
      bookName: book.name,
      quantity: sellData.quantity,
      totalPrice: book.price * sellData.quantity,
      buyerName,
      stage: sellData.stage,
      grade: sellData.grade,
      group: sellData.group,
      date: new Date().toISOString().split('T')[0],
      centerShare: centerIncome,
      teacherShare: teacherIncome,
      handlerName: currentUserName,
      receiverId: currentUserId  // تلقائي: المستخدم الحالي
    };

    if (isEdit && originalSaleId) {
      // تعديل
      const originalSale = sales.find(s => s.id === originalSaleId);
      if (originalSale && originalSale.receiverId !== currentUserId && !currentUser?.permissions?.canDeleteAny) {
        return toast.error('لا يمكنك تعديل هذه العملية لأنها ليست من إضافتك');
      }

      setSales(prev => prev.map(s => s.id === originalSaleId ? { ...s, ...saleData } : s));
      setOperations(prev =>
        prev.map(op =>
          op.details.saleId === originalSaleId
            ? { ...op, details: { ...op.details, ...saleData, receiver: currentUserName } }
            : op
        )
      );
      toast.success('تم تعديل عملية البيع بنجاح');
      setIsEditSaleDialogOpen(false);
      setEditingSale(null);
    } else {
      // بيع جديد
      const newSale = { id: Date.now(), ...saleData };
      setSales(prev => [newSale, ...prev]);
      addOperation("sell", { saleId: newSale.id, ...saleData });
      toast.success('تمت عملية البيع وتسجيلها');
      setIsSellDialogOpen(false);
    }

    setSellData({
      bookId: '',
      quantity: 1,
      buyerId: '',
      buyerType: 'student',
      stage: '',
      grade: '',
      group: '',
      buyerName: '',
      receiver: '',
      studentSearch: ''
    });
  };

  const openEditSaleDialog = (op: any) => {
    const sale = sales.find(s => s.id === op.details.saleId);
    if (!sale) return toast.error("تعذر العثور على بيانات البيع");

    setEditingSale(sale);
    setSellData({
      bookId: sale.bookId.toString(),
      quantity: sale.quantity,
      buyerId: sale.buyerId || '',
      buyerType: sale.buyerId ? 'student' : 'general',
      stage: sale.stage || '',
      grade: sale.grade || '',
      group: sale.group || '',
      buyerName: sale.buyerName || '',
      receiver: sale.receiverId || '',
      studentSearch: ''
    });
    setIsEditSaleDialogOpen(true);
  };

  const handleDeleteSale = (op: any) => {
    const d = op.details;
    if (!d?.bookId || !d?.quantity) return toast.error("بيانات العملية ناقصة");

    if (d.receiverId !== currentUserId && !currentUser?.permissions?.canDeleteAny) {
      return toast.error('لا يمكنك حذف هذه العملية لأنها ليست من إضافتك');
    }

    setBooks(prev =>
      prev.map(b =>
        b.id === d.bookId ? { ...b, quantity: (b.quantity || 0) + d.quantity } : b
      )
    );

    setOperations(prev => prev.filter(o => o.id !== op.id));
    setSales(prev => prev.filter(s => s.id !== d.saleId));

    localStorage.setItem(BOOKS_OPERATIONS_KEY, JSON.stringify(operations.filter(o => o.id !== op.id)));
    localStorage.setItem(BOOKS_SALES_KEY, JSON.stringify(sales.filter(s => s.id !== d.saleId)));

    toast.success(`تم حذف البيع وإرجاع ${d.quantity} نسخة إلى المخزن`);
  };

  const totalInventory = books.reduce((sum, b) => sum + (b.quantity || 0), 0);
  const totalValue = books.reduce((sum, b) => sum + (b.price * (b.quantity || 0)), 0);

  const filteredBooks = books.filter(b => {
    const q = searchQueryInventory.toLowerCase();
    const addedByName = users.find(u => u.id.toString() === b.addedBy)?.name?.toLowerCase() || '';
    return (
      b.name?.toLowerCase().includes(q) ||
      b.description?.toLowerCase().includes(q) ||
      b.type?.toLowerCase().includes(q) ||
      b.source?.toLowerCase().includes(q) ||
      addedByName.includes(q)
    ) && (selectedUserInventory === "all" || b.addedBy === selectedUserInventory);
  });

  const filteredSalesOperations = operations
    .filter(op => op.type === "sell")
    .filter(op => {
      const q = searchQuerySales.toLowerCase();
      const d = op.details || {};
      const userName = users.find(u => u.id.toString() === op.userId)?.name?.toLowerCase() || '';
      return (
        d.bookName?.toLowerCase().includes(q) ||
        d.buyerName?.toLowerCase().includes(q) ||
        userName.includes(q)
      ) && (selectedUserSales === "all" || op.userId === selectedUserSales);
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredStudents = students.filter(s => 
    s.stage === sellData.stage &&
    s.grade?.toString() === sellData.grade &&
    (
      !sellData.studentSearch.trim() || 
      sellData.studentSearch === ' ' || 
      s.name?.toLowerCase().includes(sellData.studentSearch.toLowerCase().trim())
    )
  );

  return (
    <div className="p-3 space-y-4 font-cairo bg-slate-50 min-h-screen" dir="rtl">
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
          <Button size="sm" className="h-8 text-[11px] font-black shadow-md" onClick={() => { setForm(emptyForm); setEditingBookId(null); setIsAddEditDialogOpen(true); }}>
            <Plus className="w-3.5 h-3.5 ml-1" /> إضافة صنف
          </Button>
        </div>
      </div>

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
          <FileText className="w-3.5 h-3.5 inline-block ml-1" /> سجل البيع
        </button>
      </div>

      <div className="animate-in fade-in duration-300">
        {activeTab === 'inventory' ? (
          <div className="space-y-4">
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
              <div className="p-3 border-b space-y-3">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <Input className="h-8 pr-9 text-xs bg-slate-50 border-none font-bold" placeholder="بحث في المخزن..." value={searchQueryInventory} onChange={(e) => setSearchQueryInventory(e.target.value)} />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Label className="text-xs font-bold mb-1 block">الموظف المستلم</Label>
                    <Select value={selectedUserInventory} onValueChange={setSelectedUserInventory}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="الكل" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">الكل</SelectItem>
                        {users.map(u => <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="text-right text-[11px] font-black h-9">اسم الكتاب</TableHead>
                    <TableHead className="text-center text-[11px] font-black h-9">سعر البيع</TableHead>
                    <TableHead className="text-center text-[11px] font-black h-9">التكلفة</TableHead>
                    <TableHead className="text-center text-[11px] font-black h-9">الكمية</TableHead>
                    <TableHead className="text-center text-[11px] font-black h-9">النوع</TableHead>
                    <TableHead className="text-center text-[11px] font-black h-9">جهة التوريد</TableHead>
                    <TableHead className="text-center text-[11px] font-black h-9">الموظف المستلم</TableHead>
                    <TableHead className="text-center text-[11px] font-black h-9">تاريخ الإضافة</TableHead>
                    <TableHead className="text-left text-[11px] font-black h-9 pl-4">إجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBooks.length > 0 ? (
                    filteredBooks.map((book) => (
                      <TableRow key={book.id} className="h-10">
                        <TableCell className="text-[11px] font-bold">{book.name || '-'}</TableCell>
                        <TableCell className="text-center text-[11px] font-black text-green-600">{book.price || 0} ج</TableCell>
                        <TableCell className="text-center text-[11px] font-black text-amber-700">{book.cost || 0} ج</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={book.quantity < 5 ? "destructive" : "secondary"} className="text-[9px] px-1.5 py-0 font-black">{book.quantity || 0}</Badge>
                        </TableCell>
                        <TableCell className="text-center text-[11px] font-bold">{book.type === 'book' ? 'كتاب' : 'مذكرة'}</TableCell>
                        <TableCell className="text-center text-[11px] font-bold">{book.source === 'center' ? 'السنتر' : 'مدرس'}</TableCell>
                        <TableCell className="text-center text-[11px] font-bold">
                          {users.find(u => u?.id?.toString() === book.addedBy)?.name || '-'}
                        </TableCell>
                        <TableCell className="text-center text-[10px] font-medium text-slate-600">
                          {book.createdAt ? new Date(book.createdAt).toLocaleDateString('ar-EG') : '-'}
                        </TableCell>
                        <TableCell className="pl-4">
                          <div className="flex justify-end gap-1">
                            <button 
                              onClick={() => { setForm(book); setEditingBookId(book.id); setIsAddEditDialogOpen(true); }} 
                              className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                            >
                              <Edit size={14} />
                            </button>
                            <button 
                              onClick={() => handleDeleteBook(book)} 
                              className="p-1 text-red-400 hover:bg-red-50 rounded"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={9} className="text-center py-10 text-[11px] font-bold text-slate-400">لا نتائج</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        ) : (
          <Card className="rounded-2xl border-none shadow-sm overflow-hidden bg-white border border-slate-100">
            <CardHeader className="bg-slate-900 text-white p-4">
              <div className="flex justify-between items-center gap-4 flex-wrap">
                <div className="flex flex-col gap-1">
                  <Label className="text-[10px] font-black opacity-60">فلترة التاريخ</Label>
                  <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-white/10 text-white h-7 text-[10px] border-none font-black w-32" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black text-green-400 opacity-80">إجمالي اليوم</p>
                  <p className="text-lg font-black">{sales.reduce((sum, s) => sum + (s.totalPrice || 0), 0).toLocaleString()} ج</p>
                </div>
              </div>
            </CardHeader>

            <div className="p-3 border-b space-y-3">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <Input className="h-8 pr-9 text-xs bg-slate-50 border-none font-bold" placeholder="بحث في سجل البيع..." value={searchQuerySales} onChange={(e) => setSearchQuerySales(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label className="text-xs font-bold mb-1 block">الموظف المستلم</Label>
                  <Select value={selectedUserSales} onValueChange={setSelectedUserSales}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      {users.map(u => <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="text-right text-[11px] font-black h-9">البيان</TableHead>
                  <TableHead className="text-right text-[11px] font-black h-9">الكمية</TableHead>
                  <TableHead className="text-right text-[11px] font-black h-9">المبلغ</TableHead>
                  <TableHead className="text-right text-[11px] font-black h-9">المشتري</TableHead>
                  <TableHead className="text-center text-[11px] font-black h-9">التاريخ</TableHead>
                  <TableHead className="text-center text-[11px] font-black h-9">المستلم</TableHead>
                  <TableHead className="text-left text-[11px] font-black h-9 pl-4">إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSalesOperations.length > 0 ? (
                  filteredSalesOperations.map((op) => {
                    const d = op.details || {};
                    return (
                      <TableRow key={op.id} className="h-10">
                        <TableCell className="text-[11px] font-bold">{d.bookName || '-'}</TableCell>
                        <TableCell className="text-center text-[11px] font-bold">{d.quantity || '-'}</TableCell>
                        <TableCell className="text-center text-[11px] font-black">{d.totalPrice ? `${d.totalPrice} ج` : '-'}</TableCell>
                        <TableCell className="text-[11px]">{d.buyerName || '-'}</TableCell>
                        <TableCell className="text-center text-[10px] text-slate-600">
                          {new Date(op.date).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                        </TableCell>
                        <TableCell className="text-center text-[11px] font-bold">
                          {users.find(u => u.id.toString() === d.receiverId)?.name || d.receiver || '-'}
                        </TableCell>
                        <TableCell className="pl-4">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => openEditSaleDialog(op)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="تعديل العملية"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteSale(op)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="حذف العملية (مع إرجاع الكمية)"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-[11px] font-bold text-slate-400">
                      لا توجد عمليات بيع مسجلة
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* نافذة إضافة / تعديل صنف */}
      <Dialog open={isAddEditDialogOpen} onOpenChange={setIsAddEditDialogOpen}>
        <DialogContent className="text-right max-w-sm rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="font-black text-right text-sm">
              {editingBookId !== null ? "تعديل الصنف" : "إضافة صنف جديد"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-3">
            <div className="space-y-1">
              <Label className="font-bold text-xs">الاسم</Label>
              <Input 
                placeholder="اسم الكتاب أو المذكرة" 
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
                className="h-9 text-xs font-bold rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="font-bold text-xs text-right block">سعر البيع</Label>
                <Input 
                  type="number" 
                  value={form.price || ''} 
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} 
                  className="h-9 text-xs text-center font-bold rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <Label className="font-bold text-xs text-right block">التكلفة</Label>
                <Input 
                  type="number" 
                  value={form.cost || ''} 
                  onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} 
                  className="h-9 text-xs text-center font-bold rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="font-bold text-xs text-right block">الكمية</Label>
                <Input 
                  type="number" 
                  value={form.quantity || ''} 
                  onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} 
                  className="h-9 text-xs text-center font-bold rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <Label className="font-bold text-xs text-right block">النوع</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger className="font-bold h-9 text-xs rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="font-bold text-right">
                    <SelectItem value="book">كتاب</SelectItem>
                    <SelectItem value="notebook">مذكرة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="font-bold text-xs">جهة التوريد</Label>
              <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                <SelectTrigger className="font-bold h-9 text-xs rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="font-bold text-right">
                  <SelectItem value="center">السنتر</SelectItem>
                  <SelectItem value="teacher">مدرس</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.source === 'teacher' && (
              <div className="grid grid-cols-2 gap-3 p-2 bg-blue-50 rounded-lg">
                <Select value={form.teacherId} onValueChange={(v) => setForm({ ...form, teacherId: v })}>
                  <SelectTrigger className="h-8 text-xs font-bold">
                    <SelectValue placeholder="المدرس" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map(t => (
                      <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input 
                  type="number" 
                  placeholder="نسبته %" 
                  value={form.teacherShare || ''} 
                  onChange={(e) => setForm({ ...form, teacherShare: Number(e.target.value) })} 
                  className="h-8 text-xs text-center font-bold"
                />
              </div>
            )}

            {/* خانة المضاف بواسطة أصبحت تلقائية */}
            <div className="space-y-1">
              <Label className="font-bold text-xs">المضاف بواسطة</Label>
              <div className="h-9 px-3 flex items-center bg-slate-100 rounded-lg border text-xs font-bold text-slate-700">
                {currentUserName}
              </div>
            </div>

            <Button onClick={handleSaveBook} className="w-full font-black text-sm h-10 rounded-lg">
              حفظ البيانات
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* نافذة بيع المذكرات */}
      <Dialog open={isSellDialogOpen} onOpenChange={setIsSellDialogOpen}>
        <DialogContent className="text-right max-w-sm rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="font-black text-right text-sm">إتمام عملية بيع</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-3">
            <Select value={sellData.bookId} onValueChange={(v) => setSellData({ ...sellData, bookId: v })}>
              <SelectTrigger className="h-10 text-xs font-bold rounded-lg">
                <SelectValue placeholder="اختر الصنف..." />
              </SelectTrigger>
              <SelectContent className="font-bold text-right">
                {books.map(b => (
                  <SelectItem key={b.id} value={b.id.toString()}>
                    {b.name} ({b.quantity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                min="1"
                value={sellData.quantity}
                onChange={(e) => setSellData({ ...sellData, quantity: Number(e.target.value) })}
                className="h-10 text-xs text-center font-bold rounded-lg"
              />
              <Select
                value={sellData.buyerType}
                onValueChange={(v) => setSellData({ ...sellData, buyerType: v, buyerId: '', buyerName: '' })}
              >
                <SelectTrigger className="h-10 text-xs font-bold rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">طالب</SelectItem>
                  <SelectItem value="general">خارجي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {sellData.buyerType === 'student' && (
              <div className="p-3 bg-slate-50 rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Select 
                    value={sellData.stage} 
                    onValueChange={(v) => setSellData({ ...sellData, stage: v, grade: '', buyerId: '', studentSearch: '' })}
                  >
                    <SelectTrigger className="h-9 text-xs font-bold">
                      <SelectValue placeholder="المرحلة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">ابتدائي</SelectItem>
                      <SelectItem value="middle">إعدادي</SelectItem>
                      <SelectItem value="high">ثانوي</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select 
                    value={sellData.grade} 
                    onValueChange={(v) => setSellData({ ...sellData, grade: v, buyerId: '', studentSearch: '' })}
                    disabled={!sellData.stage}
                  >
                    <SelectTrigger className="h-9 text-xs font-bold">
                      <SelectValue placeholder="الصف" />
                    </SelectTrigger>
                    <SelectContent>
                      {sellData.stage === 'primary' 
                        ? [1,2,3,4,5,6].map(g => <SelectItem key={g} value={g.toString()}>{g}</SelectItem>)
                        : sellData.stage 
                          ? [1,2,3].map(g => <SelectItem key={g} value={g.toString()}>{g}</SelectItem>)
                          : null
                      }
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="font-bold text-xs">اسم الطالب</Label>
                  <div className="relative">
                    <Input
                      placeholder="اكتب اسم الطالب أو اضغط لعرض الكل..."
                      value={sellData.studentSearch}
                      onChange={(e) => setSellData({ 
                        ...sellData, 
                        studentSearch: e.target.value,
                        buyerId: '' 
                      })}
                      className="h-10 text-xs font-bold rounded-lg pr-10"
                      onFocus={() => {
                        if (!sellData.studentSearch.trim()) {
                          setSellData(prev => ({ ...prev, studentSearch: ' ' }));
                        }
                      }}
                      onBlur={() => {
                        if (sellData.studentSearch === ' ') {
                          setSellData(prev => ({ ...prev, studentSearch: '' }));
                        }
                      }}
                    />

                    {sellData.studentSearch.trim() && (
                      <button
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm"
                        onClick={() => setSellData(prev => ({ ...prev, studentSearch: '', buyerId: '' }))}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {(sellData.studentSearch.trim() || sellData.studentSearch === ' ') && (
                    <div className="max-h-60 overflow-auto border rounded-md bg-white shadow-sm mt-1 z-50">
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map(student => (
                          <div
                            key={student.id}
                            className={`px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-sm transition-colors ${
                              sellData.buyerId === student.id.toString() ? 'bg-blue-100 font-medium' : ''
                            }`}
                            onClick={() => {
                              setSellData({
                                ...sellData,
                                buyerId: student.id.toString(),
                                studentSearch: student.name,
                              });
                            }}
                          >
                            {student.name}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-slate-500 text-center">
                          لا يوجد طلاب مطابقين
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {sellData.buyerType === 'general' && (
              <Input 
                placeholder="اسم المشتري" 
                value={sellData.buyerName} 
                onChange={(e) => setSellData({ ...sellData, buyerName: e.target.value })} 
                className="h-10 text-xs font-bold rounded-lg"
              />
            )}

            {/* خانة المستلم بالاسم وتلقائية */}
            <div className="space-y-1">
              <Label className="font-bold text-xs">المستلم</Label>
              <div className="h-9 px-3 flex items-center bg-slate-100 rounded-lg border text-xs font-bold text-slate-700">
                {currentUserName}
              </div>
            </div>

            <Button 
              onClick={() => handleSell(false)} 
              className="w-full font-black text-sm h-11 bg-green-600 hover:bg-green-700 rounded-lg shadow-lg shadow-green-100 mt-2"
            >
              تأكيد عملية البيع
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* نافذة تعديل عملية بيع */}
      <Dialog open={isEditSaleDialogOpen} onOpenChange={setIsEditSaleDialogOpen}>
        <DialogContent className="text-right max-w-sm rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="font-black text-right text-sm">تعديل عملية البيع</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-3">
            <Select value={sellData.bookId} onValueChange={(v) => setSellData({ ...sellData, bookId: v })}>
              <SelectTrigger className="h-10 text-xs font-bold rounded-lg">
                <SelectValue placeholder="اختر الصنف..." />
              </SelectTrigger>
              <SelectContent className="font-bold text-right">
                {books.map(b => (
                  <SelectItem key={b.id} value={b.id.toString()}>
                    {b.name} ({b.quantity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                min="1"
                value={sellData.quantity}
                onChange={(e) => setSellData({ ...sellData, quantity: Number(e.target.value) })}
                className="h-10 text-xs text-center font-bold rounded-lg"
              />
              <Select
                value={sellData.buyerType}
                onValueChange={(v) => setSellData({ ...sellData, buyerType: v, buyerId: '', buyerName: '' })}
              >
                <SelectTrigger className="h-10 text-xs font-bold rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">طالب</SelectItem>
                  <SelectItem value="general">خارجي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {sellData.buyerType === 'student' && (
              <div className="p-3 bg-slate-50 rounded-lg space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Select onValueChange={(v) => setSellData({ ...sellData, stage: v, grade: '' })}>
                    <SelectTrigger className="h-8 text-xs font-bold">
                      <SelectValue placeholder="المرحلة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">ابتدائي</SelectItem>
                      <SelectItem value="middle">إعدادي</SelectItem>
                      <SelectItem value="high">ثانوي</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sellData.grade} onValueChange={(v) => setSellData({ ...sellData, grade: v })}>
                    <SelectTrigger className="h-8 text-xs font-bold">
                      <SelectValue placeholder="الصف" />
                    </SelectTrigger>
                    <SelectContent>
                      {sellData.stage === 'primary' 
                        ? [1,2,3,4,5,6].map(g => <SelectItem key={g} value={g.toString()}>{g}</SelectItem>)
                        : sellData.stage 
                          ? [1,2,3].map(g => <SelectItem key={g} value={g.toString()}>{g}</SelectItem>)
                          : null
                      }
                    </SelectContent>
                  </Select>
                </div>
                <Input 
                  placeholder="بحث عن الطالب..." 
                  value={sellData.studentSearch} 
                  onChange={(e) => setSellData({ ...sellData, studentSearch: e.target.value })} 
                  className="h-10 text-xs font-bold rounded-lg"
                />
                <Select value={sellData.buyerId} onValueChange={(v) => setSellData({ ...sellData, buyerId: v })}>
                  <SelectTrigger className="h-10 text-xs font-bold">
                    <SelectValue placeholder="اسم الطالب..." />
                  </SelectTrigger>
                  <SelectContent className="font-bold text-right">
                    {students
                      .filter(s => 
                        s.stage === sellData.stage && 
                        s.grade?.toString() === sellData.grade &&
                        s.name?.toLowerCase().includes(sellData.studentSearch.toLowerCase())
                      )
                      .map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)
                    }
                  </SelectContent>
                </Select>
              </div>
            )}

            {sellData.buyerType === 'general' && (
              <Input 
                placeholder="اسم المشتري" 
                value={sellData.buyerName} 
                onChange={(e) => setSellData({ ...sellData, buyerName: e.target.value })} 
                className="h-10 text-xs font-bold rounded-lg"
              />
            )}

            {/* خانة المستلم بالاسم وتلقائية */}
            <div className="space-y-1">
              <Label className="font-bold text-xs">المستلم</Label>
              <div className="h-9 px-3 flex items-center bg-slate-100 rounded-lg border text-xs font-bold text-slate-700">
                {currentUserName}
              </div>
            </div>

            <Button 
              onClick={() => handleSell(true, editingSale?.id)}
              className="w-full font-black text-sm h-11 bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg shadow-blue-100 mt-2"
            >
              حفظ التعديلات
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}