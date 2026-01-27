import { useEffect, useState } from "react";
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

const GROUPS_KEY = "groups-data";
const STUDENTS_KEY = "students-data";

export default function Students() {
  const [studentList, setStudentList] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);
  
  // تحديث الفورم لدعم الباكدج وقائمة المواد
  const emptyForm = { 
    name: "", 
    phone: "", 
    parentName: "", 
    parentPhone: "", 
    grade: "", 
    enrolledGroups: [] as string[],
    isPackage: false, 
    packagePrice: "0",
    serial: "" // ✅ سيريال الطالب
  };

  const [form, setForm] = useState(emptyForm);

  useEffect(() => { 
    const s = JSON.parse(localStorage.getItem(STUDENTS_KEY) || "[]"); 
    const g = JSON.parse(localStorage.getItem(GROUPS_KEY) || "[]"); 
    setStudentList(s); 
    setGroups(g); 
  }, []);

  useEffect(() => { 
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(studentList)); 
    window.dispatchEvent(new Event("storage"));
  }, [studentList]);

  const handleSave = () => {
    if (form.enrolledGroups.length === 0 || !form.name) return;
    
    if (editingStudentId) { 
  setStudentList(studentList.map((s) => 
    s.id === editingStudentId 
      ? { ...s, ...form, serial: s.serial || form.serial } 
      : s
  )); 
} else { 
  const newId = Date.now();

  setStudentList([...studentList, { 
    ...form, 
    id: newId,
    serial: form.serial || `ST-${newId}`, // ✅ توليد السيريال
    status: "active", 
    subscriptionDate: new Date().toISOString().split("T")[0],
    createdAt: new Date().toISOString() 
  }]); 
}


    setForm(emptyForm); 
    setEditingStudentId(null); 
    setIsDialogOpen(false);
  };

  const handleDelete = (student: any) => { 
    setStudentList(studentList.filter((s) => s.id !== student.id)); 
  };

  const filteredStudents = studentList.filter((student) => 
    student.name.includes(searchQuery) || 
    student.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">إدارة الطلاب</h1><p className="text-muted-foreground">إدارة المجموعات ونظام الباكدج الشامل</p></div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 font-bold" onClick={() => {setForm(emptyForm); setEditingStudentId(null);}}>
              <Plus className="w-4 h-4" /> إضافة طالب
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-black text-xl">{editingStudentId ? "تعديل بيانات الطالب" : "إضافة طالب جديد"}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4 text-right" dir="rtl">
              <div className="space-y-2"><Label className="font-bold">اسم الطالب</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-2"><Label className="font-bold">رقم الهاتف</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="space-y-2"><Label className="font-bold">اسم ولي الأمر</Label><Input value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} /></div>
              <div className="space-y-2"><Label className="font-bold">هاتف ولي الأمر</Label><Input value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })} /></div>
              
              <div className="col-span-2 space-y-3 border-t pt-4 mt-2">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="isPackage" 
                    checked={form.isPackage} 
                    onCheckedChange={(v) => setForm({ ...form, isPackage: !!v })} 
                  />
                  <Label htmlFor="isPackage" className="font-black text-primary cursor-pointer">تفعيل نظام الباكدج لهذا الطالب</Label>
                </div>

                {form.isPackage && (
                  <div className="bg-primary/5 p-4 rounded-xl border border-dashed border-primary/30 space-y-4">
                    <div className="space-y-2">
                      <Label className="font-bold text-primary">سعر الباكدج (المبلغ المقطوع شهرياً)</Label>
                      <Input type="number" value={form.packagePrice} onChange={(e) => setForm({...form, packagePrice: e.target.value})} className="font-black" />
                    </div>
                  </div>
                )}
              </div>

              <div className="col-span-2 space-y-3 border-t pt-4">
                <Label className="font-bold text-lg text-slate-700">تحديد المواد المشترك بها:</Label>
                <div className="grid grid-cols-2 gap-3">
                  {groups.map((g: any) => (
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
                        <span className="text-[10px] text-muted-foreground">{g.grade}</span>
                      </div>
                    </div>
                  ))}
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

      <Card><CardContent className="pt-6"><div className="relative"><Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" /><Input className="pr-10" placeholder="البحث باسم الطالب أو الهاتف..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div></CardContent></Card>
      
      <Card>
        <CardHeader><CardTitle className="font-black">قائمة الطلاب الملحقين بالمجموعات ({filteredStudents.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow className="bg-muted/50"><TableHead className="text-right font-bold">الطالب</TableHead><TableHead className="text-right font-bold">المواد المشترك بها</TableHead><TableHead className="text-right font-bold">النظام المالي</TableHead><TableHead className="text-right font-bold">الحالة</TableHead><TableHead className="text-left font-bold">إجراءات</TableHead></TableRow></TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id} className="hover:bg-muted/20">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800">{student.name}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone size={10}/> {student.phone}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[250px]">
                      {student.enrolledGroups.map((g: string) => (
                        <Badge key={g} variant="secondary" className="text-[10px] font-medium">{g}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {student.isPackage ? (
                      <Badge className="bg-primary/10 text-primary border-primary/20 font-black">باكدج: {student.packagePrice} ج.م</Badge>
                    ) : (
                      <Badge variant="outline" className="font-bold">دفع لكل مادة</Badge>
                    )}
                  </TableCell>
                  <TableCell><Badge className={student.status === "active" ? "bg-success/10 text-success" : ""}>{student.status === "active" ? "نشط" : "متوقف"}</Badge></TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => { setForm(student); setEditingStudentId(student.id); setIsDialogOpen(true); }}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(student)}><Trash2 className="w-4 h-4" /></Button>
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