// src/utils/image.js
import { BASE_URL } from '../services/api'

export const DEFAULT_SCHOOL_IMAGE = 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80'
export const DEFAULT_AVATAR_IMAGE = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80'

/**
 * Resolve any image URL (relative path, localhost URL, or plain filename) into a valid absolute URL for React Native.
 */
export function resolveImageUrl(url, defaultFallback = DEFAULT_SCHOOL_IMAGE) {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return defaultFallback
  }

  const cleanUrl = url.trim()

  // Replace localhost or 127.0.0.1 with BASE_URL
  if (cleanUrl.startsWith('http://localhost:8080') || cleanUrl.startsWith('http://127.0.0.1:8080')) {
    return cleanUrl.replace(/^http:\/\/(localhost|127\.0\.0\.1):8080/, BASE_URL)
  }

  // Prepend BASE_URL for relative paths
  if (cleanUrl.startsWith('/')) {
    return `${BASE_URL}${cleanUrl}`
  }

  // Prepend BASE_URL/api/images/ for plain filenames
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://') && !cleanUrl.startsWith('file://')) {
    return `${BASE_URL}/api/images/${cleanUrl}`
  }

  return cleanUrl
}
