const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE || undefined,
    host: process.env.SMTP_SERVICE ? undefined : (process.env.SMTP_HOST || 'localhost'),
    port: process.env.SMTP_SERVICE ? undefined : (parseInt(process.env.SMTP_PORT) || 25),
    secure: process.env.SMTP_SECURE === 'true',
    auth:
        process.env.SMTP_USER
            ? {
                  user: process.env.SMTP_USER,
                  pass: process.env.SMTP_PASS,
              }
            : undefined,
});

// Verify connection configuration
transporter.verify((error, success) => {
    if (error) {
        console.error('SMTP Connection Error:', error.message);
    } else {
        console.log('SMTP Server is ready to take our messages');
    }
});

/**
 * Shared email layout wrapper
 */
const emailLayout = (content) => `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;padding:40px 0">
    <tr>
      <td align="center">
        <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a5f 0%,#2d5a8e 100%);padding:32px 40px;text-align:center">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="width:56px;height:56px;background:rgba(255,255,255,0.15);border-radius:14px;line-height:56px;font-size:28px;margin-bottom:12px">&#128737;</div>
                    <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:600;letter-spacing:-0.3px">NextStep IT</h1>
                    <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:13px;letter-spacing:0.5px">Gestion des Licences & Equipements</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:12px;color:#94a3b8;line-height:1.6">
                    <p style="margin:0">Ce message a ete envoye automatiquement par le systeme de gestion NextStep IT.</p>
                    <p style="margin:4px 0 0">Merci de ne pas repondre directement a cet email.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:16px;border-top:1px solid #e2e8f0;margin-top:16px">
                    <p style="font-size:11px;color:#cbd5e1;margin:0;text-align:center">&copy; ${new Date().getFullYear()} NextStep IT — Tous droits reserves</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

/**
 * Send a plain-text or HTML email
 */
const sendEmail = async ({ to, subject, text, html, attachments = [] }) => {
    const mailOptions = {
        from: `"NextStep IT" <${process.env.MAIL_FROM || 'noreply@nextstep-it.com'}>`,
        to,
        subject,
        text,
        html,
        attachments,
    };
    return transporter.sendMail(mailOptions);
};

/**
 * Build HTML for the PDF export email
 */
const buildExportEmailHtml = ({ filename, recipientEmail }) => {
    const date = new Date().toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return emailLayout(`
        <h2 style="color:#1e3a5f;margin:0 0 8px;font-size:20px;font-weight:600">Rapport exporte avec succes</h2>
        <p style="color:#64748b;margin:0 0 28px;font-size:14px">Genere le ${date}</p>

        <div style="background:#f0f7ff;border-left:4px solid #2d5a8e;border-radius:0 8px 8px 0;padding:20px 24px;margin-bottom:28px">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-right:16px;vertical-align:top;font-size:24px">&#128206;</td>
              <td>
                <p style="margin:0;font-size:14px;color:#1e3a5f;font-weight:600">Piece jointe</p>
                <p style="margin:4px 0 0;font-size:13px;color:#64748b">${filename}</p>
              </td>
            </tr>
          </table>
        </div>

        <p style="color:#334155;font-size:14px;line-height:1.7;margin:0 0 12px">
          Bonjour,
        </p>
        <p style="color:#334155;font-size:14px;line-height:1.7;margin:0 0 12px">
          Veuillez trouver ci-joint le rapport PDF exporte depuis le tableau de bord de gestion des licences et equipements.
        </p>
        <p style="color:#334155;font-size:14px;line-height:1.7;margin:0 0 28px">
          Ce document contient les donnees les plus recentes disponibles au moment de l'export.
        </p>

        <div style="background:#f8fafc;border-radius:8px;padding:16px 20px;border:1px solid #e2e8f0">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="font-size:12px;color:#94a3b8">Envoye a</td>
              <td style="font-size:12px;color:#94a3b8" align="right">Date</td>
            </tr>
            <tr>
              <td style="font-size:13px;color:#334155;font-weight:500;padding-top:4px">${recipientEmail}</td>
              <td style="font-size:13px;color:#334155;font-weight:500;padding-top:4px" align="right">${new Date().toLocaleDateString('fr-FR')}</td>
            </tr>
          </table>
        </div>
    `);
};

/**
 * Send license expiry notification
 */
const sendExpiryNotification = async (licenses) => {
    const urgentCount = licenses.filter((l) => l.daysUntilExpiry <= 7).length;
    const warningCount = licenses.filter((l) => l.daysUntilExpiry > 7).length;

    const getDaysStyle = (days) => {
        if (days <= 3) return 'background:#fef2f2;color:#dc2626;font-weight:700';
        if (days <= 7) return 'background:#fff7ed;color:#ea580c;font-weight:600';
        if (days <= 15) return 'background:#fffbeb;color:#d97706';
        return 'color:#334155';
    };

    const listHtml = licenses
        .map(
            (l, i) =>
                `<tr style="background-color:${i % 2 === 0 ? '#ffffff' : '#f8fafc'}">
                    <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#334155;font-weight:500">${l.type}</td>
                    <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b">
                        ${l.equipmentId ? `<span style="background:#e0e7ff;color:#3730a3;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600">${l.equipmentId.serviceTag}</span>` : '<span style="color:#cbd5e1">—</span>'}
                    </td>
                    <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#334155">${new Date(l.expirationDate).toLocaleDateString('fr-FR')}</td>
                    <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:13px;text-align:center">
                        <span style="${getDaysStyle(l.daysUntilExpiry)};padding:4px 12px;border-radius:20px;font-size:12px;display:inline-block">${l.daysUntilExpiry}j</span>
                    </td>
                </tr>`
        )
        .join('');

    const content = `
        <h2 style="color:#1e3a5f;margin:0 0 8px;font-size:20px;font-weight:600">Alerte — Licences expirant bientot</h2>
        <p style="color:#64748b;margin:0 0 24px;font-size:14px">${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <!-- Stats Cards -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
          <tr>
            <td width="33%" style="padding-right:8px">
              <div style="background:#fef2f2;border-radius:10px;padding:16px;text-align:center">
                <p style="font-size:28px;font-weight:700;color:#dc2626;margin:0">${urgentCount}</p>
                <p style="font-size:11px;color:#991b1b;margin:4px 0 0;text-transform:uppercase;letter-spacing:0.5px">Urgent (&le;7j)</p>
              </div>
            </td>
            <td width="33%" style="padding:0 4px">
              <div style="background:#fffbeb;border-radius:10px;padding:16px;text-align:center">
                <p style="font-size:28px;font-weight:700;color:#d97706;margin:0">${warningCount}</p>
                <p style="font-size:11px;color:#92400e;margin:4px 0 0;text-transform:uppercase;letter-spacing:0.5px">Attention (&le;30j)</p>
              </div>
            </td>
            <td width="33%" style="padding-left:8px">
              <div style="background:#f0f7ff;border-radius:10px;padding:16px;text-align:center">
                <p style="font-size:28px;font-weight:700;color:#1e3a5f;margin:0">${licenses.length}</p>
                <p style="font-size:11px;color:#1e3a5f;margin:4px 0 0;text-transform:uppercase;letter-spacing:0.5px">Total</p>
              </div>
            </td>
          </tr>
        </table>

        <!-- Licenses Table -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;overflow:hidden;border:1px solid #e2e8f0">
          <thead>
            <tr style="background:linear-gradient(135deg,#1e3a5f 0%,#2d5a8e 100%)">
              <th style="padding:14px 16px;text-align:left;color:#ffffff;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600">Licence</th>
              <th style="padding:14px 16px;text-align:left;color:#ffffff;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600">Service Tag</th>
              <th style="padding:14px 16px;text-align:left;color:#ffffff;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600">Expiration</th>
              <th style="padding:14px 16px;text-align:center;color:#ffffff;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600">Reste</th>
            </tr>
          </thead>
          <tbody>${listHtml}</tbody>
        </table>

        <div style="margin-top:28px;background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:16px 20px">
          <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6">
            <strong>Action requise :</strong> Veuillez proceder au renouvellement des licences concernees afin d'eviter toute interruption de service.
          </p>
        </div>
    `;

    return sendEmail({
        to: process.env.NOTIFICATION_EMAIL || 'cloud@nextstep-it.com',
        subject: `[NextStep IT] ${licenses.length} licence(s) expirant bientot${urgentCount > 0 ? ` — ${urgentCount} urgente(s)` : ''}`,
        text: `${licenses.length} licence(s) expirent dans moins de 30 jours. ${urgentCount} urgente(s) dans les 7 prochains jours.`,
        html: emailLayout(content),
    });
};

module.exports = { sendEmail, buildExportEmailHtml, sendExpiryNotification };
