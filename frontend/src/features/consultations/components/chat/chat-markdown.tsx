import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/utils/cn";

type ChatMarkdownProps = {
  content: string;
  tone: "user" | "assistant";
};

function createComponents(tone: "user" | "assistant"): Components {
  const isUser = tone === "user";
  const linkClass = isUser
    ? "text-white underline underline-offset-2"
    : "text-accent underline underline-offset-2";

  return {
    p: ({ children }) => <p className="leading-relaxed not-first:mt-3">{children}</p>,
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    a: ({ children, href }) => (
      <a href={href} target="_blank" rel="noreferrer" className={linkClass}>
        {children}
      </a>
    ),
    ul: ({ children }) => <ul className="mt-2 ml-4 list-disc space-y-1">{children}</ul>,
    ol: ({ children }) => <ol className="mt-2 ml-4 list-decimal space-y-1">{children}</ol>,
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    h1: ({ children }) => <h1 className="mt-3 text-base font-semibold">{children}</h1>,
    h2: ({ children }) => <h2 className="mt-3 text-sm font-semibold">{children}</h2>,
    h3: ({ children }) => <h3 className="mt-3 text-sm font-semibold">{children}</h3>,
    blockquote: ({ children }) => (
      <blockquote
        className={cn("mt-2 border-l-2 pl-3 italic", isUser ? "border-white/40" : "border-border")}
      >
        {children}
      </blockquote>
    ),
    code: ({ children }) => (
      <code
        className={cn(
          "rounded px-1.5 py-0.5 font-mono text-[0.85em]",
          isUser ? "bg-white/15" : "bg-surface-muted",
        )}
      >
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre
        className={cn(
          "mt-2 overflow-x-auto rounded-lg p-3 font-mono text-[0.85em] leading-relaxed",
          "[&>code]:bg-transparent [&>code]:p-0",
          isUser ? "bg-white/15" : "bg-surface-muted",
        )}
      >
        {children}
      </pre>
    ),
    table: ({ children }) => (
      <div
        className={cn(
          "mt-2 overflow-x-auto rounded-lg border",
          isUser ? "border-white/25" : "border-border",
        )}
      >
        <table className="w-full min-w-[320px] text-left text-[0.85em]">{children}</table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className={isUser ? "bg-white/10" : "bg-surface-muted"}>{children}</thead>
    ),
    th: ({ children }) => <th className="px-3 py-2 font-semibold">{children}</th>,
    td: ({ children }) => (
      <td
        className={cn("border-t px-3 py-2", isUser ? "border-white/15" : "border-border/60")}
      >
        {children}
      </td>
    ),
    hr: () => <hr className={cn("my-3", isUser ? "border-white/20" : "border-border")} />,
  };
}

export function ChatMarkdown({ content, tone }: ChatMarkdownProps) {
  return (
    <div className="text-[0.95rem]">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={createComponents(tone)}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
