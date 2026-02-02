import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom"; // السطر اللي كان ناقص
import {
  QrCode,
  Check,
  Users,
  Calendar,
  Camera,
  X,
  Barcode as BarcodeIcon,
  Trash2
} from "lucide-react";

import { QRCodeCanvas } from "qrcode.react";
import Barcode from "react-barcode"; 
import { BrowserMultiFormatReader } from "@zxing/browser";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function Attendance() {
  const location = useLocation(); // السطر اللي بيقرأ المجموعة المرسلة
  const [groups, setGroups] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedStage, setSelectedStage] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [qrStudent, setQrStudent] = useState<any>(null);
  const [attendanceData, setAttendanceData] = useState<Record<string, any>>({});
  const todayKey = new Date().toISOString().split('T')[0];
  const scannerBuffer = useRef("");
  const codeReader = useRef(new BrowserMultiFormatReader());
  const controlsRef = useRef<any>(null);

  // 1. تحميل البيانات + الاستقبال التلقائي للمجموعة
  useEffect(() => {
    const g = JSON.parse(localStorage.getItem("groups-data") || "[]");
    const t = JSON.parse(localStorage.getItem("teachers-data") || "[]");
    const s = JSON.parse(localStorage.getItem("students-data") || "[]");
    const savedAtt = JSON.parse(localStorage.getItem("attendance-data") || "{}");
    
    setGroups(g); 
    setTeachers(t);
    setAllStudents(s); 
    setAttendanceData(savedAtt);

    // لو جاي من صفحة الحصص، اختار المجموعة فوراً
    if (location.state?.selectedGroup) {
      setSelectedGroup(location.state.selectedGroup);
      // افتراضياً، إذا كانت المجموعة محددة، قم بتعيين المدرس والمرحلة والصف بناءً عليها
      const group = g.find(gr => gr.name === location.state.selectedGroup);
      if (group) {
        setSelectedTeacher(group.teacherName || "");
        setSelectedStage(group.stage || "");
        setSelectedClass(group.grade?.toString() || "");
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        if (scannerBuffer.current.length > 0) {
          processScannerInput(scannerBuffer.current.trim());
          scannerBuffer.current = "";
        }
      } else {
        if (e.key !== "Shift") scannerBuffer.current += e.key;
      }
      setTimeout(() => { scannerBuffer.current = ""; }, 300);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [location.state]); // التحديث لو الـ state اتغير

  // 2. الكاميرا والسكانر (لم يتم تعديلها)
  const startCamera = async () => {
    setCameraOpen(true);
    try {
      setTimeout(async () => {
        controlsRef.current = await codeReader.current.decodeFromVideoDevice(
          undefined, // إصلاح: إضافة undefined كأول معامل لاختيار الجهاز الافتراضي
          "video-feed", 
          (result) => {
            if (result) {
              const code = result.getText();
              try {
                const data = JSON.parse(code);
                processScannerInput(data.studentId.toString());
              } catch {
                processScannerInput(code);
              }
              closeCamera(); 
            }
          }
        );
      }, 500);
    } catch (err) { 
      console.error("Camera Error:", err); 
      setCameraOpen(false);
    }
  };

  const closeCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    setCameraOpen(false);
  };

  const processScannerInput = (code: string) => {
    const student = allStudents.find(s => s.id.toString() === code || s.serial === code || `ST-${s.id}` === code);
    if (student) {
      if (student.enrolledGroups?.includes(selectedGroup)) {
        registerAttendance(student.id);
      } else {
        alert(`الطالب ${student.name} غير مشترك في مجموعة ${selectedGroup}`);
      }
    }
  };

  const registerAttendance = (studentId: number) => {
  if (!selectedGroup) return;

  // هيكلة البيانات: [التاريخ][المجموعة][الطالب]
  const allData = { ...attendanceData };
  if (!allData[todayKey]) allData[todayKey] = {};
  if (!allData[todayKey][selectedGroup]) allData[todayKey][selectedGroup] = {};

  const currentGroupAtt = allData[todayKey][selectedGroup];
  if (currentGroupAtt[studentId]) return;

  const timeNow = new Date().toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit' });
  
  // تحديث البيانات
  allData[todayKey][selectedGroup][studentId] = { 
    status: "present", 
    time: timeNow,
    date: todayKey // إضافة التاريخ داخل بيانات الطالب أيضاً للداش بورد
  };

  setAttendanceData(allData);
  localStorage.setItem("attendance-data", JSON.stringify(allData));
  new Audio("https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg").play().catch(() => {});
};

  const removeAttendance = (studentId: number) => {
    if (!selectedGroup) return;

    // 1. أخذ نسخة من البيانات الحالية
    const allData = { ...attendanceData };

    // 2. التحقق من وجود بيانات لهذا اليوم وهذه المجموعة
    if (allData[todayKey] && allData[todayKey][selectedGroup]) {
      
      // 3. حذف الطالب من النسخة
      const updatedGroupAtt = { ...allData[todayKey][selectedGroup] };
      delete updatedGroupAtt[studentId];

      // 4. تحديث الكائن الكبير
      allData[todayKey][selectedGroup] = updatedGroupAtt;

      // 5. حفظ وتحديث الحالة
      setAttendanceData(allData);
      localStorage.setItem("attendance-data", JSON.stringify(allData));
      
      // صوت خفيف للحذف (اختياري)
      console.log(`Student ${studentId} removed from ${selectedGroup} on ${todayKey}`);
    }
  };

  // استخراج الخيارات بناءً على قاعدة صفحة المجموعات: المدرس يحدد المرحلة والصف، ثم المجموعات من groups
  const teacherOptions = teachers.map(t => ({ value: t.name, label: t.name })); // افتراضاً t.name
  const selectedTeacherData = teachers.find(t => t.name === selectedTeacher);
  const stageOptions = selectedTeacherData ? [{ value: selectedTeacherData.stage, label: selectedTeacherData.stage === "primary" ? "ابتدائي" : selectedTeacherData.stage === "middle" ? "إعدادي" : selectedTeacherData.stage === "high" ? "ثانوي" : selectedTeacherData.stage }] : [];
  const classOptions = selectedTeacherData ? [{ value: selectedTeacherData.grade?.toString(), label: `الصف ${selectedTeacherData.grade} ${selectedTeacherData.stage === "primary" ? "ابتدائي" : selectedTeacherData.stage === "middle" ? "إعدادي" : selectedTeacherData.stage === "high" ? "ثانوي" : ""}` }] : [];
  const availableGroups = selectedClass ? groups.filter(g => g.teacherName === selectedTeacher && g.stage === selectedStage && g.grade?.toString() === selectedClass) : [];

  // --- المنطقة الحساسة: تعريف المتغيرات لكل الصفحة ---
  const filteredStudents = allStudents.filter(st => 
    selectedGroup && st.enrolledGroups?.includes(selectedGroup)
  );

const currentAtt = attendanceData[todayKey]?.[selectedGroup] || {};  // ------------------------------------------------

  return (
    <div className="space-y-4 p-1">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black">تحضير الطلاب</h1>
          <p className="text-muted-foreground font-bold text-xs">QR + Barcode Scanner Support</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1 py-1 px-3 font-black bg-blue-50 text-blue-700 border-blue-200 animate-pulse">
            <BarcodeIcon className="w-3 h-3" /> جهاز السكانر جاهز
          </Badge>
          <Button className="gap-1 font-black shadow-lg h-9" onClick={startCamera}>
            <Camera className="w-4 h-4" /> مسح بالكاميرا
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div>
          <Label className="font-black mb-1 block">اختر المدرس</Label>
          <Select value={selectedTeacher} onValueChange={(value) => {
            setSelectedTeacher(value);
            const t = teachers.find(teach => teach.name === value);
            setSelectedStage(t?.stage || "");
            setSelectedClass(t?.grade?.toString() || "");
            setSelectedGroup("");
          }}>
            <SelectTrigger className="h-10 font-bold"><SelectValue placeholder="اختر المدرس" /></SelectTrigger>
            <SelectContent>
              {teacherOptions.map(t => <SelectItem key={t.value} value={t.value} className="font-bold">{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="font-black mb-1 block">اختر المرحلة</Label>
          <Select value={selectedStage} onValueChange={(value) => {
            setSelectedStage(value);
            setSelectedClass("");
            setSelectedGroup("");
          }} disabled={!selectedTeacher}>
            <SelectTrigger className="h-10 font-bold"><SelectValue placeholder="اختر المرحلة" /></SelectTrigger>
            <SelectContent>
              {stageOptions.map(s => <SelectItem key={s.value} value={s.value} className="font-bold">{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="font-black mb-1 block">اختر الصف</Label>
          <Select value={selectedClass} onValueChange={(value) => {
            setSelectedClass(value);
            setSelectedGroup("");
          }} disabled={!selectedStage}>
            <SelectTrigger className="h-10 font-bold"><SelectValue placeholder="اختر الصف" /></SelectTrigger>
            <SelectContent>
              {classOptions.map(c => <SelectItem key={c.value} value={c.value} className="font-bold">{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="font-black mb-1 block">اختر المجموعة الدراسية</Label>
          <Select value={selectedGroup} onValueChange={setSelectedGroup} disabled={!selectedClass}>
            <SelectTrigger className="h-10 font-bold"><SelectValue placeholder="اختر المجموعة" /></SelectTrigger>
            <SelectContent>
              {availableGroups.map(g => <SelectItem key={g.id} value={g.name} className="font-bold">{g.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="bg-muted/50 border rounded-lg flex items-center justify-center font-black gap-1 h-10 mt-auto">
          <Calendar className="w-3 h-3 text-primary" /> {new Date().toLocaleDateString("ar-EG")}
        </div>
      </div>

      {selectedGroup && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatCard title="إجمالي الطلاب" value={filteredStudents.length} color="text-blue-600" />
            <StatCard title="حضور" value={Object.keys(currentAtt).length} color="text-green-600" />
            <StatCard title="غائب" value={filteredStudents.length - Object.keys(currentAtt).length} color="text-red-600" />
          </div>

          <Card className="shadow-xl border-none overflow-hidden">
            <CardHeader className="bg-slate-900 text-white py-2"><CardTitle className="font-black text-sm">سجل الحضور</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="divide-y max-h-[400px] overflow-y-auto">
                {filteredStudents.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground font-bold">لا يوجد طلاب مسجلين في هذه المجموعة</div>
                ) : (
                  filteredStudents.map((student) => {
                    const att = currentAtt[student.id];
                    return (
                      <div key={student.id} className="flex justify-between items-center p-3 hover:bg-muted/50 transition-all">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${att ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                            {att ? <Check className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="font-black text-base">{student.name}</p>
{att && (
  <div>
    <p className="text-xs font-bold text-green-600">حضر الساعة {att.time}</p>
    {/* إضافة تاريخ اليوم تحت الساعة */}
    <p className="text-[10px] text-slate-400 font-medium">بتاريخ: {todayKey}</p>
  </div>
)}                          </div>
                        </div>
                        <div className="flex gap-1">
                          {att ? (
                            <div className="flex items-center gap-1">
                              <Badge className="bg-green-100 text-green-700 border-none font-black">حاضر</Badge>
                              <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400" onClick={() => removeAttendance(student.id)}><Trash2 className="w-3 h-3" /></Button>
                            </div>
                          ) : (
                            <Button className="font-black px-4 rounded-lg bg-primary" onClick={() => registerAttendance(student.id)}>تحضير</Button>
                          )}
                          <Button size="icon" variant="outline" className="rounded-lg" onClick={() => setQrStudent(student)}><QrCode className="w-3 h-3" /></Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* مودال الكاميرا */}
      <Dialog open={cameraOpen} onOpenChange={closeCamera}>
        <DialogContent className="p-0 overflow-hidden sm:max-w-md bg-black border-none">
          <div className="relative aspect-video flex items-center justify-center bg-black">
            <video id="video-feed" className="w-full h-full object-cover" />
            <Button variant="destructive" size="icon" className="absolute top-3 right-3 rounded-full z-50" onClick={closeCamera}><X /></Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* مودال كارت الطالب */}
      <Dialog open={!!qrStudent} onOpenChange={() => setQrStudent(null)}>
        <DialogContent className="sm:max-w-[500px] text-center p-6">
          {qrStudent && (
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-3">
                <div className="flex flex-col items-center gap-1">
                  <Label className="font-bold text-xs">QR Code للـ ID (للكاميرا)</Label>
                  <QRCodeCanvas size={120} value={qrStudent.id.toString()} />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Label className="font-bold text-xs">Barcode للسيريال (لجهاز الليزر)</Label>
                  <Barcode value={qrStudent.serial} width={1.5} height={45} fontSize={10} />
                </div>
              </div>
              <div>
                <p className="font-black text-xl">{qrStudent.name}</p>
                <p className="text-xs text-blue-600 font-bold">المجموعة: {selectedGroup}</p>
                <p className="text-xs text-green-600 font-bold">ID: {qrStudent.id}</p>
                <p className="text-xs text-purple-600 font-bold">Serial: {qrStudent.serial}</p>
              </div>
              <Button className="w-full font-black" onClick={() => window.print()}>طباعة الكارت</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ title, value, color }: any) {
  return (
    <Card className="border-none shadow-md p-3 text-center">
      <p className="text-xs font-black text-muted-foreground uppercase">{title}</p>
      <p className={`text-3xl font-black mt-1 ${color}`}>{value}</p>
    </Card>
  );
}