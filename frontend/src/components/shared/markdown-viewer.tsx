import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/utils/cn";

const markdownComponents: Components = {
  p: ({ children }) => (
    <p className="leading-relaxed text-foreground-soft not-first:mt-4">{children}</p>
  ),
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-accent underline underline-offset-2 hover:text-accent-hover"
    >
      {children}
    </a>
  ),
  h1: ({ children }) => (
    <h1 className="mt-8 text-2xl font-semibold tracking-tight text-foreground first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-6 text-lg font-semibold tracking-tight text-foreground">{children}</h2>
  ),
  h3: ({ children }) => <h3 className="mt-5 text-base font-semibold text-foreground">{children}</h3>,
  ul: ({ children }) => (
    <ul className="mt-3 ml-5 list-disc space-y-1.5 text-foreground-soft">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mt-3 ml-5 list-decimal space-y-1.5 text-foreground-soft">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="mt-4 border-l-2 border-accent/40 pl-4 text-foreground-soft italic">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="mt-3 overflow-x-auto rounded-lg bg-surface-muted p-4 font-mono text-[0.85em] leading-relaxed [&>code]:bg-transparent [&>code]:p-0">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="mt-4 overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[420px] text-left text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-surface-muted">{children}</thead>,
  th: ({ children }) => <th className="px-4 py-2.5 font-semibold text-foreground">{children}</th>,
  td: ({ children }) => (
    <td className="border-t border-border px-4 py-2.5 text-foreground-soft">{children}</td>
  ),
  hr: () => <hr className="my-6 border-border" />,
};

type MarkdownViewerProps = {
  content: string;
  className?: string;
};

export function MarkdownViewer({ content, className }: MarkdownViewerProps) {
  return (
    <div className={cn(className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
