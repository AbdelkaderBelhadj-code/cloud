import { useState } from 'react'
import api from '../lib/api'
import toast from 'react-hot-toast'

export default function SearchLicense() {
    const [query, setQuery] = useState('')
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)

    const handleSearch = async (e) => {
        e.preventDefault()
        if (!query.trim()) return toast.error('Entrez un type de licence')
        setLoading(true)
        try {
            const { data } = await api.get(`/search/license/${encodeURIComponent(query.trim())}`)
            setResult(data)
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erreur de recherche')
            setResult(null)
        } finally {
            setLoading(false)
        }
    }

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
        <div className="space-y-6">
            <div className="glass-card p-6">
                <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
                    📄 Rechercher une Licence
                </h2>
                <p className="text-slate-400 text-sm mb-5">
                    Rechercher par type de licence (ex: Windows Server, VMware, SQL Server...)
                </p>
                <form onSubmit={handleSearch} className="flex gap-3">
                    <input
                        id="search-license-input"
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="ex: Windows Server, VMware ESXi..."
                        className="form-input flex-1"
                    />
                    <button
                        id="search-license-btn"
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
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">
                            Résultats pour <span className="text-brand-300">"{query}"</span>
                        </h3>
                        <span className="badge-user">{result.count} résultat(s)</span>
                    </div>

                    {result.count === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-4xl mb-3">🔍</p>
                            <p className="text-slate-400">Aucune licence trouvée pour ce type</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Type</th>
                                        <th>Clé</th>
                                        <th>Vendor</th>
                                        <th>Équipement (Tag)</th>
                                        <th>Expiration</th>
                                        <th>Jours restants</th>
                                        <th>Coût</th>
                                        <th>Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.licenses.map((lic) => (
                                        <tr key={lic._id}>
                                            <td className="font-medium text-brand-300">{lic.type}</td>
                                            <td>
                                                <code className="text-xs bg-dark-700 px-2 py-1 rounded">
                                                    {lic.licenseKey || '—'}
                                                </code>
                                            </td>
                                            <td>{lic.vendor || '—'}</td>
                                            <td>
                                                {lic.equipmentId ? (
                                                    <span className="font-mono text-xs text-brand-300">{lic.equipmentId.serviceTag}</span>
                                                ) : '—'}
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
            )}
        </div>
    )
}
