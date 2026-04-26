const express = require('express');
const router = express.Router();
const Joi = require('joi');
const Equipment = require('../models/Equipment');
const authJWT = require('../middleware/auth');
const adminRole = require('../middleware/admin');

router.use(authJWT);

const equipSchema = Joi.object({
    serviceTag: Joi.string().uppercase().trim().required(),
    type: Joi.string().valid('Serveur', 'Firewall', 'Baie stockage', 'Switch', 'Routeur').required(),
    model: Joi.string().trim().required(),
    manufacturer: Joi.string().allow('').optional(),
    rack: Joi.string().allow('').optional(),
    uStart: Joi.number().integer().min(1).allow(null).optional(),
    uEnd: Joi.number().integer().min(1).allow(null).optional(),
    purchaseDate: Joi.date().iso().allow(null).optional(),
    warrantyExpiry: Joi.date().iso().allow(null).optional(),
    status: Joi.string().valid('active', 'inactive', 'maintenance').optional(),
    notes: Joi.string().allow('').optional(),
});

/** Returns the conflicting equipment in the same rack, or null. */
async function findRackConflict({ rack, uStart, uEnd, excludeId }) {
    if (!rack || uStart == null || uEnd == null) return null;
    if (uEnd < uStart) {
        return { _conflict: 'range', message: 'uEnd must be >= uStart' };
    }
    const filter = {
        rack,
        uStart: { $ne: null },
        uEnd: { $ne: null },
        // overlap: existing.uStart <= new.uEnd && existing.uEnd >= new.uStart
        $expr: {
            $and: [
                { $lte: ['$uStart', uEnd] },
                { $gte: ['$uEnd', uStart] },
            ],
        },
    };
    if (excludeId) filter._id = { $ne: excludeId };
    return Equipment.findOne(filter);
}

// GET /api/equipments
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 20, type, status, rack, search } = req.query;
        const filter = {};
        if (type) filter.type = type;
        if (status) filter.status = status;
        if (rack) filter.rack = rack;
        if (search) {
            filter.$or = [
                { serviceTag: { $regex: search, $options: 'i' } },
                { model: { $regex: search, $options: 'i' } },
                { manufacturer: { $regex: search, $options: 'i' } },
            ];
        }

        const total = await Equipment.countDocuments(filter);
        const equipments = await Equipment.find(filter)
            .populate('createdBy', 'email firstName lastName')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.json({ equipments, total, page: parseInt(page), pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/equipments/:id
router.get('/:id', async (req, res) => {
    try {
        const eq = await Equipment.findById(req.params.id).populate('createdBy', 'email firstName lastName');
        if (!eq) return res.status(404).json({ message: 'Equipment not found' });
        res.json(eq);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/equipments  (admin)
router.post('/', adminRole, async (req, res) => {
    try {
        const { error, value } = equipSchema.validate(req.body, { stripUnknown: true });
        if (error) return res.status(400).json({ message: error.details[0].message });

        const existing = await Equipment.findOne({ serviceTag: value.serviceTag });
        if (existing) return res.status(409).json({ message: 'Service tag already exists' });

        const conflict = await findRackConflict({
            rack: value.rack,
            uStart: value.uStart,
            uEnd: value.uEnd,
        });
        if (conflict?._conflict === 'range') {
            return res.status(400).json({ message: conflict.message });
        }
        if (conflict) {
            return res.status(409).json({
                message: `Rack ${value.rack} overlap with ${conflict.serviceTag} (U${conflict.uStart}-${conflict.uEnd})`,
            });
        }

        const eq = new Equipment({ ...value, createdBy: req.user._id });
        await eq.save();
        res.status(201).json(eq);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /api/equipments/:id  (admin)
router.put('/:id', adminRole, async (req, res) => {
    try {
        const { error, value } = equipSchema.validate(req.body, { stripUnknown: true });
        if (error) return res.status(400).json({ message: error.details[0].message });

        const conflict = await findRackConflict({
            rack: value.rack,
            uStart: value.uStart,
            uEnd: value.uEnd,
            excludeId: req.params.id,
        });
        if (conflict?._conflict === 'range') {
            return res.status(400).json({ message: conflict.message });
        }
        if (conflict) {
            return res.status(409).json({
                message: `Rack ${value.rack} overlap with ${conflict.serviceTag} (U${conflict.uStart}-${conflict.uEnd})`,
            });
        }

        const eq = await Equipment.findByIdAndUpdate(req.params.id, value, {
            new: true,
            runValidators: true,
        });
        if (!eq) return res.status(404).json({ message: 'Equipment not found' });
        res.json(eq);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE /api/equipments/:id  (admin)
router.delete('/:id', adminRole, async (req, res) => {
    try {
        const eq = await Equipment.findByIdAndDelete(req.params.id);
        if (!eq) return res.status(404).json({ message: 'Equipment not found' });
        res.json({ message: 'Equipment deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
