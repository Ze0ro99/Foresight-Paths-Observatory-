export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';

const MODEL_ID_PATTERN = /^gemini-[a-z0-9][a-z0-9._-]*$/i;

export function getGeminiModel(env = process.env) {
  const configured = typeof env.GEMINI_MODEL === 'string' ? env.GEMINI_MODEL.trim() : '';
  return configured && MODEL_ID_PATTERN.test(configured)
    ? configured
    : DEFAULT_GEMINI_MODEL;
}
