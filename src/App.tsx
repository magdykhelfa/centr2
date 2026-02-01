import { useState, useEffect } from 'react'; 
import { Toaster } from "@/components/ui/toaster"; 
import { Toaster as Sonner } from "sonner"; 
import { TooltipProvider } from "@/components/ui/tooltip"; 
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"; 
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom"; 
import { MainLayout } from "./components/layout/MainLayout"; 
import { GraduationCap, Lock, Facebook, Fingerprint, ShieldCheck, Wifi, Save, X } from 'lucide-react'; 
import { toast } from 'sonner';

import Dashboard from "./pages/Dashboard"; 
import Students from "./pages/Students"; 
import Groups from "./pages/Groups"; 
import Attendance from "./pages/Attendance"; 
import Exams from "./pages/Exams"; 
import Parents from "./pages/Parents"; 
import Finance from "./pages/Finance"; 
import Alerts from "./pages/Alerts"; 
import Reports from "./pages/Reports"; 
import Settings from "./pages/Settings"; 
import Teachers from "./pages/Teachers"; // استيراد صفحة المدرسين التي أنشأناها
import NotFound from "./pages/NotFound";
import Archive from "./pages/Archive"; // أضف هذا السطر هنا
import BooksPage from "./pages/BooksPage";
const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<any>(null); 
  const [loading, setLoading] = useState(true); 
  const [form, setForm] = useState({ n: '', p: '', act: '' }); 
  const [deviceId, setDeviceId] = useState(''); 
  const [isActivated, setIsActivated] = useState(false); 
  const [showIpPanel, setShowIpPanel] = useState(false);
  const [manualIp, setManualIp] = useState(localStorage.getItem('server_ip') || '');

  // المعادلة الرياضية الخاصة بك (M7)
  const generateMathKey = (id: string) => { 
    if (!id) return ""; 
    const clean = id.replace(/[^A-Z0-9]/gi, ''); 
    const mathPart = (clean.length * 9000) + 555; 
    const reversed = clean.split('').reverse().join('').toUpperCase(); 
    return `M7-${mathPart}-${reversed.slice(0, 8)}`; 
  };

  const generateUUID = () => {
    let d = new Date().getTime();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      let r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16).toUpperCase();
    });
  };

  useEffect(() => {
    // --- منطق جلب كود الماذربورد الحقيقي ---
    let finalId = "";
    try {
      // التحقق إذا كان البرنامج يعمل داخل Electron
      if (window && (window as any).require) {
        const { ipcRenderer } = (window as any).require('electron');
        const hardwareId = ipcRenderer.sendSync('get-hardware-id');
        if (hardwareId) finalId = hardwareId;
      }
    } catch (e) {
      console.log("Not in Electron environment");
    }

    // لو فشل جلب كود الماذربورد (مثلاً شغال في المتصفح)، نستخدم الـ UUID كاحتياطي
    if (!finalId) {
      finalId = localStorage.getItem('fixed_id') || generateUUID();
      localStorage.setItem('fixed_id', finalId);
    }
    
    setDeviceId(finalId);

    // التحقق من التفعيل بالـ ID الحقيقي
    if (localStorage.getItem('license_key') === generateMathKey(finalId)) setIsActivated(true);

    // جلب المستخدم الحالي
    const s = localStorage.getItem('current_edu_user');
    if (s) setUser(JSON.parse(s));

    setTimeout(() => setLoading(false), 500);
  }, []);

  const handleLogin = (e: any) => {
    e.preventDefault();
    if (!isActivated) { 
      const expected = generateMathKey(deviceId); 
      if (form.act.trim().toUpperCase() === expected.toUpperCase()) { 
        localStorage.setItem('license_key', expected); 
        setIsActivated(true); 
        toast.success('تم التفعيل بنجاح'); 
      } else {
        toast.error('كود التفعيل غير صحيح، تأكد من الكود أو تواصل مع الدعم', {
          style: { background: '#ef4444', color: '#fff' }
        });
        return;
      }
    } 

    const all = JSON.parse(localStorage.getItem('edu_users') || '[]');
    if (all.length === 0 && form.n === "admin" && form.p === "admin") {
        const admin = { name: "المدير العام", user: "admin", password: "admin", role: "admin" };
        localStorage.setItem('edu_users', JSON.stringify([admin]));
        setUser(admin);
        localStorage.setItem('current_edu_user', JSON.stringify(admin));
        return;
    }

    const f = all.find((u: any) => u.user === form.n && u.password === form.p);
    if (f) { 
        setUser(f); 
        localStorage.setItem('current_edu_user', JSON.stringify(f)); 
        toast.success(`أهلاً بك يا ${f.name}`);
    } else {
        toast.error('بيانات الدخول خاطئة');
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(deviceId);
    toast('تم نسخ الكود بنجاح', { icon: '📋', style: { borderRadius: '10px', background: '#333', color: '#fff' } });
  };

  if (loading) return ( <div className="min-h-screen bg-white flex items-center justify-center font-black" dir="rtl"> <div className="text-center space-y-4"> <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mx-auto shadow-2xl animate-bounce"><GraduationCap className="text-white w-10 h-10" /></div> <div className="text-slate-400">جاري تحميل المنصة...</div> </div> </div> );

  if (!user) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-bold" dir="rtl">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border-t-8 border-primary text-center relative overflow-hidden">
        {showIpPanel && (
          <div className="absolute inset-0 bg-white/98 z-50 flex flex-col items-center justify-center p-6 animate-in slide-in-from-top duration-300">
             <button onClick={() => setShowIpPanel(false)} className="absolute top-4 left-4 text-slate-400 hover:text-red-500 border-none bg-transparent cursor-pointer"><X /></button>
             <Wifi className="w-12 h-12 text-primary mb-2 animate-pulse" />
             <h2 className="font-black text-slate-800 mb-1">إعدادات الربط بالشبكة</h2>
             <p className="text-[10px] text-slate-400 mb-4 font-bold">للمساعدين: ادخل IP الجهاز الرئيسي</p>
             <input value={manualIp} onChange={(e) => setManualIp(e.target.value)} className="w-full p-3 border-2 rounded-xl text-center font-bold mb-4 outline-none focus:border-primary" placeholder="192.168.1.X" />
             <button onClick={() => { if (manualIp.trim()) { localStorage.setItem('server_ip', manualIp.trim()); } else { localStorage.removeItem('server_ip'); } window.location.reload(); }} className="w-full bg-primary text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 border-none cursor-pointer"><Save className="w-4 h-4" /> حفظ والربط</button>
          </div>
        )}
        <div onClick={() => setShowIpPanel(true)} className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary/20 cursor-pointer hover:rotate-6 transition-transform">
          <GraduationCap className="text-white w-10 h-10" />
        </div>
        <h1 className="text-2xl text-slate-800 mb-6 font-black">منصة السنتر الذكي</h1>
        <form onSubmit={handleLogin} className="space-y-4 text-right">
          {!isActivated && ( <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200"> <label className="text-[10px] text-amber-700 flex items-center gap-1 mb-2 font-black"><ShieldCheck className="w-3 h-3" /> كود تفعيل الجهاز</label> <input required className="w-full p-3 border-2 rounded-xl text-center font-mono outline-none focus:border-amber-500" placeholder="M7-XXXX-XXXX" onChange={(e) => setForm({...form, act: e.target.value})} /> </div> )}
          <input required className="w-full p-4 border-2 rounded-2xl text-right outline-none focus:border-primary transition-all" placeholder="اسم المستخدم" onChange={(e) => setForm({...form, n: e.target.value})} />
          <input type="password" required className="w-full p-4 border-2 rounded-2xl text-right outline-none focus:border-primary transition-all" placeholder="كلمة المرور" onChange={(e) => setForm({...form, p: e.target.value})} />
          <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black flex border-none cursor-pointer items-center justify-center gap-2 hover:bg-primary transition-all shadow-xl"><Lock className="w-4 h-4 text-primary" /> {isActivated ? 'دخول النظام' : 'تفعيل ودخول'}</button>
        </form>
        <div className="mt-8 pt-6 border-t space-y-3">
          <a href="https://www.facebook.com/magdy.khallafa" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 text-[11px] text-blue-600 font-black no-underline"><Facebook className="w-4 h-4" /> برمجة وتطوير: مجدي خلفه</a>
          <div className="flex flex-col items-center gap-1 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 cursor-pointer hover:bg-slate-100 active:scale-95 transition-all" onClick={handleCopyId}> 
            <span className="text-[9px] text-slate-400 font-black flex items-center gap-1"><Fingerprint className="w-3 h-3" /> كود الجهاز (اضغط للنسخ)</span> 
            <code className="text-primary font-mono text-[10px]">{deviceId || 'جاري الجلب...'}</code> 
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider> <Toaster /> <Sonner position="top-right" />
        <Router>
          <MainLayout user={user} onLogout={() => { localStorage.removeItem('current_edu_user'); setUser(null); }}>
            <Routes>
              <Route path="/" element={<Dashboard />} /> <Route path="/students" element={<Students />} />
              <Route path="/groups" element={<Groups />} /> <Route path="/attendance" element={<Attendance />} />
              <Route path="/teachers" element={<Teachers />} /> {/* المسار الجديد */}
              <Route path="/parents" element={<Parents />} /> <Route path="/finance" element={<Finance />} />
              <Route path="/alerts" element={<Alerts />} /> <Route path="/reports" element={<Reports />} />
              <Route path="/exams" element={<Exams />} />
              <Route path="/books" element={<BooksPage />} /> {/* ده السطر اللي بيظهره */}
              <Route path="/archive" element={<Archive />} />
              <Route path="/settings" element={<Settings />} /> <Route path="*" element={<NotFound />} />
            </Routes>
          </MainLayout>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}; 

export default App;