import { MESSAGES } from '../constants.js';

// Centralized error handler — the single place that turns errors into HTTP
// responses. Known errors (our HttpError subclasses) keep their status and
// message; anything unexpected is logged server-side and answered with a
// generic 500 so raw Node/DynamoDB errors never leak to the client.
export default function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode ?? 500;
  const message = statusCode === 500 ? MESSAGES.SERVER_ERROR : err.message;

  if (statusCode === 500) {
    console.error('unhandled error:', err);
  }

  res.status(statusCode).json({ error: message });
  next();
}
