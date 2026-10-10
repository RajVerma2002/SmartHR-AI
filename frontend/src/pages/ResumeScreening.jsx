import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FileSearch, Sparkles, AlertCircle } from "lucide-react";
import api from "@/api/axios";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

const recVariant = { "Strong Candidate": "success", "Average Candidate": "warning", "Not Recommended": "destructive" };

function ScoreRing({ score }) {
  const pct = Math.max(0, Math.min(100, score || 0));
  const color = pct >= 75 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      <svg className="h-28 w-28 -rotate-90">
        <circle cx="56" cy="56" r="48" stroke="hsl(var(--muted))" strokeWidth="10" fill="none" />
        <circle
          cx="56" cy="56" r="48" stroke={color} strokeWidth="10" fill="none"
          strokeDasharray={2 * Math.PI * 48}
          strokeDashoffset={2 * Math.PI * 48 * (1 - pct / 100)}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute text-center">
        <p className="font-display text-2xl font-bold">{pct}</p>
        <p className="text-[10px] text-muted-foreground">/ 100</p>
      </div>
    </div>
  );
}

function ResultCard({ result }) {
  if (!result) return null;
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles size={18} className="text-primary" /> Screening Result
        </CardTitle>
      </CardHeader>
      <CardContent>
        {result.configured === false && (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <p>AI is not configured. This is sample output — add a GEMINI_API_KEY in the backend .env to enable real screening.</p>
          </div>
        )}
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <ScoreRing score={result.score} />
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Recommendation</p>
              <Badge variant={recVariant[result.recommendation] || "secondary"} className="mt-1">
                {result.recommendation}
              </Badge>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Summary</p>
              <p className="mt-1 text-sm text-foreground/80">{result.summary}</p>
            </div>
            {result.skills?.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Detected skills</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {result.skills.map((s, i) => <Badge key={i} variant="outline">{s}</Badge>)}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ResumeScreening() {
  const [applicants, setApplicants] = useState([]);
  const [screeningId, setScreeningId] = useState(null);
  const [result, setResult] = useState(null);

  // Paste-text mode
  const [position, setPosition] = useState("");
  const [cvText, setCvText] = useState("");
  const [textLoading, setTextLoading] = useState(false);

  const loadApplicants = async () => {
    try {
      const { data } = await api.get("/applicants");
      setApplicants(data.applicants);
    } catch {}
  };

  useEffect(() => { loadApplicants(); }, []);

  const screenApplicant = async (a) => {
    if (!a.cvText && !a.cvPath) {
      return toast.error("This applicant has no CV uploaded. Add a PDF CV first.");
    }
    setScreeningId(a._id);
    setResult(null);
    try {
      const { data } = await api.post(`/ai/screen/${a._id}`);
      setResult({
        score: data.applicant.aiScore,
        recommendation: data.applicant.aiRecommendation,
        summary: data.applicant.aiSummary,
        skills: data.applicant.aiSkills,
        configured: data.configured,
      });
      toast.success("Screening complete");
      loadApplicants();
    } catch (err) {
      toast.error(err.response?.data?.message || "Screening failed");
    } finally {
      setScreeningId(null);
    }
  };

  const screenText = async (e) => {
    e.preventDefault();
    if (!position || !cvText) return toast.error("Enter position and CV text");
    setTextLoading(true);
    setResult(null);
    try {
      const { data } = await api.post("/ai/screen-text", { position, cvText });
      setResult(data.result);
      toast.success("Screening complete");
    } catch (err) {
      toast.error(err.response?.data?.message || "Screening failed");
    } finally {
      setTextLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="AI Resume Screening" subtitle="Score and rank candidates with Gemini AI" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSearch size={18} className="text-primary" /> Screen an Applicant
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {applicants.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No applicants yet. Add one in the Applicants page (with a PDF CV).
              </p>
            ) : (
              applicants.map((a) => (
                <div key={a._id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">{a.candidateName}</p>
                    <p className="text-xs text-muted-foreground">{a.position}{a.cvPath ? "" : " • no CV"}</p>
                  </div>
                  <Button size="sm" variant="outline" disabled={screeningId === a._id} onClick={() => screenApplicant(a)}>
                    {screeningId === a._id ? <Spinner size={16} /> : <><Sparkles size={14} /> Screen</>}
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Screen (paste text)</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={screenText} className="space-y-4">
              <div>
                <Label>Job position</Label>
                <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="e.g. Backend Developer" />
              </div>
              <div>
                <Label>CV / Resume text</Label>
                <Textarea rows={8} value={cvText} onChange={(e) => setCvText(e.target.value)} placeholder="Paste the candidate's resume text here..." />
              </div>
              <Button type="submit" className="w-full" disabled={textLoading}>
                {textLoading ? <Spinner size={18} className="text-white" /> : <><Sparkles size={16} /> Analyze with AI</>}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <ResultCard result={result} />
      </div>
    </div>
  );
}
