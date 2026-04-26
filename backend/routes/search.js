const express = require('express');
const router = express.Router();
const Equipment = require('../models/Equipment');
const License = require('../models/License');
const authJWT = require('../middleware/auth');

router.use(authJWT);

// GET /api/search/equip?type=&search=
// Returns full list (or filtered). Used by the "Chercher Équipement" page.
router.get('/equip', async (req, res) => {
    try {
        const { type, search } = req.query;
        const filter = {};
        if (type) filter.type = type;
        if (search) {
            filter.$or = [
                { serviceTag: { $regex: search, $options: 'i' } },
                { model: { $regex: search, $options: 'i' } },
                { manufacturer: { $regex: search, $options: 'i' } },
            ];
        }

        const equipments = await Equipment.find(filter)
            .populate('createdBy', 'email firstName lastName')
            .sort({ serviceTag: 1 });

        res.json({ equipments, count: equipments.length });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/search/equip/:serviceTag — exact match by tag (legacy detail view)
router.get('/equip/:serviceTag', async (req, res) => {
    try {
        const tag = req.params.serviceTag.toUpperCase();
        const equipment = await Equipment.findOne({ serviceTag: tag })
            .populate('createdBy', 'email firstName lastName');

        if (!equipment) return res.status(404).json({ message: 'Equipment not found' });

        const licenses = await License.find({ equipmentId: equipment._id })
            .populate('category', 'name')
            .sort({ expirationDate: 1 });

        res.json({ equipment, licenses });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/search/license?status=&category=&search=
// Returns full list (or filtered). Used by the "Chercher Licence" page.
router.get('/license', async (req, res) => {
    try {
        const { status, category, search } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (category) filter.category = category;
        if (search) {
            filter.$or = [
                { type: { $regex: search, $options: 'i' } },
                { vendor: { $regex: search, $options: 'i' } },
                { licenseKey: { $regex: search, $options: 'i' } },
            ];
        }

        const licenses = await License.find(filter)
            .populate('equipmentId', 'serviceTag type model')
            .populate('category', 'name')
            .sort({ expirationDate: 1 });

        res.json({ licenses, count: licenses.length });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/search/license/:type — regex match by type (legacy)
router.get('/license/:type', async (req, res) => {
    try {
        const licenses = await License.find({
            type: { $regex: req.params.type, $options: 'i' },
        })
            .populate('equipmentId', 'serviceTag type model')
            .populate('category', 'name')
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
                .populate('category', 'name')
                .limit(10),
        ]);

        res.json({ equipments, licenses });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
