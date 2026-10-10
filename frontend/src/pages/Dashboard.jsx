import { useEffect, useState } from "react";
import {
  Users, UserCheck, UserX, CalendarClock, UserPlus, Wallet, Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import api from "@/api/axios";
import { money } from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FullPageSpinner } from "@/components/ui/spinner";

const PIE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#0ea5e9", "#8b5cf6", "#ec4899"];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/dashboard/stats")
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <FullPageSpinner />;
  if (!data) return <p className="text-muted-foreground">Could not load dashboard.</p>;

  const { stats, charts } = data;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Your HR operations at a glance" />

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total Employees" value={stats.totalEmployees} icon={Users} tone="indigo" />
        <StatCard label="Present Today" value={stats.presentToday} icon={UserCheck} tone="emerald" />
        <StatCard label="Absent Today" value={stats.absentToday} icon={UserX} tone="rose" />
        <StatCard label="Pending Leaves" value={stats.pendingLeaves} icon={CalendarClock} tone="amber" />
        <StatCard label="New Applicants" value={stats.newApplicants} icon={UserPlus} tone="sky" hint="Last 30 days" />
        <StatCard label="Payroll (This Month)" value={money(stats.payrollSummary)} icon={Wallet} tone="violet" />
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Attendance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={charts.attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="present" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By Department</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={charts.departmentDistribution}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {charts.departmentDistribution.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Applicants by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={charts.applicantStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--muted))" }} />
                <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-violet-500/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles size={18} className="text-primary" /> AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Insight text={`${stats.presentToday} of ${stats.totalEmployees} employees are present today.`} />
            <Insight text={`${stats.pendingLeaves} leave request(s) awaiting your approval.`} />
            <Insight text={`${stats.newApplicants} new applicant(s) in the last 30 days — review them in Resume Screening.`} />
            <Insight text={`Monthly payroll currently totals ${money(stats.payrollSummary)}.`} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
  color: "hsl(var(--foreground))",
};

function Insight({ text }) {
  return (
    <div className="flex gap-2">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
      <p className="text-foreground/80">{text}</p>
    </div>
  );
}
