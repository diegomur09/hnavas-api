import { Router } from 'express';
import { signup, signin } from '../controllers/users.js';
import { validateSignup, validateSignin } from '../middlewares/validation.js';
import auth from '../middlewares/auth.js';
import usersRouter from './users.js';
import leadsRouter from './leads.js';
import { NotFoundError } from '../errors/index.js';
import { MESSAGES } from '../constants.js';

const router = Router();

// Public: registration and login.
router.post('/signup', validateSignup, signup);
router.post('/signin', validateSignin, signin);

// Protected: everything under /users and /leads requires a valid JWT.
router.use('/users', auth, usersRouter);
router.use('/leads', auth, leadsRouter);

// Unknown route → uniform 404 through the centralized error handler.
router.use((req, res, next) => next(new NotFoundError(MESSAGES.NOT_FOUND)));

export default router;
