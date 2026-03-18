"use client";
import { useState } from "react";
import Sidebar from "./components/Sidebar";
import ChatMessage from "./components/ChatMessage";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [message, setMessage] = useState<string>("");
  const [history, setHistory] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [topics, setTopics] = useState<string[]>([]);

  function handleNewChat(): void {
    setHistory([]);
    setMessage("");
  }

  async function sendMessage(): Promise<void> {
    if (!message.trim() || loading) return;
    setLoading(true);

    const newHistory: Message[] = [
      ...history,
      { role: "user", content: message },
    ];

    setHistory([...newHistory, { role: "assistant", content: "" }]);

    if (history.length === 0) {
      setTopics((prev) => [message.slice(0, 28), ...prev].slice(0, 12));
    }

    setMessage("");

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newHistory }),
    });

    if (res.headers.get("content-type")?.includes("text/plain")) {
      if (!res.body) {
        setLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullReply = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullReply += decoder.decode(value);
        setHistory((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: fullReply,
          };
          return updated;
        });
      }
    } else {
      const data = (await res.json()) as { reply?: string };
      setHistory((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: data.reply ?? "Something went wrong.",
        };
        return updated;
      });
    }

    setLoading(false);
  }

  const suggestions: string[] = [
    "Explain React hooks with examples",
    "What is an AI Agent?",
    "Generate 5 JavaScript quiz questions",
    "Explain async/await simply",
    "Weather in Mumbai",
    "What is 1234 * 5678?",
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar topics={topics} onNewChat={handleNewChat} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <div className="bg-white border-b border-gray-100 px-6 py-3.5 flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
            <span className="text-indigo-600 text-xs font-bold">E</span>
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm">EduCoach AI</p>
            <p className="text-xs text-gray-400">
              Your personal learning assistant
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-400">Online</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4">
          {/* Welcome Screen */}
          {history.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                E
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Welcome to EduCoach AI
                </h2>
                <p className="text-gray-400 mt-2 text-sm max-w-sm leading-relaxed">
                  Ask me anything — concepts, code, interview prep, or practice
                  questions.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => setMessage(s)}
                    className="bg-white border border-gray-200 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 text-gray-500 text-xs px-4 py-2 rounded-full transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Messages — ChatMessage component use ho raha hai ab */}
          {history.map((msg, i) => (
            <ChatMessage
              key={i}
              role={msg.role}
              content={msg.content}
              isStreaming={
                loading &&
                i === history.length - 1 &&
                msg.role === "assistant"
              }
            />
          ))}
        </div>

        {/* Input */}
        <div className="bg-white border-t border-gray-100 px-6 py-4 shrink-0">
          <div className="flex gap-3 items-end max-w-4xl mx-auto">
            <textarea
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
              placeholder="Ask anything — concepts, code, quiz questions..."
              rows={1}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !loading) {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
            />
            <button
              onClick={() => void sendMessage()}
              disabled={loading || !message.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-3 rounded-xl text-sm font-semibold transition-all shrink-0"
            >
              {loading ? "..." : "Send"}
            </button>
          </div>
          <p className="text-center text-xs text-gray-300 mt-2">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}