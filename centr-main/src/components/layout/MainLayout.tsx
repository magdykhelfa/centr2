import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, UsersRound, Calendar, FileText, Bell, Settings, LogOut, GraduationCap, DollarSign, Search, RefreshCw, Code2, Facebook, Phone, CreditCard, UserX, FileCheck, Users2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';

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

  // مصفوفة المنيو المعدلة لتشمل الصفحات الناقصة مع الصلاحيات
  const menuItems = [
    { title: 'لوحة التحكم', icon: LayoutDashboard, path: '/', perm: 'always' },
    { title: 'المدرسين والمواد', icon: GraduationCap, path: '/teachers', perm: 'always' },
    { title: 'المجموعات', icon: UsersRound, path: '/groups', perm: 'groups' },
    { title: 'الطلاب', icon: Users, path: '/students', perm: 'students' }, 
    { title: 'الحصص والدروس', icon: FileText, path: '/sessions', perm: 'groups' },
    { title: 'التحضير والغياب', icon: Calendar, path: '/attendance', perm: 'groups' },
    { title: 'الامتحانات', icon: FileCheck, path: '/exams', perm: 'students' }, // صفحة جديدة
    { title: 'أولياء الأمور', icon: Users2, path: '/parents', perm: 'students' }, // صفحة جديدة
    { title: 'الحسابات', icon: DollarSign, path: '/finance', perm: 'finance' },
    { title: 'التنبيهات', icon: Bell, path: '/alerts', perm: 'always' },
    { title: 'الإعدادات', icon: Settings, path: '/settings', perm: 'settings' },
  ];

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] font-cairo overflow-hidden" dir="rtl">
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-30 shrink-0 h-full">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800/50">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg"><GraduationCap className="text-white w-6 h-6" /></div>
          <div className="flex flex-col"><span className="font-black text-lg">المدرس الذكي </span><span className="text-[10px] text-primary font-bold tracking-tighter uppercase">v2.0 2026</span></div>
        </div>
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {menuItems.map((item) => {
            // التحقق من الصلاحيات: لو أدمن يظهر كله، لو مساعد يظهر اللي مسموح له بس
            const hasPerm = item.perm === 'always' || user?.role === 'admin' || (user?.permissions && (user.permissions as any)[item.perm]);
            if (!hasPerm) return null;

            const active = location.pathname === item.path;
            return (
              <button key={item.path} onClick={() => navigate(item.path)} className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all border-none bg-transparent cursor-pointer text-right mb-1 group", active ? "bg-primary text-white shadow-lg" : "text-slate-400 hover:bg-white/5 hover:text-white")}>
                <item.icon className={cn("w-5 h-5", active ? "text-white" : "text-slate-500")} />
                <span className="font-bold text-sm">{item.title}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-800/50">
          <div className="bg-white/5 p-3 rounded-xl mb-3">
             <p className="text-[10px] text-slate-500 font-bold mb-1">المستخدم الحالي:</p>
             <p className="text-xs font-black text-primary truncate">{user?.name || 'مستخدم'}</p>
          </div>
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all border-none bg-transparent cursor-pointer font-black text-xs"><LogOut className="w-4 h-4" /> خروج </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-40 font-bold shrink-0">
          <div className="flex-1 max-w-xl text-right relative">
            <div className="relative border rounded-xl overflow-hidden shadow-sm bg-slate-50 border-slate-200"><Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" value={query} onChange={(e) => handleSearch(e.target.value)} placeholder="بحث سريع..." className="w-full py-2.5 pr-10 pl-4 outline-none text-sm font-bold text-slate-600 bg-transparent" /></div>
            {results.length > 0 && (
              <div className="absolute top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-2xl z-[60] overflow-hidden">
                {results.map((r, i) => (
                  <div key={i} onClick={() => { navigate(`${r.path}?id=${r.id}`); setResults([]); setQuery(""); }} className="p-3 hover:bg-slate-50 border-b flex items-center gap-3 justify-start text-right cursor-pointer transition-colors"><div className="p-2 bg-slate-100 rounded-lg">{r.type === 'student' ? <GraduationCap className="w-4 h-4 text-blue-600" /> : <UsersRound className="w-4 h-4 text-emerald-600" />}</div><div><p className="text-xs font-black text-slate-800">{r.text}</p><p className="text-[10px] text-slate-400 font-bold">{r.sub}</p></div></div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group"><button className="p-2 rounded-xl hover:bg-blue-50 transition-all border border-transparent flex items-center gap-2"><Code2 className="w-5 h-5 text-slate-500" /><span className="text-[10px] font-black hidden lg:block text-slate-500">المطور</span></button>
              <div className="absolute left-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden text-center"><div className="p-4 bg-gradient-to-br from-blue-600 to-blue-700 text-white"><h3 className="font-black text-sm">م/ مجدي خلفه</h3><p className="text-[10px] text-blue-100 font-bold">خبير تطوير الأنظمة</p></div><div className="p-3 bg-white text-right"><div onClick={() => window.open('https://facebook.com/magdy.khelfa')} className="flex items-center justify-between p-2 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-blue-100 font-bold text-[11px]"><Facebook className="w-4 h-4 text-blue-600" /> فيسبوك </div><div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-[11px]"><Phone className="w-4 h-4 text-green-600" /> +201005331060 </div></div></div>
            </div>

            <button onClick={handleManualSync} disabled={isSyncing} className={`p-2 rounded-xl border transition-all ${isSyncing ? 'bg-slate-50' : 'hover:bg-amber-50 text-slate-500 hover:text-amber-600 border-transparent hover:border-amber-100'}`}><RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} /></button>

            <div className="relative group">
              <button className="relative p-2 rounded-xl hover:bg-slate-50 transition-colors"><Bell className="w-5 h-5 text-slate-500" />{notifs.length > 0 && <span className="absolute top-1 left-1 w-4 h-4 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full border-2 border-white font-black">{notifs.length}</span>}</button>
              <div className="absolute left-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
                <div className="p-4 border-b bg-slate-50/50 flex justify-between items-center"><h3 className="font-black text-slate-800 text-xs">تنبيهات السنتر</h3><span className="text-[9px] bg-white border px-2 py-0.5 rounded-full font-black">{notifs.length} جديدة</span></div>
                <div className="max-h-64 overflow-y-auto">{notifs.length === 0 ? <div className="p-8 text-center text-[10px] text-slate-400 font-bold">لا توجد تنبيهات ✅</div> : notifs.map(n => <div key={n.id} onClick={() => navigate(n.type === 'abs' ? '/attendance' : '/finance')} className="p-4 hover:bg-slate-50 border-b last:border-0 text-right cursor-pointer group"><div className="flex items-center gap-2 justify-end mb-1"><p className="text-[11px] text-slate-800 font-black group-hover:text-blue-600 transition-colors">{n.text}</p>{n.type === 'abs' ? <UserX className="w-3 h-3 text-red-500" /> : <CreditCard className="w-3 h-3 text-orange-500" />}</div><p className="text-[9px] text-slate-400 font-bold">{n.sub}</p></div>)}</div>
                <div className="p-2 border-t text-center"><button onClick={() => navigate('/alerts')} className="text-[10px] font-black text-blue-600">عرض السجل الكامل</button></div>
              </div>
            </div>

            <div className="flex items-center gap-3 pr-4 border-r border-slate-200 cursor-pointer group" onClick={onLogout}><div className="text-right"><p className="text-xs font-black text-slate-800">{user?.name || 'مستخدم'}</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{user?.role === 'admin' ? 'المدير' : 'مساعد'}</p></div><div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-black text-sm">{user?.name?.charAt(0) || 'M'}</div></div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-[#f8fafc]">{children}</main>
      </div>
    </div>
  );
};