// routes/orders.js
// Menangani buat pesanan, lihat pesanan, update status

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, checkRole } = require('../middleware/auth');

// ─────────────────────────────────────────────
// BUAT PESANAN BARU
// URL: POST /api/orders
// Member yang sudah login bisa pesan
// ─────────────────────────────────────────────
router.post('/', verifyToken, async (req, res) => {
    try {
        const { items, customer_name, customer_phone, delivery_address, payment_method } = req.body;

        // items = array produk yang dipesan, contoh:
        // [{ product_id: 1, quantity: 2 }, { product_id: 3, quantity: 1 }]

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Keranjang belanja kosong' });
        }

        let totalPrice = 0;
        const validatedItems = [];

        // Validasi setiap item di keranjang
        for (const item of items) {
            const [products] = await db.execute(
                'SELECT * FROM products WHERE product_id = ? AND stock >= ?',
                [item.product_id, item.quantity]
            );

            if (products.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: `Produk ID ${item.product_id} tidak tersedia atau stok tidak cukup`
                });
            }

            const product = products[0];
            // Hitung harga setelah diskon
            const finalPrice = product.price * (1 - product.discount / 100);
            totalPrice += finalPrice * item.quantity;

            validatedItems.push({
                product_id: item.product_id,
                quantity: item.quantity,
                price_at_purchase: finalPrice,
                seller_id: product.seller_id
            });
        }

        // Asumsikan semua produk dari seller yang sama (simpel untuk belajar)
        // Dalam aplikasi nyata, bisa dibuat multi-seller per order
        const seller_id = validatedItems[0].seller_id;

        // Buat pesanan di tabel orders
        const [orderResult] = await db.execute(
            `INSERT INTO orders (customer_id, seller_id, customer_name, customer_phone, delivery_address, total_price, payment_method)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                req.user.user_id,
                seller_id,
                customer_name,
                customer_phone,
                delivery_address,
                totalPrice,
                payment_method || 'QRIS'
            ]
        );

        const orderId = orderResult.insertId;

        // Masukkan setiap item ke tabel order_items
        for (const item of validatedItems) {
            await db.execute(
                `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
                 VALUES (?, ?, ?, ?)`,
                [orderId, item.product_id, item.quantity, item.price_at_purchase]
            );

            // Kurangi stok produk
            await db.execute(
                'UPDATE products SET stock = stock - ? WHERE product_id = ?',
                [item.quantity, item.product_id]
            );
        }

        res.status(201).json({
            success: true,
            message: 'Pesanan berhasil dibuat!',
            data: {
                order_id: orderId,
                total_price: totalPrice,
                status: 'pending'
            }
        });

    } catch (error) {
        console.error('Error buat pesanan:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

// ─────────────────────────────────────────────
// LIHAT SEMUA PESANAN (admin) atau pesanan sendiri
// URL: GET /api/orders
// ─────────────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
    try {
        let query;
        let params = [];

        if (req.user.role === 'admin') {
            // Admin bisa lihat semua pesanan
            query = `SELECT o.*, u.username as customer_username
                     FROM orders o
                     LEFT JOIN users u ON o.customer_id = u.user_id
                     ORDER BY o.order_date DESC`;
        } else if (req.user.role === 'seller') {
            // Seller hanya lihat pesanan ke tokonya
            query = `SELECT o.*, u.username as customer_username
                     FROM orders o
                     LEFT JOIN users u ON o.customer_id = u.user_id
                     WHERE o.seller_id = ?
                     ORDER BY o.order_date DESC`;
            params = [req.user.user_id];
        } else {
            // Member hanya lihat pesanannya sendiri
            query = `SELECT o.* FROM orders o
                     WHERE o.customer_id = ?
                     ORDER BY o.order_date DESC`;
            params = [req.user.user_id];
        }

        const [orders] = await db.execute(query, params);

        res.json({ success: true, data: orders });

    } catch (error) {
        console.error('Error get orders:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

// ─────────────────────────────────────────────
// LIHAT DETAIL PESANAN
// URL: GET /api/orders/:id
// ─────────────────────────────────────────────
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const [orders] = await db.execute(
            `SELECT o.*, u.username as customer_username
             FROM orders o
             LEFT JOIN users u ON o.customer_id = u.user_id
             WHERE o.order_id = ?`,
            [req.params.id]
        );

        if (orders.length === 0) {
            return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
        }

        const order = orders[0];

        // Cek akses: hanya pemesan, seller tujuan, atau admin
        if (req.user.role !== 'admin' &&
            order.customer_id !== req.user.user_id &&
            order.seller_id !== req.user.user_id) {
            return res.status(403).json({ success: false, message: 'Akses ditolak' });
        }

        // Ambil item-item di pesanan ini
        const [items] = await db.execute(
            `SELECT oi.*, p.name as product_name, p.image
             FROM order_items oi
             JOIN products p ON oi.product_id = p.product_id
             WHERE oi.order_id = ?`,
            [req.params.id]
        );

        res.json({ success: true, data: { ...order, items } });

    } catch (error) {
        console.error('Error get order detail:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

// ─────────────────────────────────────────────
// UPDATE STATUS PESANAN
// URL: PUT /api/orders/:id/status
// Hanya seller atau admin yang bisa ubah status
// ─────────────────────────────────────────────
router.put('/:id/status', verifyToken, checkRole('seller', 'admin'), async (req, res) => {
    try {
        const { status } = req.body;

        if (!['pending', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Status hanya boleh: pending, completed, atau cancelled'
            });
        }

        const [orders] = await db.execute(
            'SELECT * FROM orders WHERE order_id = ?',
            [req.params.id]
        );

        if (orders.length === 0) {
            return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
        }

        if (req.user.role === 'seller' && orders[0].seller_id !== req.user.user_id) {
            return res.status(403).json({ success: false, message: 'Akses ditolak' });
        }

        await db.execute(
            'UPDATE orders SET status = ? WHERE order_id = ?',
            [status, req.params.id]
        );

        res.json({ success: true, message: `Status pesanan diubah menjadi ${status}` });

    } catch (error) {
        console.error('Error update status:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

module.exports = router;