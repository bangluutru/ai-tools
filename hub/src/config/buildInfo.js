export const buildVersion =
  typeof import.meta.env.VITE_APP_VERSION === 'string' && import.meta.env.VITE_APP_VERSION
    ? import.meta.env.VITE_APP_VERSION
    : 'local';
