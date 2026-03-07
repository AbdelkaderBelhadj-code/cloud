import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { useSelector } from 'react-redux'
import { selectIsAdmin } from '../store/authSlice'
import api from '../lib/api'
import toast from 'react-hot-toast'

function LicenseModal({ license, equipments, onClose, onSaved }) {
    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: license
            ? {
                ...license,
                expirationDate: license.expirationDate?.slice(0, 10),
                purchaseDate: license.purchaseDate?.slice(0, 10) || '',
                equipmentId: license.equipmentId?._id || '',
            }
            : {
                type: '', licenseKey: '', vendor: '', expirationDate: '',
                purchaseDate: '', cost: '', seats: 1, status: 'active', notes: '',
                equipmentId: ''
            }
    })
    const [loading, setLoading] = useState(false)

    const onSubmit = async (data) => {
        setLoading(true)
        const { _id, id, createdBy, createdAt, updatedAt, __v, daysUntilExpiry, notificationSent, ...fields } = data
        const payload = { ...fields, equipmentId: fields.equipmentId || null }
        try {
            if (license) {
                await api.put(`/licenses/${license._id}`, payload)
                toast.success('Licence mise à jour')
            } else {
                await api.post('/licenses', payload)
                toast.success('Licence créée')
            }
            onSaved()
            onClose()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erreur')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="glass-card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                    <h3 className="font-semibold text-lg">{license ? 'Modifier Licence' : 'Ajouter Licence'}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="form-label">Type de licence *</label>
                        <input
                            className="form-input"
                            placeholder="ex: Windows Server 2022 Datacenter"
                            {...register('type', { required: 'Requis' })}
                        />
                        {errors.type && <p className="form-error">{errors.type.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Clé de licence</label>
                            <input className="form-input font-mono text-sm" placeholder="XXXXX-XXXXX-..." {...register('licenseKey')} />
                        </div>
                        <div>
                            <label className="form-label">Vendor</label>
                            <input className="form-input" placeholder="ex: Microsoft" {...register('vendor')} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Date d'expiration *</label>
                            <input type="date" className="form-input" {...register('expirationDate', { required: 'Requis' })} />
                            {errors.expirationDate && <p className="form-error">{errors.expirationDate.message}</p>}
                        </div>
                        <div>
                            <label className="form-label">Date d'achat</label>
                            <input type="date" className="form-input" {...register('purchaseDate')} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Coût (€)</label>
                            <input type="number" step="0.01" className="form-input" placeholder="0.00" {...register('cost', { valueAsNumber: true })} />
                        </div>
                        <div>
                            <label className="form-label">Nombre de sièges</label>
                            <input type="number" min="1" className="form-input" {...register('seats', { valueAsNumber: true })} />
                        </div>
                    </div>

                    <div>
                        <label className="form-label">Équipement associé</label>
                        <select className="form-input" {...register('equipmentId')}>
                            <option value="">— Aucun équipement —</option>
                            {equipments.map((eq) => (
                                <option key={eq._id} value={eq._id}>
                                    [{eq.type}] {eq.serviceTag} — {eq.model}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="form-label">Statut</label>
                        <select className="form-input" {...register('status')}>
                            <option value="active">Active</option>
                            <option value="expired">Expirée</option>
                            <option value="pending">En attente</option>
                        </select>
                    </div>

                    <div>
                        <label className="form-label">Notes</label>
                        <textarea className="form-input h-20 resize-none" {...register('notes')} />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
                            {loading ? 'Enregistrement...' : license ? 'Modifier' : 'Créer'}
                        </button>
                        <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default function ManageLicenses() {
    const isAdmin = useSelector(selectIsAdmin)
    const [licenses, setLicenses] = useState([])
    const [equipments, setEquipments] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [expiringSoon, setExpiringSoon] = useState(false)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)
    const [modal, setModal] = useState(null)
    const [deleting, setDeleting] = useState(null)

    const fetchLicenses = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ page, limit: 15 })
            if (search) params.set('search', search)
            if (statusFilter) params.set('status', statusFilter)
            if (expiringSoon) params.set('expiringSoon', 'true')
            const { data } = await api.get(`/licenses?${params}`)
            setLicenses(data.licenses)
            setTotalPages(data.pages)
            setTotal(data.total)
        } catch {
            toast.error('Erreur de chargement')
        } finally {
            setLoading(false)
        }
    }, [page, search, statusFilter, expiringSoon])

    useEffect(() => { fetchLicenses() }, [fetchLicenses])

    useEffect(() => {
        api.get('/equipments?limit=200').then(({ data }) => setEquipments(data.equipments)).catch(() => { })
    }, [])

    const handleDelete = async (id) => {
        if (!confirm('Supprimer cette licence ?')) return
        setDeleting(id)
        try {
            await api.delete(`/licenses/${id}`)
            toast.success('Licence supprimée')
            fetchLicenses()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erreur')
        } finally {
            setDeleting(null)
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
        <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1">
                    <h2 className="text-lg font-semibold">🗝️ Gestion des Licences</h2>
                    <p className="text-slate-400 text-sm">{total} licence(s) au total</p>
                </div>
                <button onClick={() => setModal('create')} className="btn-primary" id="add-license-btn">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Ajouter
                </button>
            </div>

            {/* Filters */}
            <div className="glass-card p-4 flex flex-wrap gap-3 items-center">
                <input
                    type="text"
                    placeholder="Rechercher (type, vendor...)"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                    className="form-input flex-1 min-w-48"
                />
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                    className="form-input w-40"
                >
                    <option value="">Tous statuts</option>
                    <option value="active">Active</option>
                    <option value="expired">Expirée</option>
                    <option value="pending">En attente</option>
                </select>
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={expiringSoon}
                        onChange={(e) => { setExpiringSoon(e.target.checked); setPage(1) }}
                        className="w-4 h-4 rounded accent-brand-500"
                    />
                    <span className="text-amber-400">⚠️ Expiration &lt;30j</span>
                </label>
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
                        <p className="text-4xl mb-3">🗝️</p>
                        <p className="text-slate-400">Aucune licence trouvée</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Vendor</th>
                                    <th>Équipement</th>
                                    <th>Expiration</th>
                                    <th>Jours restants</th>
                                    <th>Sièges</th>
                                    <th>Coût</th>
                                    <th>Statut</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {licenses.map((lic) => (
                                    <tr key={lic._id}>
                                        <td className="font-medium text-brand-300 max-w-[180px] truncate" title={lic.type}>{lic.type}</td>
                                        <td>{lic.vendor || '—'}</td>
                                        <td>
                                            {lic.equipmentId
                                                ? <code className="text-xs text-brand-300">{lic.equipmentId.serviceTag}</code>
                                                : '—'}
                                        </td>
                                        <td>{new Date(lic.expirationDate).toLocaleDateString('fr-FR')}</td>
                                        <td className={`font-bold ${getDaysColor(lic.daysUntilExpiry)}`}>
                                            {lic.daysUntilExpiry > 0 ? `${lic.daysUntilExpiry}j` : 'Expiré'}
                                        </td>
                                        <td>{lic.seats}</td>
                                        <td>{lic.cost ? `${lic.cost.toLocaleString('fr-FR')} €` : '—'}</td>
                                        <td>{getStatusBadge(lic.status)}</td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => setModal(lic)} className="btn-success text-xs px-2 py-1">✏️</button>
                                                {isAdmin && (
                                                    <button
                                                        onClick={() => handleDelete(lic._id)}
                                                        disabled={deleting === lic._id}
                                                        className="btn-danger text-xs px-2 py-1"
                                                    >
                                                        🗑️
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-dark-600">
                        <p className="text-xs text-slate-500">Page {page} / {totalPages}</p>
                        <div className="flex gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-xs px-3 py-1">‹</button>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary text-xs px-3 py-1">›</button>
                        </div>
                    </div>
                )}
            </div>

            {modal && (
                <LicenseModal
                    license={modal === 'create' ? null : modal}
                    equipments={equipments}
                    onClose={() => setModal(null)}
                    onSaved={fetchLicenses}
                />
            )}
        </div>
    )
}
