const mongoose = require('mongoose');

const EquipmentSchema = new mongoose.Schema(
    {
        serviceTag: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true,
        },
        type: {
            type: String,
            required: true,
            enum: ['Serveur', 'Firewall', 'Baie stockage', 'Switch', 'Routeur'],
        },
        model: {
            type: String,
            required: true,
            trim: true,
        },
        manufacturer: {
            type: String,
            trim: true,
            default: '',
        },
        location: {
            type: String,
            trim: true,
            default: '',
        },
        purchaseDate: {
            type: Date,
            default: null,
        },
        warrantyExpiry: {
            type: Date,
            default: null,
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'maintenance'],
            default: 'active',
        },
        notes: {
            type: String,
            default: '',
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    { timestamps: true }
);

// Index for fast searches
EquipmentSchema.index({ type: 1 });
EquipmentSchema.index({ status: 1 });

module.exports = mongoose.model('Equipment', EquipmentSchema);
