import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import api from '../lib/api'
import toast from 'react-hot-toast'

export default function ExportPanel() {
    const [licenses, setLicenses] = useState([])
    const [equipments, setEquipments] = useState([])
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [tab, setTab] = useState('licenses') // 'licenses' | 'equipments'
    const { register, handleSubmit, formState: { errors } } = useForm()

    useEffect(() => {
        Promise.all([
            api.get('/licenses?limit=500'),
            api.get('/equipments?limit=500'),
        ]).then(([lRes, eRes]) => {
            setLicenses(lRes.data.licenses)
            setEquipments(eRes.data.equipments)
        }).catch(() => toast.error('Erreur de chargement')).finally(() => setLoading(false))
    }, [])

    const generatePdf = (type) => {
        const doc = new jsPDF({ orientation: 'landscape' })

        doc.setFontSize(18)
        doc.setTextColor(99, 102, 241)
        doc.text('NextStep IT — Rapport de gestion', 14, 18)

        doc.setFontSize(10)
        doc.setTextColor(100)
        doc.text(`Généré le : ${new Date().toLocaleString('fr-FR')}`, 14, 26)

        if (type === 'licenses') {
            doc.setFontSize(13)
            doc.setTextColor(30, 58, 138)
            doc.text('Licences', 14, 36)

            autoTable(doc, {
                startY: 40,
                head: [['Type', 'Vendor', 'Équipement', 'Expiration', 'Jours restants', 'Sièges', 'Coût (€)', 'Statut']],
                body: licenses.map((l) => [
                    l.type,
                    l.vendor || '—',
                    l.equipmentId?.serviceTag || '—',
                    new Date(l.expirationDate).toLocaleDateString('fr-FR'),
                    l.daysUntilExpiry > 0 ? `${l.daysUntilExpiry}j` : 'Expiré',
                    l.seats,
                    l.cost || 0,
                    l.status,
                ]),
                styles: { fontSize: 8, cellPadding: 3 },
                headStyles: { fillColor: [99, 102, 241], textColor: 255 },
                alternateRowStyles: { fillColor: [245, 247, 255] },
                didParseCell: (data) => {
                    if (data.section === 'body' && data.column.index === 4) {
                        const days = parseInt(data.cell.text)
                        if (isNaN(data.cell.text) || data.cell.text[0] === 'E') {
                            data.cell.styles.textColor = [220, 53, 69]
                        } else if (days <= 30) {
                            data.cell.styles.textColor = [255, 165, 0]
                        } else {
                            data.cell.styles.textColor = [16, 185, 129]
                        }
                    }
                },
            })
        } else {
            doc.setFontSize(13)
            doc.setTextColor(30, 58, 138)
            doc.text('Équipements', 14, 36)

            autoTable(doc, {
                startY: 40,
                head: [['Service Tag', 'Type', 'Modèle', 'Fabricant', 'Emplacement', 'Statut', 'Créé le']],
                body: equipments.map((e) => [
                    e.serviceTag,
                    e.type,
                    e.model,
                    e.manufacturer || '—',
                    e.location || '—',
                    e.status,
                    new Date(e.createdAt).toLocaleDateString('fr-FR'),
                ]),
                styles: { fontSize: 8, cellPadding: 3 },
                headStyles: { fillColor: [99, 102, 241], textColor: 255 },
                alternateRowStyles: { fillColor: [245, 247, 255] },
            })
        }

        return doc
    }

    const handleDownloadPdf = () => {
        const doc = generatePdf(tab)
        const filename = `rapport_${tab}_${new Date().toISOString().slice(0, 10)}.pdf`
        doc.save(filename)
        toast.success('PDF téléchargé')
    }

    const handleDownloadExcel = () => {
        const data = tab === 'licenses'
            ? licenses.map((l) => ({
                Type: l.type,
                Vendor: l.vendor || '',
                'Clé licence': l.licenseKey || '',
                'Équipement (Tag)': l.equipmentId?.serviceTag || '',
                Expiration: new Date(l.expirationDate).toLocaleDateString('fr-FR'),
                'Jours restants': l.daysUntilExpiry,
                'Coût (€)': l.cost || 0,
                Sièges: l.seats,
                Statut: l.status,
            }))
            : equipments.map((e) => ({
                'Service Tag': e.serviceTag,
                Type: e.type,
                Modèle: e.model,
                Fabricant: e.manufacturer || '',
                Emplacement: e.location || '',
                Statut: e.status,
                'Créé le': new Date(e.createdAt).toLocaleDateString('fr-FR'),
            }))

        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, tab === 'licenses' ? 'Licences' : 'Equipements')
        const filename = `rapport_${tab}_${new Date().toISOString().slice(0, 10)}.xlsx`
        XLSX.writeFile(wb, filename)
        toast.success('Excel téléchargé')
    }

    const handleSendEmail = async (formData) => {
        setSending(true)
        try {
            const doc = generatePdf(tab)
            const pdfBase64 = doc.output('datauristring').split(',')[1]
            const filename = `rapport_${tab}_${new Date().toISOString().slice(0, 10)}.pdf`

            await api.post('/export/send-pdf', {
                email: formData.email,
                subject: `Rapport ${tab} — NextStep IT — ${new Date().toLocaleDateString('fr-FR')}`,
                pdfBase64,
                filename,
            })
            toast.success(`PDF envoyé à ${formData.email}`)
        } catch (err) {
            toast.error(err.response?.data?.message || "Erreur d'envoi")
        } finally {
            setSending(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <svg className="animate-spin h-10 w-10 text-brand-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            </div>
        )
    }

    const expiringSoon = licenses.filter((l) => l.daysUntilExpiry >= 0 && l.daysUntilExpiry <= 30)

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold">📤 Export & Envoi Email</h2>
                <p className="text-slate-400 text-sm">Exportez les données en PDF ou Excel, ou envoyez par email.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total équipements', val: equipments.length, color: 'text-brand-400', icon: '🖥️' },
                    { label: 'Total licences', val: licenses.length, color: 'text-purple-400', icon: '🗝️' },
                    { label: 'Licences actives', val: licenses.filter(l => l.status === 'active').length, color: 'text-emerald-400', icon: '✅' },
                    { label: 'Expiration <30j', val: expiringSoon.length, color: 'text-amber-400', icon: '⚠️' },
                ].map(({ label, val, color, icon }) => (
                    <div key={label} className="stat-card">
                        <span className="text-2xl">{icon}</span>
                        <p className={`text-3xl font-bold ${color}`}>{val}</p>
                        <p className="text-xs text-slate-400">{label}</p>
                    </div>
                ))}
            </div>

            {/* Data type selector */}
            <div className="glass-card p-1 flex rounded-xl w-fit">
                {['licenses', 'equipments'].map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${tab === t ? 'tab-active' : 'tab-inactive'}`}
                    >
                        {t === 'licenses' ? '🗝️ Licences' : '🖥️ Équipements'}
                    </button>
                ))}
            </div>

            {/* Export actions */}
            <div className="grid md:grid-cols-2 gap-4">
                {/* Download */}
                <div className="glass-card p-6 space-y-4">
                    <h3 className="font-semibold">📥 Télécharger</h3>
                    <p className="text-sm text-slate-400">
                        {tab === 'licenses' ? licenses.length : equipments.length} enregistrement(s) disponibles
                    </p>
                    <div className="flex gap-3">
                        <button
                            id="download-pdf-btn"
                            onClick={handleDownloadPdf}
                            className="btn-primary flex-1 justify-center"
                        >
                            📄 PDF
                        </button>
                        <button
                            id="download-excel-btn"
                            onClick={handleDownloadExcel}
                            className="btn-secondary flex-1 justify-center"
                        >
                            📊 Excel
                        </button>
                    </div>
                </div>

                {/* Send email */}
                <div className="glass-card p-6 space-y-4">
                    <h3 className="font-semibold">📧 Envoyer par Email</h3>
                    <p className="text-sm text-slate-400">Le rapport PDF sera envoyé à l'adresse indiquée.</p>
                    <form onSubmit={handleSubmit(handleSendEmail)} className="space-y-3">
                        <div>
                            <label className="form-label">Adresse email destinataire</label>
                            <input
                                id="export-email"
                                type="email"
                                placeholder="cloud@nextstep-it.com"
                                className="form-input"
                                {...register('email', { required: 'Email requis' })}
                            />
                            {errors.email && <p className="form-error">{errors.email.message}</p>}
                        </div>
                        <button
                            id="send-email-btn"
                            type="submit"
                            disabled={sending}
                            className="btn-primary w-full justify-center"
                        >
                            {sending ? 'Envoi en cours...' : '📧 Envoyer le rapport PDF'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Expiring soon warning */}
            {expiringSoon.length > 0 && (
                <div className="glass-card p-6 border border-amber-500/30">
                    <h3 className="font-semibold text-amber-400 mb-3">⚠️ Licences expirant dans 30 jours ({expiringSoon.length})</h3>
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Équipement</th>
                                    <th>Expiration</th>
                                    <th>Jours restants</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expiringSoon.map((l) => (
                                    <tr key={l._id}>
                                        <td className="font-medium">{l.type}</td>
                                        <td>{l.equipmentId?.serviceTag || '—'}</td>
                                        <td>{new Date(l.expirationDate).toLocaleDateString('fr-FR')}</td>
                                        <td className="font-bold text-amber-400">{l.daysUntilExpiry}j</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
