const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// Middleware to authenticate admin
const authenticateAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });

  // Assume authenticated user is admin (adjust if you have roles)
  req.user = user;
  next();
};

// Public: Get all active products
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, short_description, description, category_id, images, videos, pdf_url, pricing, is_active, created_at')
      .eq('is_active', true);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public: Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('products')
      .select('id, name, short_description, description, category_id, images, videos, pdf_url, pricing, is_active, created_at')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Create product
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { name, short_description, description, category_id, images = [], videos = [], pdf_url, pricing, cost_details } = req.body;
    const { data, error } = await supabase
      .from('products')
      .insert([{ name, short_description, description, category_id, images, videos, pdf_url, pricing, cost_details, is_active: true }])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Update product
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, short_description, description, category_id, images, videos, pdf_url, pricing, cost_details, is_active } = req.body;
    const { data, error } = await supabase
      .from('products')
      .update({ name, short_description, description, category_id, images, videos, pdf_url, pricing, cost_details, is_active })
      .eq('id', id)
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Delete product (soft delete by setting inactive)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
