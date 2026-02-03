import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
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
import { Input } from "@/components/ui/input";

export default function Attendance() {
  const location = useLocation();
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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const scannerBuffer = useRef("");
  const codeReader = useRef(new BrowserMultiFormatReader());
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    const g = JSON.parse(localStorage.getItem("groups-data") || "[]");
    const t = JSON.parse(localStorage.getItem("teachers-data") || "[]");
    const s = JSON.parse(localStorage.getItem("students-data") || "[]");
    const savedAtt = JSON.parse(localStorage.getItem("attendance-data") || "{}");
    
    setGroups(g); 
    setTeachers(t);
    setAllStudents(s); 
    setAttendanceData(savedAtt);

    if (location.state?.selectedGroup) {
      setSelectedGroup(location.state.selectedGroup);
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
  }, [location.state]);

  const startCamera = async () => {
    setCameraOpen(true);
    try {
      setTimeout(async () => {
        controlsRef.current = await codeReader.current.decodeFromVideoDevice(
          undefined,
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

    const allData = { ...attendanceData };
    if (!allData[selectedDate]) allData[selectedDate] = {};
    if (!allData[selectedDate][selectedGroup]) allData[selectedDate][selectedGroup] = {};

    const currentGroupAtt = allData[selectedDate][selectedGroup];
    if (currentGroupAtt[studentId]) return;

    const timeNow = new Date().toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit' });
    
    allData[selectedDate][selectedGroup][studentId] = { 
      status: "present", 
      time: timeNow,
      date: selectedDate
    };

    setAttendanceData(allData);
    localStorage.setItem("attendance-data", JSON.stringify(allData));
    new Audio("https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg").play().catch(() => {});
  };

  const removeAttendance = (studentId: number) => {
    if (!selectedGroup) return;

    const allData = { ...attendanceData };

    if (allData[selectedDate] && allData[selectedDate][selectedGroup]) {
      const updatedGroupAtt = { ...allData[selectedDate][selectedGroup] };
      delete updatedGroupAtt[studentId];

      allData[selectedDate][selectedGroup] = updatedGroupAtt;

      setAttendanceData(allData);
      localStorage.setItem("attendance-data", JSON.stringify(allData));
      
      console.log(`Student ${studentId} removed from ${selectedGroup} on ${selectedDate}`);
    }
  };

  const teacherOptions = teachers.map(t => ({ value: t.name, label: t.name }));

  const stageOptions = [
    { value: "primary", label: "ابتدائي" },
    { value: "middle", label: "إعدادي" },
    { value: "high", label: "ثانوي" },
  ];

  const getGradesForStage = (stage: string) => {
    if (stage === "primary") return [1, 2, 3, 4, 5, 6];
    if (stage === "middle" || stage === "high") return [1, 2, 3];
    return [];
  };

  const classOptions = selectedStage 
    ? getGradesForStage(selectedStage).map(grade => ({
        value: grade.toString(),
        label: `الصف ${
          ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس"][grade - 1]
        } ${stageOptions.find(s => s.value === selectedStage)?.label || ""}`
      }))
    : [];

  const availableGroups = groups.filter(g => 
    g.teacherName === selectedTeacher && 
    g.stage === selectedStage && 
    g.grade?.toString() === selectedClass
  );

  const filteredStudents = allStudents.filter(st => 
    selectedGroup && st.enrolledGroups?.includes(selectedGroup)
  );

  const currentAtt = attendanceData[selectedDate]?.[selectedGroup] || {};

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

      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
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
          <Label className="font-black mb-1 block">اختر المجموعة</Label>
          <Select value={selectedGroup} onValueChange={setSelectedGroup} disabled={!selectedClass}>
            <SelectTrigger className="h-10 font-bold"><SelectValue placeholder="اختر المجموعة" /></SelectTrigger>
            <SelectContent>
              {availableGroups.map(g => <SelectItem key={g.id} value={g.name} className="font-bold">{g.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="font-black mb-1 block">التاريخ</Label>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-10 font-medium"
          />
        </div>

        {/* تم حذف البادج الذي يعرض التاريخ مرة أخرى */}
        <div></div>
      </div>

      {selectedGroup && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatCard title="إجمالي الطلاب" value={filteredStudents.length} color="text-blue-600" />
            <StatCard title="حضور" value={Object.keys(currentAtt).length} color="text-green-600" />
            <StatCard title="غائب" value={filteredStudents.length - Object.keys(currentAtt).length} color="text-red-600" />
          </div>

          <Card className="shadow-xl border-none overflow-hidden">
            <CardHeader className="bg-slate-900 text-white py-2">
              <CardTitle className="font-black text-sm">
                سجل الحضور – {new Date(selectedDate).toLocaleDateString("ar-EG", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </CardTitle>
            </CardHeader>
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
                                <p className="text-xs font-bold text-green-600">
                                  حضر الساعة {att.time} بتاريخ {att.date}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {att ? (
                            <div className="flex items-center gap-1">
                              <Badge className="bg-green-100 text-green-700 border-none font-black">حاضر</Badge>
                              <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400" onClick={() => removeAttendance(student.id)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button className="font-black px-4 rounded-lg bg-primary" onClick={() => registerAttendance(student.id)}>
                              تحضير
                            </Button>
                          )}
                          <Button size="icon" variant="outline" className="rounded-lg" onClick={() => setQrStudent(student)}>
                            <QrCode className="w-3 h-3" />
                          </Button>
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
            <Button variant="destructive" size="icon" className="absolute top-3 right-3 rounded-full z-50" onClick={closeCamera}>
              <X />
            </Button>
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