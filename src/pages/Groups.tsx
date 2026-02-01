import { useState, useEffect } from "react";
import { 
  Plus, Search, Clock, Calendar, MoreHorizontal, 
  Edit, Trash2, User, AlertTriangle, DollarSign 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
const HALLS_KEY = "halls-data"; // مفتاح جديد للقاعات
const WEEK_DAYS = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];

const stageOptions = [
  { value: "primary", label: "ابتدائي" },
  { value: "middle", label: "إعدادي" },
  { value: "high", label: "ثانوي" },
];

const hallTypeOptions = [
  { value: "normal", label: "عادي" },
  { value: "vip", label: "VIP" },
];

const gradeOptions = [
  { value: "primary-1", label: "الصف الأول ابتدائي" },
  { value: "primary-2", label: "الصف الثاني ابتدائي" },
  { value: "primary-3", label: "الصف الثالث ابتدائي" },
  { value: "primary-4", label: "الصف الرابع ابتدائي" },
  { value: "primary-5", label: "الصف الخامس ابتدائي" },
  { value: "primary-6", label: "الصف السادس ابتدائي" },
  { value: "middle-1", label: "الصف الأول إعدادي" },
  { value: "middle-2", label: "الصف الثاني إعدادي" },
  { value: "middle-3", label: "الصف الثالث إعدادي" },
  { value: "high-1", label: "الصف الأول ثانوي" },
  { value: "high-2", label: "الصف الثاني ثانوي" },
  { value: "high-3", label: "الصف الثالث ثانوي" },
];
const getGradeLabel = (stage: string, grade: any) => {
  if (!stage || !grade) return "غير محدد";
  const stageLabel = stageOptions.find(s => s.value === stage)?.label || "";
  const ordinals = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس"];
  return `الصف ${ordinals[Number(grade) - 1] || grade} ${stageLabel}`;
};

const getGradesForStage = (stage: string) => {
  if (stage === "primary") return [1, 2, 3, 4, 5, 6];
  if (stage === "middle" || stage === "high") return [1, 2, 3];
  return [];
};

// دالة لتحويل الوقت إلى تنسيق 12 ساعة
const formatTime12Hour = (time: string) => {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "م" : "ص";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

export default function Groups() {
  const [groups, setGroups] = useState<any[]>(() => {
  if (typeof window !== "undefined") {
    return JSON.parse(localStorage.getItem(GROUPS_KEY) || "[]");
  }
  return [];
});

  const [teachers, setTeachers] = useState<any[]>([]); 
  const [halls, setHalls] = useState<any[]>(() => { // حالة جديدة للقاعات
    if (typeof window !== "undefined") {
      return JSON.parse(localStorage.getItem(HALLS_KEY) || "[]");
    }
    return [];
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isHallDialogOpen, setIsHallDialogOpen] = useState(false); // حالة لنافذة القاعات
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isHallConfirmOpen, setIsHallConfirmOpen] = useState(false); // حالة لتأكيد حذف القاعة
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteHallId, setDeleteHallId] = useState<number | null>(null); // حالة لحذف القاعة
  const [editId, setEditId] = useState<number | null>(null);
  const [editHallId, setEditHallId] = useState<number | null>(null); // حالة لتعديل القاعة

  const [form, setForm] = useState<any>({
    name: "", subject: "", stage: "", grade: "", price: "",
    days: [], startTime: "", endTime: "", teacherId: "", hallId: "", // إضافة hallId اختياري
  });

  const [hallForm, setHallForm] = useState<any>({ // نموذج جديد للقاعات
    name: "", capacity: "", type: "",
  });

  // حالات جديدة لتفاصيل القاعة
  const [selectedHall, setSelectedHall] = useState<any>(null);
  const [isHallDetailsOpen, setIsHallDetailsOpen] = useState(false);

  // حفظ المجموعات
  useEffect(() => {
    localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
  }, [groups]);

  // حفظ القاعات
  useEffect(() => {
    localStorage.setItem(HALLS_KEY, JSON.stringify(halls));
  }, [halls]);

  // جلب المدرسين وتحديث القائمة
  useEffect(() => {
    const loadTeachers = () => {
      const t = JSON.parse(localStorage.getItem(TEACHERS_KEY) || "[]");
      setTeachers(t);
    };
    loadTeachers();
  }, []);

  const resetForm = () => {
    setForm({ name: "", subject: "", stage: "", grade: "", price: "", days: [], startTime: "", endTime: "", teacherId: "", hallId: "" });
    setEditId(null);
    setIsDialogOpen(false);
  };

  const resetHallForm = () => { // دالة لإعادة تعيين نموذج القاعات
    setHallForm({ name: "", capacity: "", type: "" });
    setEditHallId(null);
    setIsHallDialogOpen(false);
  };

  const handleSave = () => {
    if (!form.name || !form.teacherId || !form.price || form.days.length === 0) {
      toast.error("بيانات ناقصة يا بطل!", { description: "تأكد من اختيار المدرس والأيام والسعر." });
      return;
    }

    const selectedTeacher = teachers.find(t => t.id.toString() === form.teacherId);
    const selectedHall = halls.find(h => h.id.toString() === form.hallId);
    const groupData = {
      ...form,
      teacherName: selectedTeacher?.name || "مدرس غير معروف",
      hallName: selectedHall?.name || "غير محدد", // إضافة اسم القاعة
      price: Number(form.price),
    };

    if (editId !== null) {
      setGroups(prev => prev.map(g => g.id === editId ? { ...g, ...groupData } : g));
      toast.success("تم تحديث المجموعة بنجاح");
    } else {
      setGroups(prev => [...prev, { id: Date.now(), students: 0, ...groupData }]);
      toast.success("تم إنشاء المجموعة بنجاح");
    }
    resetForm();
  };

  const handleSaveHall = () => { // دالة لحفظ القاعة
    if (!hallForm.name || !hallForm.capacity || !hallForm.type) {
      toast.error("بيانات ناقصة!", { description: "تأكد من ملء جميع الحقول." });
      return;
    }

    const hallData = {
      ...hallForm,
      capacity: Number(hallForm.capacity),
    };

    if (editHallId !== null) {
      setHalls(prev => prev.map(h => h.id === editHallId ? { ...h, ...hallData } : h));
      toast.success("تم تحديث القاعة بنجاح");
    } else {
      setHalls(prev => [...prev, { id: Date.now(), ...hallData }]);
      toast.success("تم إنشاء القاعة بنجاح");
    }
    resetHallForm();
  };

  // --- الفلترة الحقيقية ---
  const filteredGroups = groups.filter((group) => {
    const matchSearch = (group.name + group.teacherName + group.subject).toLowerCase().includes(searchQuery.toLowerCase());
    const matchStage = stageFilter === "all" || group.stage === stageFilter;
    const matchGrade = gradeFilter === "all" || group.grade?.toString() === gradeFilter;
    return matchSearch && matchStage && matchGrade;
  });
return (
    <div className="space-y-6 pb-10" dir="rtl">
      {/* الهيدر */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border">
        <div>
          <h1 className="text-2xl font-black text-slate-800">إدارة المجموعات</h1>
          <p className="text-muted-foreground font-bold text-sm">أتمتة بيانات المدرسين والصفوف</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsHallDialogOpen(true)} className="gap-2 bg-green-600 hover:bg-green-700 shadow-lg">
            <Plus className="w-5 h-5" /> إدارة القاعات
          </Button>
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg">
            <Plus className="w-5 h-5" /> إضافة مجموعة
          </Button>
        </div>
      </div>

      {/* البحث والفلترة الشغالة */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="ابحث بالاسم أو المدرس..." 
            className="pr-10 font-bold"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={stageFilter} onValueChange={(value) => {
            setStageFilter(value);
            // إعادة تعيين فلتر الصف إذا تغيرت المرحلة
            if (value === "all") {
              setGradeFilter("all");
            } else {
              const grades = getGradesForStage(value);
              if (!grades.includes(Number(gradeFilter))) {
                setGradeFilter("all");
              }
            }
          }}>
            <SelectTrigger className="w-[140px] font-bold"><SelectValue placeholder="المرحلة" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل المراحل</SelectItem>
              {stageOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={gradeFilter} onValueChange={setGradeFilter} disabled={stageFilter === "all"}>
            <SelectTrigger className="w-[140px] font-bold"><SelectValue placeholder="الصف" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الصفوف</SelectItem>
              {stageFilter !== "all" && getGradesForStage(stageFilter).map(grade => (
                <SelectItem key={grade} value={grade.toString()}>{getGradeLabel(stageFilter, grade)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* عرض الجدول */}
      <Card>
        <CardHeader><CardTitle className="font-black">قائمة المجموعات ({filteredGroups.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow className="bg-muted/50"><TableHead className="text-right font-bold">اسم المجموعة</TableHead><TableHead className="text-right font-bold">المدرس</TableHead><TableHead className="text-right font-bold">المادة</TableHead><TableHead className="text-right font-bold">الصف</TableHead><TableHead className="text-right font-bold">القاعة</TableHead><TableHead className="text-right font-bold">الأيام</TableHead><TableHead className="text-right font-bold">الأوقات</TableHead><TableHead className="text-right font-bold">السعر</TableHead><TableHead className="text-left font-bold">إجراءات</TableHead></TableRow></TableHeader>
            <TableBody>
              {filteredGroups.map((group) => (
                <TableRow key={group.id} className="hover:bg-muted/20">
                  <TableCell><span className="font-bold text-slate-800">{group.name}</span></TableCell>
                  <TableCell><span className="font-bold">{group.teacherName}</span></TableCell>
                  <TableCell><Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">{group.subject}</Badge></TableCell>
                  <TableCell><span className="font-bold">{getGradeLabel(group.stage, group.grade)}</span></TableCell>
                  <TableCell>
                    {group.hallId ? (
                      <Button 
                        variant="link" 
                        className="p-0 h-auto font-bold text-blue-600 hover:text-blue-800" 
                        onClick={() => { 
  setSelectedHall(halls.find(h => h.id.toString() === group.hallId)); 
  setIsHallDetailsOpen(true); 
}}
                      >
                        {group.hallName}
                      </Button>
                    ) : (
                      <span className="font-bold">{group.hallName}</span>
                    )}
                  </TableCell> {/* عرض اسم القاعة مع إمكانية النقر إذا كانت محددة */}
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {group.days.map((d: any) => <span key={d} className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold">{d}</span>)}
                    </div>
                  </TableCell>
                  <TableCell><span className="font-bold">{formatTime12Hour(group.startTime)} - {formatTime12Hour(group.endTime)}</span></TableCell>
                  <TableCell><span className="font-black text-blue-700">{group.price} ج.م</span></TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => { setEditId(group.id); setForm({ ...group, grade: group.grade.toString() }); setIsDialogOpen(true); }}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setDeleteId(group.id); setIsConfirmOpen(true); }}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* نافذة الإضافة (Smart Form) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle className="font-black text-xl">بيانات المجموعة الدراسية</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4 text-right" dir="rtl">
            <div className="space-y-2"><Label className="font-bold">اسم المجموعة</Label><Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="مثال: مراجعة نهائية" /></div>
            
            {/* المدرس والمرحلة والصف في صف واحد */}
            <div className="col-span-2 grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="font-bold">المدرس المسئول</Label>
                <Select value={form.teacherId} onValueChange={(v) => {
                  const t = teachers.find(teach => teach.id.toString() === v);
                  setForm({
                    ...form,
                    teacherId: v,
                    subject: t?.subject || "",
                    stage: t?.stage || "",
                    grade: t?.grade.toString() || ""
                  });
                }}>
                  <SelectTrigger className="text-right"><SelectValue placeholder="اختر المدرس" /></SelectTrigger>
                  <SelectContent>
                    {teachers.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.name} ({t.subject})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="font-bold">المرحلة</Label>
                <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v, grade: "" })}>
                  <SelectTrigger className="text-right"><SelectValue placeholder="اختر المرحلة" /></SelectTrigger>
                  <SelectContent>
                    {stageOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="font-bold">الصف</Label>
                <Select value={form.grade} onValueChange={(v) => setForm({ ...form, grade: v })} disabled={!form.stage}>
                  <SelectTrigger className="text-right"><SelectValue placeholder="اختر الصف" /></SelectTrigger>
                  <SelectContent>
                    {form.stage && getGradesForStage(form.stage).map(grade => (
                      <SelectItem key={grade} value={grade.toString()}>{getGradeLabel(form.stage, grade)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 col-span-2">
              <Label className="font-bold">أيام الحصة</Label>
              <div className="flex flex-wrap gap-2 bg-slate-50 p-3 rounded-lg border">
                {WEEK_DAYS.map((day) => {
                  const isSelected = form.days.includes(day);
                  return (
                    <Button
                      key={day}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      className={cn("h-8 text-xs font-bold", isSelected && "bg-blue-600")}
                      onClick={() => {
                        const newDays = isSelected 
                          ? form.days.filter((d: any) => d !== day)
                          : [...form.days, day];
                        setForm({ ...form, days: newDays });
                      }}
                    >
                      {day}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-bold">وقت البدء</Label>
              <Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label className="font-bold">وقت الانتهاء</Label>
              <Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label className="font-bold">القاعة</Label>
              <Select value={form.hallId} onValueChange={(v) => setForm({ ...form, hallId: v })}>
                <SelectTrigger className="text-right"><SelectValue placeholder="اختر القاعة (اختياري)" /></SelectTrigger>
                <SelectContent>
                  {halls.map(h => <SelectItem key={h.id} value={h.id.toString()}>{h.name} (سعة: {h.capacity})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-bold">سعر الحصة للطالب</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" className="pl-10 font-black" />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={resetForm} className="font-bold">إلغاء</Button>
            <Button onClick={handleSave} className="bg-blue-600 font-bold">حفظ البيانات</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* نافذة إدارة القاعات */}
      <Dialog open={isHallDialogOpen} onOpenChange={setIsHallDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="font-black">إدارة قاعات السنتر</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4" dir="rtl">
            <div className="grid grid-cols-3 gap-3 items-end bg-slate-50 p-4 rounded-xl border">
              <div className="space-y-2"><Label className="font-bold">اسم القاعة</Label><Input value={hallForm.name} onChange={(e) => setHallForm({...hallForm, name: e.target.value})} placeholder="قاعة 1" /></div>
              <div className="space-y-2"><Label className="font-bold">السعة</Label><Input type="number" value={hallForm.capacity} onChange={(e) => setHallForm({...hallForm, capacity: e.target.value})} placeholder="50" /></div>
              <div className="space-y-2">
                <Label className="font-bold">النوع</Label>
                <Select value={hallForm.type} onValueChange={(v) => setHallForm({...hallForm, type: v})}>
                  <SelectTrigger><SelectValue placeholder="النوع" /></SelectTrigger>
                  <SelectContent>
                    {hallTypeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSaveHall} className="col-span-3 bg-green-600 font-bold">{editHallId ? "تحديث القاعة" : "إضافة القاعة الجديدة"}</Button>
            </div>

            <Table>
              <TableHeader><TableRow><TableHead className="text-right">القاعة</TableHead><TableHead className="text-right">السعة</TableHead><TableHead className="text-right">النوع</TableHead><TableHead className="text-left">إجراءات</TableHead></TableRow></TableHeader>
              <TableBody>
                {halls.map((hall) => (
                  <TableRow key={hall.id}>
                    <TableCell className="font-bold">{hall.name}</TableCell>
                    <TableCell>{hall.capacity} طالب</TableCell>
                    <TableCell><Badge variant="outline">{hallTypeOptions.find(t => t.value === hall.type)?.label}</Badge></TableCell>
                    <TableCell className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditHallId(hall.id); setHallForm(hall); }}><Edit className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setDeleteHallId(hall.id); setIsHallConfirmOpen(true); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* تأكيد حذف المجموعة */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader className="flex flex-col items-center gap-2 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center"><AlertTriangle className="w-6 h-6 text-red-600" /></div>
            <DialogTitle className="font-black text-xl text-red-600">حذف المجموعة؟</DialogTitle>
          </DialogHeader>
          <p className="text-center font-bold text-slate-500">سيتم حذف المجموعة وبيانات الحضور المرتبطة بها نهائياً. هل أنت متأكد؟</p>
          <DialogFooter className="sm:justify-center gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)} className="font-bold">تراجع</Button>
            <Button variant="destructive" className="font-bold" onClick={() => {
              setGroups(prev => prev.filter(g => g.id !== deleteId));
              setIsConfirmOpen(false);
              toast.success("تم الحذف بنجاح");
            }}>تأكيد الحذف</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* تأكيد حذف القاعة */}
      <Dialog open={isHallConfirmOpen} onOpenChange={setIsHallConfirmOpen}>
        <DialogContent>
          <DialogHeader className="text-center"><DialogTitle className="font-black">حذف القاعة؟</DialogTitle></DialogHeader>
          <p className="text-center font-bold text-slate-500">هل أنت متأكد من حذف هذه القاعة من النظام؟</p>
          <DialogFooter className="sm:justify-center gap-2">
            <Button variant="outline" onClick={() => setIsHallConfirmOpen(false)}>إلغاء</Button>
            <Button variant="destructive" onClick={() => {
              setHalls(prev => prev.filter(h => h.id !== deleteHallId));
              setIsHallConfirmOpen(false);
              toast.success("تم حذف القاعة");
            }}>حذف نهائي</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* نافذة تفاصيل القاعة */}
      <Dialog open={isHallDetailsOpen} onOpenChange={setIsHallDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-black text-xl text-center">تفاصيل القاعة: {selectedHall?.name}</DialogTitle>
          </DialogHeader>
          {selectedHall && (
            <div className="space-y-6 py-4" dir="rtl">
              {/* معلومات أساسية عن القاعة */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-bold text-lg">معلومات القاعة</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-bold">الاسم:</Label>
                    <p className="font-semibold">{selectedHall.name}</p>
                  </div>
                  <div>
                    <Label className="font-bold">عدد المجموعات المضافة:</Label>
                    <p className="font-semibold">{groups.filter(g => g.hallId === selectedHall.id.toString()).length}</p>
                  </div>
                  <div>
                    <Label className="font-bold">سعة الصالة:</Label>
                    <p className="font-semibold">{selectedHall.capacity} طالب</p>
                  </div>
                  <div>
                    <Label className="font-bold">المتبقي من السعة:</Label>
                    {(() => {
                      const hallGroups = groups.filter(g => g.hallId === selectedHall.id.toString());
                      const totalStudents = hallGroups.length; // افتراض أن كل مجموعة تأخذ سعة كاملة (عدد المجموعات)
                      const remaining = selectedHall.capacity - totalStudents;
                      return (
                        <p className={`font-semibold ${remaining > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {remaining > 0 ? `${remaining} طالب متبقي` : 'ممتلئة'}
                        </p>
                      );
                    })()}
                  </div>
                  <div>
                    <Label className="font-bold">النوع:</Label>
                    <Badge variant="outline" className="font-bold">
                      {hallTypeOptions.find(t => t.value === selectedHall.type)?.label}
                    </Badge>
                  </div>
                  <div>
                    <Label className="font-bold">الحالة:</Label>
                    <Badge variant={selectedHall.capacity > groups.filter(g => g.hallId === selectedHall.id.toString()).length ? "default" : "destructive"} className="font-bold">
                      {selectedHall.capacity > groups.filter(g => g.hallId === selectedHall.id.toString()).length ? "متاحة" : "ممتلئة"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* المجموعات المسجلة مع التفاصيل */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-bold text-lg">المجموعات والحصص الموجودة</CardTitle>
                </CardHeader>
                <CardContent>
                  {groups.filter(g => g.hallId === selectedHall.id.toString()).length > 0 ? (
                    <div className="space-y-3">
                      {groups.filter(g => g.hallId === selectedHall.id.toString()).map((group) => (
                        <div key={group.id} className="border rounded-lg p-3 bg-gray-50">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="font-bold">اسم المجموعة:</Label>
                              <p className="font-semibold">{group.name}</p>
                            </div>
                            <div>
                              <Label className="font-bold">المدرس:</Label>
                              <p className="font-semibold">{group.teacherName}</p>
                            </div>
                            <div>
                              <Label className="font-bold">المرحلة والصف:</Label>
                              <p className="font-semibold">{getGradeLabel(group.stage, group.grade)}</p>
                            </div>
                            <div>
  <Label className="font-bold">عدد الطلاب:</Label>
  <p className="font-semibold">
    {(() => {
      // جلب الطلاب من localStorage (افتراض إنك عندك state للطلاب، لو مش موجود، أضفه)
      const students = JSON.parse(localStorage.getItem("students-data") || "[]");
      // عد الطلاب اللي مسجلين في المجموعة دي (بناءً على اسم المجموعة)
      const studentCount = students.filter((student: any) => 
        student.enrolledGroups?.some((g: string) => g.trim() === group.name.trim())
      ).length;
      return studentCount;
    })()}
  </p>
</div>
                            <div>
                              <Label className="font-bold">تاريخ الحصص (الأيام):</Label>
                              <div className="flex flex-wrap gap-1">
                                {group.days.map((d: any) => (
                                  <Badge key={d} variant="secondary" className="text-xs">{d}</Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <Label className="font-bold">أوقات الحصص:</Label>
                              <p className="font-semibold">{formatTime12Hour(group.startTime)} - {formatTime12Hour(group.endTime)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">لا توجد مجموعات مسجلة في هذه القاعة.</p>
                  )}
                </CardContent>
              </Card>

              {/* المدرسين والمراحل والصفوف */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-bold text-lg">المدرسين والمراحل والصفوف</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="font-bold">المدرسين:</Label>
                      <div className="space-y-1">
                        {[...new Set(groups.filter(g => g.hallId === selectedHall.id.toString()).map(g => g.teacherName))].map((teacher) => (
                          <Badge key={teacher} variant="outline" className="block font-semibold">{teacher}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="font-bold">المراحل:</Label>
                      <div className="space-y-1">
                        {[...new Set(groups.filter(g => g.hallId === selectedHall.id.toString()).map(g => stageOptions.find(s => s.value === g.stage)?.label))].map((stage) => (
                          <Badge key={stage} variant="outline" className="block font-semibold">{stage}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="font-bold">الصفوف:</Label>
                      <div className="space-y-1">
                        {[...new Set(groups.filter(g => g.hallId === selectedHall.id.toString()).map(g => getGradeLabel(g.stage, g.grade)))].map((grade) => (
                          <Badge key={grade} variant="outline" className="block font-semibold">{grade}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsHallDetailsOpen(false)} className="font-bold">إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}