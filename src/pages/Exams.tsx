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

export default function Exams() {
  const [exams, setExams] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openGrading, setOpenGrading] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [editId, setEditId] = useState<number | null>(null);

  const [form, setForm] = useState({
    subject: "",
    content: "",
    group: "",
    date: new Date().toISOString().split("T")[0],
    totalMarks: 0,
    status: "upcoming" as const,
  });

  useEffect(() => {
    const savedExams = JSON.parse(localStorage.getItem("exams-data") || "[]");
    const savedGroups = JSON.parse(localStorage.getItem("groups-data") || "[]");
    const savedStudents = JSON.parse(localStorage.getItem("students-data") || "[]");
    setExams(savedExams);
    setGroups(savedGroups);
    setStudents(savedStudents);
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
    setForm({ subject: "", content: "", group: "", date: new Date().toISOString().split("T")[0], totalMarks: 0, status: "upcoming" });
  };

  const openEdit = (exam: any) => {
    setEditId(exam.id);
    setForm({ ...exam });
    setOpenDialog(true);
  };

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
    <div className="space-y-6 text-right" dir="rtl">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-black">مركز الاختبارات والنتائج</h1><p className="text-muted-foreground font-bold italic">إدارة المواد وتقييم الطلاب</p></div>
        <Button className="gap-2 font-black shadow-lg" onClick={() => { setEditId(null); setOpenDialog(true); }}><Plus className="w-4 h-4" /> إضافة امتحان</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="border-none shadow-xl overflow-hidden">
            <CardHeader className="bg-slate-900 text-white py-4"><CardTitle className="flex items-center gap-2 text-md font-black"><GraduationCap className="w-5 h-5" /> سجل الامتحانات</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="text-right font-black">المادة والمحتوى</TableHead>
                  <TableHead className="text-right font-black">المجموعة</TableHead>
                  <TableHead className="text-right font-black">التاريخ</TableHead>
                  <TableHead className="text-right font-black">الحالة</TableHead>
                  <TableHead className="text-center font-black">الإجراءات</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {exams.map((exam) => (
                    <TableRow key={exam.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell><div className="flex flex-col"><span className="font-black text-primary">{exam.subject}</span><span className="text-[10px] text-muted-foreground font-bold">{exam.content}</span></div></TableCell>
                      <TableCell><Badge variant="outline" className="font-bold border-primary/20 text-primary">{exam.group}</Badge></TableCell>
                      <TableCell className="font-medium text-xs">{exam.date}</TableCell>
                      <TableCell><Badge className={`font-black ${exam.status === "graded" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>{exam.status === "graded" ? "تم الرصد" : "قيد الانتظار"}</Badge></TableCell>
                      <TableCell className="flex gap-2 justify-center">
                        <Button size="sm" variant="outline" className="font-black gap-1 border-green-200 text-green-700" onClick={() => { setSelectedExam(exam); setOpenGrading(true); }}><UserCheck className="w-3 h-3" /> رصد</Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-500" onClick={() => openEdit(exam)}><Edit className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => saveToLocal(exams.filter(e => e.id !== exam.id))}><Trash2 className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-none shadow-lg bg-gradient-to-br from-amber-50 to-orange-50 border-t-4 border-t-amber-400">
            <CardHeader><CardTitle className="flex items-center gap-2 text-amber-700 font-black"><Trophy className="w-5 h-5" /> لوحة المتفوقين</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {topPerformers.length > 0 ? topPerformers.map((winner, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-white/60 rounded-lg border border-amber-100">
                  <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center text-white font-black text-[10px]">{idx + 1}</div>
                  <div className="flex-1 text-right"><p className="font-black text-slate-800 text-[11px] leading-none">{winner.name}</p><p className="text-[9px] font-bold text-amber-600 uppercase tracking-tighter mt-1">مقفل: {winner.subject}</p></div>
                </div>
              )) : <p className="text-[10px] text-center font-bold text-muted-foreground italic py-4">لا يوجد متفوقين بعد</p>}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={openDialog} onOpenChange={(val) => { setOpenDialog(val); if(!val) setEditId(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-black text-xl text-primary text-center">{editId ? "تعديل الامتحان" : "إعداد امتحان جديد"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4 text-right">
            <div className="space-y-1"><Label className="font-black text-sm">اسم المادة</Label><Input className="font-bold h-10" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
            <div className="space-y-1"><Label className="font-black text-sm">محتوى الامتحان</Label><Textarea className="font-bold resize-none h-20" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
            <div className="space-y-1"><Label className="font-black text-sm">المجموعة</Label><Select value={form.group} onValueChange={(val) => setForm({ ...form, group: val })}><SelectTrigger className="font-bold text-right"><SelectValue placeholder="اختر المجموعة" /></SelectTrigger><SelectContent>{groups.map(g => <SelectItem key={g.id} value={g.name} className="font-bold">{g.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1"><Label className="font-black text-xs">التاريخ</Label><Input type="date" className="font-bold" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
               <div className="space-y-1"><Label className="font-black text-xs">الدرجة النهائية</Label><Input type="number" className="font-bold" value={form.totalMarks} onChange={(e) => setForm({ ...form, totalMarks: +e.target.value })} /></div>
            </div>
            <Button className="w-full font-black h-12 text-lg shadow-lg mt-2" onClick={handleSave}>{editId ? "حفظ التعديلات" : "إضافة الامتحان"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openGrading} onOpenChange={setOpenGrading}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl">
          <div className="bg-slate-900 p-6 text-white flex justify-between items-center text-right" dir="rtl">
            <div><h2 className="text-xl font-black">{selectedExam?.subject}</h2><p className="text-slate-400 font-bold text-sm">{selectedExam?.group} | {selectedExam?.totalMarks} درجة</p></div>
            <BookOpen className="w-8 h-8 opacity-20" />
          </div>
          <div className="p-6 max-h-[50vh] overflow-y-auto divide-y text-right" dir="rtl">
            {students.filter(s => 
              s.enrolledGroups?.some((g: string) => g.trim() === selectedExam?.group?.trim())
            ).map(student => (
              <div key={student.id} className="py-4 flex items-center justify-between hover:bg-slate-50 px-2 transition-colors rounded-lg">
                <span className="font-black text-slate-800">{student.name}</span>
                <div className="flex items-center gap-2">
                  <Input 
                    type="number" 
                    className="w-20 h-10 text-center font-black border-2 text-lg" 
                    value={selectedExam?.grades?.[student.id] ?? ""} 
                    onChange={(e) => updateStudentGrade(student.id, +e.target.value)} 
                  />
                  <span className="font-bold text-muted-foreground text-xs">من {selectedExam?.totalMarks}</span>
                </div>
              </div>
            ))}
            {students.filter(s => s.enrolledGroups?.some((g: string) => g.trim() === selectedExam?.group?.trim())).length === 0 && (
              <p className="text-center py-10 font-bold text-muted-foreground">لا يوجد طلاب مسجلين في هذه المجموعة</p>
            )}
          </div>
          <div className="p-4 bg-slate-50 flex justify-end">
            <Button className="font-black px-10 h-11" onClick={() => setOpenGrading(false)}>حفظ وإغلاق</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}