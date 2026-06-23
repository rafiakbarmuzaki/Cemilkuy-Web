// routes/products.js
// CRUD lengkap untuk produk cemilan

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, checkRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

// ─────────────────────────────────────────────
// GET SEMUA PRODUK (dengan search, filter, pagination)
// URL: GET /api/products
// URL dengan filter: GET /api/products?search=basreng&category=gorengan&page=1&limit=10
// Bisa diakses siapa saja (tidak perlu login)
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        // Ambil parameter dari URL query
        const search = req.query.search || '';
        const category = req.query.category || '';
        const page = parseInt(req.query.page) || 1;    // halaman ke berapa
        const limit = parseInt(req.query.limit) || 12; // berapa item per halaman
        const offset = (page - 1) * limit;             // lewati berapa item

        // Buat query SQL dengan kondisi dinamis
        let whereClause = 'WHERE p.stock > 0'; // hanya tampilkan yang masih ada stok
        let params = [];

        if (search) {
            whereClause += ' AND (p.name LIKE ? OR p.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (category) {
            whereClause += ' AND p.category = ?';
            params.push(category);
        }

        // Hitung total produk untuk pagination
        const [countResult] = await db.execute(
            `SELECT COUNT(*) as total FROM products p ${whereClause}`,
            params
        );
        const total = countResult[0].total;

        // Ambil produk sesuai halaman
        const [products] = await db.execute(
            `SELECT p.*, u.username as seller_username, u.shop_name
             FROM products p
             JOIN users u ON p.seller_id = u.user_id
             ${whereClause}
             ORDER BY p.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        res.json({
            success: true,
            data: products,
            pagination: {
                current_page: page,
                per_page: limit,
                total: total,
                total_pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error get products:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

// ─────────────────────────────────────────────
// GET DETAIL PRODUK
// URL: GET /api/products/:id
// ─────────────────────────────────────────────
router.get('/:id', async (req, res) => {
    try {
        const [products] = await db.execute(
            `SELECT p.*, u.username as seller_username, u.shop_name, u.phone as seller_phone
             FROM products p
             JOIN users u ON p.seller_id = u.user_id
             WHERE p.product_id = ?`,
            [req.params.id]
        );

        if (products.length === 0) {
            return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
        }

        res.json({ success: true, data: products[0] });

    } catch (error) {
        console.error('Error get product detail:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

// ─────────────────────────────────────────────
// TAMBAH PRODUK (hanya seller atau admin)
// URL: POST /api/products
// Perlu login sebagai seller atau admin
// ─────────────────────────────────────────────
router.post('/', verifyToken, checkRole('seller', 'admin'), upload.single('image'), async (req, res) => {
    try {
        const { name, category, price, stock, discount, description } = req.body;

        // Validasi input wajib
        if (!name || !category || !price || !stock) {
            return res.status(400).json({
                success: false,
                message: 'Name, category, price, dan stock wajib diisi'
            });
        }

        // Jika ada gambar yang diupload, buat URL-nya
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

        const [result] = await db.execute(
            `INSERT INTO products (seller_id, name, category, price, stock, discount, description, image)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.user.user_id, // seller_id = user yang sedang login
                name,
                category,
                parseFloat(price),
                parseInt(stock),
                parseInt(discount) || 0,
                description || '',
                imageUrl
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Produk berhasil ditambahkan',
            data: { product_id: result.insertId }
        });

    } catch (error) {
        console.error('Error tambah produk:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

// ─────────────────────────────────────────────
// UPDATE PRODUK
// URL: PUT /api/products/:id
// Hanya seller yang punya produk ini, atau admin
// ─────────────────────────────────────────────
router.put('/:id', verifyToken, checkRole('seller', 'admin'), upload.single('image'), async (req, res) => {
    try {
        const productId = req.params.id;

        // Cek apakah produk ada dan milik seller ini
        const [products] = await db.execute(
            'SELECT * FROM products WHERE product_id = ?',
            [productId]
        );

        if (products.length === 0) {
            return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
        }

        const product = products[0];

        // Admin bisa edit produk siapa saja, seller hanya produknya sendiri
        if (req.user.role === 'seller' && product.seller_id !== req.user.user_id) {
            return res.status(403).json({
                success: false,
                message: 'Kamu tidak berhak mengubah produk ini'
            });
        }

        const { name, category, price, stock, discount, description } = req.body;
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : product.image;

        await db.execute(
            `UPDATE products
             SET name = ?, category = ?, price = ?, stock = ?, discount = ?, description = ?, image = ?
             WHERE product_id = ?`,
            [
                name || product.name,
                category || product.category,
                parseFloat(price) || product.price,
                parseInt(stock) || product.stock,
                parseInt(discount) !== undefined ? parseInt(discount) : product.discount,
                description || product.description,
                imageUrl,
                productId
            ]
        );

        res.json({ success: true, message: 'Produk berhasil diupdate' });

    } catch (error) {
        console.error('Error update produk:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

// ─────────────────────────────────────────────
// HAPUS PRODUK
// URL: DELETE /api/products/:id
// ─────────────────────────────────────────────
router.delete('/:id', verifyToken, checkRole('seller', 'admin'), async (req, res) => {
    try {
        const productId = req.params.id;

        const [products] = await db.execute(
            'SELECT * FROM products WHERE product_id = ?',
            [productId]
        );

        if (products.length === 0) {
            return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
        }

        if (req.user.role === 'seller' && products[0].seller_id !== req.user.user_id) {
            return res.status(403).json({
                success: false,
                message: 'Kamu tidak berhak menghapus produk ini'
            });
        }

        await db.execute('DELETE FROM products WHERE product_id = ?', [productId]);

        res.json({ success: true, message: 'Produk berhasil dihapus' });

    } catch (error) {
        console.error('Error hapus produk:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

// ─────────────────────────────────────────────
// BERI RATING PRODUK
// URL: POST /api/products/:id/rating
// ─────────────────────────────────────────────
router.post('/:id/rating', verifyToken, async (req, res) => {
    try {
        const { rating } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Rating harus antara 1-5' });
        }

        const productId = req.params.id;
        const [products] = await db.execute(
            'SELECT rating, rating_count FROM products WHERE product_id = ?',
            [productId]
        );

        if (products.length === 0) {
            return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
        }

        const product = products[0];
        const newCount = product.rating_count + 1;
        // Hitung rata-rata rating baru
        const newRating = ((product.rating * product.rating_count) + parseFloat(rating)) / newCount;

        await db.execute(
            'UPDATE products SET rating = ?, rating_count = ? WHERE product_id = ?',
            [newRating.toFixed(1), newCount, productId]
        );

        res.json({ success: true, message: 'Rating berhasil diberikan', data: { rating: newRating.toFixed(1) } });

    } catch (error) {
        console.error('Error rating produk:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

module.exports = router;