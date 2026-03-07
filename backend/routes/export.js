const express = require('express');
const router = express.Router();
const Joi = require('joi');
const authJWT = require('../middleware/auth');
const { sendEmail, buildExportEmailHtml } = require('../utils/email');

router.use(authJWT);

const exportSchema = Joi.object({
    email: Joi.string().email().required(),
    subject: Joi.string().default('Export — License Management Dashboard'),
    pdfBase64: Joi.string().required(),
    filename: Joi.string().default('export.pdf'),
});

// POST /api/export/send-pdf
router.post('/send-pdf', async (req, res) => {
    try {
        const { error, value } = exportSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const pdfBuffer = Buffer.from(value.pdfBase64, 'base64');

        await sendEmail({
            to: value.email,
            subject: value.subject,
            text: 'Veuillez trouver en piece jointe le fichier PDF exporte depuis le tableau de bord NextStep IT.',
            html: buildExportEmailHtml({ filename: value.filename, recipientEmail: value.email }),
            attachments: [
                {
                    filename: value.filename,
                    content: pdfBuffer,
                    contentType: 'application/pdf',
                },
            ],
        });

        res.json({ message: `PDF sent to ${value.email}` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
