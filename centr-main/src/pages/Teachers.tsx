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
  contractType: "percentage" | "per-session" | "fixed";
  rate: number;
  status: "active" | "inactive";
}

export default function CenterTeachers() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null); // حالة لمعرفة هل نحن في وضع التعديل
  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const saved = localStorage.getItem("teachers-data");
    return saved ? JSON.parse(saved) : [];
  });

  const [form, setForm] = useState({
    name: "",
    phone: "",
    subject: "",
    contractType: "percentage" as Teacher["contractType"],
    rate: 0
  });

  useEffect(() => {
    localStorage.setItem("teachers-data", JSON.stringify(teachers));
    window.dispatchEvent(new Event("storage"));
  }, [teachers]);

  // دالة الحفظ (إضافة أو تعديل)
  const handleSaveTeacher = () => {
    if (!form.name || !form.subject) {
      alert("برجاء إدخال الاسم والمادة");
      return;
    }

    if (editId) {
      // وضع التعديل
      setTeachers(teachers.map(t => t.id === editId ? { ...t, ...form } : t));
    } else {
      // وضع الإضافة
      const newTeacher: Teacher = {
        id: Math.random().toString(36).substr(2, 9),
        ...form,
        status: "active",
      };
      setTeachers([...teachers, newTeacher]);
    }

    closeModal();
  };

  const startEdit = (teacher: Teacher) => {
    setEditId(teacher.id);
    setForm({
      name: teacher.name,
      phone: teacher.phone,
      subject: teacher.subject,
      contractType: teacher.contractType,
      rate: teacher.rate
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
    setForm({ name: "", phone: "", subject: "", contractType: "percentage", rate: 0 });
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
          <p className="text-muted-foreground font-bold text-sm">حدد طريقة الحساب (نسبة، حصة، أو راتب)</p>
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
              <div className="grid grid-cols-2 gap-4 border-t pt-4">
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
                <div className="space-y-1.5 text-right">
                  <Label className="font-bold">القيمة (بالنسبة أو الجنيه)</Label>
                  <Input 
                    type="number" 
                    value={form.rate} 
                    disabled={form.contractType === 'fixed'}
                    onChange={(e) => setForm({...form, rate: Number(e.target.value)})} 
                    className={cn("font-black text-right", form.contractType === 'fixed' && "bg-slate-100 opacity-50")} 
                  />
                  {form.contractType === 'fixed' && <p className="text-[10px] text-red-500 font-bold">الراتب الثابت يتم صرفه يدوياً من المالية</p>}
                </div>
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
                <TableHead className="text-right font-black">المدرس والمادة</TableHead>
                <TableHead className="text-right font-black">طريقة المحاسبة</TableHead>
                <TableHead className="text-right font-black">القيمة</TableHead>
                <TableHead className="text-right font-black">الحالة</TableHead>
                <TableHead className="text-left font-black">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map((teacher) => (
                <TableRow key={teacher.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-black text-slate-800">{teacher.name}</span>
                      <span className="text-xs font-bold text-blue-600">{teacher.subject}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-bold">
                      {teacher.contractType === "percentage" ? "نسبة" : teacher.contractType === "per-session" ? "بالحصة" : "راتب شهري"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-black text-sm text-emerald-600">
                      {teacher.contractType === 'fixed' ? "---" : `${teacher.rate}${teacher.contractType === "percentage" ? "%" : " ج"}`}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("font-bold text-[10px]", teacher.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600")}>
                      {teacher.status === "active" ? "نشط" : "غير نشط"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(teacher)} className="h-8 w-8 text-blue-600 hover:bg-blue-50"><Edit size={16} /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteTeacher(teacher.id)} className="h-8 w-8 text-red-400 hover:text-red-600"><Trash2 size={16} /></Button>
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