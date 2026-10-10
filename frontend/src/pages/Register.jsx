import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "Applicant" });
  const [loading, setLoading] = useState(false);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error("Fill all fields");
    if (form.password.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    try {
      await register(form);
      toast.success("Account created!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles size={22} />
          </div>
          <h2 className="text-2xl font-bold">Create your account</h2>
          <p className="mt-1 text-sm text-muted-foreground">Join SmartHR AI</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Full name</Label>
            <Input placeholder="John Doe" value={form.name} onChange={update("name")} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" placeholder="you@example.com" value={form.email} onChange={update("email")} />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" placeholder="At least 6 characters" value={form.password} onChange={update("password")} />
          </div>
          <div>
            <Label>I am a</Label>
            <Select value={form.role} onChange={update("role")}>
              <option value="Applicant">Job Applicant</option>
              <option value="Employee">Employee</option>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Spinner size={18} className="text-white" /> : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
