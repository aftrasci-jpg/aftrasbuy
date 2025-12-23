const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes that need JSON parsing
app.use('/api/products', express.json({ limit: '10mb' }), require('./routes/products'));
app.use('/api/categories', express.json({ limit: '10mb' }), require('./routes/categories'));

// Special route for file uploads (before JSON parsing)
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});
const supabase = require('./supabaseClient');

// File upload route (must be before JSON middleware)
app.post('/api/admin/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('📤 Upload API called');
    console.log('Headers:', req.headers);
    console.log('File:', req.file ? { name: req.file.originalname, size: req.file.size, type: req.file.mimetype } : 'No file');

    if (!req.file) {
      console.log('No file provided');
      return res.status(400).json({ error: 'No file provided' });
    }

    // Check authentication
    const token = req.headers.authorization?.split(' ')[1];
    console.log('Token present:', !!token);

    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ error: 'No token provided' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    console.log('Auth result:', { user: !!user, error });

    if (error || !user) {
      console.log('Invalid token');
      return res.status(401).json({ error: 'Invalid token' });
    }

    const file = req.file;
    const fileName = `${Date.now()}_${file.originalname}`;
    console.log('Uploading file:', fileName);

    const { data, error: uploadError } = await supabase.storage
      .from('catalogue')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    console.log('Storage upload result:', { data: !!data, error: uploadError });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('catalogue')
      .getPublicUrl(fileName);

    console.log('Upload successful, URL:', publicUrl);
    res.json({ url: publicUrl });
  } catch (err) {
    console.error('📤 Upload API error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Admin routes with JSON parsing
app.use('/api/admin', express.json({ limit: '10mb' }), require('./routes/admin'));

// Public routes for frontend
app.get('/api/agents/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { data, error } = await require('./supabaseClient')
      .from('agents')
      .select('id, name, whatsapp_number')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(404).json({ error: 'Agent not found' });
  }
});

app.get('/api/settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { data, error } = await require('./supabaseClient')
      .from('settings')
      .select('value')
      .eq('key', key)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(404).json({ error: 'Setting not found' });
  }
});

// Public route for carousel images - MODE AUTOMATIQUE
app.get('/api/carousel', async (req, res) => {
  try {
    console.log('🎠 Carousel API called');
    const supabase = require('./supabaseClient');

    // Get current week number for consistent weekly selection
    const now = new Date();
    const weekNumber = Math.floor((now - new Date(now.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000));
    console.log('Week number:', weekNumber);

    // Use week number as seed for consistent random selection
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, images')
      .eq('is_active', true)
      .not('images', 'is', null)
      .neq('images', '{}');

    console.log('Products query result:', { count: products?.length, error });

    if (error) {
      console.error('Products query error:', error);
      throw error;
    }

    // Filter products that have images
    const productsWithImages = products.filter(p => p.images && p.images.length > 0);
    console.log('Products with images:', productsWithImages.length);

    if (productsWithImages.length === 0) {
      console.log('No products with images, using fallback');
      // Fallback to static images if no products with images
      return res.json([
        {
          title: 'Bienvenue sur notre catalogue',
          description: 'Découvrez notre sélection de produits',
          image_url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&h=400&fit=crop',
          link_url: '#products'
        }
      ]);
    }

    // Simple seeded random selection based on week
    const selectedProducts = [];
    const shuffled = [...productsWithImages];

    // Simple shuffle with week-based seed
    for (let i = shuffled.length - 1; i > 0; i--) {
      const seed = (weekNumber + i) % shuffled.length;
      [shuffled[i], shuffled[seed]] = [shuffled[seed], shuffled[i]];
    }

    // Take first 4 products (or all if less than 4)
    const maxImages = Math.min(4, shuffled.length);
    console.log('Selecting', maxImages, 'products for carousel');

    for (let i = 0; i < maxImages; i++) {
      const product = shuffled[i];
      selectedProducts.push({
        title: product.name,
        description: 'Découvrez ce produit',
        image_url: product.images[0], // Use first image
        link_url: `#product-${product.id}` // Link to product
      });
    }

    console.log('Carousel response:', selectedProducts);
    res.json(selectedProducts);
  } catch (err) {
    console.error('🎠 Carousel API error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Serve static files
app.use(express.static('public'));

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Health check
app.get('/api/health', (req, res) => {
  res.send('Catalog Backend API - OK');
});

// Debug route for testing
app.get('/api/debug', async (req, res) => {
  try {
    const supabase = require('./supabaseClient');

    // Test products query
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('count')
      .limit(1);

    // Test storage bucket
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    res.json({
      timestamp: new Date().toISOString(),
      products: { count: products?.length || 0, error: productsError?.message },
      storage: {
        buckets: buckets?.map(b => b.name) || [],
        hasCatalogue: buckets?.some(b => b.name === 'catalogue'),
        error: bucketsError?.message
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Debug route: http://localhost:${port}/api/debug`);
  console.log(`Health check: http://localhost:${port}/api/health`);
});

// Handle server errors
server.on('error', (err) => {
  console.error('Server error:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = app;
