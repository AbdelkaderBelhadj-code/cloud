import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { selectAuth, selectIsAdmin, logout } from '../store/authSlice'
import { useTheme } from '../context/ThemeContext'
import toast from 'react-hot-toast'

import GlobalSearch from './GlobalSearch'
import DashboardStats from './DashboardStats'
import SearchEquip from './SearchEquip'
import SearchLicense from './SearchLicense'
import ManageEquipments from './ManageEquipments'
import ManageLicenses from './ManageLicenses'
import ExportPanel from './ExportPanel'
import AdminUsers from './AdminUsers'
import AdminCategories from './AdminCategories'

const TABS = [
    { id: 'stats', label: '📊 Tableau de Bord', icon: '📊' },
    { id: 'search-equip', label: '🔍 Chercher Équipement', icon: '🖥️' },
    { id: 'search-license', label: '🔍 Chercher Licence', icon: '📄' },
    { id: 'export', label: '📤 Export & Email', icon: '📤' },
]

const ADMIN_TABS = [
    { id: 'manage-equip', label: '⚙️ Gérer Équipements', icon: '🔧', adminOnly: true },
    { id: 'manage-license', label: '⚙️ Gérer Licences', icon: '🗝️', adminOnly: true },
    { id: 'admin-categories', label: '🏷️ Catégories Licences', icon: '🏷️', adminOnly: true },
    { id: 'admin-users', label: '👥 Gestion Utilisateurs', icon: '👥', adminOnly: true },
]

const ADMIN_TAB_IDS = new Set(ADMIN_TABS.map((t) => t.id))

export default function Dashboard() {
    const dispatch = useDispatch()
    const { user } = useSelector(selectAuth)
    const isAdmin = useSelector(selectIsAdmin)
    const { theme, toggleTheme } = useTheme()
    const [activeTab, setActiveTab] = useState('stats')
    const [sidebarOpen, setSidebarOpen] = useState(true)

    const allTabs = isAdmin ? [...TABS, ...ADMIN_TABS] : TABS

    const handleLogout = () => {
        dispatch(logout())
        toast.success('Déconnexion réussie')
    }

    const handleSearchNavigate = (type) => {
        if (type === 'equipment') setActiveTab(isAdmin ? 'manage-equip' : 'search-equip')
        else if (type === 'license') setActiveTab(isAdmin ? 'manage-license' : 'search-license')
    }

    // Guard: non-admins cannot land on an admin-only tab even if the id is set programmatically.
    const safeActiveTab = !isAdmin && ADMIN_TAB_IDS.has(activeTab) ? 'stats' : activeTab

    const renderTab = () => {
        switch (safeActiveTab) {
            case 'stats': return <DashboardStats />
            case 'search-equip': return <SearchEquip />
            case 'search-license': return <SearchLicense />
            case 'manage-equip': return isAdmin ? <ManageEquipments /> : null
            case 'manage-license': return isAdmin ? <ManageLicenses /> : null
            case 'export': return <ExportPanel />
            case 'admin-users': return isAdmin ? <AdminUsers /> : null
            case 'admin-categories': return isAdmin ? <AdminCategories /> : null
            default: return <DashboardStats />
        }
    }

    const activeTabLabel = allTabs.find((t) => t.id === activeTab)?.label || ''

    return (
        <div className="flex h-screen overflow-hidden">
            {/* ── Sidebar ────────────────────────────────────────────────────────── */}
            <aside className={`flex flex-col transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-16'} bg-dark-700/80 border-r border-dark-600 relative`}>
                {/* Logo */}
                <div className="p-4 border-b border-dark-600 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-600/30 border border-brand-500/40 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                    </div>
                    {sidebarOpen && (
                        <div>
                            <p className="font-bold text-sm text-gradient">LicenseMgmt</p>
                            <p className="text-xs text-slate-500">NextStep IT</p>
                        </div>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 py-4 overflow-y-auto">
                    {sidebarOpen && (
                        <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Navigation</p>
                    )}
                    <ul className="space-y-1 px-2">
                        {TABS.map((tab) => (
                            <li key={tab.id}>
                                <button
                                    onClick={() => setActiveTab(tab.id)}
                                    title={!sidebarOpen ? tab.label : undefined}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === tab.id ? 'tab-active' : 'tab-inactive'
                                        }`}
                                >
                                    <span className="text-base flex-shrink-0">{tab.icon}</span>
                                    {sidebarOpen && <span>{tab.label.replace(/^[^ ]+ /, '')}</span>}
                                </button>
                            </li>
                        ))}

                        {isAdmin && (
                            <>
                                {sidebarOpen && (
                                    <li className="pt-4 pb-1">
                                        <p className="px-1 text-xs font-semibold text-purple-400 uppercase tracking-wider">Administration</p>
                                    </li>
                                )}
                                {ADMIN_TABS.map((tab) => (
                                    <li key={tab.id}>
                                        <button
                                            onClick={() => setActiveTab(tab.id)}
                                            title={!sidebarOpen ? tab.label : undefined}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === tab.id
                                                    ? 'bg-purple-600 text-white shadow-lg'
                                                    : 'text-purple-400 hover:text-purple-200 hover:bg-purple-600/20'
                                                }`}
                                        >
                                            <span className="text-base flex-shrink-0">{tab.icon}</span>
                                            {sidebarOpen && <span>{tab.label.replace(/^[^ ]+ /, '')}</span>}
                                        </button>
                                    </li>
                                ))}
                            </>
                        )}
                    </ul>
                </nav>

                {/* User info + logout */}
                <div className="p-3 border-t border-dark-600">
                    {sidebarOpen ? (
                        <div className="glass-card-light p-3 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-brand-600/30 border border-brand-500/40 flex items-center justify-center flex-shrink-0">
                                <span className="text-brand-300 text-sm font-bold">
                                    {user?.email?.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-slate-200 truncate">{user?.email}</p>
                                <span className={user?.role === 'admin' ? 'badge-admin' : 'badge-user'}>
                                    {user?.role}
                                </span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="text-slate-400 hover:text-red-400 transition-colors"
                                title="Déconnexion"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleLogout}
                            className="w-full flex justify-center p-2 text-slate-400 hover:text-red-400 transition-colors"
                            title="Déconnexion"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Toggle button */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-dark-600 border border-dark-600 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors z-10"
                >
                    {sidebarOpen ? '‹' : '›'}
                </button>
            </aside>

            {/* ── Main Content ───────────────────────────────────────────────────── */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Top bar */}
                <header className="flex items-center justify-between px-6 py-4 border-b border-dark-600 bg-dark-700/50 backdrop-blur-sm relative z-50">
                    <div>
                        <h1 className="text-lg font-semibold">{activeTabLabel.replace(/^[^\s]+ /, '')}</h1>
                        <nav className="text-xs text-slate-500 flex items-center gap-1">
                            <span>Dashboard</span>
                            <span>›</span>
                            <span className="text-brand-400">{activeTabLabel.replace(/^[^\s]+ /, '')}</span>
                        </nav>
                    </div>

                    <div className="flex items-center gap-4 flex-1 justify-end">
                        <GlobalSearch onNavigate={handleSearchNavigate} />
                        <button
                            onClick={toggleTheme}
                            className="flex-shrink-0 w-9 h-9 rounded-xl bg-dark-600 border border-dark-500 flex items-center justify-center
                                       text-slate-400 hover:text-slate-200 transition-all duration-200 hover:bg-dark-500"
                            title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
                        >
                            {theme === 'dark' ? (
                                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round"
                                        d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                                </svg>
                            ) : (
                                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round"
                                        d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                                </svg>
                            )}
                        </button>
                        <div className="text-right hidden sm:block flex-shrink-0">
                            <p className="text-xs text-slate-400">
                                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                        {isAdmin && (
                            <span className="badge-admin text-xs flex-shrink-0">Admin</span>
                        )}
                    </div>
                </header>

                {/* Panel */}
                <div className="flex-1 overflow-y-auto p-6">
                    {renderTab()}
                </div>
            </main>
        </div>
    )
}
