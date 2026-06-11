import HttpError from './http-error.js';

export default class ConflictError extends HttpError {
  constructor(message) {
    super(409, message);
  }
}
