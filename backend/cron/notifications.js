const cron = require('node-cron');
const License = require('../models/License');
const { sendExpiryNotification } = require('../utils/email');

/**
 * Daily cron at 08:00 — check licenses expiring in ≤ 30 days
 */
cron.schedule('0 8 * * *', async () => {
    console.log('[CRON] Checking licenses expiring soon...');

    try {
        const now = new Date();
        const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        // Mark past-due licenses as expired
        const expiredResult = await License.updateMany(
            { expirationDate: { $lt: now }, status: { $ne: 'expired' } },
            { status: 'expired' }
        );
        if (expiredResult.modifiedCount > 0) {
            console.log(`[CRON] Marked ${expiredResult.modifiedCount} license(s) as expired.`);
        }

        // Find licenses expiring within 30 days that haven't been notified yet
        const expiringLicenses = await License.find({
            expirationDate: { $gte: now, $lte: in30Days },
            status: { $ne: 'expired' },
            notificationSent: false,
        }).populate('equipmentId', 'serviceTag type model');

        if (expiringLicenses.length === 0) {
            console.log('[CRON] No new licenses expiring soon. Skipping notification.');
            return;
        }

        await sendExpiryNotification(expiringLicenses);
        console.log(`[CRON] Notification sent for ${expiringLicenses.length} license(s).`);

        // Mark notified licenses so they are not re-notified
        await License.updateMany(
            { _id: { $in: expiringLicenses.map((l) => l._id) } },
            { notificationSent: true }
        );
    } catch (err) {
        console.error('[CRON] Error during license check:', err.message);
    }
});

console.log('[CRON] License notification scheduler started (daily @ 08:00)');
