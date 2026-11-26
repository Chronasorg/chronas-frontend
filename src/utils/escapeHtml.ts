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

/**
 * The value is typed `unknown` on purpose: these names come from the API, and
 * a malformed record (a number, null, an object) must not throw while the
 * timeline renders. A number is shown as text; anything else that is not a
 * string becomes ''.
 */
export function escapeHtml(value: unknown): string {
  let text = '';
  if (typeof value === 'string') text = value;
  else if (typeof value === 'number' && Number.isFinite(value)) text = String(value);
  return text.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);
}
