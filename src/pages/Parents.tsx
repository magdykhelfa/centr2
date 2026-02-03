import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { 
  Users, 
  MessageCircle, 
  Search, 
  Phone, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  Clock,
  BookOpen,
  DollarSign
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

export default function Parents() {
  const location = useLocation();
  const [parents, setParents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [teachers, setTeachers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // حالات الفلترة المتتالية
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedStage, setSelectedStage] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");

  // 1. تحميل البيانات الأساسية والاختيار التلقائي
  useEffect(() => {
    const t = JSON.parse(localStorage.getItem("teachers-data") || "[]");
    const g = JSON.parse(localStorage.getItem("groups-data") || "[]");
    setTeachers(t);
    setGroups(g);

    // لو جاي من صفحة المجموعات (Redirect)
    if (location.state?.selectedGroup) {
      const groupName = location.state.selectedGroup;
      const groupFound = g.find((gr: any) => gr.name === groupName);
      if (groupFound) {
        setSelectedTeacher(groupFound.teacherName || "");
        setSelectedStage(groupFound.stage || "");
        setSelectedClass(groupFound.grade?.toString() || "");
        setSelectedGroup(groupName);
      }
    }
  }, [location.state]);

  // 2. معالجة بيانات أولياء الأمور (المنطق الخاص بك)
  useEffect(() => {
    try {
      const students = JSON.parse(localStorage.getItem("students-data") || "[]");
      const attendanceData = JSON.parse(localStorage.getItem("attendance-data") || "{}");
      const exams = JSON.parse(localStorage.getItem("exams-data") || "[]");
      const transactions = JSON.parse(localStorage.getItem("finance-transactions") || "[]");

      const parentsMap = new Map();

      students.forEach((student: any) => {
        if (!student) return;
        
        // تصفية الطلاب بناءً على المجموعة المختارة (هنا بيتطبق الفلتر الجديد)
        if (selectedGroup && !student.enrolledGroups?.includes(selectedGroup)) return;

        const pPhone = student.parentPhone || "000";
        if (!parentsMap.has(pPhone)) {
          parentsMap.set(pPhone, { 
            name: student.parentName || "غير مسجل", 
            phone: pPhone, 
            students: [] 
          });
        }

        const groupAtt = attendanceData[selectedGroup] || {};
        const attRec = groupAtt[student.id];

        const studentExams = exams
          .filter((e: any) => (e?.group === selectedGroup) && e?.grades && e.grades[student.id] !== undefined)
          .sort((a: any, b: any) => (b.id || 0) - (a.id || 0));
        
        const lastExam = studentExams[0];
        const studentGrade = lastExam ? lastExam.grades[student.id] : null;

        const debt = transactions
          .filter((t: any) => (t.studentId === student.id) && t.status === "partial")
          .reduce((acc: number, t: any) => acc + (Number(t.amount) || 0), 0);

        parentsMap.get(pPhone).students.push({
          id: student.id,
          name: student.name,
          status: attRec ? "حاضر" : "غائب",
          time: attRec?.time || "",
          lastExamSubject: lastExam?.subject || "لا يوجد",
          score: studentGrade !== null ? studentGrade : "--",
          total: lastExam?.totalMarks || "--",
          debt: debt
        });
      });

      setParents(Array.from(parentsMap.values()));
    } catch (e) { 
      console.error("Error Linking:", e); 
    } finally {
      setLoading(false);
    }
  }, [selectedGroup]); // التحديث يحصل لما المجموعة تتغير

  // --- منطق استخراج الخيارات الموحد ---

  // 1. قائمة المدرسين
  const teacherOptions = teachers.map(t => ({ value: t.name, label: t.name }));

  // 2. قائمة المراحل الكاملة (تم إرجاع الاسم stageOptions ليتوافق مع الـ JSX عندك)
  const stageOptions = [
    { value: "primary", label: "ابتدائي" },
    { value: "middle", label: "إعدادي" },
    { value: "high", label: "ثانوي" },
  ];

  // 3. وظيفة جلب الصفوف بناءً على المرحلة
  const getGradesForStage = (stage: string) => {
    if (stage === "primary") return [1, 2, 3, 4, 5, 6];
    if (stage === "middle" || stage === "high") return [1, 2, 3];
    return [];
  };

  // 4. قائمة الصفوف (classOptions)
  const classOptions = selectedStage 
    ? getGradesForStage(selectedStage).map(grade => ({
        value: grade.toString(),
        label: `الصف ${
          ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس"][grade - 1]
        } ${stageOptions.find(s => s.value === selectedStage)?.label || ""}`
      }))
    : [];

  // 5. تصفية المجموعات
  const availableGroups = groups.filter(g => 
    g.teacherName === selectedTeacher && 
    g.stage === selectedStage && 
    g.grade?.toString() === selectedClass
  );

  // تصفية نهائية للبحث
  const finalDisplay = parents.filter(p => 
    p.name.includes(searchTerm) || p.phone.includes(searchTerm) || p.students.some((s:any) => s.name.includes(searchTerm))
  );
  
  // 🟢 دالة إرسال تقرير الواتساب
  const sendWhatsAppReport = (parent: any) => {
    const date = new Date().toLocaleDateString("ar-EG");
    let message = `*تقرير متابعة الطالب - بتاريخ ${date}*\n\n`;
    message += `إلى ولي الأمر الفاضل: *${parent.name}*\n`;
    message += `--------------------------\n`;

    parent.students.forEach((st: any, index: number) => {
      message += `*${index + 1}- الطالب: ${st.name}*\n`;
      message += `• حالة الحضور: ${st.status} ${st.time ? `(الساعة ${st.time})` : ""}\n`;
      message += `• آخر درجة: ${st.score} / ${st.total} (${st.lastExamSubject})\n`;
      message += `• الديون المتبقية: ${st.debt} ج.م\n`;
      message += `--------------------------\n`;
    });

    message += `\n*نرجو الاهتمام والمتابعة.. مع تحياتنا.*`;

    const cleanPhone = parent.phone.startsWith('0') ? '2' + parent.phone : parent.phone;
    const whatsappUrl = `https://wa.me/${cleanPhone.replace(/\s+/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };
  
  return (
  
    <div className="space-y-4 p-2">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black">شاشة أولياء الأمور</h1>
        <p className="text-muted-foreground text-sm font-bold">متابعة الأداء الأكاديمي والمالي</p>
      </div>

      {/* قسم الفلترة الجديد - مرونة كاملة في الاختيار */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded-xl shadow-sm border">
        {/* 1. المدرس */}
        <div>
          <Label className="font-black mb-1 block text-xs">المدرس</Label>
          <Select value={selectedTeacher} onValueChange={(value) => {
            setSelectedTeacher(value);
            const t = teachers.find(teach => teach.name === value);
            // تعيين تلقائي للمرحلة والصف الخاص بالمدرس
            setSelectedStage(t?.stage || "");
            setSelectedClass(t?.grade?.toString() || "");
            setSelectedGroup("");
          }}>
            <SelectTrigger className="font-bold h-10"><SelectValue placeholder="اختر المدرس" /></SelectTrigger>
            <SelectContent>
              {teachers.map(t => <SelectItem key={t.id} value={t.name} className="font-bold">{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* 2. المرحلة - الآن تعرض كل الخيارات */}
        <div>
          <Label className="font-black mb-1 block text-xs">المرحلة</Label>
          <Select 
            value={selectedStage} 
            onValueChange={(value) => {
              setSelectedStage(value);
              setSelectedClass(""); 
              setSelectedGroup("");
            }} 
            disabled={!selectedTeacher}
          >
            <SelectTrigger className="font-bold h-10"><SelectValue placeholder="المرحلة" /></SelectTrigger>
            <SelectContent>
              {/* تأكد أن هذا المتغير stageOptions معرف بالأعلى كمصفوفة [primary, middle, high] */}
              {stageOptions.map(s => <SelectItem key={s.value} value={s.value} className="font-bold">{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* 3. الصف - الآن يعرض كل الصفوف المتاحة للمرحلة */}
        <div>
          <Label className="font-black mb-1 block text-xs">الصف</Label>
          <Select 
            value={selectedClass} 
            onValueChange={(value) => {
              setSelectedClass(value);
              setSelectedGroup("");
            }} 
            disabled={!selectedStage}
          >
            <SelectTrigger className="font-bold h-10"><SelectValue placeholder="الصف" /></SelectTrigger>
            <SelectContent>
              {classOptions.map(c => <SelectItem key={c.value} value={c.value} className="font-bold">{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* 4. المجموعة */}
        <div>
          <Label className="font-black mb-1 block text-xs text-blue-600">المجموعة الدراسية</Label>
          <Select value={selectedGroup} onValueChange={setSelectedGroup} disabled={!selectedClass}>
            <SelectTrigger className="font-bold h-10 border-blue-200 bg-blue-50 text-blue-700"><SelectValue placeholder="اختر المجموعة" /></SelectTrigger>
            <SelectContent>
              {availableGroups.map(g => <SelectItem key={g.id} value={g.name} className="font-bold">{g.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* مربع بحث بالاسم إضافي */}
      <div className="relative">
        <Search className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="بحث باسم ولي الأمر أو الطالب..." 
          className="pr-10 font-bold"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* عرض البيانات */}
      {!selectedGroup ? (
        <div className="text-center p-10 bg-slate-50 rounded-2xl border-2 border-dashed">
          <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="font-black text-slate-500">برجاء اختيار المجموعة الدراسية أولاً لعرض البيانات</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {finalDisplay.map((parent, idx) => (
    <Card key={idx} className="overflow-hidden border-none shadow-lg">
      <CardHeader className="bg-slate-900 text-white p-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-black">{parent.name}</CardTitle>
          {/* تم تعديل الزر هنا ليعمل فعلياً ويرسل الرسالة */}
          <Button 
            size="sm" 
            variant="secondary" 
            className="gap-2 font-black h-8 bg-green-600 hover:bg-green-700 text-white border-none"
            onClick={() => sendWhatsAppReport(parent)}
          >
            <MessageCircle className="w-4 h-4" /> واتساب
          </Button>
        </div>
        <div className="flex items-center gap-2 text-slate-300 text-xs mt-1 font-bold">
          <Phone className="w-3 h-3" /> {parent.phone}
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        {parent.students.map((st: any) => (
          <div key={st.id} className="border-b last:border-0 pb-3 last:pb-0">
            <div className="flex justify-between items-start mb-2">
              <p className="font-black text-blue-700">{st.name}</p>
              <Badge className={st.status === "حاضر" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700 border-none"}>
                {st.status === "حاضر" ? <CheckCircle2 className="w-3 h-3 ml-1" /> : <XCircle className="w-3 h-3 ml-1" />}
                {st.status} {st.time && `(${st.time})`}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-slate-50 p-2 rounded-lg border">
                <div className="flex items-center gap-1 text-[10px] font-black text-muted-foreground mb-1 uppercase">
                  <BookOpen className="w-3 h-3" /> آخر امتحان
                </div>
                <p className="text-sm font-black">{st.lastExamSubject}</p>
                <p className="text-lg font-black text-purple-600">{st.score} <span className="text-[10px] text-slate-400">/ {st.total}</span></p>
              </div>
              
              <div className="bg-red-50 p-2 rounded-lg border border-red-100 text-right">
                <div className="flex items-center justify-end gap-1 text-[10px] font-black text-red-400 mb-1 uppercase">
                  المستحقات <DollarSign className="w-3 h-3" />
                </div>
                <p className="text-lg font-black text-red-600">{st.debt} ج.م</p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  ))}
</div>
      )}
    </div>
  );
}