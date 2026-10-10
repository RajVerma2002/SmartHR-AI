import { useEffect, useState } from "react";
import { Moon, Sun, CheckCircle2, XCircle, User, Palette, Bot } from "lucide-react";
import api from "@/api/axios";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function Settings() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [ai, setAi] = useState(null);

  useEffect(() => {
    api.get("/ai/status").then(({ data }) => setAi(data)).catch(() => {});
  }, []);

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your profile and preferences" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User size={18} className="text-primary" /> Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold text-primary">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className="text-lg font-semibold">{user?.name}</p>
                <Badge variant="default">{user?.role}</Badge>
              </div>
            </div>
            <Row label="Email" value={user?.email} />
            <Row label="Role" value={user?.role} />
            <Row label="User ID" value={user?._id} mono />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Palette size={18} className="text-primary" /> Appearance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Theme</p>
                  <p className="text-xs text-muted-foreground">Currently using {theme} mode</p>
                </div>
                <Button variant="outline" onClick={toggleTheme}>
                  {theme === "dark" ? <><Sun size={16} /> Light</> : <><Moon size={16} /> Dark</>}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bot size={18} className="text-primary" /> AI Status</CardTitle>
            </CardHeader>
            <CardContent>
              {!ai ? (
                <p className="text-sm text-muted-foreground">Checking...</p>
              ) : ai.configured ? (
                <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={18} />
                  <span>Gemini AI is connected (model: <span className="font-mono">{ai.model}</span>)</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                    <XCircle size={18} />
                    <span>AI is not configured</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Add a <span className="font-mono">GEMINI_API_KEY</span> to <span className="font-mono">backend/.env</span> and
                    restart the server. AI features will return sample data until then.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}
