import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, Plus, Edit, Trash2, UserCircle, ClipboardCheck, GraduationCap, Info, BookOpen, PenTool } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

// مكون اختيار الوقت بسهولة (Time Picker)
const TimeSelector = ({ label, value, onChange }: any) => {
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = ["00", "15", "30", "45"];
  
  const [h, m, p] = value?.includes(':') 
    ? [value.split(':')[0], value.split(':')[1].split(' ')[0], value.split(' ')[1]] 
    : ["04", "00", "م"];

  const update = (nh: string, nm: string, np: string) => onChange(`${nh}:${nm} ${np}`);

  return (
    <div className="space-y-1 flex-1">
      <Label className="text-[10px] font-black text-slate-500 mr-1">{label}</Label>
      <div className="flex gap-1" dir="ltr">
        <Select value={p} onValueChange={(v) => update(h, m, v)}>
          <SelectTrigger className="h-9 text-xs font-bold border-slate-200 bg-white"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="ص">ص</SelectItem><SelectItem value="م">م</SelectItem></SelectContent>
        </Select>
        <Select value={m} onValueChange={(v) => update(h, v, p)}>
          <SelectTrigger className="h-9 text-xs font-bold border-slate-200 bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>{minutes.map(min => <SelectItem key={min} value={min}>{min}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={h} onValueChange={(v) => update(v, m, p)}>
          <SelectTrigger className="h-9 text-xs font-bold border-slate-200 bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>{hours.map(hr => <SelectItem key={hr} value={hr}>{hr}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default function Sessions() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [form, setForm] = useState<any>({ 
    group: "", teacherName: "", subject: "", groupDays: [], 
    date: new Date().toISOString().split('T')[0], 
    startTime: "04:00 م", endTime: "05:30 م", topic: "", homework: "" 
  });

  // تحميل البيانات
  useEffect(() => { 
    const s = JSON.parse(localStorage.getItem("sessions-data") || "[]"); 
    const g = JSON.parse(localStorage.getItem("groups-data") || "[]"); 
    setSessions(s); setGroups(g); 
  }, []);

  // حفظ التغييرات
  useEffect(() => { 
    localStorage.setItem("sessions-data", JSON.stringify(sessions)); 
  }, [sessions]);

  // دالة تغيير المجموعة وسحب بياناتها
  const handleGroupChange = (groupName: string) => {
    // 1. بندور على المجموعة اللي اخترتها في قائمة المجموعات
    const selectedGroup = groups.find(g => g.name === groupName);
    
    if (selectedGroup) {
      setForm({
        ...form,
        group: groupName,
        teacherName: selectedGroup.teacherName, // سحب المدرس
        subject: selectedGroup.subject,        // سحب المادة
        groupDays: selectedGroup.days || [],   // تأكدت هنا إن الأيام بتتسحب (الحل هنا)
        startTime: selectedGroup.time || "04:00 م"
      });
    }
  };

  // دالة التعديل
  const handleEdit = (session: any) => {
    setForm(session);
    setEditId(session.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // دالة الحذف
  const handleDelete = (id: number) => {
    if (window.confirm("هل أنت متأكد من حذف هذه الحصة؟")) {
      setSessions(prev => prev.filter(s => s.id !== id));
      toast.success("تم حذف الحصة من السجل");
    }
  };

  // دالة الحفظ (إضافة أو تعديل)
  const handleSave = () => { 
    if (!form.group) return toast.error("اختر المجموعة أولاً");

    if (editId) { 
      setSessions(prev => prev.map(s => s.id === editId ? { ...s, ...form } : s));
    } else { 
      setSessions(prev => [...prev, { ...form, id: Date.now() }]); 
    } 

    setShowForm(false);
    setEditId(null);
    setForm({ 
      group: "", teacherName: "", subject: "", groupDays: [], 
      date: new Date().toISOString().split('T')[0], 
      startTime: "04:00 م", endTime: "05:30 م", topic: "", homework: "" 
    });
    toast.success("تم حفظ بيانات الحصة");
  };

  return (
    <div className="space-y-6 pb-10 px-4 max-w-5xl mx-auto" dir="rtl">
      {/* الرأس */}
      <div className="flex items-center justify-between py-6 border-b border-slate-100">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">إدارة الحصص</h1>
          <p className="text-sm font-bold text-slate-400 italic">جدول الدروس الأسبوعي</p>
        </div>
        {!showForm && (
          <Button className="font-black bg-blue-600 hover:bg-blue-700 rounded-2xl px-6 h-12 shadow-lg shadow-blue-100" onClick={() => setShowForm(true)}>
            <Plus className="ml-2 w-5 h-5" /> حصة جديدة
          </Button>
        )}
      </div>

      {/* نموذج الإضافة والتعديل */}
      {showForm && (
        <Card className="border-2 border-blue-100 shadow-xl overflow-hidden animate-in fade-in duration-300">
          <div className="bg-blue-600 p-4 text-white font-black flex justify-between items-center">
            <span>{editId ? "تعديل الحصة" : "إضافة حصة جديدة للمسار"}</span>
          </div>
          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="font-bold">المجموعة</Label>
                <Select value={form.group} onValueChange={handleGroupChange}>
                  <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl font-bold">
                    <SelectValue placeholder="اختر المجموعة" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((g: any) => (<SelectItem key={g.id} value={g.name} className="text-right font-bold">{g.name}</SelectItem>))}
                  </SelectContent>
                </Select>
                {form.groupDays.length > 0 && (
                  <p className="text-[11px] font-black text-blue-600 flex items-center gap-1">
                    <Info size={14}/> أيام المجموعة: {form.groupDays.join(" - ")}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="font-bold">التاريخ</Label>
                <Input type="date" value={form.date} className="h-12 bg-slate-50 border-slate-200 rounded-xl font-bold" onChange={e => setForm({...form, date: e.target.value})} />
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <TimeSelector label="وقت البداية" value={form.startTime} onChange={(v:any) => setForm({...form, startTime: v})} />
              <TimeSelector label="وقت النهاية" value={form.endTime} onChange={(v:any) => setForm({...form, endTime: v})} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-400">موضوع الدرس (اختياري)</Label>
                  <Input value={form.topic} onChange={e => setForm({...form, topic: e.target.value})} className="h-11 font-bold rounded-xl" placeholder="مثال: مراجعة نهائية" />
               </div>
               <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-400">الواجب (اختياري)</Label>
                  <Input value={form.homework} onChange={e => setForm({...form, homework: e.target.value})} className="h-11 font-bold rounded-xl" placeholder="مثال: حل شيت 1" />
               </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button className="flex-1 font-black bg-blue-600 hover:bg-blue-700 h-12 rounded-xl" onClick={handleSave}>حفظ البيانات</Button>
              <Button variant="ghost" className="font-bold text-slate-400" onClick={() => { setShowForm(false); setEditId(null); }}>إلغاء</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* عرض قائمة الحصص المحدثة */}
      <div className="grid gap-4 mt-6">
        {sessions.map((session) => (
          <Card key={session.id} className="group overflow-hidden border-none shadow-sm hover:shadow-md transition-all bg-white ring-1 ring-slate-100">
            <CardHeader className="p-5 pb-3">
              <div className="flex justify-between items-start flex-wrap gap-4">
                <div className="flex gap-4">
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                    <GraduationCap size={30} />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-xl font-black text-slate-800">{session.group}</CardTitle>
                      <Badge className="bg-blue-600 text-white border-none font-bold text-[11px] px-2">
                        {session.subject}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-2 items-center">
                      <span className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg text-[13px] font-black border border-blue-100/50">
                        <Calendar size={14} className="text-blue-500"/> {session.groupDays?.length > 0 ? session.groupDays.join(" - ") : "لم تُحدد أيام"}
                      </span>

                      <span className="flex items-center gap-1 text-slate-400 font-bold text-[12px]">
                        <UserCircle size={14}/> {session.teacherName}
                      </span>

                      <span className="flex items-center gap-1.5 text-slate-700 font-black text-[13px] bg-slate-50 px-2 py-0.5 rounded-md">
                        📅 {session.date}
                      </span>

                      <span className="flex items-center gap-1.5 text-emerald-700 font-black text-[13px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        <Clock size={15}/> {session.startTime} - {session.endTime}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mr-auto">
                  <Button 
  onClick={() => navigate("/attendance", { state: { selectedGroup: session.group } })} 
  className="font-black text-xs h-10 bg-green-600 hover:bg-green-700 shadow-md shadow-green-100 rounded-xl px-4"
>
                    تسجيل حضور
                  </Button>
                  <Button size="icon" variant="ghost" className="h-10 w-10 text-slate-300 hover:text-blue-600" onClick={() => handleEdit(session)}>
                    <Edit size={18}/>
                  </Button>
                  <Button size="icon" variant="ghost" className="h-10 w-10 text-slate-300 hover:text-red-500" onClick={() => handleDelete(session.id)}>
                    <Trash2 size={18}/>
                  </Button>
                </div>
              </div>
            </CardHeader>

            {(session.topic || session.homework) && (
              <CardContent className="px-5 pb-4 pt-0 mt-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                {session.topic && (
                  <div className="bg-slate-50/80 p-2 rounded-lg text-[13px] font-bold text-slate-700 border border-slate-100 flex items-center gap-2">
                    <span className="text-blue-500 font-black">📝 الدرس:</span> {session.topic}
                  </div>
                )}
                {session.homework && (
                  <div className="bg-amber-50/50 p-2 rounded-lg text-[13px] font-bold text-amber-800 border border-amber-100 flex items-center gap-2">
                    <span className="text-amber-500 font-black">🏠 الواجب:</span> {session.homework}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div> {/* قفلة الـ Grid */}
    </div> // قفلة الـ Container الرئيسية
  );
}