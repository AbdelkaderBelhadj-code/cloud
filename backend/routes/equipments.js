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
    location: Joi.string().allow('').optional(),
    purchaseDate: Joi.date().iso().allow(null).optional(),
    warrantyExpiry: Joi.date().iso().allow(null).optional(),
    status: Joi.string().valid('active', 'inactive', 'maintenance').optional(),
    notes: Joi.string().allow('').optional(),
});

// GET /api/equipments
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 20, type, status, search } = req.query;
        const filter = {};
        if (type) filter.type = type;
        if (status) filter.status = status;
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

// POST /api/equipments
router.post('/', async (req, res) => {
    try {
        const { error, value } = equipSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const existing = await Equipment.findOne({ serviceTag: value.serviceTag });
        if (existing) return res.status(409).json({ message: 'Service tag already exists' });

        const eq = new Equipment({ ...value, createdBy: req.user._id });
        await eq.save();
        res.status(201).json(eq);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /api/equipments/:id
router.put('/:id', async (req, res) => {
    try {
        const { error, value } = equipSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

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

// DELETE /api/equipments/:id  (admin only)
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
