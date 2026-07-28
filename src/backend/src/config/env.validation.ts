import * as Joi from 'joi';

const schema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(4000),
  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
  SUPABASE_URL: Joi.string().uri().required(),
  SUPABASE_PUBLISHABLE_KEY: Joi.string().min(20).required(),
  SUPABASE_SECRET_KEY: Joi.string().allow('').optional(),
  OPENAI_API_KEY: Joi.string().allow('').optional(),
  OPENAI_MODEL: Joi.string().default('gpt-5.6-luna'),
  AI_PROVIDER: Joi.string().valid('gemini', 'mock').default('gemini'),
  OPENAI_TIMEOUT_MS: Joi.number().integer().min(1000).max(120000).default(20000),
  OPENAI_MAX_RETRIES: Joi.number().integer().min(0).max(5).default(2),
  GEMINI_API_KEY: Joi.string().allow('').optional(),
  GEMINI_MODEL: Joi.string().default('gemini-3.1-flash-lite'),
  GEMINI_TIMEOUT_MS: Joi.number().integer().min(1000).max(120000).default(30000),
  FRONTEND_URL: Joi.string().uri().default('http://localhost:3000'),
  STRIPE_TEST_MODE: Joi.boolean().truthy('true').falsy('false').default(true),
  STRIPE_SECRET_KEY: Joi.string().allow('').optional(),
  STRIPE_WEBHOOK_SECRET: Joi.string().allow('').optional(),
  STRIPE_PORTAL_CONFIGURATION_ID: Joi.string().allow('').optional(),
});

export function validateEnvironment(config: Record<string, unknown>) {
  const { error, value } = schema.validate(config, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: false,
  });

  if (error) {
    throw new Error(`Environment validation failed: ${error.message}`);
  }

  if (value.NODE_ENV === 'production' && !value.SUPABASE_SECRET_KEY) {
    throw new Error('SUPABASE_SECRET_KEY is required in production');
  }

  if (value.NODE_ENV === 'production' && value.AI_PROVIDER === 'gemini' && !value.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is required when AI_PROVIDER=gemini in production');
  }

  if (value.NODE_ENV === 'production' && (!value.STRIPE_SECRET_KEY || !value.STRIPE_WEBHOOK_SECRET)) {
    throw new Error('STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET are required in production');
  }

  if (
    value.STRIPE_TEST_MODE &&
    value.STRIPE_SECRET_KEY &&
    !String(value.STRIPE_SECRET_KEY).startsWith('sk_test_')
  ) {
    throw new Error('STRIPE_TEST_MODE=true requires a Stripe sk_test_ secret key');
  }

  return value as Record<string, unknown>;
}
