import { createSlice } from '@reduxjs/toolkit'

const stored = (() => {
    try {
        const t = localStorage.getItem('auth_token')
        const u = localStorage.getItem('auth_user')
        return t && u ? { token: t, user: JSON.parse(u) } : null
    } catch {
        return null
    }
})()

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        token: stored?.token || null,
        user: stored?.user || null,
        isAuthenticated: !!stored?.token,
    },
    reducers: {
        setCredentials: (state, action) => {
            const { token, user } = action.payload
            state.token = token
            state.user = user
            state.isAuthenticated = true
            localStorage.setItem('auth_token', token)
            localStorage.setItem('auth_user', JSON.stringify(user))
        },
        logout: (state) => {
            state.token = null
            state.user = null
            state.isAuthenticated = false
            localStorage.removeItem('auth_token')
            localStorage.removeItem('auth_user')
        },
        updateUser: (state, action) => {
            state.user = { ...state.user, ...action.payload }
            localStorage.setItem('auth_user', JSON.stringify(state.user))
        },
    },
})

export const { setCredentials, logout, updateUser } = authSlice.actions
export const selectAuth = (state) => state.auth
export const selectIsAdmin = (state) => state.auth.user?.role === 'admin'
export default authSlice.reducer
