export const apiOrigin = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
export const apiUrl = path => `${apiOrigin}${path}`
export const mediaUrl = path => typeof path === 'string' && path.startsWith('/') ? `${apiOrigin}${path}` : path
