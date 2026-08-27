/**
 * Extracts a normalized field-to-error string dictionary from an API response object.
 * Handles formats:
 * - { errors: { name: "Menu item already exists with same name" } }
 * - { errors: { name: ["Error 1", "Error 2"] } }
 * - { errors: [{ field: "name", message: "..." }] }
 * - { errors: ["Error 1", "Error 2"] }
 * - { errors: "Error string" }
 *
 * @param {Object} res - API response object
 * @returns {Object} { [fieldName]: string }
 */
export const extractFieldErrors = (res) => {
  if (!res) return {};
  const errors = res.errors || res.error;
  if (!errors) return {};

  const fieldMap = {};

  if (Array.isArray(errors)) {
    errors.forEach((err, idx) => {
      if (typeof err === 'string') {
        fieldMap[`error_${idx}`] = err;
        if (!fieldMap.general) fieldMap.general = err;
      } else if (err && typeof err === 'object') {
        const key = err.field || err.param || err.path || err.key || `error_${idx}`;
        const msg = err.message || err.msg || err.error || JSON.stringify(err);
        fieldMap[key] = msg;
      }
    });
  } else if (typeof errors === 'object') {
    Object.entries(errors).forEach(([key, val]) => {
      if (typeof val === 'string') {
        fieldMap[key] = val;
      } else if (Array.isArray(val)) {
        const joined = val
          .filter(Boolean)
          .map((v) => (typeof v === 'object' ? v.message || JSON.stringify(v) : String(v)))
          .join(', ');
        if (joined) fieldMap[key] = joined;
      } else if (val && typeof val === 'object') {
        fieldMap[key] = val.message || val.msg || JSON.stringify(val);
      } else if (val !== null && val !== undefined) {
        fieldMap[key] = String(val);
      }
    });
  } else if (typeof errors === 'string') {
    fieldMap.general = errors;
  }

  return fieldMap;
};

/**
 * Gets the best user-facing error message to display in a toast notification.
 * Prioritizes specific field validation messages over generic "Validation failed" messages.
 *
 * @param {Object} res - API response object
 * @param {string} fallbackMsg - Default fallback message
 * @returns {string}
 */
export const getErrorMessage = (res, fallbackMsg = 'An error occurred.') => {
  if (!res) return fallbackMsg;

  const fieldErrors = extractFieldErrors(res);
  const errorValues = Object.values(fieldErrors).filter(Boolean);

  // If specific field errors exist, prioritize the specific error message
  if (errorValues.length > 0) {
    if (!res.message || res.message.toLowerCase().includes('validation') || res.message.toLowerCase().includes('failed')) {
      return errorValues[0];
    }
    return errorValues[0];
  }

  if (res.message && typeof res.message === 'string') {
    return res.message;
  }

  return fallbackMsg;
};
