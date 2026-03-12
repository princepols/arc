/**
 * Arc AI - useAuth Hook
 * Manages authentication state globally.
 */

import { useState, useEffect } from 'react'
import { authAPI } from '../utils/api'

export function useAuth() {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session on load
  useEffect(() => {
    const token    = localStorage.getItem('arc_token')
    const username = localStorage.getItem('arc_username')
    const user_id  = localStorage.getItem('arc_user_id')
    if (token && username) {
      setUser({ token, username, user_id })
    }
    setLoading(false)
  }, [])

  const login = (data) => {
    localStorage.setItem('arc_token',    data.token)
    localStorage.setItem('arc_username', data.username)
    localStorage.setItem('arc_user_id',  data.user_id)
    setUser(data)
  }

  const logout = () => {
    localStorage.removeItem('arc_token')
    localStorage.removeItem('arc_username')
    localStorage.removeItem('arc_user_id')
    setUser(null)
  }

  return { user, loading, login, logout }
}
