import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { useSelector } from 'react-redux'
import { selectIsAdmin } from '../store/authSlice'
import api from '../lib/api'
import toast from 'react-hot-toast'

const EQUIPMENT_TYPES = ['Serveur', 'Firewall', 'Baie stockage', 'Switch', 'Routeur']
const RACK_COUNT = 100
const RACKS = Array.from({ length: RACK_COUNT }, (_, i) => `Rack ${i + 1}`)

function EquipmentModal({ equip, onClose, onSaved }) {
    const { register, handleSubmit, formState: { errors }, reset } = useForm({
        defaultValues: equip
            ? { ...equip, uStart: equip.uStart ?? '', uEnd: equip.uEnd ?? '' }
            : {
                serviceTag: '', type: 'Serveur', model: '', manufacturer: '',
                rack: '', uStart: '', uEnd: '', status: 'active', notes: ''
            }
    })
    const [loading, setLoading] = useState(false)

    const onSubmit = async (data) => {
        setLoading(true)
        const { _id, id, createdBy, createdAt, updatedAt, __v, ...fields } = data
        // Coerce empty U fields to null
        fields.uStart = fields.uStart === '' || fields.uStart == null ? null : Number(fields.uStart)
        fields.uEnd = fields.uEnd === '' || fields.uEnd == null ? null : Number(fields.uEnd)
        try {
            if (equip) {
                await api.put(`/equipments/${equip._id}`, fields)
                toast.success('Équipement mis à jour')
            } else {
                await api.post('/equipments', fields)
                toast.success('Équipement créé')
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
            <div className="glass-card p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                    <h3 className="font-semibold text-lg">{equip ? 'Modifier Équipement' : 'Ajouter Équipement'}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Service Tag *</label>
                            <input className="form-input font-mono" {...register('serviceTag', { required: 'Requis' })} />
                            {errors.serviceTag && <p className="form-error">{errors.serviceTag.message}</p>}
                        </div>
                        <div>
                            <label className="form-label">Type *</label>
                            <select className="form-input" {...register('type', { required: true })}>
                                {EQUIPMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="form-label">Modèle *</label>
                        <input className="form-input" placeholder="ex: Dell PowerEdge R740" {...register('model', { required: 'Requis' })} />
                        {errors.model && <p className="form-error">{errors.model.message}</p>}
                    </div>

                    <div>
                        <label className="form-label">Fabricant</label>
                        <input className="form-input" placeholder="ex: Dell" {...register('manufacturer')} />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="form-label">Rack</label>
                            <select className="form-input" {...register('rack')}>
                                <option value="">— Aucun —</option>
                                {RACKS.map((r) => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="form-label">U Start</label>
                            <input
                                type="number"
                                min="1"
                                className="form-input"
                                placeholder="ex: 5"
                                {...register('uStart', { min: { value: 1, message: '≥ 1' } })}
                            />
                            {errors.uStart && <p className="form-error">{errors.uStart.message}</p>}
                        </div>
                        <div>
                            <label className="form-label">U End</label>
                            <input
                                type="number"
                                min="1"
                                className="form-input"
                                placeholder="ex: 7"
                                {...register('uEnd', { min: { value: 1, message: '≥ 1' } })}
                            />
                            {errors.uEnd && <p className="form-error">{errors.uEnd.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Date d'achat</label>
                            <input type="date" className="form-input" {...register('purchaseDate')} />
                        </div>
                        <div>
                            <label className="form-label">Expiration garantie</label>
                            <input type="date" className="form-input" {...register('warrantyExpiry')} />
                        </div>
                    </div>

                    <div>
                        <label className="form-label">Statut</label>
                        <select className="form-input" {...register('status')}>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="maintenance">Maintenance</option>
                        </select>
                    </div>

                    <div>
                        <label className="form-label">Notes</label>
                        <textarea className="form-input h-20 resize-none" {...register('notes')} />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
                            {loading ? 'Enregistrement...' : equip ? 'Modifier' : 'Créer'}
                        </button>
                        <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default function ManageEquipments() {
    const isAdmin = useSelector(selectIsAdmin)
    const [equipments, setEquipments] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState('')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)
    const [modal, setModal] = useState(null) // null | 'create' | equip obj
    const [deleting, setDeleting] = useState(null)

    const fetchEquipments = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ page, limit: 15 })
            if (search) params.set('search', search)
            if (typeFilter) params.set('type', typeFilter)
            const { data } = await api.get(`/equipments?${params}`)
            setEquipments(data.equipments)
            setTotalPages(data.pages)
            setTotal(data.total)
        } catch (err) {
            toast.error('Erreur de chargement')
        } finally {
            setLoading(false)
        }
    }, [page, search, typeFilter])

    useEffect(() => { fetchEquipments() }, [fetchEquipments])

    const handleDelete = async (id) => {
        if (!confirm('Supprimer cet équipement ?')) return
        setDeleting(id)
        try {
            await api.delete(`/equipments/${id}`)
            toast.success('Équipement supprimé')
            fetchEquipments()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erreur')
        } finally {
            setDeleting(null)
        }
    }

    const getStatusBadge = (status) => {
        const cls = { active: 'badge-active', inactive: 'badge-pending', maintenance: 'badge-pending' }
        return <span className={cls[status] || 'badge-user'}>{status}</span>
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1">
                    <h2 className="text-lg font-semibold">🔧 Gestion des Équipements</h2>
                    <p className="text-slate-400 text-sm">{total} équipement(s) au total</p>
                </div>
                {isAdmin && (
                    <button
                        id="add-equip-btn"
                        onClick={() => setModal('create')}
                        className="btn-primary"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Ajouter
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="glass-card p-4 flex flex-wrap gap-3">
                <input
                    type="text"
                    placeholder="Rechercher (tag, modèle...)"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                    className="form-input flex-1 min-w-48"
                />
                <select
                    value={typeFilter}
                    onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
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
                                    <th>Ajouté le</th>
                                    <th>Actions</th>
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
                                        <td className="text-xs text-slate-500">{new Date(eq.createdAt).toLocaleDateString('fr-FR')}</td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                {isAdmin && (
                                                    <>
                                                        <button
                                                            onClick={() => setModal(eq)}
                                                            className="btn-success text-xs px-2 py-1"
                                                        >
                                                            ✏️ Modifier
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(eq._id)}
                                                            disabled={deleting === eq._id}
                                                            className="btn-danger text-xs px-2 py-1"
                                                        >
                                                            🗑️ Supprimer
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-dark-600">
                        <p className="text-xs text-slate-500">Page {page} / {totalPages}</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="btn-secondary text-xs px-3 py-1"
                            >
                                ‹ Préc.
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="btn-secondary text-xs px-3 py-1"
                            >
                                Suiv. ›
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {modal && (
                <EquipmentModal
                    equip={modal === 'create' ? null : modal}
                    onClose={() => setModal(null)}
                    onSaved={fetchEquipments}
                />
            )}
        </div>
    )
}
