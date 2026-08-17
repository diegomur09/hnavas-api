import { Router } from 'express';
import { getLeads, postLead, deleteLead } from '../controllers/leads.js';
import { validateCreateLead, validateLeadId } from '../middlewares/validation.js';

// Lead routes (already behind the auth middleware — see routes/index.js).
const router = Router();

router.get('/', getLeads);
router.post('/', validateCreateLead, postLead);
router.delete('/:_id', validateLeadId, deleteLead);

export default router;
