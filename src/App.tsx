import { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { GraduationCap, Lock, Facebook, Fingerprint, ShieldCheck, Wifi, Save, X, AlertTriangle, Phone, MessageCircle, CheckCircle, AlertCircle } from 'lucide-react';
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

import CryptoJS from 'crypto-js';

const queryClient = new QueryClient();

// مفتاح سري قوي – غيّره لحاجة طويلة وعشوائية خاصة بيك فقط
const SECRET_KEY = "MagdyKhelfa_SuperSecretKey_2025_01005331060_DoNotShareThisEver!!!";

// تعريف لـ electronAPI من preload.js
declare global {
  interface Window {
    electronAPI?: {
      getMachineId: () => Promise<string>;
    };
  }
}

/**
 * جلب معرف الجهاز الثابت
 * - في Electron: من preload.js (machine-id)
 * - في المتصفح/dev: UUID عشوائي
 */
const getInitialDeviceId = async () => {
  let id = localStorage.getItem('fixed_id');

  if (!id) {
    if (window.electronAPI?.getMachineId) {
      try {
        id = await window.electronAPI.getMachineId();
        console.log('✅ Machine ID from Electron:', id);
      } catch (err) {
        console.error('❌ فشل جلب machine ID:', err);
      }
    }

    if (!id) {
      console.warn('⚠️ استخدام UUID عشوائي (Dev mode)');
      id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16).toUpperCase();
      });
    }

    localStorage.setItem('fixed_id', id);
  }

  return id;
};

const App = () => {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ n: '', p: '', act: '' });
  const [renewCode, setRenewCode] = useState('');
  const [showIpPanel, setShowIpPanel] = useState(false);
  const [manualIp, setManualIp] = useState(localStorage.getItem('server_ip') || '');

  const [licenseData, setLicenseData] = useState<any>(() => {
    const stored = localStorage.getItem('license_data');
    return stored ? JSON.parse(stored) : null;
  });

  const [isLicenseChecked, setIsLicenseChecked] = useState(false);
  const [isLicenseActive, setIsLicenseActive] = useState(false);

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

  // حالة لعرض رسائل التفعيل على الشاشة
  const [activationMessage, setActivationMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // جلب Device ID مرة واحدة
  useEffect(() => {
    getInitialDeviceId().then(id => {
      setDeviceId(id);
      setTimeout(() => setLoading(false), 600);
    });
  }, []);

  // فحص صلاحية الترخيص كل دقيقة
  useEffect(() => {
    if (!deviceId) return;

    let isMounted = true;

    const checkLicense = () => {
      if (!licenseData) {
        if (isMounted) {
          setIsLicenseActive(false);
          setIsLicenseChecked(true);
        }
        return;
      }

      try {
        const expiresAt = new Date(licenseData.expiresAt);
        const now = new Date();

        const licenseBelongsToThisDevice = licenseData.deviceId === deviceId;
        const isActive = licenseBelongsToThisDevice && expiresAt > now;

        if (isMounted) {
          setIsLicenseActive(isActive);
          setIsLicenseChecked(true);

          if (!licenseBelongsToThisDevice) {
            console.warn(`ترخيص لجهاز مختلف: مخزن=${licenseData.deviceId}، حالي=${deviceId}`);
          }
        }
      } catch (err) {
        console.error("خطأ في فحص تاريخ الترخيص:", err);
        if (isMounted) {
          setIsLicenseActive(false);
          setIsLicenseChecked(true);
        }
      }
    };

    checkLicense();
    const interval = setInterval(checkLicense, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [licenseData, deviceId]);

  // دالة مساعدة لعرض الرسائل على الشاشة + toast
  const showMessage = (type: 'success' | 'error', text: string) => {
    setActivationMessage({ type, text });
    toast[type](text);
  };

  // تنظيف الرسائل بعد 5 ثواني
  useEffect(() => {
    if (activationMessage) {
      const timer = setTimeout(() => setActivationMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [activationMessage]);

  const activateOrRenew = async (code: string) => {
    if (!deviceId) {
      showMessage('error', 'لم يتم تحميل معرف الجهاز بعد');
      return false;
    }

    const trimmed = code.trim();
    if (trimmed.length < 64) {
      showMessage('error', 'الكود قصير جدًا (يجب أن يكون 64 حرف على الأقل)');
      return false;
    }

    const providedSignature = trimmed.slice(-64);
    const payload = trimmed.slice(0, -64);

    const computedSignature = CryptoJS.HmacSHA256(payload + deviceId, SECRET_KEY)
      .toString(CryptoJS.enc.Hex);

    if (providedSignature !== computedSignature) {
      showMessage('error', 'كود التفعيل غير صالح أو مخصص لجهاز آخر');
      return false;
    }

    // استخراج التواريخ من الـ payload
    const [issuedFromCode, expiresFromCode] = payload.split('|');

    if (!issuedFromCode || !expiresFromCode) {
      showMessage('error', 'صيغة الكود غير صحيحة (يجب أن تحتوي على issuedAt|expiresAt)');
      return false;
    }

    const expiresDate = new Date(expiresFromCode);
    if (isNaN(expiresDate.getTime())) {
      showMessage('error', 'تاريخ الانتهاء في الكود غير صالح');
      return false;
    }

    // حماية: منع تفعيل على جهاز مختلف لو فيه ترخيص قديم
    if (licenseData && licenseData.deviceId && licenseData.deviceId !== deviceId) {
      showMessage('error', 'هذا الترخيص مخصص لجهاز آخر ولا يمكن استخدامه هنا');
      return false;
    }

    try {
      const newData = {
        deviceId,
        issuedAt: issuedFromCode,
        expiresAt: expiresFromCode,
        signature: trimmed
      };

      localStorage.setItem('license_data', JSON.stringify(newData));
      setLicenseData(newData);
      setIsLicenseActive(true);
      setIsLicenseChecked(true);

      showMessage('success', 'تم التفعيل / التجديد بنجاح ✓');
      setTimeout(() => window.location.reload(), 1200);
      return true;
    } catch (err) {
      console.error(err);
      showMessage('error', 'حدث خطأ أثناء معالجة الكود');
      return false;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setActivationMessage(null);

    const code = form.act.trim();
    if (code.length >= 64) {
      const success = await activateOrRenew(code);
      if (!success) {
        setLoading(false);
        return;
      }
    }

    const all = JSON.parse(localStorage.getItem('edu_users') || '[]');
    const found = all.find((u: any) => u.user === form.n && u.password === form.p);

    if (all.length === 0 && form.n === "admin" && form.p === "admin") {
      const admin = {
        id: Date.now(),
        user: "admin",
        password: "admin",
        role: "admin",
        name: "الأدمن",
        permissions: { dashboard: true, students: true, teachers: true, groups: true, finance: true, attendance: true, exams: true, books: true, alerts: true, archive: true, parents: true, settings: true }
      };
      localStorage.setItem('edu_users', JSON.stringify([admin]));
      localStorage.setItem('loggedUserId', String(admin.id));
      localStorage.setItem('currentUser', JSON.stringify(admin));
      setUser(admin);
      window.location.href = getDefaultRoute();
    } else if (found) {
      localStorage.setItem('loggedUserId', String(found.id));
      localStorage.setItem('currentUser', JSON.stringify(found));
      setUser(found);
      window.location.href = getDefaultRoute();
    } else {
      showMessage('error', 'بيانات الدخول خاطئة');
    }

    setLoading(false);
  };

  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewCode.trim()) {
      showMessage('error', 'أدخل كود التجديد أولاً');
      return;
    }
    setLoading(true);
    await activateOrRenew(renewCode);
    setLoading(false);
  };

  const handleCopyId = () => {
    if (!deviceId) return;
    navigator.clipboard.writeText(deviceId)
      .then(() => showMessage('success', 'تم نسخ كود الجهاز'))
      .catch(() => showMessage('error', 'فشل نسخ كود الجهاز'));
  };

  const getDefaultRoute = () => {
    if (!user || !user.permissions) return "/dashboard";

    const perms = user.permissions;
    if (perms.dashboard) return "/dashboard";
    if (perms.students) return "/students";
    if (perms.teachers) return "/teachers";
    if (perms.groups) return "/groups";
    if (perms.attendance) return "/attendance";
    if (perms.books) return "/books";
    if (perms.exams) return "/exams";
    if (perms.finance) return "/finance";
    if (perms.parents) return "/parents";
    if (perms.alerts) return "/alerts";
    if (perms.archive) return "/archive";
    if (perms.settings) return "/settings";
    return "/dashboard";
  };

  const renderActivationMessage = () => {
    if (!activationMessage) return null;

    return (
      <div className={`p-4 rounded-xl mb-6 font-bold text-center flex items-center justify-center gap-3 border-2 ${
        activationMessage.type === 'success'
          ? 'bg-green-100 border-green-500 text-green-800'
          : 'bg-red-100 border-red-500 text-red-800'
      }`}>
        {activationMessage.type === 'success' ? (
          <CheckCircle className="w-6 h-6" />
        ) : (
          <AlertCircle className="w-6 h-6" />
        )}
        <span>{activationMessage.text}</span>
      </div>
    );
  };

  if (loading || !deviceId) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-black" dir="rtl">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-primary rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl animate-bounce">
            <GraduationCap className="text-white w-12 h-12" />
          </div>
          <div className="text-primary text-lg animate-pulse">جاري التحميل...</div>
        </div>
      </div>
    );
  }

  if (!isLicenseChecked) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-black" dir="rtl">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-primary rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl animate-bounce">
            <GraduationCap className="text-white w-12 h-12" />
          </div>
          <div className="text-primary text-lg animate-pulse">جاري التحقق من الترخيص...</div>
        </div>
      </div>
    );
  }

  if (!isLicenseActive) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-900 to-red-700 flex items-center justify-center p-4 sm:p-6 font-bold text-white" dir="rtl">
        <div className="bg-white/10 backdrop-blur-md w-full max-w-lg rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl border border-red-400/40 text-center">
          <AlertTriangle className="w-16 h-16 sm:w-20 sm:h-20 text-yellow-400 mx-auto mb-4 animate-pulse" />
          
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3 drop-shadow-md">
            الاشتراك منتهي
          </h1>

          {renderActivationMessage()}

          {licenseData && (
            <div className="bg-red-950/30 p-4 rounded-xl mb-6 border border-red-400/20">
              <p className="text-lg font-bold text-yellow-300">انتهت الصلاحية في</p>
              <p className="text-xl text-white">{new Date(licenseData.expiresAt).toLocaleDateString('ar-EG')}</p>
            </div>
          )}

          <div className="mb-8 p-5 bg-red-950/30 rounded-xl border border-red-400/20">
            <h2 className="text-xl sm:text-2xl mb-4 text-yellow-300 font-bold">
              جدد اشتراكك الآن
            </h2>

            <form onSubmit={handleRenewSubmit} className="space-y-4">
              <input
                type="text"
                value={renewCode}
                onChange={(e) => setRenewCode(e.target.value.trim())}
                placeholder="أدخل كود التجديد هنا"
                className="w-full p-3.5 bg-white/15 border-2 border-red-400/70 rounded-xl text-center text-white text-base sm:text-lg font-mono placeholder:text-red-300 focus:outline-none focus:border-yellow-400 focus:bg-white/25 transition"
                dir="ltr"
              />

              <button
                type="submit"
                disabled={loading || !renewCode.trim()}
                className={`w-full font-bold py-3.5 rounded-xl text-lg transition-all shadow-lg ${
                  loading || !renewCode.trim()
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-yellow-500 hover:bg-yellow-400 text-red-950 active:scale-98'
                }`}
              >
                {loading ? 'جاري التجديد...' : 'تجديد الاشتراك'}
              </button>
            </form>
          </div>

          <div className="space-y-5 text-base sm:text-lg">
            <p className="text-red-100">للحصول على كود تجديد جديد تواصل مع المبرمج:</p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a
                href="tel:01005331060"
                className="flex items-center justify-center gap-2.5 bg-white/15 hover:bg-white/25 px-5 py-3 rounded-xl transition"
              >
                <Phone className="w-5 h-5" />
                01005331060
              </a>

              <a
                href="https://wa.me/201005331060"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2.5 bg-green-600/70 hover:bg-green-500 px-5 py-3 rounded-xl transition"
              >
                <MessageCircle className="w-5 h-5" />
                واتساب
              </a>
            </div>

            <a
              href="https://www.facebook.com/magdy.khelfa"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 text-blue-300 hover:text-blue-200 mt-3 text-lg"
            >
              <Facebook className="w-5 h-5" />
              فيسبوك: magdy.khelfa
            </a>
          </div>

          <div
            className="mt-8 p-3 bg-white/10 rounded-xl cursor-pointer hover:bg-white/20 transition"
            onClick={handleCopyId}
          >
            <p className="text-sm text-red-200 mb-1.5">كود الجهاز (اضغط للنسخ):</p>
            <code className="text-yellow-200 font-mono text-sm break-all">{deviceId}</code>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-bold" dir="rtl">
        <div className="bg-white w-full max-w-xs rounded-2xl p-5 shadow-xl border-t-8 border-primary text-center relative overflow-hidden">

          {showIpPanel && (
            <div className="absolute inset-0 bg-white/98 z-50 flex flex-col items-center justify-center p-5 animate-in fade-in">
              <button onClick={() => setShowIpPanel(false)} className="absolute top-3 left-3 text-slate-400 hover:text-red-500">
                <X size={20} />
              </button>
              <Wifi className="w-10 h-10 text-primary mb-2 animate-pulse" />
              <input
                value={manualIp}
                onChange={(e) => setManualIp(e.target.value)}
                className="w-full p-2.5 border-2 rounded-xl text-center mb-3 outline-none focus:border-primary text-sm"
                placeholder="192.168.1.X"
              />
              <button
                onClick={() => {
                  if (manualIp.trim()) localStorage.setItem('server_ip', manualIp.trim());
                  else localStorage.removeItem('server_ip');
                  window.location.reload();
                }}
                className="w-full bg-primary text-white py-2.5 rounded-xl font-bold text-sm"
              >
                <Save className="w-4 h-4 inline ml-2" /> حفظ والربط
              </button>
            </div>
          )}

          <div
            onClick={() => setShowIpPanel(true)}
            className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 cursor-pointer hover:rotate-6 transition-transform shadow-lg shadow-primary/20"
          >
            <GraduationCap className="text-white w-8 h-8" />
          </div>

          <h1 className="text-xl text-slate-800 mb-5 font-black">منصة السنتر الذكي</h1>

          {renderActivationMessage()}

          <form onSubmit={handleLogin} className="space-y-3 text-right">
            <input
              required
              className="w-full p-3 border-2 rounded-xl text-right outline-none focus:border-primary text-sm"
              placeholder="اسم المستخدم"
              value={form.n}
              onChange={(e) => setForm({ ...form, n: e.target.value })}
            />
            <input
              type="password"
              required
              className="w-full p-3 border-2 rounded-xl text-right outline-none focus:border-primary text-sm"
              placeholder="كلمة المرور"
              value={form.p}
              onChange={(e) => setForm({ ...form, p: e.target.value })}
            />
            <button
              type="submit"
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-primary transition-all shadow-lg text-sm"
            >
              <Lock className="w-4 h-4 text-primary" />
              دخول
            </button>
          </form>

          <div className="mt-5 pt-4 border-t space-y-3 text-sm">
            <a
              href="https://www.facebook.com/magdy.khallafa"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 text-blue-600 font-black no-underline"
            >
              <Facebook className="w-4 h-4" /> برمجة وتطوير: مجدي خلفه
            </a>
            <div
              className="flex flex-col items-center gap-1 p-2.5 bg-slate-50 rounded-xl border border-dashed border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
              onClick={handleCopyId}
            >
              <span className="text-[9px] text-slate-400 font-black">
                <Fingerprint className="w-3 h-3 inline ml-1" /> كود الجهاز (اضغط للنسخ)
              </span>
              <code className="text-primary font-mono text-[10px] break-all">{deviceId}</code>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SonnerToaster position="top-center" richColors duration={5000} closeButton />
        <Toaster />
        <Router>
          <MainLayout user={user} onLogout={() => {
            localStorage.removeItem('loggedUserId');
            localStorage.removeItem('currentUser');
            setUser(null);
          }}>
            <Routes>
              <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/students" element={<Students />} />
              <Route path="/teachers" element={<Teachers />} />
              <Route path="/groups" element={<Groups />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/books" element={<BooksPage />} />
              <Route path="/exams" element={<Exams />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/archive" element={<Archive />} />
              <Route path="/parents" element={<Parents />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </MainLayout>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;