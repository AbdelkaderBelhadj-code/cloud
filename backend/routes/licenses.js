const express = require('express');
const router = express.Router();
const Joi = require('joi');
const License = require('../models/License');
const authJWT = require('../middleware/auth');
const adminRole = require('../middleware/admin');

router.use(authJWT);

const licenseSchema = Joi.object({
    type: Joi.string().trim().required(),
    licenseKey: Joi.string().allow('').optional(),
    vendor: Joi.string().allow('').optional(),
    expirationDate: Joi.date().iso().required(),
    purchaseDate: Joi.date().iso().allow(null).optional(),
    cost: Joi.number().min(0).optional(),
    seats: Joi.number().integer().min(1).optional(),
    status: Joi.string().valid('active', 'expired', 'pending').optional(),
    notes: Joi.string().allow('').optional(),
    equipmentId: Joi.string().allow(null, '').optional(),
});

// GET /api/licenses
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 20, status, type, search, expiringSoon } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (type) filter.type = { $regex: type, $options: 'i' };
        if (search) {
            filter.$or = [
                { type: { $regex: search, $options: 'i' } },
                { vendor: { $regex: search, $options: 'i' } },
                { licenseKey: { $regex: search, $options: 'i' } },
            ];
        }
        if (expiringSoon === 'true') {
            const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            filter.expirationDate = { $gte: new Date(), $lte: in30Days };
        }

        const total = await License.countDocuments(filter);
        const licenses = await License.find(filter)
            .populate('equipmentId', 'serviceTag type model')
            .populate('createdBy', 'email firstName lastName')
            .sort({ expirationDate: 1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.json({ licenses, total, page: parseInt(page), pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/licenses/:id
router.get('/:id', async (req, res) => {
    try {
        const lic = await License.findById(req.params.id)
            .populate('equipmentId', 'serviceTag type model')
            .populate('createdBy', 'email');
        if (!lic) return res.status(404).json({ message: 'License not found' });
        res.json(lic);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/licenses
router.post('/', async (req, res) => {
    try {
        const { error, value } = licenseSchema.validate(req.body, { stripUnknown: true });
        if (error) return res.status(400).json({ message: error.details[0].message });

        const lic = new License({ ...value, createdBy: req.user._id });
        await lic.save();
        await lic.populate('equipmentId', 'serviceTag type model');
        res.status(201).json(lic);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /api/licenses/:id
router.put('/:id', async (req, res) => {
    try {
        const { error, value } = licenseSchema.validate(req.body, { stripUnknown: true });
        if (error) return res.status(400).json({ message: error.details[0].message });

        // Reset notification flags if expirationDate moved back beyond a threshold
        const existing = await License.findById(req.params.id);
        if (!existing) return res.status(404).json({ message: 'License not found' });

        const update = { ...value };
        if (value.expirationDate && new Date(value.expirationDate).getTime() !== new Date(existing.expirationDate).getTime()) {
            const DAY = 24 * 60 * 60 * 1000;
            const diff = new Date(value.expirationDate).getTime() - Date.now();
            if (diff > 90 * DAY) {
                update.notifiedAt90d = null;
                update.notifiedAt30d = null;
                update.lastDailyNotificationAt = null;
            } else if (diff > 30 * DAY) {
                update.notifiedAt30d = null;
                update.lastDailyNotificationAt = null;
            }
        }

        const lic = await License.findByIdAndUpdate(req.params.id, update, {
            new: true,
            runValidators: true,
        }).populate('equipmentId', 'serviceTag type model');
        res.json(lic);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE /api/licenses/:id  (admin only)
router.delete('/:id', adminRole, async (req, res) => {
    try {
        const lic = await License.findByIdAndDelete(req.params.id);
        if (!lic) return res.status(404).json({ message: 'License not found' });
        res.json({ message: 'License deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
