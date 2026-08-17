import HttpError from './http-error.js';

export default class UnauthorizedError extends HttpError {
  constructor(message) {
    super(401, message);
  }
}
