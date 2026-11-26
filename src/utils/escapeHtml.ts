/**
 * Escapes text for use inside HTML that a library renders as markup.
 *
 * vis-timeline renders item `content` and `title` as HTML. It filters them
 * with the xss library, but names that come from the API are plain text, so
 * they are escaped before they go into that markup (pentest V6, 2026-11).
 */
const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);
}
