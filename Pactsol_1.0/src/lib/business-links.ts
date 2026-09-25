const portal = (import.meta.env.PUBLIC_PORTAL_ORIGIN || '').replace(/\/$/, '');
const software = (import.meta.env.PUBLIC_SOFTWARE_ORIGIN || '').replace(/\/$/, '');
export const links = { home: `${portal}/`, sourcing: `${portal}/sourcing/`, software: `${software}/software/`, quote: `${portal}/request-quote/`, supplier: `${portal}/supplier-registration/` };
