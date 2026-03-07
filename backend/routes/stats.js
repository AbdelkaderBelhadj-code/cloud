const express = require('express');
const router = express.Router();
const Equipment = require('../models/Equipment');
const License = require('../models/License');
const User = require('../models/User');
const authJWT = require('../middleware/auth');

router.use(authJWT);

// GET /api/stats
router.get('/', async (req, res) => {
    try {
        const now = new Date();
        const endOfWeek = new Date(now);
        endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
        endOfWeek.setHours(23, 59, 59, 999);

        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

        const [
            equipmentByType,
            equipmentByStatus,
            totalEquipment,
            licensesByStatus,
            totalLicenses,
            expiringThisWeek,
            expiringThisMonth,
            expiredLicenses,
            costAggregation,
            upcomingRenewals,
            recentEquipments,
            recentLicenses,
            totalUsers,
            licensesByMonth,
        ] = await Promise.all([
            // Equipment grouped by type
            Equipment.aggregate([
                { $group: { _id: '$type', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),

            // Equipment grouped by status
            Equipment.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),

            // Total equipment
            Equipment.countDocuments(),

            // Licenses grouped by status
            License.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),

            // Total licenses
            License.countDocuments(),

            // Licenses expiring this week
            License.countDocuments({
                expirationDate: { $gte: now, $lte: endOfWeek },
                status: { $ne: 'expired' },
            }),

            // Licenses expiring this month
            License.countDocuments({
                expirationDate: { $gte: now, $lte: endOfMonth },
                status: { $ne: 'expired' },
            }),

            // Already expired licenses
            License.countDocuments({
                $or: [
                    { status: 'expired' },
                    { expirationDate: { $lt: now }, status: { $ne: 'expired' } },
                ],
            }),

            // Total cost and average cost
            License.aggregate([
                {
                    $group: {
                        _id: null,
                        totalCost: { $sum: '$cost' },
                        avgCost: { $avg: '$cost' },
                        totalSeats: { $sum: '$seats' },
                    },
                },
            ]),

            // Upcoming renewals (active licenses expiring in next 90 days)
            License.find({
                expirationDate: { $gte: now, $lte: in90Days },
                status: { $ne: 'expired' },
            })
                .select('type vendor expirationDate cost equipmentId')
                .populate('equipmentId', 'serviceTag type')
                .sort({ expirationDate: 1 })
                .limit(10),

            // Recently added equipment
            Equipment.find()
                .select('serviceTag type model status createdAt')
                .sort({ createdAt: -1 })
                .limit(5),

            // Recently added licenses
            License.find()
                .select('type vendor status expirationDate cost createdAt')
                .sort({ createdAt: -1 })
                .limit(5),

            // Total users
            User.countDocuments(),

            // Licenses expiring by month (next 12 months)
            License.aggregate([
                {
                    $match: {
                        expirationDate: {
                            $gte: now,
                            $lte: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()),
                        },
                        status: { $ne: 'expired' },
                    },
                },
                {
                    $group: {
                        _id: {
                            year: { $year: '$expirationDate' },
                            month: { $month: '$expirationDate' },
                        },
                        count: { $sum: 1 },
                        totalCost: { $sum: '$cost' },
                    },
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } },
            ]),
        ]);

        // Format equipment by type as { name, value }
        const equipmentTypeData = equipmentByType.map((item) => ({
            name: item._id,
            value: item.count,
        }));

        // Format equipment by status
        const equipmentStatusData = equipmentByStatus.map((item) => ({
            name: item._id,
            value: item.count,
        }));

        // Format license status
        const licenseStatusData = licensesByStatus.map((item) => ({
            name: item._id,
            value: item.count,
        }));

        // Format cost data
        const costs = costAggregation[0] || { totalCost: 0, avgCost: 0, totalSeats: 0 };

        // Calculate upcoming renewal cost (next 90 days)
        const upcomingRenewalCost = upcomingRenewals.reduce((sum, lic) => sum + (lic.cost || 0), 0);

        // Format licenses by month for the bar chart
        const monthNames = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'];
        const expirationsByMonth = licensesByMonth.map((item) => ({
            name: monthNames[item._id.month - 1] + ' ' + item._id.year,
            count: item.count,
            cost: item.totalCost,
        }));

        res.json({
            overview: {
                totalEquipment,
                totalLicenses,
                totalUsers,
                totalSeats: costs.totalSeats,
            },
            equipment: {
                byType: equipmentTypeData,
                byStatus: equipmentStatusData,
            },
            licenses: {
                byStatus: licenseStatusData,
                expiringThisWeek,
                expiringThisMonth,
                expired: expiredLicenses,
                expirationsByMonth,
            },
            costs: {
                totalSpend: costs.totalCost,
                averageCost: Math.round(costs.avgCost * 100) / 100,
                upcomingRenewalCost,
            },
            upcomingRenewals,
            recent: {
                equipments: recentEquipments,
                licenses: recentLicenses,
            },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
