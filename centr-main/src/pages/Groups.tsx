import { useState, useEffect } from "react";
import { 
  Plus, Search, Clock, Calendar, MoreHorizontal, 
  Edit, Trash2, User, AlertTriangle, X 
} from "lucide-react";

// استيراد مكونات الواجهة (تأكد أن هذه الملفات موجودة في مجلد ui عندك)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogTrigger, DialogFooter 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  DropdownMenu, DropdownMenuContent, 
  DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const GROUPS_KEY = "groups-data";
const TEACHERS_KEY = "teachers-data"; 
const WEEK_DAYS = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];

export default function Groups() {
  // 1. القائمة الأساسية
  const [groups, setGroups] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(GROUPS_KEY) || "[]");
    } catch {
      return [];
    }
  });

  const [teachers, setTeachers] = useState<any[]>([]); 
  const [searchQuery, setSearchQuery] = useState("");
  
  // 2. حالات التحكم في النوافذ (Modals)
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);

  // 3. حالة الفورم
  const [form, setForm] = useState<any>({
    name: "",
    subject: "",
    grade: "",
    price: "",
    days: [], // مصفوفة للأيام المختارة
    time: "",
    teacherId: "", 
  });

  // حفظ البيانات عند التغيير
  useEffect(() => {
    localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
  }, [groups]);

  // جلب المدرسين
  useEffect(() => {
    const t = JSON.parse(localStorage.getItem(TEACHERS_KEY) || "[]");
    setTeachers(t);
  }, []);

  // --- دوال التحكم ---

  const resetForm = () => {
    setForm({ name: "", subject: "", grade: "", price: "", days: [], time: "", teacherId: "" });
    setEditId(null);
    setIsDialogOpen(false);
  };

  const handleSave = () => {
    if (!form.name || !form.teacherId || !form.price || form.days.length === 0) {
  toast.error("بيانات ناقصة يا بطل!", {
    description: "تأكد من كتابة الاسم، السعر، واختيار يوم واحد على الأقل.",
    className: "font-bold text-right",
  });
  return;
}

    const selectedTeacher = teachers.find(t => t.id.toString() === form.teacherId);
    const subscriptionPrice = Number(form.price);
    
    let calculatedTeacherShare = 0;
    if (selectedTeacher) {
      const rate = Number(selectedTeacher.rate) || 0;
      calculatedTeacherShare = selectedTeacher.contractType === 'percentage' 
        ? (subscriptionPrice * rate) / 100 : rate;
    }

    const groupData = {
      ...form,
      teacherName: selectedTeacher?.name || "مدرس غير معروف",
      teacherContract: {
        type: selectedTeacher?.contractType,
        rate: selectedTeacher?.rate,
        sharePerStudent: calculatedTeacherShare
      },
      price: subscriptionPrice,
    };

    if (editId !== null) {
      setGroups(prev => prev.map(g => g.id === editId ? { ...g, ...groupData } : g));
    } else {
      setGroups(prev => [...prev, { id: Date.now(), students: 0, status: "active", ...groupData }]);
    }
    resetForm();
  };

  const handleEdit = (group: any) => {
    setEditId(group.id);
    setForm({
      ...group,
      days: Array.isArray(group.days) ? group.days : [],
    });
    setIsDialogOpen(true);
  };

  // الحذف الآمن لمنع تعليق البرنامج
  const confirmDelete = () => {
    if (deleteId) {
      const updatedGroups = groups.filter(g => g.id !== deleteId);
      setGroups(updatedGroups);
      
      // إنهاء كل الحالات المتعلقة بالحذف فوراً
      setDeleteId(null);
      setIsConfirmOpen(false);
      
      // ضمان عدم وجود أي بقايا للفورم في الذاكرة
      resetForm();
    }
  };

  const filteredGroups = groups.filter(
    (group) =>
      (group.name || "").includes(searchQuery) ||
      (group.teacherName || "").includes(searchQuery) ||
      (group.subject || "").includes(searchQuery)
  );

  return (
    <div className="space-y-6 pb-10" dir="rtl">
      {/* الهيدر */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-800">إدارة المجموعات</h1>
          <p className="text-muted-foreground font-bold text-sm">إدارة المواعيد والارتباط المالي للمدرسين</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(val) => { if(!val) resetForm(); setIsDialogOpen(val); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 font-black bg-blue-600 hover:bg-blue-700 shadow-lg px-6">
              <Plus className="w-5 h-5" /> إضافة مجموعة
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl text-right p-5" dir="rtl">
            <DialogHeader>
              <DialogTitle className="font-black text-lg text-right border-b pb-2 mb-2">
                {editId ? "تعديل بيانات المجموعة" : "إنشاء مجموعة دراسية"}
              </DialogTitle>
            </DialogHeader>

            {/* تم توزيع العناصر هنا في 3 أعمدة لتقليل الارتفاع ومنع السكرول */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 py-2">
              
              <div className="space-y-1">
                <Label className="font-bold text-xs text-slate-600">اسم المجموعة</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="مثال: المتفوقين" className="h-9 font-bold text-right" />
              </div>

              <div className="space-y-1">
                <Label className="font-bold text-xs text-slate-600">المدرس المسئول</Label>
                <Select value={form.teacherId} onValueChange={(v) => { 
                  const t = teachers.find(teach => teach.id.toString() === v); 
                  setForm({ ...form, teacherId: v, subject: t?.subject || "" }); 
                }}>
                  <SelectTrigger className="h-9 font-bold text-right">
                    <SelectValue placeholder="اختر المدرس" />
                  </SelectTrigger>
                  <SelectContent className="text-right font-bold">
                    {teachers.map((t) => (
                      <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="font-bold text-xs text-slate-600">سعر الاشتراك</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="h-9 font-black text-right" placeholder="0.00" />
              </div>

              <div className="space-y-1">
                <Label className="font-bold text-xs text-slate-600">المادة</Label>
                <Input value={form.subject} disabled className="h-9 bg-slate-50 font-bold text-blue-600 border-none" />
              </div>

              <div className="md:col-span-2 space-y-1">
                <Label className="font-bold text-xs text-slate-600">توقيت الحصة</Label>
                <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="h-9 font-bold" />
              </div>

              {/* اختيار الأيام بشكل عرضي مضغوط */}
              <div className="col-span-1 md:col-span-3 space-y-2 mt-2">
                <Label className="font-bold text-xs text-blue-700">أيام الحضور</Label>
                <div className="flex flex-wrap gap-1.5 p-2 border border-blue-50 rounded-xl bg-blue-50/20">
                  {WEEK_DAYS.map((day) => {
                    const isSelected = form.days.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          const nextDays = isSelected 
                            ? form.days.filter((d: string) => d !== day) 
                            : [...form.days, day];
                          setForm({ ...form, days: nextDays });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all duration-200 ${
                          isSelected 
                            ? "bg-blue-600 text-white shadow-sm scale-105" 
                            : "bg-white text-slate-500 border border-slate-200 hover:border-blue-300"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <DialogFooter className="flex gap-2 border-t pt-4 mt-2">
              <Button variant="outline" className="h-9 font-bold text-xs flex-1" onClick={resetForm}>إلغاء</Button>
              <Button className="h-9 font-black px-8 bg-blue-600 hover:bg-blue-700 text-xs flex-1" onClick={handleSave}>
                {editId ? "حفظ التعديلات" : "إضافة المجموعة"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* البحث */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="ابحث عن مجموعة، مدرس، أو مادة..." 
          className="pr-10 font-bold text-right bg-white" 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
        />
      </div>

      {/* عرض المجموعات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGroups.length > 0 ? filteredGroups.map((group) => (
          <Card key={group.id} className="overflow-hidden border-t-4 border-blue-600 shadow-sm hover:shadow-md transition-all group">
            <CardHeader className="pb-3 border-b bg-slate-50/30">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl font-black text-slate-800 group-hover:text-blue-600 transition-colors">{group.name}</CardTitle>
                  <div className="flex items-center gap-2 text-slate-500 mt-1">
                    <User size={14} className="text-blue-500" />
                    <span className="text-sm font-bold text-blue-600">
    {group.teacherName}
  </span>
</div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 border hover:bg-white">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="font-bold text-right">
                    <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => handleEdit(group)}>
                      <Edit size={14} /> تعديل البيانات
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 text-red-600 cursor-pointer" onClick={() => { setDeleteId(group.id); setIsConfirmOpen(true); }}>
                      <Trash2 size={14} /> حذف المجموعة
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-center justify-between text-sm font-bold bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-blue-500" />
                  <span>{group.time || "غير محدد"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-blue-500" />
                  <div className="flex gap-1 flex-wrap justify-end">
                    {group.days.map((d: string) => (
                      <span key={d} className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-black">{d}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                {/* تم تعديل عرض المادة لتكون متظللة بشكل احترافي */}
                <div className="bg-blue-600/10 px-3 py-1 rounded-lg border border-blue-200">
                  <span className="text-blue-700 font-black text-xs tracking-wide">
                    {group.subject}
                  </span>
                </div>

                <div className="text-left">
                  <p className="text-[10px] text-muted-foreground font-bold">سعر الاشتراك</p>
                  <p className="text-2xl font-black text-blue-700">
                    {group.price}
                    <span className="text-xs mr-1 font-bold italic">ج.م</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )) : (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed">
            <p className="text-muted-foreground font-bold italic">لا توجد مجموعات مطابقة للبحث</p>
          </div>
        )}
      </div>

      {/* نافذة تأكيد الحذف - الحل النهائي للتعليق */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="max-w-md text-right" dir="rtl">
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-600 animate-pulse">
              <AlertTriangle size={40} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800">حذف المجموعة؟</h3>
              <p className="text-slate-500 font-bold text-sm mt-2 px-6">
                انتبه! سيتم حذف كافة سجلات الحضور والبيانات المالية المرتبطة بهذه المجموعة نهائياً.
              </p>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
             <Button variant="outline" className="flex-1 font-bold h-12" onClick={() => setIsConfirmOpen(false)}>تراجع</Button>
             <Button variant="destructive" className="flex-1 font-black h-12 bg-red-600 hover:bg-red-700 shadow-lg shadow-red-100" onClick={confirmDelete}>تأكيد الحذف</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}