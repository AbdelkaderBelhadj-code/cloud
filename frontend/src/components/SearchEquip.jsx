import { useState } from 'react'
import api from '../lib/api'
import toast from 'react-hot-toast'

export default function SearchEquip() {
    const [query, setQuery] = useState('')
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)

    const handleSearch = async (e) => {
        e.preventDefault()
        if (!query.trim()) return toast.error('Entrez un Service Tag')
        setLoading(true)
        try {
            const { data } = await api.get(`/search/equip/${query.trim()}`)
            setResult(data)
        } catch (err) {
            toast.error(err.response?.data?.message || 'Équipement non trouvé')
            setResult(null)
        } finally {
            setLoading(false)
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
        <div className="space-y-6">
            <div className="glass-card p-6">
                <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
                    🖥️ Rechercher un Équipement
                </h2>
                <p className="text-slate-400 text-sm mb-5">
                    Rechercher par Service Tag (identifiant unique de l'équipement)
                </p>
                <form onSubmit={handleSearch} className="flex gap-3">
                    <input
                        id="search-equip-input"
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value.toUpperCase())}
                        placeholder="ex: SRV-001, FW-2023..."
                        className="form-input flex-1 font-mono"
                    />
                    <button
                        id="search-equip-btn"
                        type="submit"
                        disabled={loading}
                        className="btn-primary px-6"
                    >
                        {loading ? (
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                Rechercher
                            </>
                        )}
                    </button>
                </form>
            </div>

            {result && (
                <div className="space-y-4 animate-in slide-in-from-bottom">
                    {/* Equipment details */}
                    <div className="glass-card p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-gradient">{result.equipment.serviceTag}</h3>
                                <p className="text-slate-400">{result.equipment.type} — {result.equipment.model}</p>
                            </div>
                            {getStatusBadge(result.equipment.status)}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                            {[
                                { label: 'Fabricant', val: result.equipment.manufacturer || '—' },
                                { label: 'Emplacement', val: result.equipment.location || '—' },
                                { label: 'Date achat', val: result.equipment.purchaseDate ? new Date(result.equipment.purchaseDate).toLocaleDateString('fr-FR') : '—' },
                                { label: 'Garantie', val: result.equipment.warrantyExpiry ? new Date(result.equipment.warrantyExpiry).toLocaleDateString('fr-FR') : '—' },
                                { label: 'Ajouté par', val: result.equipment.createdBy?.email || '—' },
                                { label: 'Créé le', val: new Date(result.equipment.createdAt).toLocaleDateString('fr-FR') },
                            ].map(({ label, val }) => (
                                <div key={label} className="glass-card-light p-3">
                                    <p className="text-xs text-slate-500 mb-1">{label}</p>
                                    <p className="text-sm font-medium">{val}</p>
                                </div>
                            ))}
                        </div>

                        {result.equipment.notes && (
                            <div className="mt-4 p-3 bg-dark-700/50 rounded-xl border border-dark-600">
                                <p className="text-xs text-slate-500 mb-1">Notes</p>
                                <p className="text-sm text-slate-300">{result.equipment.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Associated Licenses */}
                    <div className="glass-card p-6">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            🗝️ Licences associées
                            <span className="badge-user text-xs">{result.licenses.length}</span>
                        </h3>

                        {result.licenses.length === 0 ? (
                            <p className="text-slate-400 text-sm text-center py-8">Aucune licence pour cet équipement</p>
                        ) : (
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Type</th>
                                            <th>Vendor</th>
                                            <th>Expiration</th>
                                            <th>Jours restants</th>
                                            <th>Places</th>
                                            <th>Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.licenses.map((lic) => (
                                            <tr key={lic._id}>
                                                <td className="font-medium">{lic.type}</td>
                                                <td>{lic.vendor || '—'}</td>
                                                <td>{new Date(lic.expirationDate).toLocaleDateString('fr-FR')}</td>
                                                <td className={`font-semibold ${getDaysColor(lic.daysUntilExpiry)}`}>
                                                    {lic.daysUntilExpiry > 0 ? `${lic.daysUntilExpiry}j` : 'Expiré'}
                                                </td>
                                                <td>{lic.seats}</td>
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
