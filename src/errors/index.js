// Custom API errors. Controllers throw these (or pass them to next()) and the
// centralized error handler maps them to HTTP responses — no status codes or
// res.json calls scattered through business logic. One class per file
// (airbnb max-classes-per-file); this index re-exports them for convenience.

export { default as HttpError } from './http-error.js';
export { default as BadRequestError } from './bad-request-error.js';
export { default as UnauthorizedError } from './unauthorized-error.js';
export { default as ForbiddenError } from './forbidden-error.js';
export { default as NotFoundError } from './not-found-error.js';
export { default as ConflictError } from './conflict-error.js';
