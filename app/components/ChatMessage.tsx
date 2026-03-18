import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export default function ChatMessage({
  role,
  content,
  isStreaming = false,
}: ChatMessageProps) {
  if (role === "user") {
    return (
      <div className="flex gap-3 justify-end">
        <div className="max-w-lg px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed bg-indigo-600 text-white">
          {content}
        </div>
        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-xs font-bold shrink-0 mt-1">
          U
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 justify-start">
      <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-1">
        E
      </div>
      <div className="max-w-lg px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed bg-white border border-gray-100 text-gray-700 shadow-sm">
        <ReactMarkdown
          components={{
            // Headings
            h1: ({ children }) => (
              <h1 className="text-lg font-bold text-gray-800 mb-2 mt-1">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-base font-bold text-gray-800 mb-2 mt-1">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-sm font-bold text-gray-800 mb-1 mt-1">
                {children}
              </h3>
            ),
            // Paragraph
            p: ({ children }) => (
              <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
            ),
            // Bold
            strong: ({ children }) => (
              <strong className="font-semibold text-gray-800">{children}</strong>
            ),
            // Inline code
            code: ({ children, className }) => {
              const isBlock = className?.includes("language-");
              if (isBlock) {
                return (
                  <code className="block bg-gray-900 text-green-400 text-xs rounded-lg px-4 py-3 my-2 overflow-x-auto font-mono whitespace-pre">
                    {children}
                  </code>
                );
              }
              return (
                <code className="bg-gray-100 text-indigo-600 text-xs px-1.5 py-0.5 rounded font-mono">
                  {children}
                </code>
              );
            },
            // Code block wrapper
            pre: ({ children }) => (
              <pre className="bg-gray-900 rounded-lg my-2 overflow-x-auto">
                {children}
              </pre>
            ),
            // Lists
            ul: ({ children }) => (
              <ul className="list-disc list-inside mb-2 space-y-1 text-gray-600">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside mb-2 space-y-1 text-gray-600">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="leading-relaxed">{children}</li>
            ),
            // Blockquote
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-indigo-300 pl-3 my-2 text-gray-500 italic">
                {children}
              </blockquote>
            ),
            // Horizontal rule
            hr: () => <hr className="border-gray-200 my-3" />,
          }}
        >
          {content}
        </ReactMarkdown>
        {role === "assistant" && !isStreaming && content && (
          <button
            onClick={() => void navigator.clipboard.writeText(content)}
            className="mt-2 text-xs text-gray-300 hover:text-gray-500 transition-colors flex items-center gap-1"
          >
            Copy
          </button>
        )}
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 bg-indigo-400 ml-1 animate-pulse rounded" />
        )}
      </div>
    </div>
  );
}
