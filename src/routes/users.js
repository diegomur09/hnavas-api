import { Router } from 'express';
import { getCurrentUser } from '../controllers/users.js';

// User routes (already behind the auth middleware — see routes/index.js).
const router = Router();

router.get('/me', getCurrentUser);

export default router;
