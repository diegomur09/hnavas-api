import HttpError from './http-error.js';

export default class ForbiddenError extends HttpError {
  constructor(message) {
    super(403, message);
  }
}
