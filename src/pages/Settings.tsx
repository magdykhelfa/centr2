import { useState, useEffect } from 'react'; 
// ✅ تمت إضافة أيقونة Archive
import { Settings as SetIcon, Building2, ShieldCheck, Trash2, UserPlus, Database, Save, Download, Upload, GraduationCap, RotateCcw, Archive } from 'lucide-react'; 
import { toast } from 'sonner';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export default function Settings() {
  const [s, setS] = useState<any>({ name: 'سنتر التفوق التعليمي', owner: 'م/ مجدي خلفه', users: [] });
  const [newUser, setNewUser] = useState({ 
    name: '', user: '', password: '', role: 'staff',
    permissions: { 
      students: true, 
      teachers: true, 
      groups: true, 
      attendance: true, 
      exams: true, 
      archive: false, // ✅ إضافة الحالة الابتدائية للأرشيف هنا
      finance: false, 
      settings: false 
    } 
  });

  useEffect(() => {
    const localS = localStorage.getItem('office_settings');
    const localU = localStorage.getItem('edu_users');
    if (localS) {
      const parsed = JSON.parse(localS);
      parsed.users = localU ? JSON.parse(localU) : [];
      setS(parsed);
    }
  }, []);

  const saveAll = () => {
    localStorage.setItem('office_settings', JSON.stringify({ name: s.name, owner: s.owner }));
    localStorage.setItem('edu_users', JSON.stringify(s.users || []));
    toast.success('تم الحفظ بنجاح');
    setTimeout(() => window.location.reload(), 500);
  };

  const addUser = () => {
    if (!newUser.user || !newUser.password) return toast.error('برجاء كتابة اسم المستخدم وكلمة المرور');
    
    const userToAdd = {
      ...newUser,
      id: Date.now(),
      permissions: newUser.role === 'admin' 
        ? { 
            students: true, teachers: true, groups: true, sessions: true, 
            attendance: true, exams: true, finance: true, settings: true,
            archive: true // ✅ المدير يحصل على صلاحية الأرشيف تلقائياً
          } 
        : newUser.permissions
    };
    
    setS({ ...s, users: [...(s.users || []), userToAdd] });
    setNewUser({ 
      name: '', user: '', password: '', role: 'staff', 
      permissions: { students: true, teachers: true, groups: true, attendance: true, exams: true, archive: false, finance: false, settings: false } 
    });
    toast.info('تمت الإضافة.. اضغط حفظ للتفعيل');
  };

  const togglePerm = (key: string) => {
    setNewUser({
      ...newUser,
      permissions: { 
        ...newUser.permissions, 
        [key]: !(newUser.permissions as any)[key] 
      }
    });
  };

  const exportBackup = () => {
    const data = {
      settings: s, 
      users: s.users,
      students: JSON.parse(localStorage.getItem('students-data') || '[]'),
      groups: JSON.parse(localStorage.getItem('groups-data') || '[]'),
      teachers: JSON.parse(localStorage.getItem('teachers-data') || '[]'),
      finance: JSON.parse(localStorage.getItem('finance-transactions') || '[]'),
      exams: JSON.parse(localStorage.getItem('exams-data') || '[]'),
      attendance: JSON.parse(localStorage.getItem('attendance-data') || '{}'),
      // ✅ حفظ بيانات الأرشيف أيضاً في النسخة الاحتياطية
      archive: JSON.parse(localStorage.getItem('archive-data') || '[]'),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Backup_${s.name}_${new Date().toLocaleDateString('en-CA')}.json`;
    a.click();
  };

  const importBackup = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event: any) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.users) localStorage.setItem('edu_users', JSON.stringify(data.users));
        if (data.students) localStorage.setItem('students-data', JSON.stringify(data.students));
        if (data.groups) localStorage.setItem('groups-data', JSON.stringify(data.groups));
        if (data.teachers) localStorage.setItem('teachers-data', JSON.stringify(data.teachers));
        if (data.finance) localStorage.setItem('finance-transactions', JSON.stringify(data.finance));
        if (data.exams) localStorage.setItem('exams-data', JSON.stringify(data.exams));
        if (data.attendance) localStorage.setItem('attendance-data', JSON.stringify(data.attendance));
        if (data.archive) localStorage.setItem('archive-data', JSON.stringify(data.archive));
        if (data.settings) localStorage.setItem('office_settings', JSON.stringify({name: data.settings.name, owner: data.settings.owner}));

        toast.success('تمت استعادة كافة البيانات بنجاح');
        setTimeout(() => window.location.reload(), 1000);
      } catch (err) { toast.error('ملف النسخة الاحتياطية غير صالح'); }
    };
    reader.readAsText(file);
  };

  const resetFactory = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في ضبط مصنع؟ سيتم حذف جميع البيانات نهائياً.')) {
      localStorage.clear(); // اختصار لحذف كل شيء
      toast.success('تم ضبط المصنع بنجاح.');
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  return (
    <div className="p-4 space-y-4 text-right font-cairo animate-in fade-in duration-500" dir="rtl">
      <div className="bg-white px-6 py-4 rounded-3xl shadow-sm border-r-4 border-primary flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><SetIcon className="w-5 h-5" /></div>
          <div>
            <h1 className="text-lg font-black text-slate-800">إعدادات الأمان</h1>
            <p className="text-[10px] text-slate-400 font-bold">إدارة الهوية والمستخدمين</p>
          </div>
        </div>
        <button onClick={saveAll} className="bg-primary text-white px-6 py-2 rounded-xl font-black text-xs flex items-center gap-2 hover:bg-slate-800 border-none cursor-pointer transition-all shadow-md shadow-primary/20"><Save className="w-4 h-4" /> حفظ التغييرات</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="font-black text-sm flex items-center gap-2 mb-4 text-slate-600"><Building2 className="w-4 h-4 text-primary" /> بيانات السنتر</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 mr-2">اسم السنتر</label><input className="w-full p-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none focus:ring-1 ring-primary/30" value={s?.name} onChange={e => setS({...s, name: e.target.value})} /></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 mr-2">المدير العام</label><input className="w-full p-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none focus:ring-1 ring-primary/30" value={s?.owner} onChange={e => setS({...s, owner: e.target.value})} /></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="font-black text-sm flex items-center gap-2 mb-4 text-slate-600"><UserPlus className="w-4 h-4 text-primary" /> إدارة الحسابات</h2>
            <div className="bg-slate-50 p-4 rounded-2xl mb-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input placeholder="اسم الشخص" className="p-2.5 rounded-lg border-none text-[11px] font-bold" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                <select className="p-2.5 rounded-lg border-none text-[11px] font-bold outline-none cursor-pointer" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                   <option value="staff">مساعد (صلاحيات محدودة)</option>
                   <option value="admin">مدير (صلاحيات كاملة)</option>
                </select>
                <input placeholder="اليوزر" className="p-2.5 rounded-lg border-none text-[11px] font-bold" value={newUser.user} onChange={e => setNewUser({...newUser, user: e.target.value})} />
                <input type="password" placeholder="الباسورد" className="p-2.5 rounded-lg border-none text-[11px] font-bold" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
              </div>
              
              {newUser.role === 'staff' && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 justify-center">
                  <p className="w-full text-center text-[10px] font-black text-slate-400 mb-1">صلاحيات المساعد:</p>
                  {Object.keys(newUser.permissions).map((p) => {
                    const labels: any = {
                      students: 'الطلاب',
                      teachers: 'المدرسين',
                      groups: 'المجموعات',
                      attendance: 'تسجيل الحضور',
                      exams: 'الامتحانات',
                      archive: 'الأرشيف', // ✅ تمت إضافة الترجمة العربية للأرشيف
                      finance: 'الحسابات المادية',
                      settings: 'الإعدادات'
                    };

                    return (
                      <button 
                        key={p} 
                        onClick={() => togglePerm(p)} 
                        className={cn(
                          "px-4 py-1.5 rounded-full text-[10px] font-black border-2 transition-all cursor-pointer", 
                          (newUser.permissions as any)[p] ? "bg-primary border-primary text-white" : "bg-white border-slate-200 text-slate-400"
                        )}
                      >
                        {labels[p] || p}
                      </button>
                    );
                  })}
                </div>
              )}
              <button onClick={addUser} className="w-full bg-slate-800 text-white py-2.5 rounded-lg font-black text-[11px] border-none cursor-pointer hover:bg-primary transition-all">إضافة الحساب</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {s.users?.map((u: any) => (
                <div key={u.id} className="p-3 bg-slate-50/50 border border-slate-100 rounded-2xl flex justify-between items-center group">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", u.role === 'admin' ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600")}><ShieldCheck className="w-4 h-4" /></div>
                    <div><p className="text-xs font-black text-slate-800">{u.name}</p><p className="text-[9px] text-slate-400 font-bold">{u.role === 'admin' ? 'مدير عام' : 'مساعد'}</p></div>
                  </div>
                  <button onClick={() => setS({...s, users: s.users.filter((x:any) => x.id !== u.id)})} className="p-2 text-slate-300 hover:text-red-500 border-none bg-transparent cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg space-y-3">
            <h2 className="font-black text-xs border-b border-white/10 pb-3 flex items-center gap-2"><Database className="w-4 h-4 text-primary" /> النسخ الاحتياطي</h2>
            <button onClick={exportBackup} className="w-full py-3 bg-primary text-white rounded-xl font-black text-[11px] flex items-center justify-center gap-2 border-none cursor-pointer transition-all"><Download className="w-4 h-4" /> حفظ نسخة</button>
            <label className="w-full py-3 bg-white/5 border border-white/10 border-dashed rounded-xl font-black text-[11px] flex items-center justify-center gap-2 cursor-pointer hover:bg-white/10 transition-all"><Upload className="w-4 h-4 text-primary" /> استعادة <input type="file" className="hidden" accept=".json" onChange={importBackup} /></label>
            <button onClick={resetFactory} className="w-full py-3 bg-red-600 text-white rounded-xl font-black text-[11px] flex items-center justify-center gap-2 border-none cursor-pointer hover:bg-red-700 transition-all"><RotateCcw className="w-4 h-4" /> ضبط مصنع</button>
          </div>
        </div>
      </div>
    </div>
  );
}