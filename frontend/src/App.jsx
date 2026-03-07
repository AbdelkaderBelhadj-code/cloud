import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Toaster } from 'react-hot-toast'
import { selectAuth } from './store/authSlice'
import Login from './components/Login'
import Dashboard from './components/Dashboard'

function PrivateRoute({ children }) {
    const { isAuthenticated } = useSelector(selectAuth)
    return isAuthenticated ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
    const { isAuthenticated } = useSelector(selectAuth)
    return !isAuthenticated ? children : <Navigate to="/dashboard" replace />
}

export default function App() {
    return (
        <BrowserRouter>
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: '#1e293b',
                        color: '#e2e8f0',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        borderRadius: '12px',
                        fontSize: '14px',
                    },
                    success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
                    error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
                }}
            />
            <Routes>
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </BrowserRouter>
    )
}
