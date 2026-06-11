import HttpError from './http-error.js';

export default class NotFoundError extends HttpError {
  constructor(message) {
    super(404, message);
  }
}
