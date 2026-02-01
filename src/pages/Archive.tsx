import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Undo2, Users, GraduationCap, UsersRound, Search, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { Input } from "@/components/ui/input";

// التأكد من أسماء المفاتيح لتطابق صفحة الطلاب
const KEYS = {
  STUDENTS: "students-data",
  TEACHERS: "teachers-data",
  GROUPS: "groups-data"
};

export default function Archive() {
  const [archiveList, setArchiveList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const loadAllArchive = () => {
    const students = JSON.parse(localStorage.getItem(KEYS.STUDENTS) || '[]').filter((s: any) => s.isArchived);
    const teachers = JSON.parse(localStorage.getItem(KEYS.TEACHERS) || '[]').filter((t: any) => t.isArchived);
    const groups = JSON.parse(localStorage.getItem(KEYS.GROUPS) || '[]').filter((g: any) => g.isArchived);
    
    let allItems = [
      ...students.map((s: any) => ({ ...s, type: 'طالب', icon: Users, storageKey: KEYS.STUDENTS })),
      ...teachers.map((t: any) => ({ ...t, type: 'مدرس', icon: GraduationCap, storageKey: KEYS.TEACHERS })),
      ...groups.map((g: any) => ({ ...g, type: 'مجموعة', icon: UsersRound, storageKey: KEYS.GROUPS }))
    ];

    if (filterType !== 'all') {
      allItems = allItems.filter(item => item.type === filterType);
    }

    if (searchTerm) {
      allItems = allItems.filter(item => 
        (item.name || item.title || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // ترتيب من الأحدث للأقدم
    allItems.sort((a, b) => new Date(b.archivedAt || 0).getTime() - new Date(a.archivedAt || 0).getTime());

    setArchiveList(allItems);
  };

  useEffect(() => {
    loadAllArchive();
    const handleStorage = () => loadAllArchive();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [searchTerm, filterType]);

  const handleRestore = (item: any) => {
  const data = JSON.parse(localStorage.getItem(item.storageKey) || '[]');
  const updated = data.map((i: any) => 
    i.id === item.id ? { ...i, isArchived: false } : i
  );
  
  localStorage.setItem(item.storageKey, JSON.stringify(updated));
  
  // 🟢 أهم سطر: تنبيه كل الصفحات أن الـ LocalStorage اتغير
  window.dispatchEvent(new Event("storage"));
  
  toast.success(`تمت استعادة ${item.type}: ${item.name || item.title} بنجاح`);
  loadAllArchive(); // تحديث قائمة الأرشيف فوراً
};

  const handlePermanentDelete = (item: any) => {
    if (confirm(`هل أنت متأكد من حذف ${item.type} نهائياً؟ لا يمكن التراجع عن هذا الإجراء.`)) {
      const data = JSON.parse(localStorage.getItem(item.storageKey) || '[]');
      const updated = data.filter((i: any) => i.id !== item.id);
      localStorage.setItem(item.storageKey, JSON.stringify(updated));
      
      window.dispatchEvent(new Event("storage"));
      
      toast.error("تم الحذف النهائي بنجاح");
      loadAllArchive();
    }
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black flex items-center gap-2">
          <Trash2 className="text-red-500 w-7 h-7" /> أرشيف المنصة الشامل
        </h1>
        <Badge variant="secondary" className="font-bold">
          إجمالي العناصر: {archiveList.length}
        </Badge>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-2xl shadow-sm border">
        <div className="flex items-center gap-2 flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400" />
          <Input 
            placeholder="البحث بالاسم أو العنوان داخل الأرشيف..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="border-none bg-slate-50 rounded-lg focus-visible:ring-1"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)} 
            className="p-2 border rounded-lg bg-slate-50 text-sm font-bold outline-none focus:ring-1 ring-primary"
          >
            <option value="all">جميع التصنيفات</option>
            <option value="طالب">الطلاب</option>
            <option value="مدرس">المدرسين</option>
            <option value="مجموعة">المجموعات</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="text-right font-bold text-slate-900">النوع</TableHead>
              <TableHead className="text-right font-bold text-slate-900">الاسم / البيان</TableHead>
              <TableHead className="text-right font-bold text-slate-900">تاريخ الأرشفة</TableHead>
              <TableHead className="text-left font-bold text-slate-900">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {archiveList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-32">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Trash2 className="w-12 h-12 opacity-20" />
                    <p className="font-bold text-lg">الأرشيف فارغ تماماً</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              archiveList.map((item, index) => (
                <TableRow key={`${item.storageKey}-${item.id}`} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell>
                    <Badge variant="outline" className="gap-1.5 px-3 py-1 bg-white shadow-sm border-slate-200">
                      <item.icon className="w-3.5 h-3.5 text-slate-500" /> 
                      <span className="font-bold">{item.type}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-black text-slate-800">{item.name || item.title}</span>
                      <span className="text-[10px] text-slate-400">ID: {item.id}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium text-slate-600">
                      {item.archivedAt ? new Date(item.archivedAt).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : "تاريخ غير معروف"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 gap-1.5 font-black shadow-sm"
                        onClick={() => handleRestore(item)}
                      >
                        <Undo2 className="w-4 h-4" /> استعادة
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-red-500 hover:bg-red-50 font-bold"
                        onClick={() => handlePermanentDelete(item)}
                      >
                        حذف نهائي
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}