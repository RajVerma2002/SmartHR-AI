import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { LogIn, LogOut, CalendarCheck } from "lucide-react";
import api from "@/api/axios";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";

const fmtTime = (d) => (d ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—");
const statusVariant = { Present: "success", Late: "warning", Absent: "destructive", "On Leave": "secondary", "Half Day": "outline" };

export default function Attendance() {
  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState("");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const loadEmployees = async () => {
    try {
      const { data } = await api.get("/employees");
      setEmployees(data.employees);
      if (data.employees[0]) setSelected(data.employees[0]._id);
    } catch {
      // employees endpoint is manager-only; non-managers just won't get the dropdown
    }
  };

  const loadRecords = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/attendance", { params: { month } });
      setRecords(data.records);
    } catch {
      toast.error("Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEmployees(); }, []);
  useEffect(() => { loadRecords(); }, [month]);

  const act = async (type) => {
    if (!selected) return toast.error("Select an employee");
    setActing(true);
    try {
      await api.post(`/attendance/${type}`, { employeeId: selected });
      toast.success(type === "checkin" ? "Checked in" : "Checked out");
      loadRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setActing(false);
    }
  };

  return (
    <div>
      <PageHeader title="Attendance" subtitle="Track daily check-ins and monthly attendance" />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck size={18} className="text-primary" /> Mark Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label>Employee</Label>
              <Select value={selected} onChange={(e) => setSelected(e.target.value)}>
                {employees.length === 0 && <option value="">No employees available</option>}
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>{emp.name} ({emp.employeeId})</option>
                ))}
              </Select>
            </div>
            <Button onClick={() => act("checkin")} disabled={acting}>
              <LogIn size={16} /> Check In
            </Button>
            <Button variant="outline" onClick={() => act("checkout")} disabled={acting}>
              <LogOut size={16} /> Check Out
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Records</CardTitle>
          <div className="flex items-center gap-2">
            <Label className="mb-0">Month</Label>
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-40" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16"><Spinner size={28} /></div>
          ) : records.length === 0 ? (
            <p className="py-16 text-center text-muted-foreground">No attendance records for this month.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r._id}>
                    <TableCell className="font-medium">{r.employee?.name || "—"}</TableCell>
                    <TableCell>{r.date}</TableCell>
                    <TableCell>{fmtTime(r.checkIn)}</TableCell>
                    <TableCell>{fmtTime(r.checkOut)}</TableCell>
                    <TableCell>{r.workHours ? `${r.workHours}h` : "—"}</TableCell>
                    <TableCell><Badge variant={statusVariant[r.status] || "secondary"}>{r.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
