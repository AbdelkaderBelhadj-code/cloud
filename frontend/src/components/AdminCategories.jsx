import { useEffect, useState, useCallback } from 'react'
import api from '../lib/api'
import toast from 'react-hot-toast'

export default function AdminCategories() {
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [name, setName] = useState('')
    const [creating, setCreating] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [editingName, setEditingName] = useState('')

    const fetchAll = useCallback(async () => {
        setLoading(true)
        try {
            const { data } = await api.get('/categories')
            setCategories(data)
        } catch (err) {
            toast.error('Erreur de chargement')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchAll() }, [fetchAll])

    const create = async (e) => {
        e.preventDefault()
        if (!name.trim()) return
        setCreating(true)
        try {
            await api.post('/categories', { name: name.trim() })
            toast.success('Catégorie créée')
            setName('')
            fetchAll()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erreur')
        } finally {
            setCreating(false)
        }
    }

    const update = async (id) => {
        if (!editingName.trim()) return
        try {
            await api.put(`/categories/${id}`, { name: editingName.trim() })
            toast.success('Catégorie mise à jour')
            setEditingId(null)
            setEditingName('')
            fetchAll()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erreur')
        }
    }

    const remove = async (id) => {
        if (!confirm('Supprimer cette catégorie ?')) return
        try {
            await api.delete(`/categories/${id}`)
            toast.success('Catégorie supprimée')
            fetchAll()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erreur')
        }
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1">
                    <h2 className="text-lg font-semibold flex items-center gap-2">🏷️ Catégories de Licences</h2>
                    <p className="text-slate-400 text-sm">{categories.length} catégorie(s)</p>
                </div>
            </div>

            <form onSubmit={create} className="glass-card p-4 flex gap-3">
                <input
                    type="text"
                    placeholder="Nom de la catégorie (ex: Système, Antivirus, Base de données)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-input flex-1"
                />
                <button type="submit" disabled={creating || !name.trim()} className="btn-primary">
                    {creating ? '…' : 'Ajouter'}
                </button>
            </form>

            <div className="glass-card overflow-hidden">
                {loading ? (
                    <div className="text-center py-12 text-slate-400">Chargement…</div>
                ) : categories.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-4xl mb-3">🏷️</p>
                        <p className="text-slate-400">Aucune catégorie. Ajoutez-en une ci-dessus.</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Nom</th>
                                    <th>Créé le</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map((c) => (
                                    <tr key={c._id}>
                                        <td>
                                            {editingId === c._id ? (
                                                <input
                                                    autoFocus
                                                    className="form-input"
                                                    value={editingName}
                                                    onChange={(e) => setEditingName(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && update(c._id)}
                                                />
                                            ) : (
                                                <span className="font-medium">{c.name}</span>
                                            )}
                                        </td>
                                        <td className="text-xs text-slate-500">
                                            {new Date(c.createdAt).toLocaleDateString('fr-FR')}
                                        </td>
                                        <td>
                                            <div className="flex gap-2">
                                                {editingId === c._id ? (
                                                    <>
                                                        <button onClick={() => update(c._id)} className="btn-success text-xs px-2 py-1">Enregistrer</button>
                                                        <button onClick={() => { setEditingId(null); setEditingName('') }} className="btn-secondary text-xs px-2 py-1">Annuler</button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => { setEditingId(c._id); setEditingName(c.name) }}
                                                            className="btn-success text-xs px-2 py-1"
                                                        >
                                                            ✏️ Modifier
                                                        </button>
                                                        <button
                                                            onClick={() => remove(c._id)}
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
            </div>
        </div>
    )
}
