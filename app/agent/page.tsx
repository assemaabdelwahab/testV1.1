"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import Link from "next/link";
import { usePrivacy } from "@/contexts/PrivacyContext";

interface CategoryTarget {
  category: string;
  current_avg: number;
  target: number;
  cut: number;
}

interface AgentPlan {
  target_amount: number;
  category_targets: CategoryTarget[];
  total_cut: number;
  feasibility: string;
}

interface AgentResponse {
  type: "plan" | "conversation";
  message: string;
  plan?: AgentPlan;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  response?: AgentResponse;
}

export default function AgentPage() {
  const { privacyMode } = usePrivacy();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [goalId, setGoalId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function mask(amount: number) {
    if (privacyMode) return "••••";
    return `EGP ${Math.round(amount).toLocaleString()}`;
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, conversationHistory, goalId }),
      });

      const data = await res.json();
      if (data.goalId) setGoalId(data.goalId);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response?.message ?? "",
          response: data.response,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="min-h-screen max-w-narrative mx-auto flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between py-4 px-5 border-b border-bg-elevated">
        <Link
          href="/"
          className="flex items-center gap-1 text-ink-secondary hover:text-ink-primary transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Dashboard
        </Link>
        <span className="text-sm font-medium text-ink-primary">Savings Coach</span>
        <div className="w-20" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">
        {messages.length === 0 && (
          <div className="text-center pt-16 space-y-2">
            <p className="text-ink-secondary text-sm">Ask about your spending or set a savings goal.</p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {[
                "Help me save 3000 EGP this month",
                "Why was last month expensive?",
                "Where do I spend the most?",
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  className="text-xs bg-bg-elevated text-ink-secondary hover:text-ink-primary px-3 py-1.5 rounded-full transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "user" ? (
              <div className="bg-signal-blue text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-xs text-sm">
                {msg.content}
              </div>
            ) : (
              <div className="space-y-3 max-w-full">
                {msg.content && (
                  <div className="bg-bg-elevated rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-ink-primary leading-relaxed">
                    {msg.content}
                  </div>
                )}
                {msg.response?.type === "plan" && msg.response.plan && (
                  <PlanCard plan={msg.response.plan} mask={mask} />
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-bg-elevated rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                {[0, 150, 300].map((delay) => (
                  <div
                    key={delay}
                    className="w-1.5 h-1.5 bg-ink-muted rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-5 pb-8 pt-3 border-t border-bg-elevated">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your spending…"
            rows={1}
            className="flex-1 bg-bg-elevated text-ink-primary placeholder:text-ink-muted rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-signal-blue"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="w-9 h-9 flex-shrink-0 flex items-center justify-center bg-signal-blue rounded-xl text-white disabled:opacity-40 transition-opacity"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function PlanCard({ plan, mask }: { plan: AgentPlan; mask: (n: number) => string }) {
  return (
    <div className="bg-bg-card border border-bg-elevated rounded-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="section-label">Savings Plan</span>
        <span className="text-sm font-semibold text-ink-primary num">{mask(plan.target_amount)}</span>
      </div>

      <div className="space-y-2.5">
        {plan.category_targets.map((ct) => (
          <div key={ct.category} className="flex flex-col gap-0.5 text-sm">
            <span className="text-ink-secondary">{ct.category}</span>
            <div className="flex items-center gap-2 text-xs num">
              <span className="text-ink-muted">{mask(ct.current_avg)}</span>
              <span className="text-ink-muted">→</span>
              <span className="text-ink-primary">{mask(ct.target)}</span>
              <span className="text-signal-red ml-auto">−{mask(ct.cut)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2.5 border-t border-bg-elevated flex items-center justify-between text-sm">
        <span className="text-ink-secondary">Total saved</span>
        <span className="font-semibold text-signal-green num">{mask(plan.total_cut)}</span>
      </div>

      {plan.feasibility && (
        <p className="text-xs text-ink-secondary">{plan.feasibility}</p>
      )}
    </div>
  );
}
