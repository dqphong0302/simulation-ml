// All browser suites share one endpoint; override for preview/CI with BASE_URL.
export const BASE_URL = (process.env.BASE_URL || 'http://127.0.0.1:5175').replace(/\/+$/, '');
