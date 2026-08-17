import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  createUser, findUserByEmail, findUserById, toPublicUser,
} from '../db/users.js';
import {
  jwtSecret, adminEmail, TOKEN_TTL, BCRYPT_ROUNDS,
} from '../config.js';
import { MESSAGES, ROLES } from '../constants.js';
import { ConflictError, NotFoundError, UnauthorizedError } from '../errors/index.js';

// POST /signup — register. The password is bcrypt-hashed before it touches
// the database; the site owner's email gets the admin role automatically.
export async function signup(req, res, next) {
  try {
    const { name, email, password } = req.body;

    const existing = await findUserByEmail(email);
    if (existing) throw new ConflictError(MESSAGES.EMAIL_IN_USE);

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const role = email === adminEmail ? ROLES.ADMIN : ROLES.CLIENT;
    const user = await createUser({
      name, email, passwordHash, role,
    });

    res.status(201).json(toPublicUser(user));
  } catch (err) {
    next(err);
  }
}

// POST /signin — verify credentials, return a signed JWT. The same 401 is
// returned for "no such user" and "wrong password" so the response never
// reveals which emails are registered.
export async function signin(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);
    if (!user) throw new UnauthorizedError(MESSAGES.INVALID_CREDENTIALS);

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) throw new UnauthorizedError(MESSAGES.INVALID_CREDENTIALS);

    const token = jwt.sign({ _id: user._id }, jwtSecret, { expiresIn: TOKEN_TTL });
    res.json({ token });
  } catch (err) {
    next(err);
  }
}

// GET /users/me — the profile behind the token (used by the frontend to
// validate a stored session).
export async function getCurrentUser(req, res, next) {
  try {
    const user = await findUserById(req.user._id);
    if (!user) throw new NotFoundError(MESSAGES.USER_NOT_FOUND);
    res.json(toPublicUser(user));
  } catch (err) {
    next(err);
  }
}
