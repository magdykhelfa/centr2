import { Bell, Search, Users as UsersIcon, Code2, Facebook, Phone, RefreshCw, GraduationCap, CreditCard, UserX } from 'lucide-react'; 
import { useState, useEffect, useCallback } from 'react'; 
import { useNavigate } from 'react-router-dom'; 
import { toast } from 'sonner';

export function Header({ user, onLogout }: { user?: any; onLogout?: () => void }) { 
  const navigate = useNavigate(); 
  const [notifs, setNotifs] = useState<any[]>([]); 
  const [query, setQuery] = useState(''); 
  const [results, setResults] = useState<any[]>([]); 
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
      if (!attendance[st.group]?.[st.id] && !readAlerts.includes(alertId)) { alerts.push({ id: alertId, text: `غياب: ${st.name}`, sub: `مجموعة: ${st.group}`, type: 'abs' }); }
    });
    const debtorsCount = students.filter((st: any) => transactions.some((t: any) => t.student === st.name && t.status === "partial")).length;
    if (debtorsCount > 0 && !readAlerts.includes(`fin-${today}`)) { alerts.push({ id: `fin-${today}`, text: `متأخرات مالية`, sub: `يوجد ${debtorsCount} طلاب لم يسددوا`, type: 'fin' }); }
    setNotifs(alerts); 
  }, []); 

  useEffect(() => { loadAlerts(); window.addEventListener('storage', loadAlerts); const interval = setInterval(loadAlerts, 5000); return () => { window.removeEventListener('storage', loadAlerts); clearInterval(interval); }; }, [loadAlerts]); 

  const handleManualSync = async () => { setIsSyncing(true); toast.success("جاري المزامنة..."); try { if ((window as any).forceSync) { await (window as any).forceSync(); } loadAlerts(); window.dispatchEvent(new Event('storage')); setTimeout(() => { navigate(0); setIsSyncing(false); }, 800); } catch (e) { setIsSyncing(false); toast.error("فشل"); } };

  const handleSearch = (q: string) => { setQuery(q); if (!q.trim()) { setResults([]); return; } const students = JSON.parse(localStorage.getItem('students-data') || '[]'); const groups = JSON.parse(localStorage.getItem('groups-data') || '[]'); const res = [...students.filter((s:any) => s.name.includes(q) || s.id?.toString().includes(q)).map((s:any) => ({ id: s.id, type: 'student', text: s.name, sub: `كود: ${s.id} | ${s.group}`, path: '/students' })), ...groups.filter((g:any) => g.name.includes(q)).map((g:any) => ({ id: g.id, type: 'group', text: `مجموعة: ${g.name}`, sub: `المواعيد: ${g.times}`, path: '/groups' }))].slice(0, 5); setResults(res); }; 

  return ( 
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40 font-bold" dir="rtl"> 
      <div className="flex-1 max-w-xl text-right relative"> 
        <div className="relative border rounded-xl overflow-hidden shadow-sm bg-slate-50 border-slate-200"> 
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /> 
          <input type="text" value={query} onChange={(e) => handleSearch(e.target.value)} placeholder="ابحث باسم الطالب، الكود..." className="w-full py-2.5 pr-10 pl-4 outline-none text-sm font-bold text-slate-600 bg-transparent" /> 
        </div> 
        {results.length > 0 && ( <div className="absolute top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-2xl z-[60] overflow-hidden"> {results.map((r, i) => ( <div key={i} onClick={() => { navigate(`${r.path}?id=${r.id}`); setResults([]); setQuery(""); }} className="p-3 hover:bg-slate-50 border-b last:border-0 cursor-pointer flex items-center gap-3 justify-start text-right transition-colors"><div className="p-2 bg-slate-100 rounded-lg">{r.type === 'student' ? <GraduationCap className="w-4 h-4 text-blue-600" /> : <UsersIcon className="w-4 h-4 text-emerald-600" />}</div><div><p className="text-xs font-black text-slate-800">{r.text}</p><p className="text-[10px] text-slate-400 font-bold">{r.sub}</p></div></div> ))} </div> )} 
      </div> 
      <div className="flex items-center gap-4"> 
        <div className="relative group"> 
          <button className="p-2 rounded-xl hover:bg-blue-50 transition-all border border-transparent flex items-center gap-2"><Code2 className="w-5 h-5 text-slate-500" /><span className="text-[10px] font-black hidden lg:block text-slate-500">مطور البرنامج</span></button> 
          <div className="absolute left-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden text-center"><div className="p-4 bg-gradient-to-br from-blue-600 to-blue-700 text-white"><div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2"><Code2 className="w-6 h-6 text-white" /></div><h3 className="font-black text-sm">م/ مجدي خلفه</h3><p className="text-[10px] text-blue-100 font-bold">خبير تطوير الأنظمة التعليمية</p></div><div className="p-3 space-y-2 bg-white text-right"><div onClick={() => window.open('https://facebook.com/magdy.khelfa', '_blank')} className="flex items-center justify-between p-2 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-blue-100"><Facebook className="w-4 h-4 text-blue-600" /><span className="text-[11px] font-black text-slate-700">فيسبوك</span></div><div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100"><Phone className="w-4 h-4 text-green-600" /><span className="text-[11px] font-black text-slate-700">+201005331060</span></div></div></div> 
        </div> 
        <button onClick={handleManualSync} disabled={isSyncing} className={`p-2 rounded-xl transition-all border ${isSyncing ? 'bg-slate-50 text-slate-300' : 'hover:bg-amber-50 text-slate-500 hover:text-amber-600 border-transparent hover:border-amber-100'}`}><RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} /></button> 
        <div className="relative group"> 
          <button className="relative p-2 rounded-xl hover:bg-slate-50 transition-colors"><Bell className="w-5 h-5 text-slate-500" />{notifs.length > 0 && <span className="absolute top-1 left-1 w-4 h-4 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full border-2 border-white font-black">{notifs.length}</span>}</button> 
          <div className="absolute left-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50"><div className="p-4 border-b border-slate-50 text-right bg-slate-50/50 flex justify-between items-center"><h3 className="font-black text-slate-800 text-xs">تنبيهات السنتر</h3><span className="text-[9px] bg-white border px-2 py-0.5 rounded-full font-black">{notifs.length} جديدة</span></div><div className="max-h-64 overflow-y-auto">{notifs.length === 0 ? (<div className="p-8 text-center text-xs text-slate-400 font-bold italic">لا توجد تنبيهات جديدة ✅</div>) : (notifs.map((n) => (<div key={n.id} className="p-4 hover:bg-slate-50 border-b last:border-0 text-right cursor-pointer group" onClick={() => navigate(n.type === 'abs' ? '/attendance' : '/finance')}><div className="flex items-center gap-2 justify-end mb-1"><p className="text-[11px] text-slate-800 font-black group-hover:text-blue-600 transition-colors">{n.text}</p>{n.type === 'abs' ? <UserX className="w-3 h-3 text-red-500" /> : <CreditCard className="w-3 h-3 text-orange-500" />}</div><p className="text-[9px] text-slate-400 font-bold">{n.sub}</p></div>)))}</div><div className="p-2 border-t text-center"><button onClick={() => navigate('/alerts')} className="text-[10px] font-black text-blue-600 hover:underline">عرض كل السجل</button></div></div> 
        </div> 
        <div className="flex items-center gap-3 pr-4 border-r border-slate-200 cursor-pointer group" onClick={onLogout}><div className="text-right"><p className="text-xs font-black text-slate-800 group-hover:text-red-600 transition-colors">{user?.name || 'أستاذنا'}</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">مدير النظام</p></div><div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-black text-sm shadow-sm">{user?.name?.charAt(0) || 'M'}</div></div> 
      </div> 
    </header> 
  ); 
}