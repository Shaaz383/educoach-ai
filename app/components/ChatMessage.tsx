import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

interface CodeProps {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
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
      <div className="max-w-xl px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed bg-white border border-gray-100 text-gray-700 shadow-sm">
        <ReactMarkdown
          components={{
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
            p: ({ children }) => (
              <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-gray-800">{children}</strong>
            ),
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
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-indigo-300 pl-3 my-2 text-gray-500 italic">
                {children}
              </blockquote>
            ),
            hr: () => <hr className="border-gray-200 my-3" />,

            // Code — syntax highlighting wala
            code({ inline, className, children }: CodeProps) {
              const match = /language-(\w+)/.exec(className ?? "");
              const language = match ? match[1] : "text";
              const codeString = String(children).replace(/\n$/, "");

              if (!inline && match) {
                return (
                  <div className="my-3 rounded-xl overflow-hidden">
                    {/* Language label */}
                    <div className="bg-gray-800 px-4 py-1.5 flex items-center justify-between">
                      <span className="text-xs text-gray-400 font-mono">
                        {language}
                      </span>
                      <button
                        onClick={() =>
                          void navigator.clipboard.writeText(codeString)
                        }
                        className="text-xs text-gray-400 hover:text-white transition-colors"
                      >
                        Copy code
                      </button>
                    </div>
                    <SyntaxHighlighter
                      style={oneDark}
                      language={language}
                      PreTag="div"
                      customStyle={{
                        margin: 0,
                        borderRadius: 0,
                        fontSize: "13px",
                        padding: "16px",
                      }}
                    >
                      {codeString}
                    </SyntaxHighlighter>
                  </div>
                );
              }

              // Inline code
              return (
                <code className="bg-gray-100 text-indigo-600 text-xs px-1.5 py-0.5 rounded font-mono">
                  {children}
                </code>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>

        {/* Copy full message */}
        {!isStreaming && content && (
          <button
            onClick={() => void navigator.clipboard.writeText(content)}
            className="mt-2 text-xs text-gray-300 hover:text-gray-500 transition-colors"
          >
            Copy
          </button>
        )}

        {/* Streaming cursor */}
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 bg-indigo-400 ml-1 animate-pulse rounded" />
        )}
      </div>
    </div>
  );
}
