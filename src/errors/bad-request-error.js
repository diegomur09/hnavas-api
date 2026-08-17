import HttpError from './http-error.js';

export default class BadRequestError extends HttpError {
  constructor(message) {
    super(400, message);
  }
}
