import { toast } from 'sonner';

/**
 * Extracts a readable error string from an error or response object.
 */
export function extractErrorMessage(error, fallback = 'An unexpected error occurred') {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  if (typeof error.message === 'string' && error.message !== '[object Object]') {
    return error.message;
  }
  if (typeof error.data?.error === 'string') return error.data.error;
  if (typeof error.data?.error?.message === 'string') return error.data.error.message;
  if (typeof error.data?.message === 'string') return error.data.message;
  if (Array.isArray(error.data?.errors) && error.data.errors.length > 0) {
    return error.data.errors
      .map((e) => (typeof e === 'string' ? e : e.msg || e.message || JSON.stringify(e)))
      .join(', ');
  }
  return fallback;
}

/**
 * Extracts a readable success string from a response object or fallback.
 */
export function extractSuccessMessage(data, fallback = 'Operation completed successfully') {
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (typeof data.message === 'string') return data.message;
  return fallback;
}

/**
 * Tracks a Promise or async operation with three distinct toast states:
 * 1. pending (loading)
 * 2. fulfilled (success)
 * 3. rejected (error)
 *
 * @param {Promise|Function} promiseOrFn - The promise or async function to track.
 * @param {Object} options - Configuration for loading, success, and error messages.
 * @param {string} options.loading - Loading message during pending state.
 * @param {string|Function} options.success - Success message or callback function (data) => string.
 * @param {string|Function} options.error - Error message or callback function (error) => string.
 * @returns {Promise} The original promise result.
 */
export function toastPromise(promiseOrFn, {
  loading = 'Processing...',
  success = 'Operation successful',
  error = 'Operation failed',
  ...sonnerOptions
} = {}) {
  const promise = typeof promiseOrFn === 'function' ? promiseOrFn() : promiseOrFn;

  return toast.promise(promise, {
    loading,
    success: (data) => {
      if (typeof success === 'function') {
        return success(data) || extractSuccessMessage(data, 'Operation successful');
      }
      return extractSuccessMessage(data, success);
    },
    error: (err) => {
      if (typeof error === 'function') {
        return error(err) || extractErrorMessage(err, 'Operation failed');
      }
      return extractErrorMessage(err, error);
    },
    ...sonnerOptions,
  });
}

/**
 * Enhanced notification facade combining sonner primitives with smart message extractors.
 */
export const notify = {
  loading: (msg, opts) => toast.loading(msg, opts),
  success: (msg, opts) => toast.success(extractSuccessMessage(msg), opts),
  error: (err, opts) => toast.error(extractErrorMessage(err), opts),
  info: (msg, opts) => toast.info(msg, opts),
  warning: (msg, opts) => toast.warning(msg, opts),
  promise: toastPromise,
  dismiss: (id) => toast.dismiss(id),
};

export { toast };
export default notify;
