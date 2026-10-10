import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import api from "@/api/axios";
import { money } from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";

const DEPARTMENTS = ["Engineering", "Human Resources", "Sales", "Marketing", "Finance", "Operations", "Support"];
const emptyForm = { name: "", email: "", phone: "", department: "Engineering", designation: "", salary: "", gender: "Male", status: "Active" };

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/employees", { params: { search, department: dept } });
      setEmployees(data.employees);
    } catch {
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, [search, dept]);

  useEffect(() => {
    const t = setTimeout(load, 300); // debounce search
    return () => clearTimeout(t);
  }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (emp) => {
    setEditing(emp);
    setForm({
      name: emp.name, email: emp.email, phone: emp.phone || "",
      department: emp.department, designation: emp.designation || "",
      salary: emp.salary, gender: emp.gender, status: emp.status,
    });
    setModalOpen(true);
  };

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return toast.error("Name and email are required");
    setSaving(true);
    try {
      const payload = { ...form, salary: Number(form.salary) || 0 };
      if (editing) {
        await api.put(`/employees/${editing._id}`, payload);
        toast.success("Employee updated");
      } else {
        await api.post("/employees", payload);
        toast.success("Employee added");
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (emp) => {
    if (!confirm(`Delete ${emp.name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/employees/${emp._id}`);
      toast.success("Employee removed");
      load();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle="Manage your organization's people"
        action={<Button onClick={openAdd}><Plus size={16} /> Add Employee</Button>}
      />

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Search by name, email, ID or designation..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={dept} onChange={(e) => setDept(e.target.value)} className="sm:w-56">
            <option value="All">All Departments</option>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16"><Spinner size={28} /></div>
          ) : employees.length === 0 ? (
            <p className="py-16 text-center text-muted-foreground">No employees found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{emp.name}</p>
                          <p className="text-xs text-muted-foreground">{emp.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{emp.employeeId}</TableCell>
                    <TableCell>{emp.department}</TableCell>
                    <TableCell>{emp.designation || "—"}</TableCell>
                    <TableCell>{money(emp.salary)}</TableCell>
                    <TableCell>
                      <Badge variant={emp.status === "Active" ? "success" : "secondary"}>{emp.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(emp)}>
                          <Pencil size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => remove(emp)}>
                          <Trash2 size={16} className="text-destructive" />
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Employee" : "Add Employee"}>
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Full name</Label>
              <Input value={form.name} onChange={update("name")} placeholder="Jane Doe" />
            </div>
            <div className="col-span-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={update("email")} placeholder="jane@company.com" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={update("phone")} placeholder="+92 300 0000000" />
            </div>
            <div>
              <Label>Department</Label>
              <Select value={form.department} onChange={update("department")}>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </Select>
            </div>
            <div>
              <Label>Designation</Label>
              <Input value={form.designation} onChange={update("designation")} placeholder="Software Engineer" />
            </div>
            <div>
              <Label>Salary (PKR)</Label>
              <Input type="number" value={form.salary} onChange={update("salary")} placeholder="150000" />
            </div>
            <div>
              <Label>Gender</Label>
              <Select value={form.gender} onChange={update("gender")}>
                <option>Male</option><option>Female</option><option>Other</option>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onChange={update("status")}>
                <option>Active</option><option>Inactive</option>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Spinner size={16} className="text-white" /> : editing ? "Save changes" : "Add employee"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
