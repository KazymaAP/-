// ============================================================
// CONFIG - Environment variables for frontend
// ============================================================

/**
 * Validates a URL string
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates an email string (basic RFC 5322 compliant regex)
 */
function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email);
}

/**
 * Validates a phone number (basic E.164 format)
 */
function isValidPhone(phone) {
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
}

/**
 * Validates a Telegram username (alphanumeric + underscore, 5-32 chars)
 */
function isValidTelegramUsername(username) {
  const usernameRegex = /^[a-zA-Z0-9_]{5,32}$/;
  return usernameRegex.test(username);
}

/**
 * Validates a Twitter username (alphanumeric + underscore, 1-15 chars, optional @)
 */
function isValidTwitterUsername(username) {
  const cleanUsername = username.startsWith('@') ? username.slice(1) : username;
  const usernameRegex = /^[a-zA-Z0-9_]{1,15}$/;
  return usernameRegex.test(cleanUsername);
}

/**
 * Gets environment variable with validation
 */
function getEnv(key, fallback, validator) {
  try {
    const value = import.meta.env[key];
    const result = value !== undefined && value !== '' ? value : fallback;
    
    if (validator && !validator(result)) {
      console.warn(`[Config] Invalid value for ${key}: "${result}". Using fallback.`);
      return fallback;
    }
    
    return result;
  } catch {
    return fallback;
  }
}

/**
 * Deep freezes an object (including nested objects and arrays)
 * Handles circular references and symbols
 */
function deepFreeze(obj, seen = new WeakSet()) {
  if (!obj || typeof obj !== 'object' || Object.isFrozen(obj)) {
    return obj;
  }
  
  if (seen.has(obj)) {
    return obj;
  }
  
  seen.add(obj);
  
  const props = [
    ...Object.getOwnPropertyNames(obj),
    ...Object.getOwnPropertySymbols(obj)
  ];
  
  for (const prop of props) {
    const value = obj[prop];
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value, seen);
    }
  }
  
  return Object.freeze(obj);
}

const config = deepFreeze({
  site: {
    url: getEnv('VITE_SITE_URL', 'https://nodeforge.dev', isValidUrl),
    name: getEnv('VITE_SITE_NAME', 'Nodeforge'),
  },
  telegram: {
    username: getEnv('VITE_TELEGRAM_USERNAME', 'nodeforge_dev', isValidTelegramUsername),
  },
  miniApps: {
    baseUrl: getEnv('VITE_MINI_APPS_BASE_URL', 'https://miniapps.nodeforge.dev', isValidUrl),
  },
  contact: {
    email: getEnv('VITE_CONTACT_EMAIL', 'nodeforge@proton.me', isValidEmail),
    phone: getEnv('VITE_CONTACT_PHONE', '+7-999-000-00-00', isValidPhone),
    telegram: getEnv('VITE_CONTACT_TELEGRAM', 'https://t.me/nodeforge_dev', isValidUrl),
  },
  social: {
    ogImage: getEnv('VITE_OG_IMAGE_URL', 'https://nodeforge.dev/og-image.svg', isValidUrl),
    twitter: getEnv('VITE_TWITTER_USERNAME', '@nodeforge_dev', isValidTwitterUsername),
  }
});

export default config;