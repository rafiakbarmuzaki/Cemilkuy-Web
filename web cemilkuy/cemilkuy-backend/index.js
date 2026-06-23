// index.js
// File utama — titik masuk aplikasi backend Cemilkuy

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// ─────────────────────────────────────────────
// MIDDLEWARE GLOBAL
// ─────────────────────────────────────────────

// Izinkan akses dari domain lain (frontend bisa hubungi backend)
app.use(cors({
    origin: '*', // di production, ganti dengan domain frontend kamu
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Agar Express bisa membaca JSON dari body request
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sajikan folder uploads sebagai file statis
// Gambar bisa diakses di: http://localhost:3000/uploads/nama-gambar.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─────────────────────────────────────────────
// ROUTE UTAMA
// ─────────────────────────────────────────────

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Route cek server aktif
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🍟 Cemilkuy API siap!',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            products: '/api/products',
            orders: '/api/orders',
            dashboard: '/api/dashboard'
        }
    });
});

// ─────────────────────────────────────────────
// ERROR HANDLER (jika ada route yang tidak ditemukan)
// ─────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.url} tidak ditemukan`
    });
});

// ─────────────────────────────────────────────
// JALANKAN SERVER
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('─────────────────────────────────');
    console.log('🍟  Cemilkuy Backend Aktif!');
    console.log(`🌐  Server: http://localhost:${PORT}`);
    console.log(`📁  Database: ${process.env.DB_NAME}`);
    console.log('─────────────────────────────────');
});