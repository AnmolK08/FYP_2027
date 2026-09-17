/**
 * sleep.js — tiny async delay utility used by sync engines and retry logic.
 */

/**
 * Pause execution for `ms` milliseconds.
 * @param {number} ms
 * @returns {Promise<void>}
 */
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
