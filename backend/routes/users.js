const express = require('express');
const router = express.Router();
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const Joi = require('joi');
const User = require('../models/User');
const authJWT = require('../middleware/auth');
const adminRole = require('../middleware/admin');

// All routes: authJWT + adminRole
router.use(authJWT, adminRole);

const createUserSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('admin', 'user').default('user'),
    firstName: Joi.string().allow('').optional(),
    lastName: Joi.string().allow('').optional(),
});

const updateUserSchema = Joi.object({
    email: Joi.string().email().optional(),
    password: Joi.string().min(6).optional(),
    role: Joi.string().valid('admin', 'user').optional(),
    firstName: Joi.string().allow('').optional(),
    lastName: Joi.string().allow('').optional(),
    isActive: Joi.boolean().optional(),
});

// GET /api/users
router.get('/', async (req, res) => {
    try {
        const users = await User.find().select('-password -mfaSecret').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/users
router.post('/', async (req, res) => {
    try {
        const { error, value } = createUserSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const existing = await User.findOne({ email: value.email });
        if (existing) return res.status(409).json({ message: 'Email already in use' });

        const mfaSecret = speakeasy.generateSecret({
            name: `LicenseMgmt (${value.email})`,
            length: 20,
        });

        const user = new User({
            ...value,
            mfaSecret: mfaSecret.base32,
            mfaEnabled: false,
        });
        await user.save();

        const qrCodeUrl = await qrcode.toDataURL(mfaSecret.otpauth_url);

        res.status(201).json({
            user: user.toJSON(),
            mfaQr: qrCodeUrl,
            mfaSecret: mfaSecret.base32,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password -mfaSecret');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /api/users/:id
router.put('/:id', async (req, res) => {
    try {
        const { error, value } = updateUserSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        // Prevent admin from deactivating themselves
        if (req.params.id === req.user._id.toString() && value.isActive === false) {
            return res.status(400).json({ message: 'Cannot deactivate your own account' });
        }

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        Object.assign(user, value);
        await user.save();

        res.json(user.toJSON());
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
    try {
        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/users/:id/reset-mfa
router.post('/:id/reset-mfa', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const mfaSecret = speakeasy.generateSecret({
            name: `LicenseMgmt (${user.email})`,
            length: 20,
        });
        user.mfaSecret = mfaSecret.base32;
        user.mfaEnabled = false;
        await user.save();

        const qrCodeUrl = await qrcode.toDataURL(mfaSecret.otpauth_url);
        res.json({ mfaQr: qrCodeUrl, mfaSecret: mfaSecret.base32 });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
