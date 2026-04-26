import { useState, useEffect, useCallback } from 'react'
import api from '../lib/api'
import toast from 'react-hot-toast'

const EQUIPMENT_TYPES = ['Serveur', 'Firewall', 'Baie stockage', 'Switch', 'Routeur']

export default function SearchEquip() {
    const [equipments, setEquipments] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState('')
    const [selected, setSelected] = useState(null)
    const [detailLoading, setDetailLoading] = useState(false)

    const fetchList = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (search) params.set('search', search)
            if (typeFilter) params.set('type', typeFilter)
            const { data } = await api.get(`/search/equip?${params}`)
            setEquipments(data.equipments)
        } catch (err) {
            toast.error('Erreur de chargement')
        } finally {
            setLoading(false)
        }
    }, [search, typeFilter])

    useEffect(() => { fetchList() }, [fetchList])

    const openDetail = async (eq) => {
        setDetailLoading(true)
        setSelected({ equipment: eq, licenses: [] })
        try {
            const { data } = await api.get(`/search/equip/${eq.serviceTag}`)
            setSelected(data)
        } catch (err) {
            toast.error('Erreur')
            setSelected(null)
        } finally {
            setDetailLoading(false)
        }
    }

    const getStatusBadge = (status) => {
        const cls = { active: 'badge-active', inactive: 'badge-pending', maintenance: 'badge-pending' }
        return <span className={cls[status] || 'badge-user'}>{status}</span>
    }

    const getLicBadge = (status) => {
        const cls = { active: 'badge-active', expired: 'badge-expired', pending: 'badge-pending' }
        return <span className={cls[status] || 'badge-user'}>{status}</span>
    }

    const getDaysColor = (days) => {
        if (days < 0) return 'text-red-400'
        if (days <= 30) return 'text-amber-400'
        return 'text-emerald-400'
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1">
                    <h2 className="text-lg font-semibold flex items-center gap-2">🖥️ Rechercher un Équipement</h2>
                    <p className="text-slate-400 text-sm">{equipments.length} équipement(s)</p>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-card p-4 flex flex-wrap gap-3">
                <input
                    type="text"
                    placeholder="Rechercher (tag, modèle, fabricant...)"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="form-input flex-1 min-w-48"
                />
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="form-input w-48"
                >
                    <option value="">Tous les types</option>
                    {EQUIPMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
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
                ) : equipments.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-4xl mb-3">🖥️</p>
                        <p className="text-slate-400">Aucun équipement trouvé</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Service Tag</th>
                                    <th>Type</th>
                                    <th>Modèle</th>
                                    <th>Fabricant</th>
                                    <th>Rack / U</th>
                                    <th>Statut</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {equipments.map((eq) => (
                                    <tr key={eq._id}>
                                        <td><code className="text-brand-300 text-xs">{eq.serviceTag}</code></td>
                                        <td>
                                            <span className="text-xs bg-dark-700 border border-dark-600 px-2 py-1 rounded">
                                                {eq.type}
                                            </span>
                                        </td>
                                        <td className="font-medium">{eq.model}</td>
                                        <td>{eq.manufacturer || '—'}</td>
                                        <td>
                                            {eq.rack
                                                ? <span className="text-xs">{eq.rack}{eq.uStart != null && eq.uEnd != null ? ` · U${eq.uStart}-${eq.uEnd}` : ''}</span>
                                                : '—'}
                                        </td>
                                        <td>{getStatusBadge(eq.status)}</td>
                                        <td>
                                            <button
                                                onClick={() => openDetail(eq)}
                                                className="btn-secondary text-xs px-2 py-1"
                                            >
                                                Détails
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Detail panel */}
            {selected && (
                <div className="space-y-4 animate-in slide-in-from-bottom">
                    <div className="glass-card p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-gradient">{selected.equipment.serviceTag}</h3>
                                <p className="text-slate-400">{selected.equipment.type} — {selected.equipment.model}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {getStatusBadge(selected.equipment.status)}
                                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white">✕</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                            {[
                                { label: 'Fabricant', val: selected.equipment.manufacturer || '—' },
                                { label: 'Rack', val: selected.equipment.rack || '—' },
                                { label: 'U occupés', val: selected.equipment.uStart != null && selected.equipment.uEnd != null ? `U${selected.equipment.uStart}-${selected.equipment.uEnd}` : '—' },
                                { label: 'Date achat', val: selected.equipment.purchaseDate ? new Date(selected.equipment.purchaseDate).toLocaleDateString('fr-FR') : '—' },
                                { label: 'Garantie', val: selected.equipment.warrantyExpiry ? new Date(selected.equipment.warrantyExpiry).toLocaleDateString('fr-FR') : '—' },
                                { label: 'Créé le', val: new Date(selected.equipment.createdAt).toLocaleDateString('fr-FR') },
                            ].map(({ label, val }) => (
                                <div key={label} className="glass-card-light p-3">
                                    <p className="text-xs text-slate-500 mb-1">{label}</p>
                                    <p className="text-sm font-medium">{val}</p>
                                </div>
                            ))}
                        </div>

                        {selected.equipment.notes && (
                            <div className="mt-4 p-3 bg-dark-700/50 rounded-xl border border-dark-600">
                                <p className="text-xs text-slate-500 mb-1">Notes</p>
                                <p className="text-sm text-slate-300">{selected.equipment.notes}</p>
                            </div>
                        )}
                    </div>

                    <div className="glass-card p-6">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            🗝️ Licences associées
                            <span className="badge-user text-xs">{selected.licenses.length}</span>
                        </h3>

                        {detailLoading ? (
                            <p className="text-slate-400 text-sm text-center py-4">Chargement…</p>
                        ) : selected.licenses.length === 0 ? (
                            <p className="text-slate-400 text-sm text-center py-8">Aucune licence pour cet équipement</p>
                        ) : (
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Type</th>
                                            <th>Catégorie</th>
                                            <th>Vendor</th>
                                            <th>Expiration</th>
                                            <th>Jours restants</th>
                                            <th>Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selected.licenses.map((lic) => (
                                            <tr key={lic._id}>
                                                <td className="font-medium">{lic.type}</td>
                                                <td>{lic.category?.name || '—'}</td>
                                                <td>{lic.vendor || '—'}</td>
                                                <td>{new Date(lic.expirationDate).toLocaleDateString('fr-FR')}</td>
                                                <td className={`font-semibold ${getDaysColor(lic.daysUntilExpiry)}`}>
                                                    {lic.daysUntilExpiry > 0 ? `${lic.daysUntilExpiry}j` : 'Expiré'}
                                                </td>
                                                <td>{getLicBadge(lic.status)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
