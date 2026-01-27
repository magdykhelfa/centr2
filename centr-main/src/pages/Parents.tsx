import { useEffect, useState } from "react";
import { UserCheck, Phone, Users, MessageCircle, Clock, Trophy, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Parents() {
  const [parents, setParents] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    try {
      const students = JSON.parse(localStorage.getItem("students-data") || "[]");
      const attendanceData = JSON.parse(localStorage.getItem("attendance-data") || "{}");
      const exams = JSON.parse(localStorage.getItem("exams-data") || "[]");
      const transactions = JSON.parse(localStorage.getItem("finance-transactions") || "[]");
      const groups = JSON.parse(localStorage.getItem("groups-data") || "[]"); // إضافة لجلب بيانات المجموعات
      const savedSettings = JSON.parse(localStorage.getItem("app-settings") || "{}");
      setSettings(savedSettings);

      const parentsMap = new Map();

      students.forEach((student: any) => {
        const pPhone = student.parentPhone || "000";
        if (!parentsMap.has(pPhone)) {
          parentsMap.set(pPhone, { name: student.parentName, phone: pPhone, students: [] });
        }

        // 1. ربط الحضور
        const groupAtt = attendanceData[student.group] || {};
        const attRec = groupAtt[student.id];

        // 2. ربط الامتحانات
        const studentExams = exams
          .filter((e: any) => e.group === student.group && e.grades && e.grades[student.id] !== undefined)
          .sort((a: any, b: any) => b.id - a.id);
        
        const lastExam = studentExams[0];
        const studentGrade = lastExam ? lastExam.grades[student.id] : null;
        const isTop = lastExam && Number(studentGrade) >= Number(lastExam.totalMarks);

        // 3. المالية (تعديل ليشمل ديون الباكدجات والديون العادية)
        const debt = transactions
          .filter((t: any) => (t.student === student.name || t.studentId === student.id) && t.status === "partial")
          .reduce((acc: number, t: any) => acc + (Number(t.amount) || 0), 0);

        // 4. جلب اسم مدرس المجموعة (إضافة جديدة للتقرير)
        const groupInfo = groups.find((g: any) => g.name === student.group);
        const teacherName = groupInfo ? groupInfo.teacherName : "";

        parentsMap.get(pPhone).students.push({
          id: student.id,
          name: student.name,
          group: student.group,
          teacherName: teacherName, // إضافة لبيانات الطالب
          status: attRec ? "حاضر" : "غائب",
          time: attRec ? attRec.time : "",
          lastExamSubject: lastExam ? lastExam.subject : "لا يوجد",
          score: studentGrade !== null ? studentGrade : "--",
          total: lastExam ? lastExam.totalMarks : "--",
          isTop: isTop,
          debt: debt
        });
      });

      setParents(Array.from(parentsMap.values()));
    } catch (e) { console.error("Error Linking Pages:", e); }
  }, []);

  const sendReport = (parent: any) => {
    const teacherHeader = settings.centerName ? `*${settings.centerName}*` : (settings.teacherName ? `*أ/ ${settings.teacherName}*` : `*تقرير المتابعة*`);
    let msg = `--------------------------\n🏛️ ${teacherHeader}\n--------------------------\n*ولي الأمر:* ${parent.name}\n\n`;

    parent.students.forEach((s: any, i: number) => {
      msg += `*الطالب:* ${s.name}\n`;
      msg += `*المجموعة:* ${s.group} ${s.teacherName ? `(أ/ ${s.teacherName})` : ""}\n`; // إضافة المدرس للرسالة
      msg += `*الحضور:* ${s.status === "حاضر" ? `✅ حاضر (${s.time})` : "❌ غائب"}\n`;
      msg += `*الامتحان:* ${s.lastExamSubject} (${s.score}/${s.total}) ${s.isTop ? "🏆 (متفوق)" : ""}\n`;
      msg += `*المالية:* ${s.debt > 0 ? s.debt + " ج.م (برجاء السداد)" : "خالص ✅"}\n`;
      if (i < parent.students.length - 1) msg += `- - - - - - - - - - - - - -\n`;
    });

    msg += `\n*شكراً لمتابعتكم لنا*`;
    window.open(`https://wa.me/2${parent.phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-black text-secondary">أولياء الأمور</h1><p className="text-muted-foreground text-xs font-bold">ربط تلقائي مع الحضور والامتحانات والمالية</p></div>
        <Badge className="bg-secondary text-white font-black px-4 py-1 rounded-xl">عدد أولياء الأمور: {parents.length}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {parents.map((p, idx) => (
          <Card key={idx} className="border-none shadow-2xl rounded-[2rem] overflow-hidden group">
            <CardHeader className="bg-secondary/5 pb-4 border-b border-dashed border-secondary/20">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-white shadow-lg"><UserCheck className="w-7 h-7" /></div>
                <div><CardTitle className="text-xl font-black">{p.name}</CardTitle><p className="text-sm font-bold text-muted-foreground font-mono">{p.phone}</p></div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4 font-egyptian">
              {p.students.map((s: any, sIdx: number) => (
                <div key={sIdx} className="p-4 rounded-2xl bg-muted/30 border border-muted space-y-3 relative overflow-hidden">
                  {s.isTop && <div className="absolute -left-2 -top-2 bg-amber-400 text-white p-2 rounded-br-2xl shadow-lg animate-bounce"><Trophy className="w-4 h-4" /></div>}
                  <div className="flex justify-between items-center">
                    <span className="font-black text-secondary">{s.name}</span>
                    <Badge className={s.status === "حاضر" ? "bg-green-500 text-white" : "bg-red-500 text-white"}>{s.status}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] font-bold text-muted-foreground">
                    <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> {s.time || "--:--"}</div>
                    <div className={`flex items-center gap-1 ${s.isTop ? 'text-amber-600 font-black' : 'text-primary'}`}>
                       <Star className="w-3 h-3" /> {s.lastExamSubject}: {s.score}/{s.total}
                    </div>
                  </div>
                  {s.debt > 0 && <div className="text-[10px] font-black text-orange-600 bg-orange-50 p-1 rounded-lg text-center border border-orange-100">مطلوب مالياً: {s.debt} ج.م</div>}
                </div>
              ))}
              <Button className="w-full h-12 gap-2 font-black bg-secondary hover:bg-secondary/90 shadow-lg rounded-2xl" onClick={() => sendReport(p)}>
                <MessageCircle className="w-5 h-5" /> إرسال تقرير الواتساب
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}