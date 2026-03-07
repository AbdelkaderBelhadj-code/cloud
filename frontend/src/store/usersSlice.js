import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../lib/api'

export const fetchUsers = createAsyncThunk('users/fetchAll', async (_, { rejectWithValue }) => {
    try {
        const { data } = await api.get('/users')
        return data
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || 'Failed to fetch users')
    }
})

export const createUser = createAsyncThunk('users/create', async (userData, { rejectWithValue }) => {
    try {
        const { data } = await api.post('/users', userData)
        return data
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || 'Failed to create user')
    }
})

export const updateUser = createAsyncThunk('users/update', async ({ id, data: body }, { rejectWithValue }) => {
    try {
        const { data } = await api.put(`/users/${id}`, body)
        return data
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || 'Failed to update user')
    }
})

export const deleteUser = createAsyncThunk('users/delete', async (id, { rejectWithValue }) => {
    try {
        await api.delete(`/users/${id}`)
        return id
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || 'Failed to delete user')
    }
})

export const resetUserMfa = createAsyncThunk('users/resetMfa', async (id, { rejectWithValue }) => {
    try {
        const { data } = await api.post(`/users/${id}/reset-mfa`)
        return { id, ...data }
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || 'Failed to reset MFA')
    }
})

const usersSlice = createSlice({
    name: 'users',
    initialState: {
        list: [],
        loading: false,
        error: null,
        mfaReset: null,
    },
    reducers: {
        clearMfaReset: (state) => { state.mfaReset = null },
        clearError: (state) => { state.error = null },
    },
    extraReducers: (builder) => {
        builder
            // fetchUsers
            .addCase(fetchUsers.pending, (state) => { state.loading = true; state.error = null })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.loading = false; state.list = action.payload
            })
            .addCase(fetchUsers.rejected, (state, action) => {
                state.loading = false; state.error = action.payload
            })
            // createUser
            .addCase(createUser.pending, (state) => { state.loading = true })
            .addCase(createUser.fulfilled, (state, action) => {
                state.loading = false
                state.list.unshift(action.payload.user)
                state.mfaReset = { mfaQr: action.payload.mfaQr, mfaSecret: action.payload.mfaSecret }
            })
            .addCase(createUser.rejected, (state, action) => {
                state.loading = false; state.error = action.payload
            })
            // updateUser
            .addCase(updateUser.pending, (state) => { state.loading = true })
            .addCase(updateUser.fulfilled, (state, action) => {
                state.loading = false
                const idx = state.list.findIndex((u) => u._id === action.payload._id)
                if (idx !== -1) state.list[idx] = action.payload
            })
            .addCase(updateUser.rejected, (state, action) => {
                state.loading = false; state.error = action.payload
            })
            // deleteUser
            .addCase(deleteUser.pending, (state) => { state.loading = true })
            .addCase(deleteUser.fulfilled, (state, action) => {
                state.loading = false
                state.list = state.list.filter((u) => u._id !== action.payload)
            })
            .addCase(deleteUser.rejected, (state, action) => {
                state.loading = false; state.error = action.payload
            })
            // resetMfa
            .addCase(resetUserMfa.fulfilled, (state, action) => {
                state.mfaReset = { mfaQr: action.payload.mfaQr, mfaSecret: action.payload.mfaSecret }
            })
    },
})

export const { clearMfaReset, clearError } = usersSlice.actions
export const selectUsers = (state) => state.users
export default usersSlice.reducer
