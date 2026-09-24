import * as React from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

/**
 * Markdown renderer for agent responses.
 * ---------------------------------------------------------------------------
 * The LangGraph agent returns GitHub-flavoured markdown (headings, bullet and
 * numbered lists, tables, `code`, **bold**, links, blockquotes). This component
 * renders that content with the design-system tokens:
 * - 0.25rem radii, no gradients/glassmorphism/glow.
 * - Headings use Raleway (`font-heading`), body uses the inherited Open Sans.
 * - Tables scroll horizontally inside the bubble so they never overflow.
 * - Raw HTML is NOT rendered (react-markdown default) — no injection surface.
 */

export interface MarkdownMessageProps {
  content: string;
  className?: string;
}

const components: Components = {
  h1: ({ children }) => (
    <h3 className="mb-2 mt-4 font-heading text-lg font-bold text-white first:mt-0">{children}</h3>
  ),
  h2: ({ children }) => (
    <h4 className="mb-2 mt-4 font-heading text-base font-bold text-white first:mt-0">{children}</h4>
  ),
  h3: ({ children }) => (
    <h5 className="mb-2 mt-4 font-heading text-sm font-bold uppercase tracking-wide text-white first:mt-0">
      {children}
    </h5>
  ),
  h4: ({ children }) => (
    <h6 className="mb-2 mt-3 font-heading text-sm font-bold text-white first:mt-0">{children}</h6>
  ),
  h5: ({ children }) => (
    <h6 className="mb-2 mt-3 font-heading text-sm font-bold text-secondary-foreground first:mt-0">
      {children}
    </h6>
  ),
  h6: ({ children }) => (
    <h6 className="mb-2 mt-3 font-heading text-sm font-bold text-muted-foreground first:mt-0">
      {children}
    </h6>
  ),
  p: ({ children }) => <p className="my-2 leading-relaxed first:mt-0 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-accent underline underline-offset-2 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="my-2 list-disc space-y-1 pl-5 marker:text-muted-foreground">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 list-decimal space-y-1 pl-5 marker:text-muted-foreground">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-border pl-3 text-secondary-foreground italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-4 border-border" />,
  code: ({ className, children, ...props }) => {
    const isBlock = typeof className === 'string' && className.includes('language-');
    if (isBlock) {
      return (
        <code
          className={cn('font-mono text-xs text-foreground', className)}
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code
        className="rounded-[0.25rem] border border-border bg-surface-hover px-1.5 py-0.5 font-mono text-xs text-accent"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-3 overflow-x-auto rounded-[0.25rem] border border-border bg-surface-hover p-3">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-[0.25rem] border border-border">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-secondary-light">{children}</thead>,
  th: ({ children }) => (
    <th className="border-b border-border px-3 py-2 text-left font-heading text-xs font-bold uppercase tracking-wide text-white">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-border px-3 py-2 align-top text-secondary-foreground">
      {children}
    </td>
  ),
};

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ content, className }) => (
  <div className={cn('text-base text-foreground', className)}>
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  </div>
);
