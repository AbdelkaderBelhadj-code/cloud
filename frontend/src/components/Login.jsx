import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import api from '../lib/api'
import { setCredentials } from '../store/authSlice'

export default function Login() {
    const dispatch = useDispatch()
    const [step, setStep] = useState('password') // 'password' | 'mfa' | 'setup-mfa'
    const [userId, setUserId] = useState(null)
    const [mfaQr, setMfaQr] = useState(null)
    const [mfaSecret, setMfaSecret] = useState(null)
    const [isLoading, setIsLoading] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm()

    // Step 1: Email + Password
    const handleLogin = async (data) => {
        setIsLoading(true)
        try {
            const res = await api.post('/auth/login', {
                email: data.email,
                password: data.password,
            })
            setUserId(res.data.userId)

            if (!res.data.mfaEnabled) {
                // Fetch QR and secret for setup
                try {
                    const setupRes = await api.get(`/auth/setup/${res.data.userId}`);
                    setMfaQr(setupRes.data.mfaQr);
                    setMfaSecret(setupRes.data.mfaSecret);
                    setStep('setup-mfa');
                    toast.success('Veuillez configurer votre MFA');
                } catch (err) {
                    toast.error('Impossible de charger le QR code');
                    setStep('setup-mfa');
                }
            } else {
                setStep('mfa');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Identifiants invalides')
        } finally {
            setIsLoading(false)
        }
    }

    // Step 2: MFA TOTP
    const handleMfa = async (data) => {
        setIsLoading(true)
        try {
            const res = await api.post('/auth/verify-mfa', {
                userId,
                token: data.totpCode,
            })
            dispatch(setCredentials({ token: res.data.token, user: res.data.user }))
            toast.success(`Bienvenue, ${res.data.user.email}!`)
        } catch (err) {
            toast.error(err.response?.data?.message || 'Code MFA invalide')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl animate-pulse-slow" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />

            <div className="w-full max-w-md relative z-10">
                {/* Logo / Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600/20 border border-brand-500/30 mb-4 glow-brand">
                        <svg className="w-8 h-8 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gradient">License Management</h1>
                    <p className="text-slate-400 text-sm mt-1">NextStep IT — Gestion des licences</p>
                </div>

                <div className="glass-card p-8">
                    {/* Step indicator */}
                    <div className="flex items-center gap-2 mb-6">
                        <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${step !== 'password' ? 'bg-brand-500' : 'bg-dark-600'}`} />
                        <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${step === 'mfa' || step === 'setup-mfa' ? 'bg-brand-500' : 'bg-dark-600'}`} />
                    </div>

                    {step === 'password' && (
                        <form onSubmit={handleSubmit(handleLogin)} className="space-y-5">
                            <div>
                                <h2 className="text-xl font-semibold mb-1">Connexion</h2>
                                <p className="text-slate-400 text-sm">Entrez vos identifiants</p>
                            </div>

                            <div>
                                <label className="form-label">Adresse email</label>
                                <input
                                    id="login-email"
                                    type="email"
                                    placeholder="Email"
                                    className="form-input"
                                    {...register('email', { required: 'Email requis' })}
                                />
                                {errors.email && <p className="form-error">{errors.email.message}</p>}
                            </div>

                            <div>
                                <label className="form-label">Mot de passe</label>
                                <input
                                    id="login-password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="form-input"
                                    {...register('password', { required: 'Mot de passe requis' })}
                                />
                                {errors.password && <p className="form-error">{errors.password.message}</p>}
                            </div>

                            <button
                                id="login-submit"
                                type="submit"
                                disabled={isLoading}
                                className="btn-primary w-full justify-center"
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Connexion...
                                    </span>
                                ) : 'Continuer →'}
                            </button>
                        </form>
                    )}

                    {step === 'setup-mfa' && (
                        <div className="space-y-5">
                            <div>
                                <h2 className="text-xl font-semibold mb-1">Configuration MFA</h2>
                                <p className="text-slate-400 text-sm">
                                    Scannez ce QR code avec Google Authenticator ou Authy, puis entrez le code généré.
                                </p>
                            </div>

                            {mfaQr && (
                                <div className="flex flex-col items-center gap-3">
                                    <img src={mfaQr} alt="MFA QR Code" className="rounded-xl border border-dark-600 w-48 h-48" />
                                    {mfaSecret && (
                                        <div className="text-center">
                                            <p className="text-xs text-slate-500 mb-1">Clé manuelle :</p>
                                            <code className="text-xs text-brand-300 bg-dark-700 px-3 py-1 rounded-lg break-all">
                                                {mfaSecret}
                                            </code>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="glass-card-light p-4">
                                <p className="text-sm text-amber-400 font-medium">
                                    ⚠️ Contactez votre administrateur pour obtenir le QR code de configuration MFA.
                                </p>
                            </div>

                            <button
                                onClick={() => setStep('mfa')}
                                className="btn-primary w-full justify-center"
                            >
                                J'ai scanné le QR Code →
                            </button>
                        </div>
                    )}

                    {step === 'mfa' && (
                        <form onSubmit={handleSubmit(handleMfa)} className="space-y-5">
                            <div>
                                <h2 className="text-xl font-semibold mb-1">Authentification MFA</h2>
                                <p className="text-slate-400 text-sm">
                                    Entrez le code à 6 chiffres de votre application d'authentification.
                                </p>
                            </div>

                            <div className="flex items-center justify-center gap-3 py-4">
                                <div className="w-12 h-12 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                            d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3m-3 4.5h3" />
                                    </svg>
                                </div>
                            </div>

                            <div>
                                <label className="form-label text-center block">Code TOTP</label>
                                <input
                                    id="mfa-code"
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    placeholder="000000"
                                    className="form-input text-center text-2xl tracking-widest font-mono"
                                    {...register('totpCode', {
                                        required: 'Code requis',
                                        pattern: { value: /^\d{6}$/, message: 'Code à 6 chiffres' },
                                    })}
                                />
                                {errors.totpCode && <p className="form-error text-center">{errors.totpCode.message}</p>}
                            </div>

                            <button
                                id="mfa-submit"
                                type="submit"
                                disabled={isLoading}
                                className="btn-primary w-full justify-center"
                            >
                                {isLoading ? 'Vérification...' : 'Accéder au tableau de bord'}
                            </button>

                            <button
                                type="button"
                                onClick={() => { setStep('password'); reset() }}
                                className="w-full text-center text-sm text-slate-400 hover:text-slate-200 transition-colors"
                            >
                                ← Retour
                            </button>
                        </form>
                    )}
                </div>

                <p className="text-center text-xs text-slate-600 mt-6">
                    © 2024 NextStep IT — Système de gestion des licences
                </p>
            </div>
        </div>
    )
}
