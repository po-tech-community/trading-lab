/**
 * MarkdownContent — lightweight markdown renderer used by AI chat surfaces.
 *
 * Originally inline in `AiAdvisorPanel.tsx`; extracted per task AI-FE-5 so it
 * can also be reused by `pages/ai-chat/ChatPanel.tsx` (and any other AI surface
 * that needs to render assistant replies).
 *
 * Supports: ``` fenced code blocks, `inline code`, **bold**, *italic*,
 * `## h2` / `### h3`, `- item` / `* item` lists, `1. item` ordered lists, and
 * paragraph / line breaks. No external dependency — keeps the bundle small.
 */

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderMarkdown(text: string): string {
  return (
    text
      .replace(
        /```[\s\S]*?```/g,
        (m) =>
          `<pre class="bg-muted rounded p-2 text-xs overflow-x-auto my-2 border"><code>${escapeHtml(m.slice(3, -3).replace(/^\w+\n/, ""))}</code></pre>`,
      )
      .replace(
        /`([^`]+)`/g,
        '<code class="bg-muted px-1 rounded text-xs font-mono">$1</code>',
      )
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/^### (.+)$/gm, '<h3 class="font-semibold text-sm mt-3 mb-1">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="font-semibold text-base mt-3 mb-1">$1</h2>')
      .replace(/^[-*] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
      .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
      .replace(/\n\n/g, '</p><p class="mb-2">')
      .replace(/\n/g, "<br/>")
  );
}

export interface MarkdownContentProps {
  text: string;
  /** Extra classes appended to the root wrapper. */
  className?: string;
}

export function MarkdownContent({ text, className }: MarkdownContentProps) {
  return (
    <div
      className={`prose-sm text-sm leading-relaxed [&_p]:mb-2 [&_li]:my-0.5${className ? ` ${className}` : ""}`}
      dangerouslySetInnerHTML={{
        __html: `<p class="mb-2">${renderMarkdown(text)}</p>`,
      }}
    />
  );
}
