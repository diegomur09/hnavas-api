import jwt from 'jsonwebtoken';
import { jwtSecret } from '../config.js';
import { MESSAGES } from '../constants.js';
import { UnauthorizedError } from '../errors/index.js';

// Authorization gate. Expects `Authorization: Bearer <token>`; on a valid
// signature, attaches { _id } as req.user and lets the request through.
// Everything behind this middleware can trust req.user.
export default function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    next(new UnauthorizedError(MESSAGES.AUTH_REQUIRED));
    return;
  }

  const token = header.replace('Bearer ', '');
  let payload;
  try {
    payload = jwt.verify(token, jwtSecret);
  } catch {
    next(new UnauthorizedError(MESSAGES.AUTH_REQUIRED));
    return;
  }

  req.user = payload; // { _id }
  next();
}
