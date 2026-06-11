import { celebrate, Joi, Segments } from 'celebrate';

// Request validation schemas (celebrate/Joi). Requests that don't match are
// rejected with a 400 BEFORE reaching any controller or the database.

export const validateSignup = celebrate({
  [Segments.BODY]: Joi.object().keys({
    name: Joi.string().required().min(2).max(60),
    email: Joi.string().required().email(),
    password: Joi.string().required().min(8).max(128),
  }),
});

export const validateSignin = celebrate({
  [Segments.BODY]: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required(),
  }),
});

export const validateCreateLead = celebrate({
  [Segments.BODY]: Joi.object().keys({
    name: Joi.string().required().min(2).max(120),
    email: Joi.string().required().email(),
    project: Joi.string().required().min(2).max(2000),
    locale: Joi.string().valid('en', 'es').default('en'),
  }),
});

export const validateLeadId = celebrate({
  [Segments.PARAMS]: Joi.object().keys({
    _id: Joi.string().required().uuid(),
  }),
});

// Public site endpoints (no auth, but still schema-validated).

export const validateChat = celebrate({
  [Segments.BODY]: Joi.object().keys({
    messages: Joi.array().required().min(1).items(Joi.object().keys({
      role: Joi.string().required().valid('user', 'assistant'),
      content: Joi.string().required().allow('').max(4000),
    })),
    locale: Joi.string().valid('en', 'es').default('en'),
    visitorId: Joi.string().max(100),
  }),
});

export const validateContact = celebrate({
  [Segments.BODY]: Joi.object().keys({
    name: Joi.string().required().min(2).max(120),
    email: Joi.string().required().email().max(200),
    project: Joi.string().required().min(2).max(2000),
    locale: Joi.string().valid('en', 'es').default('en'),
  }),
});
