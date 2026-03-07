const express = require('express');
const router = express.Router();
const Equipment = require('../models/Equipment');
const License = require('../models/License');
const authJWT = require('../middleware/auth');

router.use(authJWT);

// GET /api/search/equip/:serviceTag
router.get('/equip/:serviceTag', async (req, res) => {
    try {
        const tag = req.params.serviceTag.toUpperCase();
        const equipment = await Equipment.findOne({ serviceTag: tag })
            .populate('createdBy', 'email firstName lastName');

        if (!equipment) return res.status(404).json({ message: 'Equipment not found' });

        // Also fetch all licenses tied to this equipment
        const licenses = await License.find({ equipmentId: equipment._id })
            .sort({ expirationDate: 1 });

        res.json({ equipment, licenses });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/search/license/:type
router.get('/license/:type', async (req, res) => {
    try {
        const licenses = await License.find({
            type: { $regex: req.params.type, $options: 'i' },
        })
            .populate('equipmentId', 'serviceTag type model')
            .sort({ expirationDate: 1 });

        res.json({ licenses, count: licenses.length });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/search/global?q=term
router.get('/global', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ message: 'Query parameter q is required' });

        const [equipments, licenses] = await Promise.all([
            Equipment.find({
                $or: [
                    { serviceTag: { $regex: q, $options: 'i' } },
                    { model: { $regex: q, $options: 'i' } },
                    { manufacturer: { $regex: q, $options: 'i' } },
                ],
            }).limit(10),
            License.find({
                $or: [
                    { type: { $regex: q, $options: 'i' } },
                    { vendor: { $regex: q, $options: 'i' } },
                    { licenseKey: { $regex: q, $options: 'i' } },
                ],
            })
                .populate('equipmentId', 'serviceTag type')
                .limit(10),
        ]);

        res.json({ equipments, licenses });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
