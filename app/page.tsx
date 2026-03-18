"use client";
import { useState } from "react";
import Sidebar from "./components/Sidebar";

export default function Home() {
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [topics, setTopics] = useState([]);

  function handleNewChat() {
    setHistory([]);
    setMessage("");
  }

  async function sendMessage() {
    if (!message.trim() || loading) return;
    setLoading(true);

    const newHistory = [
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

    // Streaming response handle karo
    if (res.headers.get("content-type")?.includes("text/plain")) {
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
      // Fallback JSON response
      const data = await res.json();
      setHistory((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: data.reply || "Something went wrong.",
        };
        return updated;
      });
    }

    setLoading(false);
  }

  const suggestions = [
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
            <p className="text-xs text-gray-400">Your personal learning assistant</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-400">Online</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4">
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
                  Ask me anything — concepts, code, interview prep, or practice questions.
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

          {history.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-1">
                  E
                </div>
              )}
              <div
                className={`max-w-lg px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-tr-sm"
                    : "bg-white border border-gray-100 text-gray-700 rounded-tl-sm shadow-sm"
                }`}
              >
                {msg.content}
                {msg.role === "assistant" &&
                  i === history.length - 1 &&
                  loading && (
                    <span className="inline-block w-1.5 h-4 bg-indigo-400 ml-1 animate-pulse rounded" />
                  )}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-xs font-bold shrink-0 mt-1">
                  U
                </div>
              )}
            </div>
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
                  sendMessage();
                }
              }}
            />
            <button
              onClick={sendMessage}
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