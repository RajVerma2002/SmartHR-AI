import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, FileText, Search } from "lucide-react";
import api from "@/api/axios";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";

const STATUSES = ["Applied", "Screening", "Shortlisted", "Interviewed", "Hired", "Rejected"];
const statusVariant = {
  Applied: "secondary", Screening: "warning", Shortlisted: "default",
  Interviewed: "default", Hired: "success", Rejected: "destructive",
};
const recVariant = { "Strong Candidate": "success", "Average Candidate": "warning", "Not Recommended": "destructive" };

export default function Applicants() {
  const [applicants, setApplicants] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ candidateName: "", email: "", phone: "", position: "" });
  const [cvFile, setCvFile] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/applicants", { params: { status: filter, search } });
      setApplicants(data.applicants);
    } catch {
      toast.error("Failed to load applicants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [filter, search]);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    if (!form.candidateName || !form.email || !form.position) return toast.error("Name, email and position are required");
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (cvFile) fd.append("cv", cvFile);
      await api.post("/applicants", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Applicant added");
      setModalOpen(false);
      setForm({ candidateName: "", email: "", phone: "", position: "" });
      setCvFile(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (id, status) => {
    try {
      await api.put(`/applicants/${id}`, { status });
      toast.success("Status updated");
      load();
    } catch {
      toast.error("Update failed");
    }
  };

  const remove = async (a) => {
    if (!confirm(`Delete applicant ${a.candidateName}?`)) return;
    try {
      await api.delete(`/applicants/${a._id}`);
      toast.success("Applicant removed");
      load();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div>
      <PageHeader
        title="Applicant Tracking"
        subtitle="Manage candidates through your recruitment pipeline"
        action={<Button onClick={() => setModalOpen(true)}><Plus size={16} /> Add Applicant</Button>}
      />

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input placeholder="Search by name, email or position..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="sm:w-48">
            <option value="All">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16"><Spinner size={28} /></div>
          ) : applicants.length === 0 ? (
            <p className="py-16 text-center text-muted-foreground">No applicants found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>AI Score</TableHead>
                  <TableHead>Recommendation</TableHead>
                  <TableHead>CV</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applicants.map((a) => (
                  <TableRow key={a._id}>
                    <TableCell>
                      <p className="font-medium">{a.candidateName}</p>
                      <p className="text-xs text-muted-foreground">{a.email}</p>
                    </TableCell>
                    <TableCell>{a.position}</TableCell>
                    <TableCell>
                      {a.aiScore != null ? (
                        <span className="font-semibold">{a.aiScore}/100</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not screened</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {a.aiRecommendation ? (
                        <Badge variant={recVariant[a.aiRecommendation] || "secondary"}>{a.aiRecommendation}</Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      {a.cvPath ? (
                        <a href={a.cvPath} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                          <FileText size={14} /> View
                        </a>
                      ) : <span className="text-xs text-muted-foreground">None</span>}
                    </TableCell>
                    <TableCell>
                      <Select value={a.status} onChange={(e) => changeStatus(a._id, e.target.value)} className="h-8 w-36 text-xs">
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Button variant="ghost" size="icon" onClick={() => remove(a)}>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Applicant">
        <form onSubmit={save} className="space-y-4">
          <div>
            <Label>Candidate name</Label>
            <Input value={form.candidateName} onChange={update("candidateName")} placeholder="Full name" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={update("email")} placeholder="candidate@email.com" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={update("phone")} placeholder="+92 ..." />
            </div>
          </div>
          <div>
            <Label>Position applied for</Label>
            <Input value={form.position} onChange={update("position")} placeholder="e.g. Full Stack Developer" />
          </div>
          <div>
            <Label>CV (PDF) — optional, enables AI screening</Label>
            <Input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setCvFile(e.target.files[0])} />
            <p className="mt-1 text-xs text-muted-foreground">Upload a PDF to extract text for AI resume screening.</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Spinner size={16} className="text-white" /> : "Add applicant"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
