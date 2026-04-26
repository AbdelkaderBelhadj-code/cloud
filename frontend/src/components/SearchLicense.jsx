import { useState, useEffect, useCallback } from 'react'
import api from '../lib/api'
import toast from 'react-hot-toast'

export default function SearchLicense() {
    const [licenses, setLicenses] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('')

    useEffect(() => {
        api.get('/categories').then(({ data }) => setCategories(data)).catch(() => {})
    }, [])

    const fetchList = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (search) params.set('search', search)
            if (statusFilter) params.set('status', statusFilter)
            if (categoryFilter) params.set('category', categoryFilter)
            const { data } = await api.get(`/search/license?${params}`)
            setLicenses(data.licenses)
        } catch (err) {
            toast.error('Erreur de chargement')
        } finally {
            setLoading(false)
        }
    }, [search, statusFilter, categoryFilter])

    useEffect(() => { fetchList() }, [fetchList])

    const getDaysColor = (days) => {
        if (days < 0) return 'text-red-400'
        if (days <= 30) return 'text-amber-400'
        return 'text-emerald-400'
    }

    const getStatusBadge = (status) => {
        const cls = { active: 'badge-active', expired: 'badge-expired', pending: 'badge-pending' }
        return <span className={cls[status] || 'badge-user'}>{status}</span>
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1">
                    <h2 className="text-lg font-semibold flex items-center gap-2">📄 Rechercher une Licence</h2>
                    <p className="text-slate-400 text-sm">{licenses.length} licence(s)</p>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-card p-4 flex flex-wrap gap-3">
                <input
                    type="text"
                    placeholder="Rechercher (type, vendor, clé...)"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="form-input flex-1 min-w-48"
                />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="form-input w-44"
                >
                    <option value="">Tous statuts</option>
                    <option value="active">Active</option>
                    <option value="expired">Expirée</option>
                    <option value="pending">En attente</option>
                </select>
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="form-input w-52"
                >
                    <option value="">Toutes catégories</option>
                    {categories.map((c) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="glass-card overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <svg className="animate-spin h-8 w-8 text-brand-400" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    </div>
                ) : licenses.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-4xl mb-3">🔍</p>
                        <p className="text-slate-400">Aucune licence trouvée</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Catégorie</th>
                                    <th>Vendor</th>
                                    <th>Équipement</th>
                                    <th>Expiration</th>
                                    <th>Jours</th>
                                    <th>Coût</th>
                                    <th>Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {licenses.map((lic) => (
                                    <tr key={lic._id}>
                                        <td className="font-medium text-brand-300">{lic.type}</td>
                                        <td>{lic.category?.name || '—'}</td>
                                        <td>{lic.vendor || '—'}</td>
                                        <td>
                                            {lic.equipmentId
                                                ? <span className="font-mono text-xs text-brand-300">{lic.equipmentId.serviceTag}</span>
                                                : '—'}
                                        </td>
                                        <td>{new Date(lic.expirationDate).toLocaleDateString('fr-FR')}</td>
                                        <td className={`font-semibold ${getDaysColor(lic.daysUntilExpiry)}`}>
                                            {lic.daysUntilExpiry > 0 ? `${lic.daysUntilExpiry}j` : 'Expiré'}
                                        </td>
                                        <td>{lic.cost ? `${lic.cost.toLocaleString('fr-FR')} €` : '—'}</td>
                                        <td>{getStatusBadge(lic.status)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
