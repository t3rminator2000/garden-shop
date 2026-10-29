import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { authApi } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authApi.getSession())

  const login = useCallback(async (identifier, password) => {
    const s = await authApi.login(identifier, password)
    setUser(s)
    return s
  }, [])

  const register = useCallback(async (data) => {
    const s = await authApi.register(data)
    setUser(s)
    return s
  }, [])

  const logout = useCallback(() => {
    authApi.logout()
    setUser(null)
  }, [])

  const updateProfile = useCallback((key, data) => {
    setUser(authApi.saveProfile(key, data))
  }, [])

  const value = useMemo(
    () => ({ user, isAuth: Boolean(user), isAdmin: user?.role === 'admin', login, register, logout, updateProfile }),
    [user, login, register, logout, updateProfile],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth нужно вызывать внутри AuthProvider')
  return ctx
}
