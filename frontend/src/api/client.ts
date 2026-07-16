import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

client.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// Refresh tokens are single-use and rotate on every call, so any two concurrent
// /auth/refresh calls against the same token are never both safe — one succeeds,
// one gets a hard "revoked" error. This app has two independent places that can
// trigger a refresh: AuthContext's mount-time session restore, and this file's own
// 401-retry logic below (for an access token that expired mid-session). Without
// coordination, those two could race each other's refresh calls. Sharing one
// in-flight promise here — used by both this interceptor AND authApi.refresh() —
// guarantees at most one real /auth/refresh request is ever in flight at a time,
// no matter which caller (or how many callers) ask for it concurrently.
let refreshPromise: Promise<string> | null = null

export function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${client.defaults.baseURL}/auth/refresh`, {}, { withCredentials: true, _isRefresh: true } as any)
      .then(({ data }) => {
        const unwrapped =
          data && typeof data === 'object' && 'success' in data && 'data' in data ? data.data : data
        const newToken: string = unwrapped.accessToken
        setAccessToken(newToken)
        return newToken
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

client.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
      response.data = response.data.data
    }
    return response
  },
  async (error) => {
    const originalRequest = error.config
    // A 401 from the login endpoint itself means "wrong credentials", not "session
    // expired" — it must reject normally so the login form can show an inline
    // error, not trigger a refresh attempt (which also 401s with no session yet)
    // followed by a hard window.location redirect that wipes the form's state.
    const isLoginRequest = typeof originalRequest.url === 'string' && originalRequest.url.includes('/auth/login')

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest._isRefresh && !isLoginRequest) {
      originalRequest._retry = true

      try {
        const newToken = await refreshAccessToken()
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return client(originalRequest)
      } catch (refreshError) {
        setAccessToken(null)
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)

export default client
