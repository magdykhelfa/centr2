import { useState, useEffect } from 'react'; 
import { 
  Settings as SetIcon, Building2, ShieldCheck, Trash2, UserPlus, Database, 
  Save, Download, Upload, RotateCcw, Lock, X, AlertTriangle, Edit2 
} from 'lucide-react'; 
import { toast } from 'sonner';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

const AUDIT_LOG_KEY = 'audit-log';

// الصلاحيات الافتراضية + الجديد canDeleteAny
const defaultPermissions = {
  dashboard: false,  // دائمًا true للكل عادة
  students: false,
  teachers: false,
  groups: false,
  attendance: false,
  books: false,
  exams: false,
  finance: false,
  alerts: false,
  archive: false,
  parents: false,
  settings: false,
  canDeleteAny: false  // جديد: لو true يقدر يحذف أي سجل، لو false يحذف بس اللي هو عمله
};

export default function Settings() {
  const [s, setS] = useState<any>({ 
    name: 'سنتر التفوق التعليمي', 
    owner: 'م/ مجدي خلفه', 
    factoryCode: '1234',
    users: [] 
  });

  const [newUser, setNewUser] = useState({
    name: '',
    user: '',
    password: '',
    role: 'staff',
    permissions: { ...defaultPermissions },
    locked: false
  });

  const [editingUser, setEditingUser] = useState<any>(null);

  const [showResetModal, setShowResetModal] = useState(false);
  const [confirmCode, setConfirmCode] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [deleteConfirmCode, setDeleteConfirmCode] = useState('');

  useEffect(() => {
    try {
      const localS = localStorage.getItem('office_settings');
      const localU = localStorage.getItem('edu_users');

      let parsedSettings = localS ? JSON.parse(localS) : {};
      let users = localU ? JSON.parse(localU) : [];

      if (!Array.isArray(users)) users = [];

      // دمج الصلاحيات الافتراضية + الجديدة لكل مستخدم قديم
      users = users.map((u: any) => ({
        ...u,
        permissions: { ...defaultPermissions, ...u.permissions }
      }));

      parsedSettings.users = users;

      if (!parsedSettings.factoryCode) parsedSettings.factoryCode = '1234';

      if (users.length === 0) {
        users.push({
          id: Date.now(),
          name: 'Super Admin',
          user: 'admin',
          password: 'admin',
          role: 'admin',
          permissions: { 
            ...defaultPermissions,
            dashboard: true,
            students: true, teachers: true, groups: true, 
            attendance: true, exams: true, archive: true, 
            finance: true, alerts: true, books: true, 
            parents: true, settings: true,
            canDeleteAny: true
          },
          locked: true
        });
        parsedSettings.users = users;
      }

      setS(parsedSettings);
    } catch (err) {
      console.error('خطأ في تحميل الإعدادات:', err);
      toast.error('حدث خطأ أثناء تحميل الإعدادات');
    }
  }, []);

  const logAction = (type: string, target: string) => {
    const logs = JSON.parse(localStorage.getItem(AUDIT_LOG_KEY) || '[]');
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify([...logs, {
      type, target, date: new Date().toISOString()
    }]));
  };

  const saveAll = () => {
    const users = Array.isArray(s?.users) ? s.users : [];

    const hasAdmin = users.some((u: any) => 
      u?.permissions?.settings === true || u?.role === 'admin'
    );

    if (!hasAdmin) {
      toast.error('لا يمكن حفظ الإعدادات بدون وجود مدير عام واحد على الأقل');
      return false;
    }

    try {
      localStorage.setItem('office_settings', JSON.stringify({
        name: s?.name || 'سنتر التفوق التعليمي',
        owner: s?.owner || 'م/ مجدي خلفه',
        factoryCode: s?.factoryCode || '1234'
      }));

      localStorage.setItem('edu_users', JSON.stringify(users));

      toast.success('تم حفظ التغييرات بنجاح');
      return true;
    } catch (err) {
      console.error('خطأ أثناء الحفظ:', err);
      toast.error('حدث خطأ أثناء حفظ البيانات');
      return false;
    }
  };

  const resetNewUserForm = () => {
    setNewUser({
      name: '',
      user: '',
      password: '',
      role: 'staff',
      permissions: { ...defaultPermissions },
      locked: false
    });
    setEditingUser(null);
  };

  const addOrUpdateUser = () => {
    if (!newUser.user || !newUser.password) {
      return toast.error('برجاء كتابة اسم المستخدم وكلمة المرور');
    }

    const permissions = newUser.role === 'admin' 
      ? { ...defaultPermissions, ...Object.fromEntries(Object.keys(defaultPermissions).map(k => [k, true])) }
      : { ...defaultPermissions, ...newUser.permissions };

    const userToAdd = { 
      ...newUser, 
      id: editingUser ? editingUser.id : Date.now(), 
      permissions 
    };

    let updatedUsers;
    if (editingUser) {
      const oldUser = s.users.find((u: any) => u.id === editingUser.id);
      if (oldUser && JSON.stringify(oldUser.permissions) !== JSON.stringify(userToAdd.permissions)) {
        logAction('change_permissions', oldUser.name || 'غير معروف');
      }
      updatedUsers = s.users.map((u: any) => u.id === editingUser.id ? userToAdd : u);
    } else {
      updatedUsers = [...(s.users || []), userToAdd];
    }

    setS({ ...s, users: updatedUsers });
    resetNewUserForm();

    setTimeout(() => {
      saveAll();
    }, 100);

    toast.info(editingUser ? 'تم تعديل الحساب وحفظه' : 'تم إضافة الحساب وحفظه');
  };

  const startEditUser = (u: any) => {
    if (u.locked) return toast.error('لا يمكن تعديل الحساب المحمي');
    setNewUser({
      ...u,
      permissions: { ...defaultPermissions, ...u.permissions }
    });
    setEditingUser(u);
  };

  const startDeleteUser = (u: any) => {
    if (u.locked) return toast.error('لا يمكن حذف الحساب المحمي');
    
    const admins = s.users.filter((user: any) => user.permissions.settings === true && user.id !== u.id);
    if (u.permissions.settings && admins.length === 0) {
      return toast.error('لا يمكن حذف آخر مدير عام');
    }
    
    setDeletingUserId(u.id);
    if (u.permissions.settings) {
      setShowDeleteModal(true);
    } else {
      handleConfirmDelete();
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingUserId) return;
    
    const u = s.users.find((user: any) => user.id === deletingUserId);
    if (u.permissions.settings && deleteConfirmCode !== s.factoryCode) {
      return toast.error('رمز الأمان غير صحيح');
    }
    
    const updatedUsers = s.users.filter((user: any) => user.id !== deletingUserId);
    setS({ ...s, users: updatedUsers });
    logAction('delete_user', u.name);

    setTimeout(() => {
      saveAll();
    }, 100);

    toast.success('تم حذف المستخدم وحفظ التغييرات');
    setShowDeleteModal(false);
    setDeleteConfirmCode('');
    setDeletingUserId(null);
  };

  const togglePerm = (key: string) => {
    setNewUser(prev => ({
      ...prev,
      permissions: { ...defaultPermissions, ...prev.permissions, [key]: !prev.permissions[key] }
    }));
  };

  const exportBackup = () => {
    const data = { 
      settings: { name: s.name, owner: s.owner, factoryCode: s.factoryCode },
      users: s.users,
      students: JSON.parse(localStorage.getItem('students-data') || '[]'),
      groups: JSON.parse(localStorage.getItem('groups-data') || '[]'),
      teachers: JSON.parse(localStorage.getItem('teachers-data') || '[]'),
      finance: JSON.parse(localStorage.getItem('finance-transactions') || '[]'),
      exams: JSON.parse(localStorage.getItem('exams-data') || '[]'),
      attendance: JSON.parse(localStorage.getItem('attendance-data') || '{}'),
      archive: JSON.parse(localStorage.getItem('archive-data') || '[]')
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_${s.name.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('en-CA')}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
        if (data.settings) localStorage.setItem('office_settings', JSON.stringify(data.settings));
        
        toast.success('تم استيراد البيانات بنجاح');
        setTimeout(() => window.location.reload(), 1200);
      } catch (err) {
        toast.error('فشل في قراءة ملف النسخة الاحتياطية');
      }
    };
    reader.readAsText(file);
  };

  const handleFinalReset = () => {
    if (confirmCode === s.factoryCode) {
      logAction('factory_reset', 'All data');

      const keysToRemove = [
        'students-data','teachers-data','groups-data','attendance-data',
        'exams-data','finance-transactions','archive-data','edu_users'
      ];

      keysToRemove.forEach(key => localStorage.removeItem(key));

      toast.success('تم تصفير البيانات بنجاح');
      setShowResetModal(false);
      setConfirmCode('');
      setTimeout(() => window.location.reload(), 1000);
    } else {
      toast.error('رمز الأمان غير صحيح');
    }
  };

  return (
    <div className="p-4 space-y-4 text-right font-cairo animate-in fade-in duration-500" dir="rtl">
      
      {showResetModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-800">تأكيد ضبط المصنع</h3>
              <p className="text-xs text-slate-500 font-bold leading-relaxed">
                سيتم حذف كافة بيانات الطلاب، المدرسين، والعمليات المالية نهائياً. <br/>
                <span className="text-red-500 italic">هذا الإجراء لا يمكن الرجوع عنه!</span>
              </p>
              
              <div className="space-y-2 text-right">
                <label className="text-[10px] font-black text-slate-400 mr-2">أدخل رمز الأمان للمتابعة</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-300" />
                  <input 
                    type="password" 
                    className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-center font-black tracking-[1em] outline-none focus:border-red-500 transition-all"
                    value={confirmCode}
                    onChange={(e) => setConfirmCode(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={handleFinalReset}
                  className="flex-1 bg-red-600 text-white py-3 rounded-2xl font-black text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-200 cursor-pointer border-none"
                >
                  تأكيد الحذف
                </button>
                <button 
                  onClick={() => { setShowResetModal(false); setConfirmCode(''); }}
                  className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all cursor-pointer border-none"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-800">تأكيد حذف المدير</h3>
              <p className="text-xs text-slate-500 font-bold leading-relaxed">
                سيتم حذف هذا المدير نهائياً. <br/>
                <span className="text-red-500 italic">هذا الإجراء لا يمكن الرجوع عنه!</span>
              </p>
              
              <div className="space-y-2 text-right">
                <label className="text-[10px] font-black text-slate-400 mr-2">أدخل رمز الأمان للمتابعة</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-300" />
                  <input 
                    type="password" 
                    className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-center font-black tracking-[1em] outline-none focus:border-red-500 transition-all"
                    value={deleteConfirmCode}
                    onChange={(e) => setDeleteConfirmCode(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={handleConfirmDelete}
                  className="flex-1 bg-red-600 text-white py-3 rounded-2xl font-black text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-200 cursor-pointer border-none"
                >
                  تأكيد الحذف
                </button>
                <button 
                  onClick={() => { setShowDeleteModal(false); setDeleteConfirmCode(''); setDeletingUserId(null); }}
                  className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all cursor-pointer border-none"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white px-6 py-4 rounded-3xl shadow-sm border-r-4 border-primary flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <SetIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-800">إعدادات الأمان</h1>
            <p className="text-[10px] text-slate-400 font-bold">إدارة الهوية والمستخدمين</p>
          </div>
        </div>
        <button 
          onClick={saveAll}
          className="bg-primary text-white px-6 py-2 rounded-xl font-black text-xs flex items-center gap-2 hover:bg-primary/90 transition-all shadow-md"
        >
          <Save className="w-4 h-4" /> حفظ التغييرات
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="font-black text-sm flex items-center gap-2 mb-4 text-slate-600">
              <Building2 className="w-4 h-4 text-primary" /> بيانات السنتر
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 mr-2">اسم السنتر</label>
                <input 
                  className="w-full p-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none ring-1 ring-transparent focus:ring-primary/30" 
                  value={s?.name} 
                  onChange={e => setS({...s, name: e.target.value})} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 mr-2">المدير العام</label>
                <input 
                  className="w-full p-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none ring-1 ring-transparent focus:ring-primary/30" 
                  value={s?.owner} 
                  onChange={e => setS({...s, owner: e.target.value})} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-red-400 mr-2 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> رمز الأمان
                </label>
                <input 
                  className="w-full p-3 bg-red-50/50 border border-red-100 rounded-xl text-xs font-black text-red-600 outline-none" 
                  value={s?.factoryCode} 
                  onChange={e => setS({...s, factoryCode: e.target.value})} 
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="font-black text-sm flex items-center gap-2 mb-4 text-slate-600">
              <UserPlus className="w-4 h-4 text-primary" /> إدارة الحسابات
            </h2>
            <div className="bg-slate-50 p-4 rounded-2xl mb-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input 
                  placeholder="اسم الشخص" 
                  className="p-2.5 rounded-lg border-none text-[11px] font-bold" 
                  value={newUser.name} 
                  onChange={e => setNewUser({...newUser, name: e.target.value})} 
                />
                <select 
                  className="p-2.5 rounded-lg border-none text-[11px] font-bold outline-none cursor-pointer" 
                  value={newUser.role} 
                  onChange={e => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="staff">مساعد (صلاحيات محدودة)</option>
                  <option value="admin">مدير (صلاحيات كاملة)</option>
                </select>
                <input 
                  placeholder="اليوزر" 
                  className="p-2.5 rounded-lg border-none text-[11px] font-bold" 
                  value={newUser.user} 
                  onChange={e => setNewUser({...newUser, user: e.target.value})} 
                />
                <input 
                  type="password" 
                  placeholder="الباسورد" 
                  className="p-2.5 rounded-lg border-none text-[11px] font-bold" 
                  value={newUser.password} 
                  onChange={e => setNewUser({...newUser, password: e.target.value})} 
                />
              </div>
              
              {newUser.role === 'staff' && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 justify-center">
                  {Object.keys(newUser.permissions).map((p) => {
                    const labels: any = {
                      dashboard: 'لوحة التحكم',
                      students: 'الطلاب',
                      teachers: 'المدرسين',
                      groups: 'المجموعات',
                      attendance: 'الحضور',
                      books: 'الكتب والمذكرات',
                      exams: 'الامتحانات',
                      finance: 'الحسابات',
                      alerts: 'التنبيهات',
                      archive: 'الأرشيف',
                      parents: 'أولياء الأمور',
                      settings: 'الإعدادات',
                      canDeleteAny: 'حذف أي سجل (غير مقيد)'  // الجديد
                    };
                    return (
                      <button 
                        key={p} 
                        onClick={() => togglePerm(p)} 
                        className={cn(
                          "px-4 py-1.5 rounded-full text-[10px] font-black border-2 transition-all cursor-pointer",
                          newUser.permissions[p] ? "bg-primary border-primary text-white" : "bg-white border-slate-200 text-slate-400"
                        )}
                      >
                        {labels[p] || p}
                      </button>
                    );
                  })}
                </div>
              )}
              <button 
                onClick={addOrUpdateUser} 
                className="w-full bg-slate-800 text-white py-2.5 rounded-lg font-black text-[11px] border-none cursor-pointer hover:bg-primary transition-all"
              >
                {editingUser ? 'تعديل الحساب' : 'إضافة الحساب'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {s.users?.map((u: any) => (
                <div 
                  key={u.id} 
                  className="p-3 bg-slate-50/50 border border-slate-100 rounded-2xl flex justify-between items-center group"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      u.role === 'admin' ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
                    )}>
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800">
                        {u.name} {u.locked && <span className="text-[9px] bg-red-100 text-red-600 px-1 rounded-full font-bold">محمي</span>}
                      </p>
                      <p className="text-[9px] text-slate-400 font-bold">
                        {u.role === 'admin' ? 'مدير عام' : 'مساعد'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!u.locked && (
                      <button 
                        onClick={() => startEditUser(u)} 
                        className="p-2 text-slate-300 hover:text-blue-500 border-none bg-transparent cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {!u.locked && (
                      <button 
                        onClick={() => startDeleteUser(u)} 
                        className="p-2 text-slate-300 hover:text-red-500 border-none bg-transparent cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg space-y-3">
            <h2 className="font-black text-xs border-b border-white/10 pb-3 flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" /> النسخ الاحتياطي
            </h2>
            <button 
              onClick={exportBackup} 
              className="w-full py-3 bg-primary text-white rounded-xl font-black text-[11px] flex items-center justify-center gap-2 border-none cursor-pointer hover:opacity-90 transition-all"
            >
              <Download className="w-4 h-4" /> حفظ نسخة
            </button>
            <label 
              className="w-full py-3 bg-white/5 border border-white/10 border-dashed rounded-xl font-black text-[11px] flex items-center justify-center gap-2 cursor-pointer hover:bg-white/10 transition-all"
            >
              <Upload className="w-4 h-4 text-primary" /> استعادة 
              <input type="file" className="hidden" accept=".json" onChange={importBackup} />
            </label>
            
            <button 
              onClick={() => setShowResetModal(true)} 
              className="w-full py-3 bg-red-600 text-white rounded-xl font-black text-[11px] flex items-center justify-center gap-2 border-none cursor-pointer hover:bg-red-700 transition-all shadow-lg shadow-red-900/40"
            >
              <RotateCcw className="w-4 h-4" /> ضبط مصنع
            </button>
            <p className="text-[9px] text-white/30 text-center mt-2 font-bold italic">الإدارة المتقدمة للبيانات</p>
          </div>
        </div>
      </div>
    </div>
  );
}