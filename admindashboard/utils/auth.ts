// Simple auth helper functions for client-side
export const setAuthToken = (token: string) => {
  // Set in localStorage for client-side access
  if (typeof window !== "undefined") {
    localStorage.setItem("auth-token", token)
  }

  // Also set cookie for server-side (middleware) access
  document.cookie = `auth-token=${token}; path=/; max-age=${60 * 60 * 24 * 7}` // 1 week
}

export const removeAuthToken = () => {
  // Remove from localStorage
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth-token")
  }

  // Also remove cookie
  document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
}

export const getAuthToken = () => {
  // Get from localStorage for client-side
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth-token")
  }
  return null
}

export const isAuthenticated = () => {
  return !!getAuthToken()
}
