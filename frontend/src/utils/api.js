/**
 * Arc AI - API Client v2
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

async function request(path, options = {}) {
  const token = localStorage.getItem('arc_token')
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Request failed')
  return data
}

export const authAPI = {
  sendOtp:  (body) => request('/auth/send-otp', { method: 'POST', body: JSON.stringify(body) }),
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login:    (body) => request('/auth/login',    { method: 'POST', body: JSON.stringify(body) }),
  me:       ()     => request('/auth/me'),
}

export const sessionsAPI = {
  list:    ()          => request('/sessions/'),
  create:  (title)     => request('/sessions/', { method: 'POST', body: JSON.stringify({ title }) }),
  delete:  (id)        => request(`/sessions/${id}`, { method: 'DELETE' }),
  search:  (q)         => request(`/sessions/search?q=${encodeURIComponent(q)}`),
  rename:  (id, title) => request(`/sessions/${id}/title`, { method: 'PATCH', body: JSON.stringify({ title }) }),
}

export const chatAPI = {
  getMessages: (sessionId)       => request(`/chat/${sessionId}`),
  send:        (sessionId, body) => request(`/chat/${sessionId}`, { method: 'POST', body: JSON.stringify(body) }),
}

export const uploadAPI = {
  upload: async (file) => {
    const token = localStorage.getItem('arc_token')
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${BASE_URL}/upload/`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: form,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || 'Upload failed')
    return data
  }
}

// ── Admin API ────────────────────────────────────────────────────────────────
function adminRequest(path, options = {}) {
  const token = sessionStorage.getItem('arc_admin_token')
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return fetch(`${BASE_URL}${path}`, { ...options, headers })
    .then(async res => {
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Request failed')
      return data
    })
}

export const adminAPI = {
  login:          (body)      => adminRequest('/admin/login', { method: 'POST', body: JSON.stringify(body) }),
  dashboard:      ()          => adminRequest('/admin/dashboard'),
  analytics:      ()          => adminRequest('/admin/analytics'),
  logs:           (type = '') => adminRequest(`/admin/logs?event_type=${type}&limit=200`),
  users:          (search='') => adminRequest(`/admin/users?search=${encodeURIComponent(search)}`),
  banUser:        (id, body)  => adminRequest(`/admin/users/${id}/ban`,            { method: 'POST',   body: JSON.stringify(body) }),
  unbanUser:      (id)        => adminRequest(`/admin/users/${id}/unban`,           { method: 'POST'  }),
  deleteUser:     (id)        => adminRequest(`/admin/users/${id}`,                 { method: 'DELETE'}),
  resetPassword:  (id, body)  => adminRequest(`/admin/users/${id}/reset-password`,  { method: 'POST',   body: JSON.stringify(body) }),
  conversations:  (uid='')    => adminRequest(`/admin/conversations${uid ? `?user_id=${uid}` : ''}`),
  getMessages:    (sid)       => adminRequest(`/admin/conversations/${sid}/messages`),
}