/**
 * Format Utilities
 *
 * Utility functions for formatting values for display.
 *
 * Requirements: 1.6 (Province Tooltip Population Display)
 */

/**
 * Formats a population number for display in tooltips and UI elements.
 *
 * Formatting rules:
 * - Population >= 1,000,000 displays as "X.XM" (millions with 1 decimal)
 * - Population >= 1,000 displays as "X.Xk" (thousands with 1 decimal)
 * - Population < 1,000 displays as-is
 * - Negative or invalid values return "0"
 *
 * Requirement 1.6: THE ProvinceTooltip SHALL display the province population
 * formatted as M (millions) or k (thousands).
 *
 * @param population - The population number to format
 * @returns The formatted population string
 *
 * @example
 * formatPopulation(500) // "500"
 * formatPopulation(1500) // "1.5k"
 * formatPopulation(1500000) // "1.5M"
 * formatPopulation(0) // "0"
 * formatPopulation(-100) // "0"
 */
export function formatPopulation(population: number): string {
  // Handle invalid inputs
  if (!Number.isFinite(population) || population < 0) {
    return '0';
  }

  // Millions (>= 1,000,000)
  if (population >= 1_000_000) {
    const millions = population / 1_000_000;
    // Use toFixed(1) for one decimal place, but remove trailing .0
    const formatted = millions.toFixed(1);
    return formatted.endsWith('.0')
      ? `${formatted.slice(0, -2)}M`
      : `${formatted}M`;
  }

  // Thousands (>= 1,000)
  if (population >= 1_000) {
    const thousands = population / 1_000;
    const formatted = thousands.toFixed(1);
    return formatted.endsWith('.0')
      ? `${formatted.slice(0, -2)}k`
      : `${formatted}k`;
  }

  // Raw value (< 1,000)
  return String(Math.floor(population));
}
