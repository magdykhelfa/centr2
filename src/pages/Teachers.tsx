import { useState, useEffect } from "react";
import { Phone, Eye, Edit, Trash2, Plus, GraduationCap, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Teacher {
  id: string;
  name: string;
  phone: string;
  subject: string;
  stage: "primary" | "middle" | "high";
  grade: number;
  contractType: "percentage" | "per-session" | "fixed";
  status: "active" | "inactive";
  joinDate: string;
}

const stageOptions = [
  { value: "primary", label: "ابتدائي" },
  { value: "middle", label: "إعدادي" },
  { value: "high", label: "ثانوي" },
];

const getGradeLabel = (stage: string, grade: number) => {
  const stageLabel = stageOptions.find(s => s.value === stage)?.label;
  const ordinals = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس"];
  return `الصف ${ordinals[grade - 1]} ${stageLabel}`;
};

const getGradeOptions = (stage: string) => {
  const length = stage === "primary" ? 6 : 3;
  return Array.from({ length }, (_, i) => ({
    value: i + 1,
    label: getGradeLabel(stage, i + 1)
  }));
};

export default function CenterTeachers() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const saved = localStorage.getItem("teachers-data");
    return saved ? JSON.parse(saved) : [];
  });

  const [form, setForm] = useState({
    name: "",
    phone: "",
    subject: "",
    stage: "primary" as Teacher["stage"],
    grade: 1,
    contractType: "percentage" as Teacher["contractType"],
    joinDate: new Date().toISOString().split('T')[0],
  });

  const [gradeOptions, setGradeOptions] = useState(getGradeOptions(form.stage));

  useEffect(() => {
    const options = getGradeOptions(form.stage);
    setGradeOptions(options);
    if (!options.some(opt => opt.value === form.grade)) {
      setForm(prev => ({ ...prev, grade: options[0]?.value || 1 }));
    }
  }, [form.stage]);

  useEffect(() => {
    localStorage.setItem("teachers-data", JSON.stringify(teachers));
    window.dispatchEvent(new Event("storage"));
  }, [teachers]);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
    setForm({
      name: "",
      phone: "",
      subject: "",
      stage: "primary",
      grade: 1,
      contractType: "percentage",
      joinDate: new Date().toISOString().split('T')[0],
    });
  };

  const startEdit = (teacher: Teacher) => {
    setEditId(teacher.id);
    setForm({
      name: teacher.name,
      phone: teacher.phone,
      subject: teacher.subject,
      stage: teacher.stage,
      grade: teacher.grade,
      contractType: teacher.contractType,
      joinDate: teacher.joinDate || new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const handleSaveTeacher = () => {
    if (!form.name || !form.subject) {
      alert("برجاء إدخال الاسم والمادة");
      return;
    }

    if (editId) {
      setTeachers(teachers.map(t => t.id === editId ? { ...t, ...form } : t));
    } else {
      const newTeacher: Teacher = {
        id: Math.random().toString(36).substr(2, 9),
        ...form,
        status: "active",
      };
      setTeachers([...teachers, newTeacher]);
    }
    closeModal();
  };

  const deleteTeacher = (id: string) => {
    if(confirm("هل أنت متأكد من حذف هذا المدرس؟ سيؤثر ذلك على حسابات المجموعات المرتبطة به.")) {
      setTeachers(teachers.filter(t => t.id !== id));
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border">
        <div>
          <h1 className="text-2xl font-black text-slate-800">إدارة المدرسين والعقود</h1>
          <p className="text-muted-foreground font-bold text-sm">حدد نوع التعاقد (نسبة، حصة، أو راتب)</p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={(open) => { if(!open) closeModal(); else setIsModalOpen(true); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 font-black bg-slate-900">
              <Plus className="w-4 h-4" /> إضافة مدرس جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="text-right">
            <DialogHeader>
              <DialogTitle className="font-black text-xl text-right">
                {editId ? "تعديل بيانات المدرس" : "إضافة مدرس جديد للسنتر"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4 text-right">
              <div className="space-y-1.5">
                <Label className="font-bold">اسم المدرس</Label>
                <Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="أدخل اسم المدرس الكامل" className="font-bold text-right" />
              </div>
              <div className="space-y-1.5 text-right">
                <Label className="font-bold">تاريخ الانضمام</Label>
                <Input type="date" value={form.joinDate} onChange={(e) => setForm({...form, joinDate: e.target.value})} className="font-bold text-right" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 text-right">
                  <Label className="font-bold">رقم الهاتف</Label>
                  <Input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} placeholder="01xxxxxxxxx" className="font-bold text-right" />
                </div>
                <div className="space-y-1.5 text-right">
                  <Label className="font-bold">المادة</Label>
                  <Input value={form.subject} onChange={(e) => setForm({...form, subject: e.target.value})} placeholder="المادة" className="font-bold text-right" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 text-right">
                  <Label className="font-bold">المرحلة</Label>
                  <Select value={form.stage} onValueChange={(v: any) => setForm({...form, stage: v})}>
                    <SelectTrigger className="font-bold text-right"><SelectValue /></SelectTrigger>
                    <SelectContent className="text-right font-bold">
                      {stageOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 text-right">
                  <Label className="font-bold">الصف</Label>
                  <Select value={form.grade.toString()} onValueChange={(v: any) => setForm({...form, grade: Number(v)})}>
                    <SelectTrigger className="font-bold text-right"><SelectValue /></SelectTrigger>
                    <SelectContent className="text-right font-bold">
                      {gradeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value.toString()}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5 text-right">
                <Label className="font-bold">نوع التعاقد</Label>
                <Select value={form.contractType} onValueChange={(v: any) => setForm({...form, contractType: v})}>
                  <SelectTrigger className="font-bold text-right"><SelectValue /></SelectTrigger>
                  <SelectContent className="text-right font-bold">
                    <SelectItem value="percentage">نسبة من تحصيل الطلاب (%)</SelectItem>
                    <SelectItem value="per-session">أجر ثابت عن الحصة الواحدة</SelectItem>
                    <SelectItem value="fixed">راتب شهري ثابت</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSaveTeacher} className="w-full font-black text-lg py-6 mt-2 bg-blue-600 hover:bg-blue-700">
                {editId ? "حفظ التعديلات" : "تأكيد الإضافة"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-xl bg-white overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="text-right font-black">اسم المدرس</TableHead>
                <TableHead className="text-right font-black">رقم الهاتف</TableHead>
                <TableHead className="text-right font-black">المادة</TableHead>
                <TableHead className="text-right font-black">المرحلة</TableHead>
                <TableHead className="text-right font-black">الصف</TableHead>
                <TableHead className="text-right font-black">نوع التعاقد</TableHead>
                <TableHead className="text-right font-black">تاريخ الانضمام</TableHead>
                <TableHead className="text-right font-black">الحالة</TableHead>
                <TableHead className="text-left font-black">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map((teacher) => (
                <TableRow key={teacher.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-black text-slate-800">{teacher.name}</TableCell>
                  <TableCell className="font-bold text-slate-700">{teacher.phone}</TableCell>
                  <TableCell className="font-bold text-slate-700">{teacher.subject}</TableCell>
                  <TableCell className="font-bold text-slate-700">
                    {stageOptions.find(s => s.value === teacher.stage)?.label}
                  </TableCell>
                  <TableCell className="font-bold text-slate-700">
                    {getGradeLabel(teacher.stage, teacher.grade)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-bold">
                      {teacher.contractType === "percentage" ? "نسبة" : teacher.contractType === "per-session" ? "بالحصة" : "راتب"}
                    </Badge>
                  </TableCell>
                  {/* عمود تاريخ الانضمام */}
                  <TableCell className="font-bold text-slate-600 text-sm">
                    {teacher.joinDate || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("font-bold text-[10px]", teacher.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600")}>
                      {teacher.status === "active" ? "نشط" : "غير نشط"}
                    </Badge>
                  </TableCell>
                  
                  {/* عمود الإجراءات في النهاية */}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(teacher)} className="h-8 w-8 text-blue-600 hover:bg-blue-50">
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteTeacher(teacher.id)} className="h-8 w-8 text-red-400 hover:text-red-600">
                        <Trash2 size={16} />
                      </Button>
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