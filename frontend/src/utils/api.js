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