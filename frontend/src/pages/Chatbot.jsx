import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Send, Sparkles, User } from "lucide-react";
import api from "@/api/axios";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

const suggestions = [
  "How many employees are present today?",
  "Show the payroll summary for this month.",
  "How many leave requests are pending?",
  "List employees currently on leave.",
];

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    api
      .get("/ai/chat/history")
      .then(({ data }) => {
        const hist = [];
        data.history.forEach((h) => {
          hist.push({ role: "user", text: h.message });
          hist.push({ role: "assistant", text: h.response });
        });
        setMessages(hist);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: msg }]);
    setSending(true);
    try {
      const { data } = await api.post("/ai/chat", { message: msg });
      setMessages((m) => [...m, { role: "assistant", text: data.response }]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to get response");
      setMessages((m) => [...m, { role: "assistant", text: "Sorry, I couldn't process that request." }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHeader title="AI HR Chatbot" subtitle="Ask questions about your HR data in plain language" />

      <Card className="flex h-[calc(100vh-220px)] flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-6">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Sparkles size={26} className="text-primary" />
              </div>
              <h3 className="text-lg font-semibold">SmartHR Assistant</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                I can answer questions about employees, attendance, leaves and payroll. Try one of these:
              </p>
              <div className="mt-5 grid max-w-md gap-2 sm:grid-cols-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-lg border border-border bg-card p-3 text-left text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                m.role === "user" ? "bg-secondary" : "bg-primary text-primary-foreground"
              }`}>
                {m.role === "user" ? <User size={16} /> : <Sparkles size={16} />}
              </div>
              <div className={`max-w-[75%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
              }`}>
                {m.text}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Sparkles size={16} />
              </div>
              <div className="rounded-2xl bg-secondary px-4 py-3">
                <Spinner size={16} />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border p-4">
          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your HR data..."
              disabled={sending}
            />
            <Button type="submit" size="icon" disabled={sending || !input.trim()}>
              <Send size={18} />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
