const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Middleware to authenticate admin
const authenticateAdmin = async (req, res, next) => {
  console.log('Auth middleware called');
  console.log('Headers:', req.headers.authorization);

  const token = req.headers.authorization?.split(' ')[1];
  console.log('Extracted token:', token ? token.substring(0, 50) + '...' : 'null');

  if (!token) {
    console.log('No token provided in request');
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Validate the JWT token with Supabase
    console.log('Validating token with Supabase...');
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.log('Token validation failed:', error?.message);
      return res.status(401).json({ error: 'Invalid token' });
    }

    console.log('Token validation passed for user:', user.email);
    req.user = user; // Store user info for later use
    req.token = token; // Store token for potential future use
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};



// Update admin credentials (email and/or password)
router.put('/credentials', authenticateAdmin, async (req, res) => {
  try {
    const { email, password } = req.body;

    const updates = {};
    if (email) updates.email = email;
    if (password) updates.password = password;

    const { data, error } = await supabase.auth.updateUser(updates);
    if (error) throw error;

    res.json({ message: 'Credentials updated successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});



// Agents management
router.get('/agents', authenticateAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/agents', authenticateAdmin, async (req, res) => {
  try {
    const { name, whatsapp_number, slug } = req.body;
    const { data, error } = await supabase
      .from('agents')
      .insert([{ name, whatsapp_number, slug, is_active: true }])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/agents/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, whatsapp_number, slug, is_active } = req.body;
    const { data, error } = await supabase
      .from('agents')
      .update({ name, whatsapp_number, slug, is_active })
      .eq('id', id)
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/agents/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Categories management
router.get('/categories', authenticateAdmin, async (req, res) => {
  try {
    console.log('🔍 Fetching categories for admin:', req.user?.email);

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('📊 Categories query result:', { count: data?.length, error: error?.message });

    if (error) {
      console.error('❌ Categories query error:', error);
      throw error;
    }

    res.json(data);
  } catch (err) {
    console.error('❌ Categories API error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/categories', authenticateAdmin, async (req, res) => {
  try {
    const { name, description, image_url } = req.body;
    const { data, error } = await supabase
      .from('categories')
      .insert([{ name, description, image_url }])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/categories/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image_url } = req.body;
    const { data, error } = await supabase
      .from('categories')
      .update({ name, description, image_url })
      .eq('id', id)
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/categories/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Settings management
router.get('/settings/:key', authenticateAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    console.log('GET /settings/:key - key:', key);

    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', key)
      .single();

    if (error) {
      console.log('Settings GET error:', error);
      // If setting doesn't exist, return default values
      if (error.code === 'PGRST116') { // No rows returned
        const defaultValues = {
          'site_logo': 'https://images.unsplash.com/photo-1557683316-973673baf926?w=200&h=60&fit=crop',
          'site_whatsapp': '+22507080910'
        };

        const defaultValue = defaultValues[key];
        if (defaultValue) {
          console.log('Returning default value for', key, ':', defaultValue);
          return res.json({ value: defaultValue });
        }
      }
      throw error;
    }

    console.log('Settings GET success:', { key, value: data.value });
    res.json({ value: data.value });
  } catch (err) {
    console.error('GET /settings error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/settings/:key', authenticateAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    console.log('PUT /settings/:key - key:', key, 'value:', value);

    const { data, error } = await supabase
      .from('settings')
      .upsert({ key, value, updated_at: new Date().toISOString() })
      .select();

    if (error) {
      console.error('Settings upsert error:', error);
      throw error;
    }

    console.log('Settings upsert success:', data);
    res.json(data[0]);
  } catch (err) {
    console.error('PUT /settings error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Test routes for debugging
router.get('/test-categories', async (req, res) => {
  try {
    console.log('🧪 Testing categories table access...');

    // Test without authentication first
    const { data, error } = await supabase
      .from('categories')
      .select('count')
      .limit(1);

    console.log('🧪 Categories test result:', { count: data?.length, error: error?.message });

    if (error) {
      console.error('🧪 Categories test error:', error);
      return res.status(500).json({
        error: error.message,
        details: error,
        hint: 'Check if categories table exists and RLS policies allow access'
      });
    }

    res.json({
      success: true,
      message: 'Categories table accessible',
      count: data?.length || 0
    });
  } catch (err) {
    console.error('🧪 Test route error:', err);
    res.status(500).json({
      error: err.message,
      hint: 'Database connection issue'
    });
  }
});

router.get('/test-settings', async (req, res) => {
  try {
    console.log('🧪 Testing settings table access...');

    // Test settings table access
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .limit(5);

    console.log('🧪 Settings test result:', { count: data?.length, error: error?.message, data });

    if (error) {
      console.error('🧪 Settings test error:', error);
      return res.status(500).json({
        error: error.message,
        details: error,
        hint: 'Check if settings table exists and has data'
      });
    }

    res.json({
      success: true,
      message: 'Settings table accessible',
      count: data?.length || 0,
      settings: data
    });
  } catch (err) {
    console.error('🧪 Settings test route error:', err);
    res.status(500).json({
      error: err.message,
      hint: 'Database connection issue'
    });
  }
});

// Video support is already implemented in the upload system
// Videos are accepted via accept="video/*" in the HTML
// Videos are stored in the products.videos array field

module.exports = router;
