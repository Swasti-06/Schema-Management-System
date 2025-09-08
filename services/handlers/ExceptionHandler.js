export default class ExceptionHandler {
  /**
   * Handles and formats errors
   * @param {Error|Object} err - error object or custom error
   * @returns {Object} structured error response
   */
  static handle(err) {
    // If it's already a structured error object
    if (err && err.error && err.details) {
      return {
        status: 400,
        error: err.error,
        details: err.details,
      };
    }

    // If it's a standard Error
    if (err instanceof Error) {
      return {
        status: 500,
        error: "InternalServerError",
        details: err.message || "An unexpected error occurred",
      };
    }

    // Fallback for unknown errors
    return {
      status: 500,
      error: "UnknownError",
      details: JSON.stringify(err),
    };
  }
}
