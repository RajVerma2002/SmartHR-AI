import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Download, BadgeCheck } from "lucide-react";
import api from "@/api/axios";
import { money } from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";

export default function Payroll() {
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ employee: "", month: "", basicSalary: "", allowances: "", bonus: "", deductions: "" });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/payroll", { params: { month } });
      setPayrolls(data.payrolls);
    } catch {
      toast.error("Failed to load payroll");
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const { data } = await api.get("/employees");
      setEmployees(data.employees);
    } catch {}
  };

  useEffect(() => { loadEmployees(); }, []);
  useEffect(() => { load(); }, [month]);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const openAdd = () => {
    setForm({ employee: employees[0]?._id || "", month, basicSalary: "", allowances: "", bonus: "", deductions: "" });
    setModalOpen(true);
  };

  // When picking an employee, pre-fill basic salary from their record
  const pickEmployee = (e) => {
    const emp = employees.find((x) => x._id === e.target.value);
    setForm({ ...form, employee: e.target.value, basicSalary: emp?.salary || "" });
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.employee || !form.month) return toast.error("Employee and month are required");
    setSaving(true);
    try {
      await api.post("/payroll", {
        employee: form.employee,
        month: form.month,
        basicSalary: Number(form.basicSalary) || 0,
        allowances: Number(form.allowances) || 0,
        bonus: Number(form.bonus) || 0,
        deductions: Number(form.deductions) || 0,
      });
      toast.success("Payroll record created");
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const markPaid = async (id) => {
    try {
      await api.put(`/payroll/${id}/pay`);
      toast.success("Marked as paid");
      load();
    } catch {
      toast.error("Action failed");
    }
  };

  const downloadPayslip = async (p) => {
    try {
      const res = await api.get(`/payroll/${p._id}/payslip`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `payslip-${p.employee?.employeeId || "emp"}-${p.month}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Could not generate payslip");
    }
  };

  const totalNet = payrolls.reduce((s, p) => s + (p.netSalary || 0), 0);

  return (
    <div>
      <PageHeader
        title="Payroll"
        subtitle="Salaries, bonuses, deductions and payslips"
        action={<Button onClick={openAdd}><Plus size={16} /> Add Payroll</Button>}
      />

      <Card className="mb-4">
        <CardContent className="flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Label className="mb-0">Month</Label>
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-40" />
          </div>
          <p className="text-sm text-muted-foreground">
            Total net for {month}: <span className="font-semibold text-foreground">{money(totalNet)}</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16"><Spinner size={28} /></div>
          ) : payrolls.length === 0 ? (
            <p className="py-16 text-center text-muted-foreground">No payroll records for {month}.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Basic</TableHead>
                  <TableHead>Allow.</TableHead>
                  <TableHead>Bonus</TableHead>
                  <TableHead>Deduct.</TableHead>
                  <TableHead>Net</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrolls.map((p) => (
                  <TableRow key={p._id}>
                    <TableCell>
                      <p className="font-medium">{p.employee?.name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{p.employee?.employeeId}</p>
                    </TableCell>
                    <TableCell>{money(p.basicSalary)}</TableCell>
                    <TableCell>{money(p.allowances)}</TableCell>
                    <TableCell>{money(p.bonus)}</TableCell>
                    <TableCell className="text-destructive">-{money(p.deductions)}</TableCell>
                    <TableCell className="font-semibold">{money(p.netSalary)}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "Paid" ? "success" : "warning"}>{p.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {p.status !== "Paid" && (
                          <Button variant="ghost" size="icon" title="Mark paid" onClick={() => markPaid(p._id)}>
                            <BadgeCheck size={16} className="text-emerald-500" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" title="Download payslip" onClick={() => downloadPayslip(p)}>
                          <Download size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Payroll Record">
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Employee</Label>
              <Select value={form.employee} onChange={pickEmployee}>
                {employees.length === 0 && <option value="">No employees available</option>}
                {employees.map((emp) => <option key={emp._id} value={emp._id}>{emp.name} ({emp.employeeId})</option>)}
              </Select>
            </div>
            <div>
              <Label>Month</Label>
              <Input type="month" value={form.month} onChange={update("month")} />
            </div>
            <div>
              <Label>Basic salary</Label>
              <Input type="number" value={form.basicSalary} onChange={update("basicSalary")} />
            </div>
            <div>
              <Label>Allowances</Label>
              <Input type="number" value={form.allowances} onChange={update("allowances")} placeholder="0" />
            </div>
            <div>
              <Label>Bonus</Label>
              <Input type="number" value={form.bonus} onChange={update("bonus")} placeholder="0" />
            </div>
            <div className="col-span-2">
              <Label>Deductions</Label>
              <Input type="number" value={form.deductions} onChange={update("deductions")} placeholder="0" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Spinner size={16} className="text-white" /> : "Create record"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
