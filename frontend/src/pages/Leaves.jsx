import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Check, X } from "lucide-react";
import api from "@/api/axios";
import { useAuth } from "@/context/AuthContext";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";

const LEAVE_TYPES = ["Casual", "Sick", "Annual", "Unpaid", "Maternity"];
const statusVariant = { Pending: "warning", Approved: "success", Rejected: "destructive" };
const fmtDate = (d) => new Date(d).toLocaleDateString();

export default function Leaves() {
  const { user } = useAuth();
  const isManager = ["Super Admin", "HR Manager"].includes(user?.role);

  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ employee: "", leaveType: "Casual", startDate: "", endDate: "", reason: "" });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/leaves", { params: { status: filter } });
      setLeaves(data.leaves);
    } catch {
      toast.error("Failed to load leaves");
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const { data } = await api.get("/employees");
      setEmployees(data.employees);
      if (data.employees[0]) setForm((f) => ({ ...f, employee: data.employees[0]._id }));
    } catch {}
  };

  useEffect(() => { loadEmployees(); }, []);
  useEffect(() => { load(); }, [filter]);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const apply = async (e) => {
    e.preventDefault();
    if (!form.employee || !form.startDate || !form.endDate) return toast.error("Fill all required fields");
    setSaving(true);
    try {
      await api.post("/leaves", form);
      toast.success("Leave request submitted");
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit");
    } finally {
      setSaving(false);
    }
  };

  const review = async (id, status) => {
    try {
      await api.put(`/leaves/${id}/status`, { status });
      toast.success(`Leave ${status.toLowerCase()}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    }
  };

  return (
    <div>
      <PageHeader
        title="Leave Management"
        subtitle="Apply for and review leave requests"
        action={<Button onClick={() => setModalOpen(true)}><Plus size={16} /> Apply Leave</Button>}
      />

      <div className="mb-4 flex gap-2">
        {["All", "Pending", "Approved", "Rejected"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16"><Spinner size={28} /></div>
          ) : leaves.length === 0 ? (
            <p className="py-16 text-center text-muted-foreground">No leave requests found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  {isManager && <TableHead className="text-right">Review</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaves.map((l) => (
                  <TableRow key={l._id}>
                    <TableCell className="font-medium">{l.employee?.name || "—"}</TableCell>
                    <TableCell>{l.leaveType}</TableCell>
                    <TableCell>{fmtDate(l.startDate)}</TableCell>
                    <TableCell>{fmtDate(l.endDate)}</TableCell>
                    <TableCell>{l.days}</TableCell>
                    <TableCell className="max-w-[160px] truncate text-muted-foreground">{l.reason || "—"}</TableCell>
                    <TableCell><Badge variant={statusVariant[l.status]}>{l.status}</Badge></TableCell>
                    {isManager && (
                      <TableCell>
                        {l.status === "Pending" ? (
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => review(l._id, "Approved")}>
                              <Check size={16} className="text-emerald-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => review(l._id, "Rejected")}>
                              <X size={16} className="text-destructive" />
                            </Button>
                          </div>
                        ) : (
                          <p className="text-right text-xs text-muted-foreground">Reviewed</p>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Apply for Leave">
        <form onSubmit={apply} className="space-y-4">
          <div>
            <Label>Employee</Label>
            <Select value={form.employee} onChange={update("employee")}>
              {employees.length === 0 && <option value="">No employees available</option>}
              {employees.map((emp) => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
            </Select>
          </div>
          <div>
            <Label>Leave type</Label>
            <Select value={form.leaveType} onChange={update("leaveType")}>
              {LEAVE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start date</Label>
              <Input type="date" value={form.startDate} onChange={update("startDate")} />
            </div>
            <div>
              <Label>End date</Label>
              <Input type="date" value={form.endDate} onChange={update("endDate")} />
            </div>
          </div>
          <div>
            <Label>Reason</Label>
            <Textarea value={form.reason} onChange={update("reason")} placeholder="Brief reason for leave" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Spinner size={16} className="text-white" /> : "Submit request"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
