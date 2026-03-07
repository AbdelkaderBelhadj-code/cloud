import axios from 'axios'
import { store } from '../store/store'
import { logout } from '../store/authSlice'

const api = axios.create({
    baseURL: '/api',
})

// Attach token
api.interceptors.request.use((config) => {
    const token = store.getState().auth.token
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Handle 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            store.dispatch(logout())
        }
        return Promise.reject(error)
    }
)

export default api
