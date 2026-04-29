/**
 * Utility function to merge classNames conditionally
 * Handles Tailwind CSS class merging and removes duplicates
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes
    .filter((cls) => cls && typeof cls === 'string')
    .join(' ')
    .trim()
}
