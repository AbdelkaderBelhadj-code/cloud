const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const Joi = require('joi');
const User = require('../models/User');
const authJWT = require('../middleware/auth');
const adminRole = require('../middleware/admin');

// ── Validation Schemas ──────────────────────────────────────────────────────
const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('admin', 'user').default('user'),
    firstName: Joi.string().allow('').optional(),
    lastName: Joi.string().allow('').optional(),
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

const verifyMfaSchema = Joi.object({
    userId: Joi.string().required(),
    token: Joi.string().length(6).required(),
});

// ── POST /api/auth/register  (Admin only — or first-time seed) ─────────────
router.post('/register', authJWT, adminRole, async (req, res) => {
    try {
        const { error, value } = registerSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const existing = await User.findOne({ email: value.email });
        if (existing) return res.status(409).json({ message: 'Email already in use' });

        // Generate MFA secret
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

        // Generate QR code
        const qrCodeUrl = await qrcode.toDataURL(mfaSecret.otpauth_url);

        res.status(201).json({
            message: 'User created',
            user: user.toJSON(),
            mfaQr: qrCodeUrl,
            mfaSecret: mfaSecret.base32,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ── POST /api/auth/register-seed  (Public — creates very first admin) ───────
router.post('/register-seed', async (req, res) => {
    try {
        const count = await User.countDocuments();
        if (count > 0) {
            return res.status(403).json({ message: 'Seed disabled — users already exist' });
        }

        const { error, value } = registerSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const mfaSecret = speakeasy.generateSecret({
            name: `LicenseMgmt (${value.email})`,
            length: 20,
        });

        const user = new User({
            ...value,
            role: 'admin',
            mfaSecret: mfaSecret.base32,
            mfaEnabled: false,
        });
        await user.save();

        const qrCodeUrl = await qrcode.toDataURL(mfaSecret.otpauth_url);

        res.status(201).json({
            message: 'Admin seeded successfully',
            user: user.toJSON(),
            mfaQr: qrCodeUrl,
            mfaSecret: mfaSecret.base32,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { error, value } = loginSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const user = await User.findOne({ email: value.email });
        if (!user || !user.isActive) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const passwordMatch = await user.comparePassword(value.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Return userId for MFA step
        res.json({
            message: 'Password valid — complete MFA',
            userId: user._id,
            requiresMfa: true,
            mfaEnabled: user.mfaEnabled,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ── POST /api/auth/verify-mfa ────────────────────────────────────────────────
router.post('/verify-mfa', async (req, res) => {
    try {
        const { error, value } = verifyMfaSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const user = await User.findById(value.userId);
        if (!user || !user.isActive) {
            return res.status(401).json({ message: 'User not found' });
        }

        const verified = speakeasy.totp.verify({
            secret: user.mfaSecret,
            encoding: 'base32',
            token: value.token,
            window: 2,
        });

        if (!verified) {
            return res.status(401).json({ message: 'Invalid MFA token' });
        }

        // Enable MFA on first successful verification
        if (!user.mfaEnabled) {
            user.mfaEnabled = true;
            await user.save();
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName,
            },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ── GET /api/auth/setup/:userId ─────────────────────────────────────────────
router.get('/setup/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.mfaEnabled) return res.status(403).json({ message: 'MFA already enabled' });

        // Re-generate the QR code from the stored secret
        const otpauth_url = speakeasy.otpauthURL({
            secret: user.mfaSecret,
            label: `LicenseMgmt (${user.email})`,
            encoding: 'base32'
        });

        const qrCodeUrl = await qrcode.toDataURL(otpauth_url);

        res.json({
            mfaQr: qrCodeUrl,
            mfaSecret: user.mfaSecret
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', authJWT, (req, res) => {
    res.json({ user: req.user });
});

module.exports = router;
