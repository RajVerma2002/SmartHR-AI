import { useState } from "react";
import toast from "react-hot-toast";
import { Sparkles, Code, Users, Lightbulb, AlertCircle } from "lucide-react";
import api from "@/api/axios";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

const sections = [
  { key: "technical", title: "Technical", icon: Code, tone: "text-indigo-500" },
  { key: "behavioral", title: "Behavioral", icon: Users, tone: "text-emerald-500" },
  { key: "scenario", title: "Scenario-Based", icon: Lightbulb, tone: "text-amber-500" },
];

export default function InterviewGenerator() {
  const [position, setPosition] = useState("");
  const [experience, setExperience] = useState("Mid-level");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState(null);

  const generate = async (e) => {
    e.preventDefault();
    if (!position) return toast.error("Enter a job position");
    setLoading(true);
    setQuestions(null);
    try {
      const { data } = await api.post("/ai/interview-questions", { position, experience });
      setQuestions(data.questions);
      toast.success("Questions generated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="AI Interview Generator" subtitle="Generate role-specific interview questions with Gemini AI" />

      <Card className="mb-6">
        <CardContent className="p-6">
          <form onSubmit={generate} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label>Job position</Label>
              <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="e.g. React Frontend Developer" />
            </div>
            <div className="sm:w-48">
              <Label>Experience level</Label>
              <Select value={experience} onChange={(e) => setExperience(e.target.value)}>
                <option>Junior</option>
                <option>Mid-level</option>
                <option>Senior</option>
                <option>Lead</option>
              </Select>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? <Spinner size={18} className="text-white" /> : <><Sparkles size={16} /> Generate</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <Spinner size={32} />
          <p className="text-sm">Generating interview questions...</p>
        </div>
      )}

      {questions && (
        <>
          {questions.configured === false && (
            <div className="mb-6 flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <p>AI is not configured — these are sample questions. Add a GEMINI_API_KEY in the backend .env for AI-generated questions.</p>
            </div>
          )}
          <div className="grid gap-6 lg:grid-cols-3">
            {sections.map(({ key, title, icon: Icon, tone }) => (
              <Card key={key} className="animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon size={18} className={tone} /> {title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3">
                    {(questions[key] || []).map((q, i) => (
                      <li key={i} className="flex gap-2.5 text-sm">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {i + 1}
                        </span>
                        <span className="text-foreground/80">{q}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
