// routes/dashboard.js
// Statistik untuk dashboard admin

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, checkRole } = require('../middleware/auth');

// Semua route dashboard hanya bisa diakses admin
router.use(verifyToken, checkRole('admin'));

// ─────────────────────────────────────────────
// GET STATISTIK UTAMA
// URL: GET /api/dashboard/stats
// ─────────────────────────────────────────────
router.get('/stats', async (req, res) => {
    try {
        // Jalankan semua query sekaligus (lebih cepat)
        const [
            [totalUsers],
            [totalProducts],
            [totalOrders],
            [totalRevenue],
            [pendingOrders]
        ] = await Promise.all([
            db.execute('SELECT COUNT(*) as total FROM users WHERE role != "admin"'),
            db.execute('SELECT COUNT(*) as total FROM products'),
            db.execute('SELECT COUNT(*) as total FROM orders'),
            db.execute('SELECT SUM(total_price) as total FROM orders WHERE status = "completed"'),
            db.execute('SELECT COUNT(*) as total FROM orders WHERE status = "pending"')
        ]);

        res.json({
            success: true,
            data: {
                total_users: totalUsers[0].total,
                total_products: totalProducts[0].total,
                total_orders: totalOrders[0].total,
                total_revenue: totalRevenue[0].total || 0,
                pending_orders: pendingOrders[0].total
            }
        });

    } catch (error) {
        console.error('Error get stats:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

// ─────────────────────────────────────────────
// GET DATA GRAFIK PENJUALAN (7 hari terakhir)
// URL: GET /api/dashboard/chart
// ─────────────────────────────────────────────
router.get('/chart', async (req, res) => {
    try {
        // Penjualan per hari selama 7 hari terakhir
        const [salesChart] = await db.execute(`
            SELECT
                DATE(order_date) as tanggal,
                COUNT(*) as jumlah_pesanan,
                SUM(total_price) as total_penjualan
            FROM orders
            WHERE order_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                AND status = 'completed'
            GROUP BY DATE(order_date)
            ORDER BY tanggal ASC
        `);

        // Produk terlaris
        const [topProducts] = await db.execute(`
            SELECT
                p.name,
                p.category,
                SUM(oi.quantity) as total_terjual
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            JOIN orders o ON oi.order_id = o.order_id
            WHERE o.status = 'completed'
            GROUP BY oi.product_id
            ORDER BY total_terjual DESC
            LIMIT 5
        `);

        // Distribusi kategori produk
        const [categoryChart] = await db.execute(`
            SELECT category, COUNT(*) as jumlah
            FROM products
            GROUP BY category
        `);

        res.json({
            success: true,
            data: {
                sales_chart: salesChart,
                top_products: topProducts,
                category_distribution: categoryChart
            }
        });

    } catch (error) {
        console.error('Error get chart:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

// ─────────────────────────────────────────────
// GET DAFTAR SEMUA USER
// URL: GET /api/dashboard/users
// ─────────────────────────────────────────────
router.get('/users', async (req, res) => {
    try {
        const [users] = await db.execute(
            `SELECT user_id, username, full_name, phone, role, shop_name, created_at
             FROM users ORDER BY created_at DESC`
        );

        res.json({ success: true, data: users });

    } catch (error) {
        console.error('Error get users:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

module.exports = router;