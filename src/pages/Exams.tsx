import { useState, useEffect } from "react";
import { GraduationCap, Plus, Trophy, Edit, Trash2, UserCheck, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// إضافة مفاتيح localStorage للمدرسين والمجموعات (زي الكود الأول)
const TEACHERS_KEY = "teachers-data";
const GROUPS_KEY = "groups-data";

// خيارات المراحل والصفوف (زي الكود الأول)
const stageOptions = [
  { value: "primary", label: "ابتدائي" },
  { value: "middle", label: "إعدادي" },
  { value: "high", label: "ثانوي" },
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

// 
export default function Exams() {
  const [exams, setExams] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]); // إضافة حالة للمدرسين
  const [openDialog, setOpenDialog] = useState(false);
  const [openGrading, setOpenGrading] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [editId, setEditId] = useState<number | null>(null);

  // تعديل النموذج: إضافة حقول جديدة للمدرس، المرحلة، الصف، والجروب كـ id بدل name
  const [form, setForm] = useState({
  subject: "",
  content: "",
  groupId: "",
  group: "",      // أضفنا هذا السطر
  teacher: "",
  teacherId: "",  // أضفنا هذا السطر
  stage: "",
  grade: "",
  date: "",
  totalMarks: 0,
  status: "upcoming" as "upcoming"
});

  useEffect(() => {
    const savedExams = JSON.parse(localStorage.getItem("exams-data") || "[]");
    const savedGroups = JSON.parse(localStorage.getItem(GROUPS_KEY) || "[]");
    const savedStudents = JSON.parse(localStorage.getItem("students-data") || "[]");
    const savedTeachers = JSON.parse(localStorage.getItem(TEACHERS_KEY) || "[]"); // جلب المدرسين
    setExams(savedExams);
    setGroups(savedGroups);
    setStudents(savedStudents);
    setTeachers(savedTeachers); // تعيين المدرسين
  }, []);

  const saveToLocal = (updatedExams: any[]) => {
    setExams(updatedExams);
    localStorage.setItem("exams-data", JSON.stringify(updatedExams));
  };

  const handleSave = () => {
    if (editId) {
      const updated = exams.map((e) => (e.id === editId ? { ...e, ...form } : e));
      saveToLocal(updated);
    } else {
      saveToLocal([...exams, { ...form, id: Date.now(), grades: {} }]);
    }
    setOpenDialog(false);
    setEditId(null);
    // إعادة تعيين النموذج
    setForm({
      subject: "",
      content: "",
      groupId: "",
      group: "",
      teacher: "",
      teacherId: "",
      stage: "",
      grade: "",
      date: "",
      totalMarks: 0,
      status: "upcoming"
    });
  }; // <--- هذا القوس كان ناقصاً (إغلاق handleSave)

  const openEdit = (exam: any) => {
    setEditId(exam.id);
    setForm({ ...exam });
    setOpenDialog(true);
  }; // <--- تأكد أن هذا القوس موجود (إغلاق openEdit)

  const updateStudentGrade = (studentId: number, grade: number) => {
    if (!selectedExam) return;
    const updatedGrades = { ...selectedExam.grades, [studentId]: grade };
    const newSelectedExam = { ...selectedExam, grades: updatedGrades, status: "graded" };
    setSelectedExam(newSelectedExam);
    const updatedExams = exams.map(exam => exam.id === selectedExam.id ? newSelectedExam : exam);
    saveToLocal(updatedExams);
  };

  const getTopPerformers = () => {
    const winners: any[] = [];
    exams.forEach(exam => {
      if (exam.grades) {
        Object.entries(exam.grades).forEach(([studentId, grade]) => {
          if (Number(grade) >= exam.totalMarks && exam.totalMarks > 0) {
            const student = students.find(s => s.id.toString() === studentId);
            if (student) winners.push({ id: student.id, name: student.name, subject: exam.subject });
          }
        });
      }
    });
    return Array.from(new Map(winners.map(item => [item['id'], item])).values()).slice(0, 5);
  };

  const topPerformers = getTopPerformers();

  return (
    <div className="space-y-4 text-right" dir="rtl">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-black">مركز الاختبارات والنتائج</h1><p className="text-muted-foreground font-bold italic">إدارة المواد وتقييم الطلاب</p></div>
        <Button className="gap-1 font-black shadow-lg" onClick={() => { setEditId(null); setOpenDialog(true); }}><Plus className="w-3 h-3" /> إضافة امتحان</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <Card className="border-none shadow-xl overflow-hidden">
            <CardHeader className="bg-slate-900 text-white py-3"><CardTitle className="flex items-center gap-1 text-sm font-black"><GraduationCap className="w-4 h-4" /> سجل الامتحانات</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="text-right font-black">المادة والمحتوى</TableHead>
                  <TableHead className="text-right font-black">المجموعة</TableHead>
                  <TableHead className="text-right font-black">المدرس</TableHead> {/* عمود جديد */}
                  <TableHead className="text-right font-black">المرحلة</TableHead> {/* عمود جديد */}
                  <TableHead className="text-right font-black">الصف</TableHead> {/* عمود جديد */}
                  <TableHead className="text-right font-black">التاريخ</TableHead>
                  <TableHead className="text-right font-black">الحالة</TableHead>
                  <TableHead className="text-center font-black">الإجراءات</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {exams.map((exam) => {
                    // جلب بيانات الجروب لعرض التفاصيل
                    const selectedGroup = groups.find(g => g.id.toString() === exam.groupId);
                    return (
                      <TableRow key={exam.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell><div className="flex flex-col"><span className="font-black text-primary">{exam.subject}</span><span className="text-[9px] text-muted-foreground font-bold">{exam.content}</span></div></TableCell>
                        <TableCell><Badge variant="outline" className="font-bold border-primary/20 text-primary">{selectedGroup?.name || "غير محدد"}</Badge></TableCell>
                        <TableCell><Badge variant="outline" className="font-bold">{selectedGroup?.teacherName || "غير محدد"}</Badge></TableCell> {/* عرض المدرس */}
                        <TableCell><Badge variant="outline" className="font-bold">{stageOptions.find(s => s.value === selectedGroup?.stage)?.label || "غير محدد"}</Badge></TableCell> {/* عرض المرحلة */}
                        <TableCell><Badge variant="outline" className="font-bold">{getGradeLabel(selectedGroup?.stage, selectedGroup?.grade) || "غير محدد"}</Badge></TableCell> {/* عرض الصف */}
                        <TableCell className="font-medium text-xs">{exam.date}</TableCell>
                        <TableCell><Badge className={`font-black ${exam.status === "graded" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>{exam.status === "graded" ? "تم الرصد" : "قيد الانتظار"}</Badge></TableCell>
                        <TableCell className="flex gap-1 justify-center">
                          <Button size="sm" variant="outline" className="font-black gap-1 border-green-200 text-green-700" onClick={() => { setSelectedExam(exam); setOpenGrading(true); }}><UserCheck className="w-3 h-3" /> رصد</Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-blue-500" onClick={() => openEdit(exam)}><Edit className="w-3 h-3" /></Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500" onClick={() => saveToLocal(exams.filter(e => e.id !== exam.id))}><Trash2 className="w-3 h-3" /></Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <Card className="border-none shadow-lg bg-gradient-to-br from-amber-50 to-orange-50 border-t-4 border-t-amber-400">
            <CardHeader><CardTitle className="flex items-center gap-1 text-amber-700 font-black"><Trophy className="w-4 h-4" /> لوحة المتفوقين</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {topPerformers.length > 0 ? topPerformers.map((winner, idx) => (
                <div key={idx} className="flex items-center gap-1 p-1 bg-white/60 rounded-lg border border-amber-100">
                  <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-white font-black text-[8px]">{idx + 1}</div>
                  <div className="flex-1 text-right"><p className="font-black text-slate-800 text-[10px] leading-none">{winner.name}</p><p className="text-[8px] font-bold text-amber-600 uppercase tracking-tighter mt-1">مقفل: {winner.subject}</p></div>
                </div>
              )) : <p className="text-[9px] text-center font-bold text-muted-foreground italic py-3">لا يوجد متفوقين بعد</p>}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={openDialog} onOpenChange={(val) => { setOpenDialog(val); if(!val) setEditId(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-black text-lg text-primary text-center">{editId ? "تعديل الامتحان" : "إعداد امتحان جديد"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4 text-right" dir="rtl">
  {/* 1. اختيار المدرس (الأساس) */}
  {/* 1. اختيار المدرس (الأساس) */}
<div className="space-y-1">
  <Label className="font-black text-xs">المدرس المسئول</Label>
  <Select 
    value={form.teacherId} 
    onValueChange={(val) => {
      const selectedTeacher = teachers.find(t => t.id.toString() === val);
      // البحث عن أول مجموعة مرتبطة بهذا المدرس لجلب بيانات المرحلة والصف منها تلقائياً
      const firstGroup = groups.find(g => g.teacherId === val);

      setForm({ 
        ...form, 
        teacherId: val, 
        teacher: selectedTeacher?.name || "",
        subject: selectedTeacher?.subject || "",
        // ملء البيانات تلقائياً إذا وجدت مجموعة
        stage: firstGroup?.stage || "", 
        grade: firstGroup ? `${firstGroup.stage}-${firstGroup.grade}` : "", 
        groupId: firstGroup?.id.toString() || "",
        group: firstGroup?.name || ""
      });
    }}
  >
    <SelectTrigger className="font-bold text-right border-primary/50">
      <SelectValue placeholder="اختر المدرس" />
    </SelectTrigger>
    <SelectContent>
      {teachers.map(t => (
        <SelectItem key={t.id} value={t.id.toString()} className="font-bold">
          {t.name} ({t.subject})
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>

  {/* 2. المرحلة والصف (يتم ملؤهما تلقائياً أو اختيارهما بناءً على المدرس) */}
  <div className="grid grid-cols-2 gap-3">
    <div className="space-y-1">
      <Label className="font-black text-xs">المرحلة</Label>
      <Select 
        value={form.stage} 
        onValueChange={(val) => setForm({ ...form, stage: val, grade: "", groupId: "" })}
        disabled={!form.teacherId}
      >
        <SelectTrigger className="font-bold text-right"><SelectValue placeholder="المرحلة" /></SelectTrigger>
        <SelectContent>
          {stageOptions.map(opt => <SelectItem key={opt.value} value={opt.value} className="font-bold">{opt.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
    <div className="space-y-1">
      <Label className="font-black text-xs">الصف</Label>
      <Select 
        value={form.grade} 
        onValueChange={(val) => setForm({ ...form, grade: val, groupId: "" })}
        disabled={!form.stage}
      >
        <SelectTrigger className="font-bold text-right"><SelectValue placeholder="الصف" /></SelectTrigger>
        <SelectContent>
          {gradeOptions.filter(opt => opt.value.startsWith(form.stage)).map(opt => (
            <SelectItem key={opt.value} value={opt.value} className="font-bold">{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </div>

  {/* 3. اختيار المجموعة (مفلترة بناءً على المدرس والمرحلة والصف) */}
  <div className="space-y-1">
    <Label className="font-black text-xs text-blue-600">المجموعة المتاحة لهذا المدرس والصف</Label>
    <Select 
      value={form.groupId} 
      onValueChange={(val) => {
        const selectedGroup = groups.find(g => g.id.toString() === val);
        setForm({ ...form, groupId: val, group: selectedGroup?.name || "" });
      }}
      disabled={!form.grade}
    >
      <SelectTrigger className="font-bold text-right border-blue-400">
        <SelectValue placeholder={form.grade ? "اختر المجموعة" : "اكمل البيانات السابقة أولاً"} />
      </SelectTrigger>
      <SelectContent>
        {groups
          .filter(g => 
            g.teacherId === form.teacherId && 
            g.stage === form.stage && 
            g.grade.toString() === form.grade.split('-')[1] // توافق مع تنسيق المجموعات
          )
          .map(g => (
            <SelectItem key={g.id} value={g.id.toString()} className="font-bold">{g.name}</SelectItem>
          ))
        }
      </SelectContent>
    </Select>
  </div>

  <hr className="my-1" />

  {/* 4. تفاصيل الامتحان */}
  <div className="space-y-1">
    <Label className="font-black text-xs">محتوى الامتحان</Label>
    <Input className="font-bold h-9" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="مثال: مراجعة الوحدة الأولى" />
  </div>

  <div className="grid grid-cols-2 gap-3">
    <div className="space-y-1">
      <Label className="font-black text-[10px]">التاريخ</Label>
      <Input type="date" className="font-bold h-9" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
    </div>
    <div className="space-y-1">
      <Label className="font-black text-[10px]">الدرجة النهائية</Label>
      <Input type="number" className="font-bold h-9" value={form.totalMarks} onChange={(e) => setForm({ ...form, totalMarks: +e.target.value })} />
    </div>
  </div>

  <Button className="w-full font-black h-10 text-base shadow-lg mt-2" onClick={handleSave}>
    {editId ? "حفظ التعديلات" : "إضافة الامتحان"}
  </Button>
</div>
        </DialogContent>
      </Dialog>

      <Dialog open={openGrading} onOpenChange={setOpenGrading}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-xl">
          <div className="bg-slate-900 p-4 text-white flex justify-between items-center text-right" dir="rtl">
            <div><h2 className="text-lg font-black">{selectedExam?.subject}</h2><p className="text-slate-400 font-bold text-xs">{selectedExam?.group} | {selectedExam?.totalMarks} درجة</p></div>
            <BookOpen className="w-6 h-6 opacity-20" />
          </div>
          <div className="p-4 max-h-[40vh] overflow-y-auto divide-y text-right" dir="rtl">
            {students.filter(s => 
              s.enrolledGroups?.some((g: string) => g.trim() === selectedExam?.group?.trim())
            ).map(student => (
              <div key={student.id} className="py-3 flex items-center justify-between hover:bg-slate-50 px-1 transition-colors rounded-lg">
                <span className="font-black text-slate-800">{student.name}</span>
                <div className="flex items-center gap-1">
                  <Input 
                    type="number" 
                    className="w-16 h-8 text-center font-black border-2 text-base" 
                    value={selectedExam?.grades?.[student.id] ?? ""} 
                    onChange={(e) => updateStudentGrade(student.id, +e.target.value)} 
                  />
                  <span className="font-bold text-muted-foreground text-xs">من {selectedExam?.totalMarks}</span>
                </div>
              </div>
            ))}
            {students.filter(s => s.enrolledGroups?.some((g: string) => g.trim() === selectedExam?.group?.trim())).length === 0 && (
              <p className="text-center py-8 font-bold text-muted-foreground">لا يوجد طلاب مسجلين في هذه المجموعة</p>
            )}
          </div>
          <div className="p-3 bg-slate-50 flex justify-end">
            <Button className="font-black px-8 h-9" onClick={() => setOpenGrading(false)}>حفظ وإغلاق</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}