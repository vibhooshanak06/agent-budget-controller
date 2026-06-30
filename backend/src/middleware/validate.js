'use strict';

/**
 * validate.js
 *
 * Reusable Zod validation middleware factory.
 * Validates req.body, req.query, or req.params against a Zod schema.
 * On success, the parsed (and coerced) data replaces the raw input.
 * On failure, an AppError is forwarded to the error handler.
 *
 * Usage:
 *   const { createTeamSchema } = require('../validations/team.validation');
 *   router.post('/', validate(createTeamSchema), teamController.create);
 */

const AppError = require('../utils/AppError');

/**
 * @param {import('zod').ZodSchema} schema  - Zod schema to validate against
 * @param {'body'|'query'|'params'}  source - Which part of req to validate
 */
const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);

  if (!result.success) {
    const details = result.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    return next(
      new AppError('Validation failed', 400, 'VALIDATION_ERROR', details),
    );
  }

  // Replace raw input with Zod-parsed (coerced + defaults applied) data
  req[source] = result.data;
  return next();
};

module.exports = validate;
