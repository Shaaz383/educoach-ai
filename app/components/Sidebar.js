export default function Sidebar({ topics, onNewChat }) {
  return (
    <div className="w-64 h-screen bg-indigo-950 flex flex-col p-4 gap-4 shrink-0">

      {/* Logo */}
      <div className="flex items-center gap-3 px-2 py-3">
        <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0">
          E
        </div>
        <span className="text-white font-semibold text-base">EduCoach AI</span>
      </div>

      {/* New Chat Button */}
      <button
        onClick={onNewChat}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
      >
        <span className="text-xl leading-none">+</span>
        New Chat
      </button>

      {/* Recent Topics */}
      <div className="flex flex-col gap-1">
        <p className="text-indigo-400 text-xs font-semibold px-2 mb-1 uppercase tracking-widest">
          Recent
        </p>
        {topics.length === 0 && (
          <p className="text-indigo-600 text-xs px-2 italic">
            No chats yet...
          </p>
        )}
        {topics.map((topic, i) => (
          <div
            key={i}
            className="text-indigo-200 text-sm px-3 py-2 rounded-lg hover:bg-indigo-800 cursor-pointer truncate transition-colors"
          >
            {topic}
          </div>
        ))}
      </div>

      {/* Bottom */}
      <div className="mt-auto border-t border-indigo-800 pt-4 flex flex-col gap-1">
        <p className="text-indigo-400 text-xs px-2 font-medium">EduCoach AI</p>
        <p className="text-indigo-600 text-xs px-2">Powered by Llama 3.3</p>
      </div>

    </div>
  );
}