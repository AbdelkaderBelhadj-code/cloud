import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import api from '../lib/api'
import toast from 'react-hot-toast'
import {
    BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

const COLORS = {
    brand: '#6366f1',
    emerald: '#10b981',
    amber: '#f59e0b',
    red: '#ef4444',
    sky: '#0ea5e9',
    purple: '#a855f7',
    pink: '#ec4899',
    slate: '#64748b',
}

const PIE_COLORS = [COLORS.brand, COLORS.emerald, COLORS.amber, COLORS.sky, COLORS.purple, COLORS.pink]

const STATUS_COLORS = {
    active: COLORS.emerald,
    expired: COLORS.red,
    pending: COLORS.amber,
    inactive: COLORS.slate,
    maintenance: COLORS.amber,
}

function KpiCard({ label, value, sub, icon, color = 'brand' }) {
    const colorMap = {
        brand: 'from-brand-600/20 to-brand-800/10 border-brand-500/30',
        emerald: 'from-emerald-600/20 to-emerald-800/10 border-emerald-500/30',
        amber: 'from-amber-600/20 to-amber-800/10 border-amber-500/30',
        red: 'from-red-600/20 to-red-800/10 border-red-500/30',
        sky: 'from-sky-600/20 to-sky-800/10 border-sky-500/30',
        purple: 'from-purple-600/20 to-purple-800/10 border-purple-500/30',
    }
    const textMap = {
        brand: 'text-brand-400',
        emerald: 'text-emerald-400',
        amber: 'text-amber-400',
        red: 'text-red-400',
        sky: 'text-sky-400',
        purple: 'text-purple-400',
    }

    return (
        <div className={`stat-card bg-gradient-to-br ${colorMap[color]} border`}>
            <div className="flex items-center justify-between">
                <span className="text-2xl">{icon}</span>
                {sub && <span className={`text-xs font-medium ${textMap[color]}`}>{sub}</span>}
            </div>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            <p className="text-sm text-slate-400">{label}</p>
        </div>
    )
}

function ChartCard({ title, children, className = '' }) {
    return (
        <div className={`glass-card p-5 ${className}`}>
            <h3 className="text-sm font-semibold text-slate-300 mb-4">{title}</h3>
            {children}
        </div>
    )
}

function useChartTheme() {
    const { theme } = useTheme()
    return {
        grid: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
        axis: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        tick: theme === 'dark' ? '#94a3b8' : '#64748b',
        tooltipBg: theme === 'dark' ? '#1e293b' : '#ffffff',
        tooltipBorder: theme === 'dark' ? '#334155' : '#e2e8f0',
        tooltipText: theme === 'dark' ? '#94a3b8' : '#64748b',
    }
}

function CustomTooltip({ active, payload, label }) {
    const ct = useChartTheme()
    if (!active || !payload?.length) return null
    return (
        <div style={{ background: ct.tooltipBg, border: `1px solid ${ct.tooltipBorder}` }} className="rounded-xl px-4 py-3 shadow-xl">
            <p className="text-xs mb-1" style={{ color: ct.tooltipText }}>{label}</p>
            {payload.map((entry, i) => (
                <p key={i} className="text-sm font-medium" style={{ color: entry.color }}>
                    {entry.name}: {entry.value}
                </p>
            ))}
        </div>
    )
}

function PieTooltip({ active, payload }) {
    const ct = useChartTheme()
    if (!active || !payload?.length) return null
    const d = payload[0]
    return (
        <div style={{ background: ct.tooltipBg, border: `1px solid ${ct.tooltipBorder}` }} className="rounded-xl px-4 py-3 shadow-xl">
            <p className="text-sm font-medium" style={{ color: d.payload.fill }}>
                {d.name}: {d.value}
            </p>
        </div>
    )
}

function StatusDot({ color }) {
    return <span className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: color }} />
}

export default function DashboardStats() {
    const ct = useChartTheme()
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get('/stats')
                setStats(data)
            } catch {
                toast.error('Erreur lors du chargement des statistiques')
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="text-center">
                    <svg className="animate-spin h-10 w-10 text-brand-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <p className="text-slate-400 text-sm">Chargement des statistiques...</p>
                </div>
            </div>
        )
    }

    if (!stats) {
        return (
            <div className="text-center py-20">
                <p className="text-slate-400">Impossible de charger les statistiques</p>
            </div>
        )
    }

    const { overview, equipment, licenses, costs, upcomingRenewals, recent } = stats

    const formatCurrency = (val) => {
        if (val == null || isNaN(val)) return '0 EUR'
        return val.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 })
    }

    const getDaysUntilExpiry = (date) => {
        const diff = new Date(date) - new Date()
        return Math.ceil(diff / (1000 * 60 * 60 * 24))
    }

    const getDaysColor = (days) => {
        if (days < 0) return 'text-red-400'
        if (days <= 7) return 'text-red-400'
        if (days <= 30) return 'text-amber-400'
        return 'text-emerald-400'
    }

    return (
        <div className="space-y-6">
            {/* KPI Cards Row */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <KpiCard
                    icon="🖥️"
                    value={overview.totalEquipment}
                    label="Equipements"
                    color="brand"
                />
                <KpiCard
                    icon="🗝️"
                    value={overview.totalLicenses}
                    label="Licences"
                    color="sky"
                />
                <KpiCard
                    icon="⚠️"
                    value={licenses.expiringThisWeek}
                    label="Expire cette semaine"
                    color="amber"
                    sub="7 jours"
                />
                <KpiCard
                    icon="📅"
                    value={licenses.expiringThisMonth}
                    label="Expire ce mois"
                    color="purple"
                    sub="30 jours"
                />
                <KpiCard
                    icon="🚫"
                    value={licenses.expired}
                    label="Licences Expirees"
                    color="red"
                />
                <KpiCard
                    icon="💰"
                    value={formatCurrency(costs.totalSpend)}
                    label="Depenses Totales"
                    color="emerald"
                />
            </div>

            {/* Charts Row 1: Equipment by Type + License Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Equipements par Type">
                    {equipment.byType.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={equipment.byType} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fill: ct.tick, fontSize: 12 }}
                                    axisLine={{ stroke: ct.axis }}
                                />
                                <YAxis
                                    tick={{ fill: ct.tick, fontSize: 12 }}
                                    axisLine={{ stroke: ct.axis }}
                                    allowDecimals={false}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="value" name="Quantite" radius={[8, 8, 0, 0]}>
                                    {equipment.byType.map((_, i) => (
                                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-slate-500 text-sm text-center py-10">Aucune donnee</p>
                    )}
                </ChartCard>

                <ChartCard title="Statut des Licences">
                    {licenses.byStatus.length > 0 ? (
                        <div className="flex items-center gap-6">
                            <ResponsiveContainer width="60%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={licenses.byStatus}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {licenses.byStatus.map((entry, i) => (
                                            <Cell
                                                key={i}
                                                fill={STATUS_COLORS[entry.name] || PIE_COLORS[i % PIE_COLORS.length]}
                                                stroke="transparent"
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<PieTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex-1 space-y-3">
                                {licenses.byStatus.map((entry, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <StatusDot color={STATUS_COLORS[entry.name] || PIE_COLORS[i]} />
                                            <span className="text-sm text-slate-300 capitalize">{entry.name}</span>
                                        </div>
                                        <span className="text-sm font-bold">{entry.value}</span>
                                    </div>
                                ))}
                                <div className="pt-2 border-t border-dark-600">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-500">Total</span>
                                        <span className="text-sm font-bold text-brand-400">{overview.totalLicenses}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-slate-500 text-sm text-center py-10">Aucune donnee</p>
                    )}
                </ChartCard>
            </div>

            {/* Charts Row 2: Expirations by Month + Costs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Expirations a Venir (12 mois)">
                    {licenses.expirationsByMonth.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={licenses.expirationsByMonth} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="gradientCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={COLORS.brand} stopOpacity={0.4} />
                                        <stop offset="100%" stopColor={COLORS.brand} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fill: ct.tick, fontSize: 11 }}
                                    axisLine={{ stroke: ct.axis }}
                                />
                                <YAxis
                                    tick={{ fill: ct.tick, fontSize: 12 }}
                                    axisLine={{ stroke: ct.axis }}
                                    allowDecimals={false}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    name="Licences"
                                    stroke={COLORS.brand}
                                    fill="url(#gradientCount)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-slate-500 text-sm text-center py-10">Aucune expiration a venir</p>
                    )}
                </ChartCard>

                <ChartCard title="Cout des Renouvellements par Mois">
                    {licenses.expirationsByMonth.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={licenses.expirationsByMonth} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fill: ct.tick, fontSize: 11 }}
                                    axisLine={{ stroke: ct.axis }}
                                />
                                <YAxis
                                    tick={{ fill: ct.tick, fontSize: 12 }}
                                    axisLine={{ stroke: ct.axis }}
                                    tickFormatter={(v) => `${v} EUR`}
                                />
                                <Tooltip
                                    content={({ active, payload, label }) => {
                                        if (!active || !payload?.length) return null
                                        return (
                                            <div style={{ background: ct.tooltipBg, border: `1px solid ${ct.tooltipBorder}` }} className="rounded-xl px-4 py-3 shadow-xl">
                                                <p className="text-xs mb-1" style={{ color: ct.tooltipText }}>{label}</p>
                                                <p className="text-sm font-medium text-emerald-400">
                                                    {payload[0].value.toLocaleString('fr-FR')} EUR
                                                </p>
                                            </div>
                                        )
                                    }}
                                />
                                <Bar dataKey="cost" name="Cout" radius={[8, 8, 0, 0]} fill={COLORS.emerald} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-slate-500 text-sm text-center py-10">Aucune donnee de cout</p>
                    )}
                </ChartCard>
            </div>

            {/* Cost Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="stat-card bg-gradient-to-br from-emerald-600/10 to-emerald-900/5 border border-emerald-500/20">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Depenses Totales</p>
                    <p className="text-2xl font-bold text-emerald-400">{formatCurrency(costs.totalSpend)}</p>
                    <p className="text-xs text-slate-500">{overview.totalLicenses} licence(s) au total</p>
                </div>
                <div className="stat-card bg-gradient-to-br from-amber-600/10 to-amber-900/5 border border-amber-500/20">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Renouvellements a Venir</p>
                    <p className="text-2xl font-bold text-amber-400">{formatCurrency(costs.upcomingRenewalCost)}</p>
                    <p className="text-xs text-slate-500">Dans les 90 prochains jours</p>
                </div>
                <div className="stat-card bg-gradient-to-br from-sky-600/10 to-sky-900/5 border border-sky-500/20">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Cout Moyen / Licence</p>
                    <p className="text-2xl font-bold text-sky-400">{formatCurrency(costs.averageCost)}</p>
                    <p className="text-xs text-slate-500">{overview.totalSeats} siege(s) au total</p>
                </div>
            </div>

            {/* Bottom Row: Upcoming Renewals Table + Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Renewals */}
                <ChartCard title="Prochains Renouvellements">
                    {upcomingRenewals.length > 0 ? (
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Licence</th>
                                        <th>Equipement</th>
                                        <th>Expiration</th>
                                        <th>Cout</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {upcomingRenewals.map((lic) => {
                                        const days = getDaysUntilExpiry(lic.expirationDate)
                                        return (
                                            <tr key={lic._id}>
                                                <td>
                                                    <p className="font-medium text-sm text-brand-300 truncate max-w-[160px]" title={lic.type}>{lic.type}</p>
                                                    <p className="text-xs text-slate-500">{lic.vendor}</p>
                                                </td>
                                                <td>
                                                    {lic.equipmentId
                                                        ? <code className="text-xs text-slate-400">{lic.equipmentId.serviceTag}</code>
                                                        : <span className="text-xs text-slate-600">--</span>}
                                                </td>
                                                <td>
                                                    <span className={`text-sm font-semibold ${getDaysColor(days)}`}>
                                                        {days}j
                                                    </span>
                                                </td>
                                                <td className="text-sm">
                                                    {lic.cost ? `${lic.cost.toLocaleString('fr-FR')} EUR` : '--'}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-slate-500 text-sm text-center py-8">Aucun renouvellement a venir</p>
                    )}
                </ChartCard>

                {/* Recent Activity */}
                <ChartCard title="Activite Recente">
                    <div className="space-y-4">
                        {recent.equipments.length > 0 && (
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Derniers Equipements</p>
                                <div className="space-y-2">
                                    {recent.equipments.map((eq) => (
                                        <div key={eq._id} className="flex items-center gap-3 p-2.5 rounded-lg bg-dark-700/40 border border-dark-600/30">
                                            <div className="w-8 h-8 rounded-lg bg-brand-600/20 border border-brand-500/30 flex items-center justify-center flex-shrink-0">
                                                <span className="text-xs">🖥️</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{eq.model}</p>
                                                <p className="text-xs text-slate-500">{eq.type} - {eq.serviceTag}</p>
                                            </div>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${eq.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>
                                                {eq.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {recent.licenses.length > 0 && (
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Dernieres Licences</p>
                                <div className="space-y-2">
                                    {recent.licenses.map((lic) => {
                                        const days = getDaysUntilExpiry(lic.expirationDate)
                                        return (
                                            <div key={lic._id} className="flex items-center gap-3 p-2.5 rounded-lg bg-dark-700/40 border border-dark-600/30">
                                                <div className="w-8 h-8 rounded-lg bg-sky-600/20 border border-sky-500/30 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-xs">🗝️</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{lic.type}</p>
                                                    <p className="text-xs text-slate-500">{lic.vendor || 'N/A'}</p>
                                                </div>
                                                <span className={`text-xs font-semibold ${getDaysColor(days)}`}>
                                                    {days > 0 ? `${days}j` : 'Expire'}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {recent.equipments.length === 0 && recent.licenses.length === 0 && (
                            <p className="text-slate-500 text-sm text-center py-8">Aucune activite recente</p>
                        )}
                    </div>
                </ChartCard>
            </div>
        </div>
    )
}
