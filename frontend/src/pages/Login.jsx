import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Sparkles, Mail, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

const demoAccounts = [
  { label: "Super Admin", email: "admin@smarthr.com", password: "admin123" },
  { label: "HR Manager", email: "hr@smarthr.com", password: "hr123" },
  { label: "Employee", email: "employee@smarthr.com", password: "emp123" },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Enter email and password");
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left brand panel */}
      <div className="hidden w-1/2 flex-col justify-between bg-sidebar p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Sparkles size={20} />
          </div>
          <span className="font-display text-xl font-semibold">SmartHR AI</span>
        </div>
        <div>
          <h1 className="font-display text-4xl font-bold leading-tight">
            Intelligent HR,<br />powered by AI.
          </h1>
          <p className="mt-4 max-w-md text-sidebar-foreground/70">
            Manage employees, attendance, payroll and recruitment in one place — with AI resume
            screening, interview generation and an HR assistant built in.
          </p>
          <div className="mt-8 flex gap-8">
            <Stat n="10+" l="Modules" />
            <Stat n="3" l="AI Features" />
            <Stat n="4" l="User Roles" />
          </div>
        </div>
        <p className="text-xs text-sidebar-foreground/50">© {new Date().getFullYear()} SmartHR AI</p>
      </div>

      {/* Right form panel */}
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">Sign in</h2>
            <p className="mt-1 text-sm text-muted-foreground">Access your SmartHR AI dashboard</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  type="email"
                  placeholder="you@smarthr.com"
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Spinner size={18} className="text-white" /> : "Sign in"}
            </Button>
          </form>

          <div className="mt-6">
            <p className="mb-2 text-center text-xs text-muted-foreground">Quick demo login</p>
            <div className="grid grid-cols-3 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => fillDemo(acc)}
                  className="rounded-md border border-border bg-card px-2 py-2 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            New applicant?{" "}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Stat({ n, l }) {
  return (
    <div>
      <p className="font-display text-2xl font-bold">{n}</p>
      <p className="text-xs text-sidebar-foreground/60">{l}</p>
    </div>
  );
}
