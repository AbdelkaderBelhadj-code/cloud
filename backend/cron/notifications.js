const cron = require('node-cron');
const License = require('../models/License');
const { sendExpiryNotification } = require('../utils/email');

const DAY = 24 * 60 * 60 * 1000;

/**
 * Daily cron at 08:00 — tiered expiry notifications:
 *   • T-90d : one-shot "preavis 90 jours"
 *   • T-30d : one-shot "preavis 30 jours"
 *   • T-30d → T-0 : daily rappel
 *   • T<0  : flip status to 'expired'
 */
cron.schedule('0 8 * * *', async () => {
    console.log('[CRON] Checking license expiry tiers...');

    try {
        const now = new Date();
        const in30Days = new Date(now.getTime() + 30 * DAY);
        const in90Days = new Date(now.getTime() + 90 * DAY);
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);

        // Pass A — expire past-due
        const expiredResult = await License.updateMany(
            { expirationDate: { $lt: now }, status: { $ne: 'expired' } },
            { status: 'expired' }
        );
        if (expiredResult.modifiedCount > 0) {
            console.log(`[CRON] Marked ${expiredResult.modifiedCount} license(s) as expired.`);
        }

        // Pass B — 90-day preavis (one-shot)
        const list90 = await License.find({
            expirationDate: { $gt: in30Days, $lte: in90Days },
            status: { $ne: 'expired' },
            notifiedAt90d: null,
        }).populate('equipmentId', 'serviceTag type model');

        if (list90.length > 0) {
            await sendExpiryNotification(list90, { stage: '90d' });
            await License.updateMany(
                { _id: { $in: list90.map((l) => l._id) } },
                { notifiedAt90d: now }
            );
            console.log(`[CRON] 90-day preavis sent for ${list90.length} license(s).`);
        }

        // Pass C — 30-day preavis (one-shot)
        const list30 = await License.find({
            expirationDate: { $gt: now, $lte: in30Days },
            status: { $ne: 'expired' },
            notifiedAt30d: null,
        }).populate('equipmentId', 'serviceTag type model');

        if (list30.length > 0) {
            await sendExpiryNotification(list30, { stage: '30d' });
            await License.updateMany(
                { _id: { $in: list30.map((l) => l._id) } },
                { notifiedAt30d: now, lastDailyNotificationAt: now }
            );
            console.log(`[CRON] 30-day preavis sent for ${list30.length} license(s).`);
        }

        // Pass D — daily rappel inside the final 30 days
        const listDaily = await License.find({
            expirationDate: { $gt: now, $lte: in30Days },
            status: { $ne: 'expired' },
            notifiedAt30d: { $ne: null },
            $or: [
                { lastDailyNotificationAt: null },
                { lastDailyNotificationAt: { $lt: startOfDay } },
            ],
        }).populate('equipmentId', 'serviceTag type model');

        if (listDaily.length > 0) {
            await sendExpiryNotification(listDaily, { stage: 'daily' });
            await License.updateMany(
                { _id: { $in: listDaily.map((l) => l._id) } },
                { lastDailyNotificationAt: now }
            );
            console.log(`[CRON] Daily rappel sent for ${listDaily.length} license(s).`);
        }

        if (list90.length === 0 && list30.length === 0 && listDaily.length === 0) {
            console.log('[CRON] No notifications to send.');
        }
    } catch (err) {
        console.error('[CRON] Error during license check:', err.message);
    }
});

console.log('[CRON] License notification scheduler started (daily @ 08:00)');
