/**
 * Arc AI - useProfile Hook
 * Manages user profile state: display name, avatar.
 * Persists to sessionStorage so it survives page refreshes within the tab.
 *
 * Returns: { profile, updateProfile }
 * profile = { displayName: string, avatar: string | null }
 *   avatar is a base64 data URL or null (falls back to initials)
 */

import { useState, useCallback } from 'react'

const STORAGE_KEY = 'arc_profile'

function loadProfile(username) {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (_) {}
  // Default: username as display name, no avatar
  return { displayName: username, avatar: null }
}

export function useProfile(username) {
  const [profile, setProfile] = useState(() => loadProfile(username))

  const updateProfile = useCallback((changes) => {
    setProfile(prev => {
      const next = { ...prev, ...changes }
      try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch (_) {}
      return next
    })
  }, [])

  return { profile, updateProfile }
}