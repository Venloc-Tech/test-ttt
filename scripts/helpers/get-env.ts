/**
 * @param {string} [key] Env variable key
 * @param {boolean} [required] If the variable required
 * @returns {string} Env variable value
 */
export const getEnv = (key: string, required: boolean = true): string => {
  const value = process.env[key];

  if (required && !value) throw new Error(`Environment variable is missing: ${key}`);

  return value as string;
}