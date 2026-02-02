/**
 * Score Formatting Utility
 *
 * Formats numeric scores for display in badges and UI elements.
 * Uses abbreviated format for large numbers.
 *
 * Requirements: 5.5
 */

/**
 * Formats a score number for display in the badge.
 *
 * Formatting rules:
 * - Scores > 100,000 display as "Xm" (millions)
 * - Scores > 1,000 display as "Xk" (thousands)
 * - Smaller scores display as-is
 *
 * @param score - The numeric score to format
 * @returns The formatted score string
 *
 * @example
 * formatScore(500) // "500"
 * formatScore(1500) // "1k"
 * formatScore(150000) // "0m"
 * formatScore(1500000) // "1m"
 */
export function formatScore(score: number): string {
  if (score > 100000) {
    return `${String(Math.floor(score / 1000000))}m`;
  }
  if (score > 1000) {
    return `${String(Math.floor(score / 1000))}k`;
  }
  return String(score);
}
