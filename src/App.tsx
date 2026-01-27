import { useState, useEffect, Suspense, lazy } from 'react'; 
import { Toaster } from "@/components/ui/toaster"; 
import { Toaster as Sonner } from "sonner"; 
import { TooltipProvider } from "@/components/ui/tooltip"; 
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"; 
import { HashRouter as Router, Routes, Route } from "react-router-dom"; 
import { MainLayout } from "./components/layout/MainLayout"; 
import { GraduationCap, Lock } from 'lucide-react'; 
import { toast } from 'sonner';

// --- Lazy Pages ---
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Teachers = lazy(() => import("./pages/Teachers")); // ضفنا المدرسين هنا
const Students = lazy(() => import("./pages/Students"));
const Groups = lazy(() => import("./pages/Groups"));
const Attendance = lazy(() => import("./pages/Attendance"));
const Sessions = lazy(() => import("./pages/Sessions"));
const Exams = lazy(() => import("./pages/Exams"));
const Parents = lazy(() => import("./pages/Parents"));
const Finance = lazy(() => import("./pages/Finance"));
const Alerts = lazy(() => import("./pages/Alerts"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<any>(null); 
  const [loading, setLoading] = useState(true); 
  const [form, setForm] = useState({ n: '', p: '' }); 

  useEffect(() => {
    const s = localStorage.getItem('current_edu_user');
    if (s) setUser(JSON.parse(s));
    setLoading(false);
  }, []);

  const handleLogin = (e: any) => {
    e.preventDefault();
    const all = JSON.parse(localStorage.getItem('edu_users') || '[]');

    if (all.length === 0 && form.n === "admin" && form.p === "admin") {
      const admin = { name: "المدير العام", user: "admin", password: "admin", role: "admin" };
      localStorage.setItem('edu_users', JSON.stringify([admin]));
      localStorage.setItem('current_edu_user', JSON.stringify(admin));
      setUser(admin);
      toast.success('تم تسجيل الدخول بنجاح');
      return;
    }

    const foundUser = all.find((u: any) => u.user === form.n && u.password === form.p);
    if (foundUser) { 
      setUser(foundUser); 
      localStorage.setItem('current_edu_user', JSON.stringify(foundUser)); 
      toast.success(`أهلاً بك يا ${foundUser.name}`);
    } else {
      toast.error('بيانات الدخول خاطئة');
    }
  };

  if (loading) return null;

  if (!user) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-bold animate-in fade-in duration-500" dir="rtl">
      <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl border-t-[10px] border-primary text-center">
        <div className="w-20 h-20 bg-primary rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary/30 animate-bounce">
          <GraduationCap className="text-white w-10 h-10" />
        </div>
        <h1 className="text-2xl text-slate-800 mb-2 font-black">نظام إدارة السنتر</h1>
        <p className="text-slate-400 text-xs mb-8 font-black">سجل دخولك لبدء العمل</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            required
            className="w-full p-4 bg-slate-50 border-none rounded-2xl text-right outline-none focus:ring-2 ring-primary/20 transition-all font-bold"
            placeholder="اسم المستخدم"
            onChange={(e) => setForm({...form, n: e.target.value})}
          />
          <input
            type="password"
            required
            className="w-full p-4 bg-slate-50 border-none rounded-2xl text-right outline-none focus:ring-2 ring-primary/20 transition-all font-bold"
            placeholder="كلمة المرور"
            onChange={(e) => setForm({...form, p: e.target.value})}
          />
          <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black flex border-none cursor-pointer items-center justify-center gap-2 hover:bg-primary transition-all shadow-xl shadow-slate-200 mt-2">
            <Lock className="w-4 h-4" /> دخول النظام
          </button>
        </form>
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
              localStorage.removeItem('current_edu_user');
              setUser(null);
            }}
          >
            <Suspense fallback={<div className="h-screen flex items-center justify-center font-black text-slate-400">جاري التحميل...</div>}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/teachers" element={<Teachers />} /> {/* ضفنا الراوت هنا */}
                <Route path="/students" element={<Students />} />
                <Route path="/groups" element={<Groups />} />
                <Route path="/attendance" element={<Attendance />} />
                <Route path="/sessions" element={<Sessions />} />
                <Route path="/exams" element={<Exams />} />
                <Route path="/parents" element={<Parents />} />
                <Route path="/finance" element={<Finance />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </MainLayout>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}; 

export default App;
