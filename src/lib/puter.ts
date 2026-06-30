import puter from '@heyputer/puter.js';

const puterAppId = import.meta.env.VITE_PUTER_APP_ID || 'legalease-helpdesk';

try {
  puter.setAppID(puterAppId);
} catch (error) {
  console.warn('Puter initialization warning:', error);
}

export default puter;
