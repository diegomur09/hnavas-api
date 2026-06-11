// Application constants: response/error messages, kept out of the code paths
// so wording changes never touch logic (and stay consistent across routes).

export const MESSAGES = {
  AUTH_REQUIRED: 'Authorization required',
  INVALID_CREDENTIALS: 'Incorrect email or password',
  EMAIL_IN_USE: 'A user with this email already exists',
  USER_NOT_FOUND: 'User not found',
  LEAD_NOT_FOUND: 'Lead not found',
  FORBIDDEN_LEAD: 'You can only delete your own leads',
  NOT_FOUND: 'Requested resource not found',
  SERVER_ERROR: 'An error occurred on the server',
  RATE_LIMITED: 'Too many requests, please try again later',
};

export const ROLES = {
  ADMIN: 'admin',
  CLIENT: 'client',
};

export const LEAD_SOURCES = {
  AGENT: 'agent',
  CONTACT_FORM: 'contact-form',
  MANUAL: 'manual',
};
