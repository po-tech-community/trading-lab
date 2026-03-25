/**
 * Date helper utilities for converting between date formats.
 *
 * We use epoch milliseconds (number) as the standard date format
 * throughout the backtest engine because:
 * - It is a plain number — easy to sort, compare, and do math on
 * - No string parsing needed in the calculation engine
 * - Works consistently across timezones when using UTC
 */

/**
 * Converts a date string (YYYY-MM-DD) to epoch milliseconds at UTC midnight.
 *
 * Example: '2025-01-01' → 1735689600000
 */
export function dateStringToEpochMs(dateString: string): number {
    return new Date(dateString + 'T00:00:00.000Z').getTime();
}

/**
 * Converts epoch milliseconds to a date string (YYYY-MM-DD) in UTC.
 *
 * Example: 1735689600000 → '2025-01-01'
 */
export function epochMsToDateString(epochMs: number): string {
    return new Date(epochMs).toISOString().split('T')[0];
}
