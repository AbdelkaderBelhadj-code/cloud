import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    resetUserMfa,
    clearMfaReset,
    selectUsers,
} from '../store/usersSlice'
import { selectAuth } from '../store/authSlice'

function UserModal({ user: editUser, onClose, onSaved }) {
    const dispatch = useDispatch()
    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: editUser
            ? { email: editUser.email, role: editUser.role, firstName: editUser.firstName, lastName: editUser.lastName, isActive: editUser.isActive }
            : { email: '', password: '', role: 'user', firstName: '', lastName: '' }
    })
    const [loading, setLoading] = useState(false)

    const onSubmit = async (data) => {
        setLoading(true)
        try {
            if (editUser) {
                const payload = { ...data }
                if (!data.password) delete payload.password
                await dispatch(updateUser({ id: editUser._id, data: payload })).unwrap()
                toast.success('Utilisateur mis à jour')
            } else {
                const result = await dispatch(createUser(data)).unwrap()
                toast.success('Utilisateur créé')
            }
            onSaved()
            onClose()
        } catch (err) {
            toast.error(err || 'Erreur')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="glass-card p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                    <h3 className="font-semibold text-lg">{editUser ? 'Modifier Utilisateur' : 'Créer Utilisateur'}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="form-label">Prénom</label>
                            <input className="form-input" placeholder="Jean" {...register('firstName')} />
                        </div>
                        <div>
                            <label className="form-label">Nom</label>
                            <input className="form-input" placeholder="Dupont" {...register('lastName')} />
                        </div>
                    </div>

                    <div>
                        <label className="form-label">Email *</label>
                        <input
                            type="email"
                            className="form-input"
                            placeholder="user@nextstep-it.com"
                            {...register('email', { required: 'Email requis' })}
                        />
                        {errors.email && <p className="form-error">{errors.email.message}</p>}
                    </div>

                    <div>
                        <label className="form-label">{editUser ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe *'}</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="••••••••"
                            {...register('password', { required: !editUser ? 'Requis' : false, minLength: { value: 6, message: 'Min 6 caractères' } })}
                        />
                        {errors.password && <p className="form-error">{errors.password.message}</p>}
                    </div>

                    <div>
                        <label className="form-label">Rôle</label>
                        <select className="form-input" {...register('role')}>
                            <option value="user">👤 Utilisateur</option>
                            <option value="admin">🛡️ Administrateur</option>
                        </select>
                    </div>

                    {editUser && (
                        <div className="flex items-center gap-3">
                            <label className="form-label mb-0">Compte actif</label>
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded accent-brand-500"
                                {...register('isActive')}
                            />
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
                            {loading ? 'Enregistrement...' : editUser ? 'Modifier' : 'Créer'}
                        </button>
                        <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function MfaModal({ data, onClose }) {
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="glass-card p-6 w-full max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
                <h3 className="font-semibold text-lg mb-2">📲 QR Code MFA</h3>
                <p className="text-slate-400 text-sm mb-4">
                    L'utilisateur doit scanner ce QR code avec Google Authenticator ou Authy.
                </p>
                {data.mfaQr && <img src={data.mfaQr} alt="MFA QR" className="mx-auto rounded-xl border border-dark-600 w-48 h-48 mb-4" />}
                <div className="bg-dark-700 rounded-xl p-3 mb-4">
                    <p className="text-xs text-slate-500 mb-1">Clé secrète (en cas d'impossibilité de scan) :</p>
                    <code className="text-xs text-brand-300 break-all">{data.mfaSecret}</code>
                </div>
                <button onClick={onClose} className="btn-primary w-full justify-center">Fermer</button>
            </div>
        </div>
    )
}

export default function AdminUsers() {
    const dispatch = useDispatch()
    const { list: users, loading, error, mfaReset } = useSelector(selectUsers)
    const { user: currentUser } = useSelector(selectAuth)
    const [modal, setModal] = useState(null) // null | 'create' | user obj
    const [search, setSearch] = useState('')

    useEffect(() => {
        dispatch(fetchUsers())
    }, [dispatch])

    useEffect(() => {
        if (error) {
            toast.error(error)
        }
    }, [error])

    const handleDelete = async (user) => {
        if (!confirm(`Supprimer l'utilisateur ${user.email} ?`)) return
        try {
            await dispatch(deleteUser(user._id)).unwrap()
            toast.success('Utilisateur supprimé')
        } catch (err) {
            toast.error(err || 'Erreur')
        }
    }

    const handleResetMfa = async (user) => {
        if (!confirm(`Réinitialiser le MFA de ${user.email} ?`)) return
        try {
            await dispatch(resetUserMfa(user._id)).unwrap()
            toast.success('MFA réinitialisé')
        } catch (err) {
            toast.error(err || 'Erreur')
        }
    }

    const filtered = users.filter((u) =>
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.firstName?.toLowerCase().includes(search.toLowerCase()) ||
        u.lastName?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        👥 Gestion des Utilisateurs
                        <span className="badge-admin">{users.length} utilisateur(s)</span>
                    </h2>
                    <p className="text-slate-400 text-sm">Administration complète des comptes</p>
                </div>
                <button
                    id="add-user-btn"
                    onClick={() => setModal('create')}
                    className="btn-primary"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Créer utilisateur
                </button>
            </div>

            {/* Search */}
            <div className="glass-card p-4">
                <input
                    type="text"
                    placeholder="Rechercher par email, prénom ou nom..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="form-input"
                />
            </div>

            {/* Table */}
            <div className="glass-card overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <svg className="animate-spin h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-4xl mb-3">👥</p>
                        <p className="text-slate-400">Aucun utilisateur trouvé</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Email</th>
                                    <th>Nom complet</th>
                                    <th>Rôle</th>
                                    <th>MFA</th>
                                    <th>Statut</th>
                                    <th>Créé le</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((u) => (
                                    <tr key={u._id} className={u._id === currentUser?.id ? 'ring-1 ring-inset ring-brand-500/30' : ''}>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-brand-600/30 border border-brand-500/30 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-brand-300 text-xs font-bold">
                                                        {u.email.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <span className="text-sm">{u.email}</span>
                                                {u._id === currentUser?.id && (
                                                    <span className="text-xs text-brand-400">(vous)</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>{u.firstName || u.lastName ? `${u.firstName} ${u.lastName}`.trim() : '—'}</td>
                                        <td>
                                            <span className={u.role === 'admin' ? 'badge-admin' : 'badge-user'}>
                                                {u.role === 'admin' ? '🛡️ Admin' : '👤 User'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={u.mfaEnabled ? 'badge-active' : 'badge-pending'}>
                                                {u.mfaEnabled ? '✅ Activé' : '⚠️ Non configuré'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={u.isActive ? 'badge-active' : 'badge-expired'}>
                                                {u.isActive ? 'Actif' : 'Inactif'}
                                            </span>
                                        </td>
                                        <td className="text-xs text-slate-500">
                                            {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-1 flex-wrap">
                                                <button
                                                    onClick={() => setModal(u)}
                                                    className="btn-success text-xs px-2 py-1"
                                                >
                                                    ✏️ Modifier
                                                </button>
                                                <button
                                                    onClick={() => handleResetMfa(u)}
                                                    className="text-xs px-2 py-1 bg-amber-500/20 hover:bg-amber-500/40 text-amber-400 border border-amber-500/30 rounded-lg transition-all"
                                                >
                                                    📲 MFA
                                                </button>
                                                {u._id !== currentUser?.id && (
                                                    <button
                                                        onClick={() => handleDelete(u)}
                                                        className="btn-danger text-xs px-2 py-1"
                                                    >
                                                        🗑️ Suppr.
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
            </div>

            {modal && (
                <UserModal
                    user={modal === 'create' ? null : modal}
                    onClose={() => setModal(null)}
                    onSaved={() => dispatch(fetchUsers())}
                />
            )}

            {mfaReset && (
                <MfaModal
                    data={mfaReset}
                    onClose={() => dispatch(clearMfaReset())}
                />
            )}
        </div>
    )
}
