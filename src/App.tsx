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
import Settings from "./pages/Settings"; 
import Teachers from "./pages/Teachers"; 
import NotFound from "./pages/NotFound";
import Archive from "./pages/Archive"; 
import BooksPage from "./pages/BooksPage";

const queryClient = new QueryClient();

// --- وظائف المساعدة لإنشاء الأكواد ---
const generateMathKey = (id: string | number | null | undefined) => { 
    if (!id) return ""; 
    const idStr = String(id);
    const clean = idStr.replace(/[^A-Z0-9]/gi, ''); 
    const mathPart = (clean.length * 9000) + 555; 
    const reversed = clean.split('').reverse().join('').toUpperCase(); 
    return `M7-${mathPart}-${reversed.slice(0, 8)}`; 
};

const getInitialDeviceId = () => {
    let id = localStorage.getItem('fixed_id');
    if (!id) {
        id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            let r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16).toUpperCase();
        });
        localStorage.setItem('fixed_id', id);
    }
    return id;
};

const App = () => {
  const [deviceId] = useState(getInitialDeviceId());
  const [loading, setLoading] = useState(true); 
  const [form, setForm] = useState({ n: '', p: '', act: '' }); 
  const [showIpPanel, setShowIpPanel] = useState(false);
  const [manualIp, setManualIp] = useState(localStorage.getItem('server_ip') || '');

  const [isActivated, setIsActivated] = useState(() => {
    const storedKey = localStorage.getItem('license_key');
    const generatedKey = generateMathKey(getInitialDeviceId());
    return String(storedKey) === String(generatedKey);
  });

  const [user, setUser] = useState<any>(() => {
    const loggedId = localStorage.getItem('loggedUserId');
    if (loggedId) {
        try {
            const allUsers = JSON.parse(localStorage.getItem('edu_users') || '[]');
            return allUsers.find((u: any) => String(u.id) === String(loggedId)) || null;
        } catch { return null; }
    }
    return null;
  });

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800); 
    return () => clearTimeout(timer);
  }, []);

  // --- تحديد الصفحة الافتراضية بناءً على الصلاحيات ---
  const getDefaultRoute = () => {
    if (!user || !user.permissions) return "/dashboard";
    const p = user.permissions;
    if (p.dashboard) return "/dashboard";
    if (p.students) return "/students";
    if (p.teachers) return "/teachers";
    if (p.groups) return "/groups";
    if (p.finance) return "/finance";
    if (p.attendance) return "/attendance";
    if (p.exams) return "/exams";
    if (p.books) return "/books";
    if (p.alerts) return "/alerts";
    if (p.archive) return "/archive";
    if (p.parents) return "/parents";
    if (p.settings) return "/settings";
    return "/dashboard"; 
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
        if (!isActivated) { 
          const expected = generateMathKey(deviceId); 
          if (form.act.trim().toUpperCase() === expected.toUpperCase()) { 
            localStorage.setItem('license_key', expected); 
            setIsActivated(true); 
          } else {
            setLoading(false);
            toast.error('كود التفعيل غير صحيح');
            return;
          }
        } 
        const all = JSON.parse(localStorage.getItem('edu_users') || '[]');
        if (all.length === 0 && form.n === "admin" && form.p === "admin") {
            const admin = { 
              id: Date.now(), name: "المدير العام", user: "admin", password: "admin", role: "admin",
              permissions: { 
                dashboard: true, students: true, teachers: true, groups: true, attendance: true, 
                exams: true, archive: true, finance: true, alerts: true, books: true, parents: true, settings: true 
              }
            };
            localStorage.setItem('edu_users', JSON.stringify([admin]));
            localStorage.setItem('loggedUserId', String(admin.id));
            setUser(admin);
            setLoading(false);
            return;
        }
        const found = all.find((u: any) => u.user === form.n && u.password === form.p);
        if (found) { 
          localStorage.setItem('loggedUserId', String(found.id));
          setUser(found);
          setLoading(false);
        } else {
          setLoading(false);
          toast.error('بيانات الدخول خاطئة');
        }
    }, 800); 
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(deviceId);
    toast.success('تم نسخ كود الجهاز');
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center font-black" dir="rtl">
      <div className="text-center space-y-4">
        <div className="w-24 h-24 bg-primary rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl animate-bounce">
          <GraduationCap className="text-white w-12 h-12" />
        </div>
        <div className="text-primary text-lg animate-pulse font-bold">جاري تحضير بياناتك...</div>
      </div>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-bold" dir="rtl">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border-t-8 border-primary text-center relative overflow-hidden">
        {showIpPanel && (
          <div className="absolute inset-0 bg-white/98 z-50 flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
            <button onClick={() => setShowIpPanel(false)} className="absolute top-4 left-4 text-slate-400 hover:text-red-500 border-none bg-transparent cursor-pointer">
              <X />
            </button>
            <Wifi className="w-12 h-12 text-primary mb-2 animate-pulse" />
            <h2 className="font-black text-slate-800 mb-1">إعدادات الشبكة</h2>
            <p className="text-[10px] text-slate-400 mb-4">أدخل IP الجهاز الرئيسي للمزامنة</p>
            <input 
              value={manualIp} 
              onChange={(e) => setManualIp(e.target.value)} 
              className="w-full p-3 border-2 rounded-xl text-center mb-4 outline-none focus:border-primary" 
              placeholder="192.168.1.X" 
            />
            <button 
              onClick={() => { 
                if (manualIp.trim()) localStorage.setItem('server_ip', manualIp.trim()); 
                else localStorage.removeItem('server_ip'); 
                setLoading(true);
                setTimeout(() => window.location.reload(), 500);
              }} 
              className="w-full bg-primary text-white py-3 rounded-xl font-bold border-none cursor-pointer"
            >
              <Save className="w-4 h-4 inline ml-2" /> حفظ والربط
            </button>
          </div>
        )}
        
        <div onClick={() => setShowIpPanel(true)} className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-4 cursor-pointer hover:rotate-6 transition-transform shadow-lg shadow-primary/20">
          <GraduationCap className="text-white w-10 h-10" />
        </div>
        <h1 className="text-2xl text-slate-800 mb-6 font-black">منصة السنتر الذكي</h1>
        
        <form onSubmit={handleLogin} className="space-y-4 text-right">
          {!isActivated && ( 
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200"> 
              <label className="text-[10px] text-amber-700 flex items-center gap-1 mb-2 font-black">
                <ShieldCheck className="w-3 h-3" /> كود تفعيل الجهاز
              </label> 
              <input 
                required 
                className="w-full p-3 border-2 rounded-xl text-center font-mono outline-none focus:border-amber-500" 
                placeholder="M7-XXXX-XXXX" 
                value={form.act}
                onChange={(e) => setForm({...form, act: e.target.value})} 
              /> 
            </div> 
          )}
          <input 
            required 
            className="w-full p-4 border-2 rounded-2xl text-right outline-none focus:border-primary" 
            placeholder="اسم المستخدم" 
            value={form.n}
            onChange={(e) => setForm({...form, n: e.target.value})} 
          />
          <input 
            type="password" 
            required 
            className="w-full p-4 border-2 rounded-2xl text-right outline-none focus:border-primary" 
            placeholder="كلمة المرور" 
            value={form.p}
            onChange={(e) => setForm({...form, p: e.target.value})} 
          />
          <button 
            type="submit"
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black flex border-none cursor-pointer items-center justify-center gap-2 hover:bg-primary transition-all shadow-xl"
          >
            <Lock className="w-4 h-4 text-primary" /> {isActivated ? 'دخول النظام' : 'تفعيل ودخول'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t space-y-3">
          <a href="https://www.facebook.com/magdy.khallafa" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 text-[11px] text-blue-600 font-black no-underline">
            <Facebook className="w-4 h-4" /> برمجة وتطوير: مجدي خلفه
          </a>
          <div className="flex flex-col items-center gap-1 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 cursor-pointer" onClick={handleCopyId}> 
            <span className="text-[9px] text-slate-400 font-black">
              <Fingerprint className="w-3 h-3 inline ml-1" /> كود الجهاز (اضغط للنسخ)
            </span> 
            <code className="text-primary font-mono text-[10px]">{deviceId}</code> 
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider> 
        <Toaster /> 
        <Sonner position="top-right" />
        <Router>
          <MainLayout 
            user={user} 
            onLogout={() => { 
                setLoading(true);
                setTimeout(() => {
                    localStorage.removeItem('loggedUserId');
                    setUser(null); 
                    setLoading(false);
                }, 600);
            }}
          >
            <Routes>
              {/* توجيه المسار الرئيسي بناءً على الصلاحية */}
              <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
              
              <Route path="/dashboard" element={user?.permissions?.dashboard ? <Dashboard /> : <Navigate to={getDefaultRoute()} replace />} />
              <Route path="/students" element={user?.permissions?.students ? <Students /> : <Navigate to={getDefaultRoute()} replace />} />
              <Route path="/teachers" element={user?.permissions?.teachers ? <Teachers /> : <Navigate to={getDefaultRoute()} replace />} />
              <Route path="/groups" element={user?.permissions?.groups ? <Groups /> : <Navigate to={getDefaultRoute()} replace />} />
              <Route path="/attendance" element={user?.permissions?.attendance ? <Attendance /> : <Navigate to={getDefaultRoute()} replace />} />
              <Route path="/books" element={user?.permissions?.books ? <BooksPage /> : <Navigate to={getDefaultRoute()} replace />} />
              <Route path="/exams" element={user?.permissions?.exams ? <Exams /> : <Navigate to={getDefaultRoute()} replace />} />
              <Route path="/finance" element={user?.permissions?.finance ? <Finance /> : <Navigate to={getDefaultRoute()} replace />} />
              <Route path="/alerts" element={user?.permissions?.alerts ? <Alerts /> : <Navigate to={getDefaultRoute()} replace />} />
              <Route path="/archive" element={user?.permissions?.archive ? <Archive /> : <Navigate to={getDefaultRoute()} replace />} />
              <Route path="/parents" element={user?.permissions?.parents ? <Parents /> : <Navigate to={getDefaultRoute()} replace />} />
              <Route path="/settings" element={user?.permissions?.settings ? <Settings /> : <Navigate to={getDefaultRoute()} replace />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </MainLayout>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}; 

export default App;