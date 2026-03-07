import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../lib/api'

function useDebounce(value, delay) {
    const [debounced, setDebounced] = useState(value)
    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delay)
        return () => clearTimeout(id)
    }, [value, delay])
    return debounced
}

export default function GlobalSearch({ onNavigate }) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState(null)
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)
    const containerRef = useRef(null)
    const inputRef = useRef(null)

    const debouncedQuery = useDebounce(query.trim(), 300)

    const search = useCallback(async (q) => {
        if (!q || q.length < 2) {
            setResults(null)
            return
        }
        setLoading(true)
        try {
            const { data } = await api.get(`/search/global?q=${encodeURIComponent(q)}`)
            setResults(data)
        } catch {
            setResults(null)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        search(debouncedQuery)
    }, [debouncedQuery, search])

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    // Keyboard shortcut: Ctrl+K to focus
    useEffect(() => {
        const handler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault()
                inputRef.current?.focus()
                setOpen(true)
            }
            if (e.key === 'Escape') {
                setOpen(false)
                inputRef.current?.blur()
            }
        }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [])

    const handleSelect = (type, item) => {
        setOpen(false)
        setQuery('')
        setResults(null)
        if (onNavigate) onNavigate(type, item)
    }

    const hasResults = results && (results.equipments?.length > 0 || results.licenses?.length > 0)
    const noResults = results && results.equipments?.length === 0 && results.licenses?.length === 0
    const showDropdown = open && query.trim().length >= 2

    const getDaysUntilExpiry = (date) => {
        const diff = new Date(date) - new Date()
        return Math.ceil(diff / (1000 * 60 * 60 * 24))
    }

    const getDaysColor = (days) => {
        if (days < 0) return 'text-red-400'
        if (days <= 30) return 'text-amber-400'
        return 'text-emerald-400'
    }

    return (
        <div ref={containerRef} className="relative w-full max-w-md">
            {/* Search Input */}
            <div className="relative">
                <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
                    onFocus={() => { if (query.trim().length >= 2) setOpen(true) }}
                    placeholder="Recherche globale..."
                    className="w-full bg-dark-700/80 border border-dark-600 text-slate-100 rounded-xl pl-10 pr-16 py-2 text-sm
                               focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50
                               placeholder:text-slate-500 transition-all duration-200"
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5
                                px-1.5 py-0.5 rounded bg-dark-600 border border-dark-500 text-[10px] text-slate-500 font-mono">
                    Ctrl+K
                </kbd>
            </div>

            {/* Dropdown */}
            {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50
                                bg-dark-700 border border-dark-600 rounded-xl shadow-2xl overflow-hidden
                                max-h-[420px] overflow-y-auto">

                    {loading && (
                        <div className="flex items-center gap-2 px-4 py-3">
                            <svg className="animate-spin h-4 w-4 text-brand-400" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            <span className="text-xs text-slate-400">Recherche en cours...</span>
                        </div>
                    )}

                    {!loading && noResults && (
                        <div className="px-4 py-6 text-center">
                            <p className="text-sm text-slate-500">Aucun resultat pour "{query}"</p>
                        </div>
                    )}

                    {!loading && hasResults && (
                        <>
                            {/* Equipment Results */}
                            {results.equipments.length > 0 && (
                                <div>
                                    <div className="px-4 py-2 bg-dark-800/50 border-b border-dark-600">
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                            <span>Equipements</span>
                                            <span className="bg-dark-600 text-slate-400 px-1.5 py-0.5 rounded-full">{results.equipments.length}</span>
                                        </p>
                                    </div>
                                    {results.equipments.map((eq) => (
                                        <button
                                            key={eq._id}
                                            onClick={() => handleSelect('equipment', eq)}
                                            className="w-full text-left px-4 py-2.5 hover:bg-dark-600/50 transition-colors flex items-center gap-3 border-b border-dark-600/30 last:border-b-0"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-brand-600/20 border border-brand-500/30 flex items-center justify-center flex-shrink-0">
                                                <span className="text-xs">🖥️</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-200 truncate">{eq.model}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <code className="text-[11px] text-brand-400">{eq.serviceTag}</code>
                                                    <span className="text-[11px] text-slate-600">|</span>
                                                    <span className="text-[11px] text-slate-500">{eq.type}</span>
                                                    {eq.manufacturer && (
                                                        <>
                                                            <span className="text-[11px] text-slate-600">|</span>
                                                            <span className="text-[11px] text-slate-500">{eq.manufacturer}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${
                                                eq.status === 'active'
                                                    ? 'bg-emerald-500/20 text-emerald-400'
                                                    : eq.status === 'maintenance'
                                                    ? 'bg-amber-500/20 text-amber-400'
                                                    : 'bg-slate-500/20 text-slate-400'
                                            }`}>
                                                {eq.status}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* License Results */}
                            {results.licenses.length > 0 && (
                                <div>
                                    <div className="px-4 py-2 bg-dark-800/50 border-b border-dark-600">
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                            <span>Licences</span>
                                            <span className="bg-dark-600 text-slate-400 px-1.5 py-0.5 rounded-full">{results.licenses.length}</span>
                                        </p>
                                    </div>
                                    {results.licenses.map((lic) => {
                                        const days = getDaysUntilExpiry(lic.expirationDate)
                                        return (
                                            <button
                                                key={lic._id}
                                                onClick={() => handleSelect('license', lic)}
                                                className="w-full text-left px-4 py-2.5 hover:bg-dark-600/50 transition-colors flex items-center gap-3 border-b border-dark-600/30 last:border-b-0"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-sky-600/20 border border-sky-500/30 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-xs">🗝️</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-slate-200 truncate">{lic.type}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        {lic.vendor && <span className="text-[11px] text-slate-500">{lic.vendor}</span>}
                                                        {lic.equipmentId && (
                                                            <>
                                                                {lic.vendor && <span className="text-[11px] text-slate-600">|</span>}
                                                                <code className="text-[11px] text-brand-400">{lic.equipmentId.serviceTag}</code>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className={`text-xs font-semibold flex-shrink-0 ${getDaysColor(days)}`}>
                                                    {days > 0 ? `${days}j` : 'Expire'}
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
