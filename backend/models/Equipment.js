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
        rack: {
            type: String,
            trim: true,
            default: '',
        },
        uStart: {
            type: Number,
            min: 1,
            default: null,
        },
        uEnd: {
            type: Number,
            min: 1,
            default: null,
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
EquipmentSchema.index({ rack: 1, uStart: 1, uEnd: 1 });

module.exports = mongoose.model('Equipment', EquipmentSchema);
