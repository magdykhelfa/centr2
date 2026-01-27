import { FileText, Download, Users, UsersRound, Wallet, ClipboardCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const reportTypes = [
  {
    id: "students",
    title: "تقرير الطلاب",
    description: "تقرير شامل عن جميع الطلاب وبياناتهم",
    icon: Users,
    color: "gradient-primary",
  },
  {
    id: "groups",
    title: "تقرير المجموعات",
    description: "تقرير عن المجموعات والطلاب المسجلين",
    icon: UsersRound,
    color: "gradient-secondary",
  },
  {
    id: "attendance",
    title: "تقرير الحضور",
    description: "تقرير تفصيلي عن حضور وغياب الطلاب",
    icon: ClipboardCheck,
    color: "bg-success",
  },
  {
    id: "finance",
    title: "التقرير المالي",
    description: "تقرير الإيرادات والمصروفات والمتأخرات",
    icon: Wallet,
    color: "bg-warning",
  },
];

export default function Reports() {
  const openReport = (type: string) => {
    window.open(`/print/${type}`, "_blank");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">التقارير</h1>
        <p className="text-muted-foreground">إنشاء وتصدير التقارير</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportTypes.map((report) => (
          <Card key={report.id} className="card-hover">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl ${report.color} flex items-center justify-center`}>
                  <report.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">{report.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {report.description}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => openReport(report.id)}
                >
                  <FileText className="w-4 h-4" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => alert("Excel لاحقًا")}
                >
                  <Download className="w-4 h-4" />
                  Excel
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => openReport(report.id)}
                >
                  عرض
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
