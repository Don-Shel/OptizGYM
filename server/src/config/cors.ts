const LOCAL_FRONTEND_ORIGIN = 'http://localhost:8080';

// Both hostnames have been used by the deployed OptizGYM frontend. Keeping the
// aliases here prevents a Vercel hostname change from silently breaking the API
// while FRONTEND_URL is being updated on the hosting platform.
const PRODUCTION_FRONTEND_ALIASES = [
  'https://optibizgym.vercel.app',
  'https://optizgym.vercel.app',
];

export const getAllowedFrontendOrigins = (
  configuredOrigins = process.env.FRONTEND_URL,
  nodeEnv = process.env.NODE_ENV,
): string[] => {
  const configured = (configuredOrigins || LOCAL_FRONTEND_ORIGIN)
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);

  const productionAliases = nodeEnv === 'production'
    ? PRODUCTION_FRONTEND_ALIASES
    : [];

  return Array.from(new Set([...configured, ...productionAliases]));
};
