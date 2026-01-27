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
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [qrStudent, setQrStudent] = useState<any>(null);
  const [attendanceData, setAttendanceData] = useState<Record<string, any>>({});
  
  const scannerBuffer = useRef("");
  const codeReader = useRef(new BrowserMultiFormatReader());
  const controlsRef = useRef<any>(null);

  // 1. تحميل البيانات + الاستقبال التلقائي للمجموعة
  useEffect(() => {
    const g = JSON.parse(localStorage.getItem("groups-data") || "[]");
    const s = JSON.parse(localStorage.getItem("students-data") || "[]");
    const savedAtt = JSON.parse(localStorage.getItem("attendance-data") || "{}");
    
    setGroups(g); 
    setAllStudents(s); 
    setAttendanceData(savedAtt);

    // لو جاي من صفحة الحصص، اختار المجموعة فوراً
    if (location.state?.selectedGroup) {
      setSelectedGroup(location.state.selectedGroup);
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

  // 2. الكاميرا والسكانر
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
    const currentGroupAtt = attendanceData[selectedGroup] || {};
    if (currentGroupAtt[studentId]) return;

    const timeNow = new Date().toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit' });
    const newAtt = { 
      ...attendanceData, 
      [selectedGroup]: { ...currentGroupAtt, [studentId]: { status: "present", time: timeNow } } 
    };
    setAttendanceData(newAtt);
    localStorage.setItem("attendance-data", JSON.stringify(newAtt));
    new Audio("https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg").play().catch(() => {});
  };

  const removeAttendance = (studentId: number) => {
    const currentGroupAtt = { ...attendanceData[selectedGroup] };
    delete currentGroupAtt[studentId];
    const newAtt = { ...attendanceData, [selectedGroup]: currentGroupAtt };
    setAttendanceData(newAtt);
    localStorage.setItem("attendance-data", JSON.stringify(newAtt));
  };

  // --- المنطقة الحساسة: تعريف المتغيرات لكل الصفحة ---
  const filteredStudents = allStudents.filter(st => 
    selectedGroup && st.enrolledGroups?.includes(selectedGroup)
  );

  const currentAtt = (selectedGroup && attendanceData[selectedGroup]) ? attendanceData[selectedGroup] : {};
  // ------------------------------------------------

  return (
    <div className="space-y-6 p-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">تحضير الطلاب</h1>
          <p className="text-muted-foreground font-bold text-sm">QR + Barcode Scanner Support</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="flex items-center gap-2 py-2 px-4 font-black bg-blue-50 text-blue-700 border-blue-200 animate-pulse">
            <BarcodeIcon className="w-4 h-4" /> جهاز السكانر جاهز
          </Badge>
          <Button className="gap-2 font-black shadow-lg h-11" onClick={startCamera}>
            <Camera className="w-5 h-5" /> مسح بالكاميرا
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Label className="font-black mb-2 block">اختر المجموعة الدراسية</Label>
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger className="h-12 font-bold"><SelectValue placeholder="اختر المجموعة" /></SelectTrigger>
            <SelectContent>
              {groups.map(g => <SelectItem key={g.id} value={g.name} className="font-bold">{g.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="bg-muted/50 border rounded-xl flex items-center justify-center font-black gap-2 h-12 mt-auto">
          <Calendar className="w-4 h-4 text-primary" /> {new Date().toLocaleDateString("ar-EG")}
        </div>
      </div>

      {selectedGroup && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard title="إجمالي الطلاب" value={filteredStudents.length} color="text-blue-600" />
            <StatCard title="حضور" value={Object.keys(currentAtt).length} color="text-green-600" />
            <StatCard title="غائب" value={filteredStudents.length - Object.keys(currentAtt).length} color="text-red-600" />
          </div>

          <Card className="shadow-xl border-none overflow-hidden">
            <CardHeader className="bg-slate-900 text-white py-3"><CardTitle className="font-black text-md">سجل الحضور</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="divide-y max-h-[500px] overflow-y-auto">
                {filteredStudents.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground font-bold">لا يوجد طلاب مسجلين في هذه المجموعة</div>
                ) : (
                  filteredStudents.map((student) => {
                    const att = currentAtt[student.id];
                    return (
                      <div key={student.id} className="flex justify-between items-center p-4 hover:bg-muted/50 transition-all">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${att ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                            {att ? <Check className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="font-black text-lg">{student.name}</p>
                            {att && <p className="text-xs font-bold text-green-600">حضر الساعة {att.time}</p>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {att ? (
                            <div className="flex items-center gap-1">
                              <Badge className="bg-green-100 text-green-700 border-none font-black">حاضر</Badge>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400" onClick={() => removeAttendance(student.id)}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          ) : (
                            <Button className="font-black px-6 rounded-xl bg-primary" onClick={() => registerAttendance(student.id)}>تحضير</Button>
                          )}
                          <Button size="icon" variant="outline" className="rounded-xl" onClick={() => setQrStudent(student)}><QrCode className="w-4 h-4" /></Button>
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
            <Button variant="destructive" size="icon" className="absolute top-4 right-4 rounded-full z-50" onClick={closeCamera}><X /></Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* مودال كارت الطالب */}
      <Dialog open={!!qrStudent} onOpenChange={() => setQrStudent(null)}>
        <DialogContent className="sm:max-w-[600px] text-center p-8">
          {qrStudent && (
            <div className="flex flex-col items-center gap-6">
              <div className="flex gap-4">
                <div className="flex flex-col items-center gap-2">
                  <Label className="font-bold text-sm">QR Code للـ ID (للكاميرا)</Label>
                  <QRCodeCanvas size={160} value={qrStudent.id.toString()} />
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Label className="font-bold text-sm">Barcode للسيريال (لجهاز الليزر)</Label>
                  <Barcode value={qrStudent.serial} width={2} height={60} fontSize={12} />
                </div>
              </div>
              <div>
                <p className="font-black text-2xl">{qrStudent.name}</p>
                <p className="text-sm text-blue-600 font-bold">المجموعة: {selectedGroup}</p>
                <p className="text-sm text-green-600 font-bold">ID: {qrStudent.id}</p>
                <p className="text-sm text-purple-600 font-bold">Serial: {qrStudent.serial}</p>
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
    <Card className="border-none shadow-md p-4 text-center">
      <p className="text-xs font-black text-muted-foreground uppercase">{title}</p>
      <p className={`text-4xl font-black mt-1 ${color}`}>{value}</p>
    </Card>
  );
}