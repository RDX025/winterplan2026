const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args) => {
    if (isDev) console.log(...args);
    if (typeof window !== 'undefined' && window.__debugLog) window.__debugLog(...args);
  },
  warn: (...args) => {
    if (isDev) console.warn(...args);
    if (typeof window !== 'undefined' && window.__debugLog) window.__debugLog('⚠️', ...args);
  },
  error: (...args) => {
    if (isDev) console.error(...args);
    if (typeof window !== 'undefined' && window.__debugLog) window.__debugLog('❌', ...args);
  }
};
