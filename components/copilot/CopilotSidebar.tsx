"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store/useAppStore";
import { createClient } from "@/lib/supabase/client";
import { X, Send, MessageSquare } from "lucide-react";
import type { CopilotMessage } from "@/types";

const suggestions: Record<string, string[]> = {
  "/hub": [
    "Quel est l'état de ma boîte aujourd'hui ?",
    "Quelles sont mes priorités cette semaine ?",
    "Qu'est-ce qui mérite mon attention ?",
  ],
  "/astryd": [
    "Qu'est-ce qui bloque ma progression ?",
    "Quelle décision dois-je prioriser ?",
    "Mon objectif est-il réaliste ?",
  ],
  "/elyse": [
    "Combien de mois de runway me reste-t-il ?",
    "Où puis-je réduire mon burn ?",
    "Suis-je en bonne santé financière ?",
  ],
  "/gyna": [
    "Quel est mon prochain levier commercial ?",
    "Mon pipeline est-il suffisant ?",
    "Comment accélérer mon acquisition ?",
  ],
  "/integrations": [
    "Quels outils connecter en priorité ?",
    "À quoi sert la connexion Pennylane ?",
  ],
  "/settings": [
    "Quelles informations renseigner en priorité ?",
    "Comment fonctionne le co-pilote ?",
  ],
};

function getPageLabel(pathname: string) {
  if (pathname.startsWith("/hub")) return "Hub";
  if (pathname.startsWith("/astryd")) return "Astryd";
  if (pathname.startsWith("/elyse")) return "Elyse";
  if (pathname.startsWith("/gyna")) return "Gyna";
  if (pathname.startsWith("/integrations")) return "Intégrations";
  if (pathname.startsWith("/settings")) return "Settings";
  return "Studio";
}

function getPageContext(pathname: string) {
  if (pathname.startsWith("/hub")) return "/hub";
  if (pathname.startsWith("/astryd")) return "/astryd";
  if (pathname.startsWith("/elyse")) return "/elyse";
  if (pathname.startsWith("/gyna")) return "/gyna";
  if (pathname.startsWith("/integrations")) return "/integrations";
  if (pathname.startsWith("/settings")) return "/settings";
  return "/hub";
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  if (hours > 0) return `il y a ${hours}h`;
  if (mins > 0) return `il y a ${mins}min`;
  return "à l'instant";
}

export function CopilotSidebar() {
  const pathname = usePathname();
  const { copilotOpen, closeCopilot, user } = useAppStore();
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const pageContext = getPageContext(pathname);
  const pageSuggestions = suggestions[pageContext] || suggestions["/hub"];

  useEffect(() => {
    if (copilotOpen && user) {
      loadHistory();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copilotOpen, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  async function loadHistory() {
    if (!user) return;
    const { data } = await supabase
      .from("copilot_messages")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(10);
    if (data) setMessages(data as CopilotMessage[]);
  }

  async function sendMessage(content: string) {
    if (!content.trim() || loading || !user) return;

    const userMsg: CopilotMessage = {
      id: crypto.randomUUID(),
      user_id: user.id,
      role: "user",
      content,
      page_context: pageContext,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setStreamingContent("");

    await supabase.from("copilot_messages").insert({
      user_id: user.id,
      role: "user",
      content,
      page_context: pageContext,
    });

    const history = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const response = await fetch("/api/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, pageContext }),
      });

      if (!response.ok) throw new Error("API error");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") break;
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullContent += parsed.content;
                  setStreamingContent(fullContent);
                }
              } catch {}
            }
          }
        }
      }

      const assistantMsg: CopilotMessage = {
        id: crypto.randomUUID(),
        user_id: user.id,
        role: "assistant",
        content: fullContent,
        page_context: pageContext,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setStreamingContent("");

      await supabase.from("copilot_messages").insert({
        user_id: user.id,
        role: "assistant",
        content: fullContent,
        page_context: pageContext,
      });
    } catch {
      setStreamingContent("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`
        fixed right-0 top-0 h-screen w-[380px] bg-surface border-l border-border
        flex flex-col z-30
        transition-transform duration-300 ease-in-out
        ${copilotOpen ? "translate-x-0" : "translate-x-full"}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <MessageSquare size={16} className="text-blue" />
          <div>
            <p className="font-sans font-semibold text-sm text-fg">Co-pilote</p>
            <p className="font-sans text-xs text-muted">Vous êtes sur {getPageLabel(pathname)}</p>
          </div>
        </div>
        <button onClick={closeCopilot} className="text-muted hover:text-fg transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Suggestions */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex flex-wrap gap-2">
          {pageSuggestions.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              disabled={loading}
              className="
                text-xs font-sans px-3 py-1.5
                rounded-full border border-border
                text-muted hover:text-fg hover:border-fg
                transition-all duration-150
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && !streamingContent && (
          <div className="text-center py-8">
            <MessageSquare size={28} className="text-border mx-auto mb-3" />
            <p className="font-sans text-sm text-muted">
              Pose une question ou utilise une suggestion ci-dessus.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`
                max-w-[85%] px-4 py-3 rounded-[20px]
                font-sans text-sm leading-relaxed
                ${msg.role === "user"
                  ? "bg-beige text-fg rounded-br-md"
                  : "bg-surface border border-border text-fg rounded-bl-md"
                }
              `}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <p className="text-[10px] text-muted mt-1.5">{timeAgo(msg.created_at)}</p>
            </div>
          </div>
        ))}

        {streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[85%] px-4 py-3 rounded-[20px] rounded-bl-md bg-surface border border-border font-sans text-sm leading-relaxed text-fg">
              <p className="whitespace-pre-wrap">{streamingContent}</p>
              <span className="inline-block w-1.5 h-3.5 bg-blue animate-pulse ml-0.5" />
            </div>
          </div>
        )}

        {loading && !streamingContent && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-[20px] rounded-bl-md bg-surface border border-border">
              <div className="flex gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-4 border-t border-border">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder="Posez une question sur votre boîte…"
            rows={1}
            disabled={loading}
            className="
              flex-1 px-4 py-2.5 rounded-xl
              bg-bg border border-border
              font-sans text-sm text-fg
              placeholder:text-muted
              focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-blue
              resize-none transition-all duration-150
              disabled:opacity-50
            "
            style={{ minHeight: "42px", maxHeight: "120px" }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="
              w-10 h-10 rounded-xl bg-fg text-white
              flex items-center justify-center
              hover:opacity-80 transition-opacity
              disabled:opacity-30 disabled:cursor-not-allowed
              flex-shrink-0
            "
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
