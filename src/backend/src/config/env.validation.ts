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
  AI_PROVIDER: Joi.string().valid('openai', 'mock').default('mock'),
  OPENAI_TIMEOUT_MS: Joi.number().integer().min(1000).max(120000).default(20000),
  OPENAI_MAX_RETRIES: Joi.number().integer().min(0).max(5).default(2),
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

  if (value.NODE_ENV === 'production' && value.AI_PROVIDER === 'openai' && !value.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required when AI_PROVIDER=openai in production');
  }

  return value as Record<string, unknown>;
}
