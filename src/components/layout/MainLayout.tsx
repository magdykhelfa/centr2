import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UsersRound, 
  Calendar, 
  FileText, 
  Bell, 
  Settings, 
  LogOut, 
  GraduationCap, 
  DollarSign, 
  Search, 
  RefreshCw, 
  Code2, 
  Facebook, 
  Phone, 
  CreditCard, 
  UserX, 
  FileCheck, 
  Users2,
  Trash2 // ✅ تم إضافة الأيقونة هنا لحل مشكلة الخطأ
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import { BookOpen } from "lucide-react";

// ... باقي الكود كما هو دون تغيير

export const MainLayout = ({ children, user, onLogout }: any) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadAlerts = useCallback(() => {
    const students = JSON.parse(localStorage.getItem('students-data') || '[]');
    const attendance = JSON.parse(localStorage.getItem('attendance-data') || '{}');
    const transactions = JSON.parse(localStorage.getItem('finance-transactions') || '[]');
    const readAlerts = JSON.parse(localStorage.getItem("read-alerts-ids") || "[]");
    const today = new Date().toLocaleDateString('en-CA'); 
    const alerts: any[] = [];
    students.forEach((st: any) => {
      const alertId = `abs-${st.id}-${today}`;
      if (!attendance[st.group]?.[st.id] && !readAlerts.includes(alertId)) {
        alerts.push({ id: alertId, text: `غياب: ${st.name}`, sub: `مجموعة: ${st.group}`, type: 'abs' });
      }
    });
    const debtorsCount = students.filter((st: any) => transactions.some((t: any) => t.student === st.name && t.status === "partial")).length;
    if (debtorsCount > 0 && !readAlerts.includes(`fin-${today}`)) {
      alerts.push({ id: `fin-${today}`, text: `متأخرات مالية`, sub: `يوجد ${debtorsCount} طلاب لم يسددوا`, type: 'fin' });
    }
    setNotifs(alerts);
  }, []);

  useEffect(() => {
    loadAlerts();
    window.addEventListener('storage', loadAlerts);
    const interval = setInterval(loadAlerts, 5000);
    return () => { window.removeEventListener('storage', loadAlerts); clearInterval(interval); };
  }, [loadAlerts]);

  const handleManualSync = async () => {
    setIsSyncing(true); toast.success("جاري المزامنة...");
    try { if ((window as any).forceSync) await (window as any).forceSync(); loadAlerts(); window.dispatchEvent(new Event('storage')); setTimeout(() => { navigate(0); setIsSyncing(false); }, 800); }
    catch (e) { setIsSyncing(false); toast.error("فشل"); }
  };

  const handleSearch = (q: string) => {
    setQuery(q); if (!q.trim()) { setResults([]); return; }
    const students = JSON.parse(localStorage.getItem('students-data') || '[]');
    const groups = JSON.parse(localStorage.getItem('groups-data') || '[]');
    const res = [
      ...students.filter((s:any) => s.name.includes(q) || s.id?.toString().includes(q)).map((s:any) => ({ id: s.id, type: 'student', text: s.name, sub: `كود: ${s.id} | ${s.group}`, path: '/students' })),
      ...groups.filter((g:any) => g.name.includes(q)).map((g:any) => ({ id: g.id, type: 'group', text: `مجموعة: ${g.name}`, sub: `المواعيد: ${g.times}`, path: '/groups' }))
    ].slice(0, 5);
    setResults(res);
  };

  const menuItems = [
    { title: 'لوحة التحكم', icon: LayoutDashboard, path: '/', perm: 'always' },
    { title: 'المدرسين والمواد', icon: GraduationCap, path: '/teachers', perm: 'always' },
    { title: 'المجموعات', icon: UsersRound, path: '/groups', perm: 'groups' },
    { title: 'الطلاب', icon: Users, path: '/students', perm: 'students' }, 
    { title: 'التحضير والغياب', icon: Calendar, path: '/attendance', perm: 'groups' },
    { title: 'الامتحانات', icon: FileCheck, path: '/exams', perm: 'students' },
    { title: 'أولياء الأمور', icon: Users2, path: '/parents', perm: 'students' },
    { title: 'الحسابات', icon: DollarSign, path: '/finance', perm: 'finance' },
    { title: 'التنبيهات', icon: Bell, path: '/alerts', perm: 'always' },
    { title: 'الكتب والمذكرات', icon: BookOpen, path: '/books', perm: 'always' },
    
    // القسم الجديد (الأرشيف)
    { title: ' الأرشيف ', icon: Trash2, path: '/archive', perm: 'students' }, 
    
    { title: 'الإعدادات', icon: Settings, path: '/settings', perm: 'settings' },
];

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] font-cairo overflow-hidden" dir="rtl">
      {/* Sidebar الصغير */}
      <aside className="w-48 bg-slate-900 text-white flex flex-col shadow-2xl z-30 shrink-0 h-full">
        <div className="p-3 flex items-center gap-2 border-b border-slate-800/50">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center"><GraduationCap className="text-white w-5 h-5" /></div>
          <div className="flex flex-col"><span className="font-black text-xs">السنتر الذكي</span><span className="text-[8px] text-primary font-bold">v2.0 2026</span></div>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {menuItems.map((item) => {
            const hasPerm = item.perm === 'always' || user?.role === 'admin' || (user?.permissions && (user.permissions as any)[item.perm]);
            if (!hasPerm) return null;
            const active = location.pathname === item.path;
            return (
              <button key={item.path} onClick={() => navigate(item.path)} className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all border-none bg-transparent cursor-pointer text-right group", active ? "bg-primary text-white shadow-lg" : "text-slate-400 hover:bg-white/5 hover:text-white")}>
                <item.icon className={cn("w-4 h-4", active ? "text-white" : "text-slate-500")} />
                <span className="font-bold text-[12px]">{item.title}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-2 border-t border-slate-800/50">
          <div className="bg-white/5 p-2 rounded-lg mb-2">
             <p className="text-[9px] text-slate-500 font-bold mb-0.5">المستخدم:</p>
             <p className="text-[10px] font-black text-primary truncate">{user?.name || 'مستخدم'}</p>
          </div>
          <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all border-none bg-transparent cursor-pointer font-black text-[10px]"><LogOut className="w-3 h-3" /> خروج </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header الصغير */}
        <header className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-40 shrink-0">
          <div className="flex-1 max-w-xs text-right relative">
            <div className="relative border rounded-lg overflow-hidden bg-slate-50 border-slate-200">
              <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input type="text" value={query} onChange={(e) => handleSearch(e.target.value)} placeholder="بحث..." className="w-full py-1 pr-8 pl-3 outline-none text-[12px] font-bold text-slate-600 bg-transparent" />
            </div>
            {results.length > 0 && (
              <div className="absolute top-full mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-2xl z-[60] overflow-hidden">
                {results.map((r, i) => (
                  <div key={i} onClick={() => { navigate(`${r.path}?id=${r.id}`); setResults([]); setQuery(""); }} className="p-2 hover:bg-slate-50 border-b flex items-center gap-3 justify-start text-right cursor-pointer">
                    <div className="p-1.5 bg-slate-100 rounded-lg">{r.type === 'student' ? <GraduationCap className="w-3.5 h-3.5 text-blue-600" /> : <UsersRound className="w-3.5 h-3.5 text-emerald-600" />}</div>
                    <div><p className="text-[11px] font-black text-slate-800">{r.text}</p><p className="text-[9px] text-slate-400 font-bold">{r.sub}</p></div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* رجوع مربع المطور بالكامل */}
            <div className="relative group">
              <button className="p-1.5 rounded-lg hover:bg-blue-50 transition-all border border-transparent flex items-center gap-2">
                <Code2 className="w-4 h-4 text-slate-500" />
                <span className="text-[10px] font-black hidden lg:block text-slate-500">تواصل مع مطور البرنامج</span>
              </button>
              <div className="absolute left-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden text-center">
                <div className="p-4 bg-gradient-to-br from-blue-600 to-blue-700 text-white"><h3 className="font-black text-sm">م/ مجدي خلفه</h3><p className="text-[10px] text-blue-100 font-bold">خبير تطوير الأنظمة</p></div>
                <div className="p-3 bg-white text-right">
                  <div onClick={() => window.open('https://facebook.com/magdy.khelfa')} className="flex items-center justify-between p-2 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-blue-100 font-bold text-[11px]"><Facebook className="w-4 h-4 text-blue-600" /> فيسبوك </div>
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-[11px] font-bold"><Phone className="w-4 h-4 text-green-600" /> +201005331060 </div>
                </div>
              </div>
            </div>

            <button onClick={handleManualSync} disabled={isSyncing} className={`p-1.5 rounded-lg border transition-all ${isSyncing ? 'bg-slate-50' : 'hover:bg-amber-50 text-slate-500 hover:text-amber-600 border-transparent hover:border-amber-100'}`}>
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>

            {/* رجوع الإشعارات بالتفصيل */}
            <div className="relative group">
              <button className="relative p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                <Bell className="w-4 h-4 text-slate-500" />
                {notifs.length > 0 && <span className="absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full border border-white font-black">{notifs.length}</span>}
              </button>
              <div className="absolute left-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
                <div className="p-3 border-b bg-slate-50/50 flex justify-between items-center"><h3 className="font-black text-slate-800 text-xs">تنبيهات السنتر</h3><span className="text-[9px] bg-white border px-2 py-0.5 rounded-full font-black">{notifs.length} جديدة</span></div>
                <div className="max-h-64 overflow-y-auto">
                  {notifs.length === 0 ? <div className="p-8 text-center text-[10px] text-slate-400 font-bold">لا توجد تنبيهات ✅</div> : notifs.map(n => (
                    <div key={n.id} onClick={() => navigate(n.type === 'abs' ? '/attendance' : '/finance')} className="p-3 hover:bg-slate-50 border-b last:border-0 text-right cursor-pointer group">
                      <div className="flex items-center gap-2 justify-end mb-1"><p className="text-[11px] text-slate-800 font-black group-hover:text-blue-600 transition-colors">{n.text}</p>{n.type === 'abs' ? <UserX className="w-3 h-3 text-red-500" /> : <CreditCard className="w-3 h-3 text-orange-500" />}</div>
                      <p className="text-[9px] text-slate-400 font-bold">{n.sub}</p>
                    </div>
                  ))}
                </div>
                <div className="p-2 border-t text-center"><button onClick={() => navigate('/alerts')} className="text-[10px] font-black text-blue-600 border-none bg-transparent">عرض السجل الكامل</button></div>
              </div>
            </div>

            <div className="flex items-center gap-2 pr-2 border-r border-slate-200 cursor-pointer group" onClick={onLogout}>
              <div className="text-right hidden sm:block">
                <p className="text-[11px] font-black text-slate-800 leading-none">{user?.name || 'مستخدم'}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase">{user?.role === 'admin' ? 'المدير' : 'مساعد'}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-black text-xs">{user?.name?.charAt(0) || 'M'}</div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 bg-[#f8fafc]">{children}</main>
      </div>
    </div>
  );
};