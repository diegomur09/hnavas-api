// Base class for API errors: an Error that knows its HTTP status code. The
// centralized error handler uses statusCode to build the response.
export default class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}
