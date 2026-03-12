import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' },
})

// Inject JWT token into every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Redirect to login when token expires (401) — but never on auth endpoints themselves
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint = (error.config?.url as string | undefined)?.includes('/auth/')
    if (error.response?.status === 401 && !isAuthEndpoint && typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      document.cookie = 'auth_token=; path=/; SameSite=Strict; max-age=0'
      document.cookie = 'auth_role=; path=/; SameSite=Strict; max-age=0'
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
