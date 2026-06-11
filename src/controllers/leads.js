import {
  createLead, deleteLeadById, findLeadById, listLeadsByOwner,
} from '../db/leads.js';
import { MESSAGES, LEAD_SOURCES } from '../constants.js';
import { ForbiddenError, NotFoundError } from '../errors/index.js';

// GET /leads — the authenticated user's leads, newest first. The owner-keyed
// query makes it impossible to receive anyone else's data.
export async function getLeads(req, res, next) {
  try {
    const leads = await listLeadsByOwner(req.user._id);
    res.json(leads);
  } catch (err) {
    next(err);
  }
}

// POST /leads — create a lead owned by the authenticated user.
export async function postLead(req, res, next) {
  try {
    const {
      name, email, project, locale,
    } = req.body;
    const lead = await createLead({
      owner: req.user._id,
      name,
      email,
      project,
      locale,
      source: LEAD_SOURCES.MANUAL,
    });
    res.status(201).json(lead);
  } catch (err) {
    next(err);
  }
}

// DELETE /leads/:_id — delete one of YOUR leads. Missing → 404; someone
// else's → 403 (never deleted).
export async function deleteLead(req, res, next) {
  try {
    const lead = await findLeadById(req.params._id);
    if (!lead) throw new NotFoundError(MESSAGES.LEAD_NOT_FOUND);
    if (lead.owner !== req.user._id) throw new ForbiddenError(MESSAGES.FORBIDDEN_LEAD);

    await deleteLeadById(lead._id);
    res.json(lead);
  } catch (err) {
    next(err);
  }
}
