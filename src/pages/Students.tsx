import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import Barcode from "react-barcode";
import { QrCode, Users } from "lucide-react"; // أيقونة العرض
import { Plus, Search, MoreHorizontal, Eye, Edit, Trash2, Phone, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox"; // تأكد من وجود هذا المكون
import { toast } from 'sonner'; //
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Archive, Trash } from "lucide-react";

const GROUPS_KEY = "groups-data";
// تأكد من هذا السطر في Students.tsx
const STUDENTS_KEY = "students-data"; 

const archiveItem = (student: any) => {
  if (!student) return;
  
  // بنجيب الداتا الحالية
  const allStudents = JSON.parse(localStorage.getItem(STUDENTS_KEY) || "[]");
  
  // بنعدل الطالب ونضيف له تاريخ الأرشفة
  const updatedAll = allStudents.map((s: any) => 
    s.id === student.id ? { ...s, isArchived: true, archivedAt: new Date().toISOString() } : s
  );
  
  // بنحفظ
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(updatedAll));
  
  // بنحدث القائمة اللي قدامنا عشان يختفي
  
  toast.success(`تم نقل ${student.name} للأرشيف`);
};
const TEACHERS_KEY = "teachers-data";

const stageOptions = [
  { value: "primary", label: "ابتدائي" },
  { value: "middle", label: "إعدادي" },
  { value: "high", label: "ثانوي" },
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

export default function Students() {
  // --- الـ States الأساسية (مرة واحدة فقط!) ---
  const [studentList, setStudentList] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);
  const [qrStudent, setQrStudent] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const emptyForm = { 
    name: "", 
    phone: "", 
    parentName: "", 
    parentPhone: "", 
    teacherId: "",
    stage: "",
    grade: "",
    enrolledGroups: [] as string[],
    serial: "" // سيريال الطالب
  };

  const [form, setForm] = useState(emptyForm);
  const [stageFilter, setStageFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [viewingStudent, setViewingStudent] = useState<any>(null);
  useEffect(() => { 
    const s = JSON.parse(localStorage.getItem(STUDENTS_KEY) || "[]"); 
    // بنعرض فقط الطلاب اللي مش متأرشفين في الصفحة دي
    setStudentList(s.filter((student: any) => !student.isArchived)); 
    
    setGroups(JSON.parse(localStorage.getItem(GROUPS_KEY) || "[]")); 
    setTeachers(JSON.parse(localStorage.getItem(TEACHERS_KEY) || "[]"));
  }, []);

  // 1. تحميل البيانات لأول مرة عند فتح الصفحة
useEffect(() => { 
  const refreshData = () => {
    const s = JSON.parse(localStorage.getItem(STUDENTS_KEY) || "[]"); 
    setStudentList(s.filter((student: any) => !student.isArchived)); 
    setGroups(JSON.parse(localStorage.getItem(GROUPS_KEY) || "[]")); 
    setTeachers(JSON.parse(localStorage.getItem(TEACHERS_KEY) || "[]"));
  };

  refreshData();

  // 🟢 الميزان: مراقب التغييرات اللي بتحصل من صفحات تانية (زي الأرشيف)
  window.addEventListener('storage', refreshData);
  return () => window.removeEventListener('storage', refreshData);
}, []);

// 2. حفظ البيانات عند إضافة أو تعديل طالب (مع الحفاظ على الأرشيف)
useEffect(() => { 
  if (studentList.length === 0) {
     // بنشيك لو الـ LocalStorage أصلاً فيه داتا عشان ميمسحش بالغلط
     const existing = JSON.parse(localStorage.getItem(STUDENTS_KEY) || "[]");
     if (existing.length > 0 && studentList.length === 0) return; 
  }
  
  const allStudents = JSON.parse(localStorage.getItem(STUDENTS_KEY) || "[]");
  const archivedOnes = allStudents.filter((s: any) => s.isArchived);
  
  // دمج الحالي مع المؤرشف
  const dataToSave = [...studentList, ...archivedOnes];
  const uniqueData = Array.from(new Map(dataToSave.map(item => [item.id, item])).values());
  
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(uniqueData));
}, [studentList]);

  const handleSave = () => {
    if (form.enrolledGroups.length === 0 || !form.name || !form.teacherId || !form.stage || !form.grade) return;
    
    const selectedTeacher = teachers.find(t => t.id.toString() === form.teacherId);
    
    if (editingStudentId) { 
      setStudentList(studentList.map((s) => 
        s.id === editingStudentId 
          ? { ...s, ...form, teacherName: selectedTeacher?.name || "مدرس غير معروف", serial: s.serial || form.serial } 
          : s
      )); 
    } else { 
      const newId = Date.now();
      setStudentList([...studentList, { 
        ...form, 
        id: newId,
        teacherName: selectedTeacher?.name || "مدرس غير معروف",
        serial: form.serial || `ST-${newId}`,
        status: "active", 
        subscriptionDate: new Date().toISOString().split("T")[0],
        createdAt: new Date().toISOString() 
      }]); 
    }

    setForm(emptyForm); 
    setEditingStudentId(null); 
    setIsDialogOpen(false);
  };

    useEffect(() => { 
    const s = JSON.parse(localStorage.getItem(STUDENTS_KEY) || "[]").filter((student: any) => !student.isArchived); 
    const g = JSON.parse(localStorage.getItem(GROUPS_KEY) || "[]"); 
    const t = JSON.parse(localStorage.getItem(TEACHERS_KEY) || "[]");
    setStudentList(s); 
    setGroups(g); 
    setTeachers(t);
  }, []);

  // 🟢 1. دالة تشغيل نافذة الحذف (المسئولة عن فتح الـ AlertDialog)
  const handleDelete = (student: any) => { 
    setItemToDelete(student);
    setShowDeleteAlert(true);
  };

  // 🟢 2. دالة الأرشفة (المسئولة عن الزرار الأول في النافذة)
  const archiveItem = (student: any) => {
    if (!student) return;
    const allStudents = JSON.parse(localStorage.getItem(STUDENTS_KEY) || "[]");
    const updatedAll = allStudents.map((s: any) => 
      s.id === student.id ? { ...s, isArchived: true, archivedAt: new Date().toISOString() } : s
    );
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(updatedAll));
    setStudentList(updatedAll.filter((s: any) => !s.isArchived));
    toast.success(`تم نقل الطالب ${student.name} للأرشيف`);
    setShowDeleteAlert(false);
  };

  // 🟢 3. دالة الحذف النهائي (المسئولة عن الزرار الثاني في النافذة)
  const permanentlyDelete = (student: any) => {
    if (!student) return;
    const allStudents = JSON.parse(localStorage.getItem(STUDENTS_KEY) || "[]");
    const updatedAll = allStudents.filter((s: any) => s.id !== student.id);
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(updatedAll));
    setStudentList(updatedAll.filter((s: any) => !s.isArchived));
    toast.error("تم حذف الطالب نهائياً من النظام");
    setShowDeleteAlert(false);
  };
  // --- منطق البحث الشامل (يتضمن الآن الباركود والسيريال) ---
  const filteredStudents = studentList.filter((student) => {
  // البحث الشامل الموجود (مش هغيره)
  const searchText = `
    ${student.name} 
    ${student.phone} 
    ${student.teacherName} 
    ${student.parentName}
    ${student.id}
    ${student.serial || ''}
    ${student.enrolledGroups?.join(' ')} 
    ${stageOptions.find(s => s.value === student.stage)?.label || ''}
    ${getGradeLabel(student.stage, student.grade)}
  `.toLowerCase();
  
  const matchSearch = searchText.includes(searchQuery.toLowerCase());
  
  // إضافة الفلترة الجديدة للمرحلة والصف
  const matchStage = stageFilter === "all" || student.stage === stageFilter;
  const matchGrade = gradeFilter === "all" || student.grade?.toString() === gradeFilter;
  
  return matchSearch && matchStage && matchGrade;
});
    
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">إدارة الطلاب</h1><p className="text-muted-foreground">إدارة المجموعات والتسجيل</p></div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 font-bold" onClick={() => {setForm(emptyForm); setEditingStudentId(null);}}>
              <Plus className="w-4 h-4" /> إضافة طالب
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-black text-xl">{editingStudentId ? "تعديل بيانات الطالب" : "إضافة طالب جديد"}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3 py-4 text-right" dir="rtl">
              <div className="space-y-2"><Label className="font-bold">اسم الطالب</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-2"><Label className="font-bold">رقم الهاتف</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="space-y-2"><Label className="font-bold">اسم ولي الأمر</Label><Input value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} /></div>
              <div className="space-y-2"><Label className="font-bold">هاتف ولي الأمر</Label><Input value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })} /></div>
              
              {/* المدرس والمرحلة والصف في صف واحد */}
              <div className="col-span-2 grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="font-bold">المدرس المسئول</Label>
                  <Select value={form.teacherId} onValueChange={(v) => {
                    const t = teachers.find(teach => teach.id.toString() === v);
                    setForm({
                      ...form,
                      teacherId: v,
                      stage: t?.stage || "",
                      grade: t?.grade.toString() || ""  // التعديل هنا: تحويل grade إلى string
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

              {/* البحث عن اسم المادة من قائمة المدرسين بناءً على اسم المدرس المسجل في المجموعة */}
<div className="col-span-2 space-y-3 border-t pt-4">
  <Label className="font-bold text-lg text-slate-700">تحديد المجموعات المشترك بها:</Label>
  <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
    {groups.map((g: any) => {
      // 🟢 البحث عن المدرس المسجل للمجموعة لجلب المادة الخاصة به
      const groupTeacher = teachers.find(t => t.name === g.teacherName);
      const subject = groupTeacher?.subject || "مادة غير محددة";

      return (
        <div key={g.id} className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border hover:border-primary transition-colors cursor-pointer">
          <Checkbox 
            id={`g-${g.id}`} 
            checked={form.enrolledGroups.includes(g.name)}
            onCheckedChange={(checked) => {
              const updated = checked 
                ? [...form.enrolledGroups, g.name]
                : form.enrolledGroups.filter(name => name !== g.name);
              setForm({ ...form, enrolledGroups: updated });
            }}
          />
          <div className="flex flex-col text-right">
            <Label htmlFor={`g-${g.id}`} className="font-bold text-sm cursor-pointer">{g.name}</Label>
            {/* 🟢 عرض المادة بجانب الصف */}
            <span className="text-[10px] text-muted-foreground font-bold">
               {subject} - {getGradeLabel(g.stage, g.grade)}
            </span>
          </div>
        </div>
      );
    })}
  </div>
</div>

              <div className="col-span-2 flex justify-end gap-2 mt-6 border-t pt-4">
                <Button variant="outline" className="font-bold" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
                <Button className="font-black px-8" onClick={handleSave}>{editingStudentId ? "حفظ التعديلات" : "تأكيد تسجيل الطالب"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
          {/* البحث والفلترة الشاملة (مستخرج من صفحة المجموعات ومعدل للطلاب) */}
<div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border">
  {/* البحث هنا مباشرة بدون Card، عشان يبقى كبير وطبيعي */}
  <div className="relative flex-1">
    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
    <Input 
      placeholder="البحث باسم الطالب أو الباركود أو الهاتف او المدرس او المجموعه ..." 
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
      <Card>
  <CardHeader>
    <CardTitle className="font-black">قائمة الطلاب الملحقين بالمجموعات ({filteredStudents.length})</CardTitle>
  </CardHeader>
  <CardContent>
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50">
          <TableHead className="text-right font-bold">كود الطالب</TableHead>
          <TableHead className="text-right font-bold">الطالب</TableHead>
          <TableHead className="text-right font-bold">المدرس</TableHead>
          <TableHead className="text-right font-bold">المرحلة والصف</TableHead>
          <TableHead className="text-right font-bold">المجموعات</TableHead>
          <TableHead className="text-right font-bold">تاريخ الانضمام</TableHead>
          <TableHead className="text-right font-bold">الحالة</TableHead>
          <TableHead className="text-left font-bold">إجراءات</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredStudents.map((student) => (
          <TableRow key={student.id} className="hover:bg-muted/20">
            {/* 1. كود الطالب */}
            <TableCell>
              <div className="flex items-center gap-2 bg-slate-100 w-fit px-2 py-1 rounded border border-slate-300">
                <span className="font-mono text-xs font-black text-blue-800">
                  {student.serial || `ST-${student.id}`}
                </span>
              </div>
            </TableCell>

            {/* 2. اسم الطالب وهاتفه - مع منطق جلب البيانات المطور */}
            <TableCell>
              <div 
                className="flex flex-col cursor-pointer group"
                onClick={() => {
  // 1. جلب البيانات الخام من LocalStorage
  const allFinance = JSON.parse(localStorage.getItem("finance-transactions") || "[]");
  const allAttendance = JSON.parse(localStorage.getItem("attendance-data") || "{}");
  const allTeachers = JSON.parse(localStorage.getItem("teachers-data") || "[]");
  const allGroups = JSON.parse(localStorage.getItem("groups-data") || "[]");

  // 2. جلب المدفوعات (تصفية دقيقة)
  const studentFinance = allFinance.filter((f: any) => {
    const matchId = f.student && f.student.toString() === student.id.toString();
    const matchNameInDesc = f.description && f.description.includes(student.name);
    return matchId || matchNameInDesc;
  });

  // 3. جلب المدرسين والمواد المشترك بها
  const teachersAndSubjects = (student.enrolledGroups || []).map((groupName: string) => {
    const groupInfo = allGroups.find((g: any) => g.name === groupName);
    const teacherInfo = allTeachers.find((t: any) => t.name === (groupInfo?.teacherName || student.teacherName));
    return {
      groupName: groupName,
      teacherName: groupInfo?.teacherName || student.teacherName || "غير محدد",
      subject: teacherInfo?.subject || "مادة تعليمية"
    };
  });

  // 4. جلب سجل الحضور المصلح (يدعم هيكلة التاريخ)
  let studentAttendance: any[] = [];
  
  // نمر على كل التواريخ المسجلة في الحضور
  Object.keys(allAttendance).forEach((dateKey) => {
    const dailyRecords = allAttendance[dateKey]; // مستوى التاريخ
    
    // نمر على كل المجموعات داخل هذا التاريخ
    Object.keys(dailyRecords).forEach((groupName) => {
      const groupStudents = dailyRecords[groupName]; // مستوى المجموعة
      
      // نتحقق إذا كان الطالب موجوداً في هذه المجموعة في هذا اليوم
      if (groupStudents[student.id]) {
        studentAttendance.push({
          date: dateKey,
          group: groupName,
          ...groupStudents[student.id]
        });
      }
    });
  });

  // ترتيب الحضور من الأحدث للأقدم
  studentAttendance.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // تحديث الحالة لعرض المودال
  setViewingStudent({ 
    ...student, 
    studentFinance, 
    studentAttendance,
    teachersAndSubjects 
  });
}}
              >
                <span className="font-bold text-slate-800 group-hover:text-blue-600 group-hover:underline transition-all">
                  {student.name}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone size={10} /> {student.phone}
                </span>
              </div>
            </TableCell>

            {/* 3. المدرس */}
            <TableCell>
              <span className="font-bold">{student.teacherName}</span>
            </TableCell>

            {/* 4. المرحلة والصف */}
            <TableCell>
              <span className="font-bold">{getGradeLabel(student.stage, student.grade)}</span>
            </TableCell>

            {/* 5. المجموعات المشترك بها */}
            <TableCell>
              <div className="flex flex-wrap gap-1 max-w-[200px]">
                {student.enrolledGroups.map((g: string) => (
                  <Badge key={g} variant="secondary" className="text-[10px] font-medium">
                    {g}
                  </Badge>
                ))}
              </div>
            </TableCell>

            {/* 6. تاريخ الانضمام */}
            <TableCell>
              <span className="text-sm font-medium text-slate-600">
                {student.subscriptionDate || "—"}
              </span>
            </TableCell>

            {/* 7. الحالة */}
            <TableCell>
              <Badge className={student.status === "active" ? "bg-success/10 text-success" : "bg-slate-100 text-slate-500"}>
                {student.status === "active" ? "نشط" : "متوقف"}
              </Badge>
            </TableCell>

            {/* 8. الإجراءات */}
            <TableCell>
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                  onClick={() => setQrStudent(student)}
                >
                  <QrCode className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-primary"
                  onClick={() => {
                    setForm(student);
                    setEditingStudentId(student.id);
                    setIsDialogOpen(true);
                  }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:bg-red-50"
                  onClick={() => handleDelete(student)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </CardContent>
</Card>

    {/* مودال كارت الطالب */}
    <Dialog open={!!qrStudent} onOpenChange={() => setQrStudent(null)}>
      <DialogContent className="sm:max-w-[500px] text-center p-6">
        {qrStudent && (
          <div className="flex flex-col items-center gap-4" dir="rtl">
            <div className="flex gap-3 bg-white p-4 rounded-xl border shadow-sm">
              <div className="flex flex-col items-center gap-1">
                <Label className="font-bold text-[10px] text-slate-500 uppercase">QR Code (ID)</Label>
                <QRCodeCanvas size={120} value={qrStudent.id.toString()} />
              </div>
              <div className="flex flex-col items-center gap-1 border-r pr-4 border-slate-100">
                <Label className="font-bold text-[10px] text-slate-500 uppercase">Barcode (Serial)</Label>
                <Barcode 
                  value={qrStudent.serial || `ST-${qrStudent.id}`} 
                  width={1.5} 
                  height={45} 
                  fontSize={12} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-black text-2xl text-slate-900">{qrStudent.name}</p>
              <div className="flex flex-col gap-1">
                <Badge variant="outline" className="w-fit mx-auto bg-blue-50 text-blue-700 border-blue-200 font-black">
                  {getGradeLabel(qrStudent.stage, qrStudent.grade)}
                </Badge>
                <p className="text-xs text-slate-500 font-bold">المدرس: {qrStudent.teacherName}</p>
              </div>
            </div>
            <Button className="w-full font-black bg-slate-900 hover:bg-slate-800 h-11" onClick={() => window.print()}>طباعة الكارت</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* نافذة تأكيد الحذف */}
    <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
      <AlertDialogContent className="text-right" dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-black flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-500" /> حذف الطالب: {itemToDelete?.name}
          </AlertDialogTitle>
          <AlertDialogDescription className="py-4 font-bold text-slate-600">
            هل تريد نقل الطالب إلى الأرشيف للرجوع إليه لاحقاً، أم حذفه نهائياً؟
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-row-reverse justify-start gap-2 border-t pt-4">
          <Button variant="default" onClick={() => archiveItem(itemToDelete)} className="bg-blue-600 hover:bg-blue-700 font-black gap-2">
            <Archive className="w-4 h-4" /> نقل للأرشيف
          </Button>
          <Button variant="ghost" onClick={() => permanentlyDelete(itemToDelete)} className="text-red-500 hover:bg-red-50 font-black">
            حذف نهائي
          </Button>
          <AlertDialogCancel className="font-bold border-none">إلغاء</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* نافذة ملف الطالب الشامل */}
    <Dialog open={!!viewingStudent} onOpenChange={() => setViewingStudent(null)}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader className="border-b pb-4 flex flex-row items-center justify-between">
          <DialogTitle className="text-2xl font-black flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p>{viewingStudent?.name}</p>
              <p className="text-xs text-slate-500 font-bold tracking-widest uppercase">كود: {viewingStudent?.serial || viewingStudent?.id}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 text-right">
          {/* 1. البيانات والمواد */}
          <div className="space-y-4">
            <h3 className="font-black text-blue-600 border-r-4 border-blue-600 pr-2 text-sm text-right">المواد والمدرسين</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {viewingStudent?.teachersAndSubjects?.map((item: any, idx: number) => (
                <div key={idx} className="bg-green-50 p-2 rounded-lg border border-green-100 flex justify-between items-center">
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] text-green-600 font-bold">المادة</span>
                    <span className="text-xs font-black">{item.subject}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-slate-500 font-bold">المدرس</span>
                    <span className="text-xs font-bold text-slate-700">{item.teacherName}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <h3 className="font-black text-slate-600 border-r-4 border-slate-600 pr-2 text-sm text-right mt-4">بيانات التواصل</h3>
            <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-2 border">
               <div className="flex justify-between"><span className="text-slate-500 font-bold">ولي الأمر:</span> <span className="font-black">{viewingStudent?.parentName || '---'}</span></div>
               <div className="flex justify-between"><span className="text-slate-500 font-bold">هاتف الطوارئ:</span> <span className="font-black">{viewingStudent?.parentPhone || '---'}</span></div>
            </div>
          </div>

          {/* 2. سجل الحضور */}
          <div className="space-y-4">
            <h3 className="font-black text-amber-600 border-r-4 border-amber-600 pr-2 text-sm text-right">سجل الحضور</h3>
            <div className="bg-slate-50 rounded-2xl border overflow-hidden">
              <Table>
                <TableBody>
                  {viewingStudent?.studentAttendance?.length > 0 ? viewingStudent.studentAttendance.slice(-5).reverse().map((att: any, i: number) => (
                    <TableRow key={i} className="text-[10px]">
                      <TableCell className="font-bold">{att.date}</TableCell>
                      <TableCell className="text-slate-500 text-center">{att.group}</TableCell>
                      <TableCell className="text-left">
                        <Badge variant="outline" className={att.status === 'present' ? "text-green-600 border-green-200" : "text-red-600 border-red-200"}>
                          {att.status === 'present' ? 'حاضر' : 'غائب'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )) : <TableRow><TableCell className="text-center text-slate-400 py-10 font-bold">لا توجد سجلات</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* 3. السجل المالي */}
          <div className="space-y-4">
            <h3 className="font-black text-purple-600 border-r-4 border-purple-600 pr-2 text-sm text-right">المدفوعات المالية</h3>
            <div className="bg-slate-50 rounded-2xl border overflow-hidden">
              <Table>
                <TableBody>
                  {viewingStudent?.studentFinance?.length > 0 ? viewingStudent.studentFinance.slice(-5).reverse().map((fin: any, i: number) => (
                    <TableRow key={i} className="text-[10px]">
                      <TableCell className="font-bold">{fin.date}</TableCell>
                      <TableCell className="font-black text-purple-700 text-center">{fin.amount} ج</TableCell>
                      <TableCell className="text-[9px] text-left truncate max-w-[80px]">{fin.description || 'مصاريف'}</TableCell>
                    </TableRow>
                  )) : <TableRow><TableCell className="text-center text-slate-400 py-10 font-bold">لا توجد مدفوعات</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
        
        <div className="border-t pt-4">
            <Button className="w-full font-black bg-slate-900 h-11" onClick={() => setViewingStudent(null)}>إغلاق الملف</Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
  );
}