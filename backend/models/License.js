const mongoose = require('mongoose');

const LicenseSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            required: true,
            trim: true,
        },
        licenseKey: {
            type: String,
            trim: true,
            default: '',
        },
        vendor: {
            type: String,
            trim: true,
            default: '',
        },
        expirationDate: {
            type: Date,
            required: true,
        },
        purchaseDate: {
            type: Date,
            default: null,
        },
        cost: {
            type: Number,
            default: 0,
        },
        seats: {
            type: Number,
            default: 1,
        },
        status: {
            type: String,
            enum: ['active', 'expired', 'pending'],
            default: 'active',
        },
        notes: {
            type: String,
            default: '',
        },
        equipmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Equipment',
            default: null,
        },
        notificationSent: {
            type: Boolean,
            default: false,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    { timestamps: true }
);

// Virtual: days until expiration
LicenseSchema.virtual('daysUntilExpiry').get(function () {
    const now = new Date();
    const diff = this.expirationDate - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

LicenseSchema.set('toJSON', { virtuals: true });
LicenseSchema.set('toObject', { virtuals: true });

// Index for cron queries
LicenseSchema.index({ expirationDate: 1 });
LicenseSchema.index({ type: 1 });
LicenseSchema.index({ equipmentId: 1 });

module.exports = mongoose.model('License', LicenseSchema);
