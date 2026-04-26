const express = require('express');
const router = express.Router();
const Joi = require('joi');
const Category = require('../models/Category');
const License = require('../models/License');
const authJWT = require('../middleware/auth');
const adminRole = require('../middleware/admin');

router.use(authJWT);

const categorySchema = Joi.object({
    name: Joi.string().trim().required(),
});

// GET /api/categories  — anyone (used by dropdowns)
router.get('/', async (req, res) => {
    try {
        const cats = await Category.find().sort({ name: 1 });
        res.json(cats);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/categories  — admin
router.post('/', adminRole, async (req, res) => {
    try {
        const { error, value } = categorySchema.validate(req.body, { stripUnknown: true });
        if (error) return res.status(400).json({ message: error.details[0].message });

        const existing = await Category.findOne({ name: value.name });
        if (existing) return res.status(409).json({ message: 'Category already exists' });

        const cat = await Category.create(value);
        res.status(201).json(cat);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /api/categories/:id  — admin
router.put('/:id', adminRole, async (req, res) => {
    try {
        const { error, value } = categorySchema.validate(req.body, { stripUnknown: true });
        if (error) return res.status(400).json({ message: error.details[0].message });

        const cat = await Category.findByIdAndUpdate(req.params.id, value, {
            new: true,
            runValidators: true,
        });
        if (!cat) return res.status(404).json({ message: 'Category not found' });
        res.json(cat);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE /api/categories/:id  — admin
// Refuses if any license still references the category.
router.delete('/:id', adminRole, async (req, res) => {
    try {
        const inUse = await License.countDocuments({ category: req.params.id });
        if (inUse > 0) {
            return res.status(409).json({
                message: `Cannot delete: ${inUse} license(s) still reference this category.`,
            });
        }
        const cat = await Category.findByIdAndDelete(req.params.id);
        if (!cat) return res.status(404).json({ message: 'Category not found' });
        res.json({ message: 'Category deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
