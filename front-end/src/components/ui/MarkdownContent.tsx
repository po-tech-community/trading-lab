/**
 * MarkdownContent — shared markdown renderer for AI messages.
 *
 * Extracted from AiAdvisorPanel (AI-FE-5) so ChatPanel and any future
 * surface can render AI responses consistently.
 *
 * Supports: bold, italic, headings (##/###), bullet + numbered lists,
 * inline code, fenced code blocks.
 */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderMarkdown(text: string): string {
  return text
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
    .replace(/\n/g, "<br/>");
}

interface MarkdownContentProps {
  text: string;
  className?: string;
}

export function MarkdownContent({ text, className }: MarkdownContentProps) {
  return (
    <div
      className={
        className ??
        "prose-sm text-sm leading-relaxed [&_p]:mb-2 [&_li]:my-0.5"
      }
      dangerouslySetInnerHTML={{
        __html: `<p class="mb-2">${renderMarkdown(text)}</p>`,
      }}
    />
  );
}