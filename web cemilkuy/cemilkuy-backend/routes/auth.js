// routes/auth.js
// Menangani: Register, Login, Logout

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const upload = require('../middleware/upload');
const { verifyToken, checkRole } = require('../middleware/auth');

// ─────────────────────────────────────────────
// REGISTER - Daftar akun baru
// URL: POST /api/auth/register
// ─────────────────────────────────────────────
router.post('/register',
    // Validasi input terlebih dahulu
    [
        body('username').trim().isLength({ min: 3 }).withMessage('Username minimal 3 karakter'),
        body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
        body('full_name').trim().notEmpty().withMessage('Nama lengkap wajib diisi'),
        body('phone').trim().notEmpty().withMessage('Nomor HP wajib diisi'),
        body('role').isIn(['member', 'seller']).withMessage('Role hanya boleh member atau seller')
    ],
    async (req, res) => {
        try {
            // Cek apakah ada validasi yang gagal
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validasi gagal',
                    errors: errors.array()
                });
            }

            const { username, password, full_name, phone, role, shop_name } = req.body;

            // Cek apakah username sudah dipakai
            const [existingUser] = await db.execute(
                'SELECT user_id FROM users WHERE username = ?',
                [username]
            );

            if (existingUser.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Username sudah digunakan'
                });
            }

            // Enkripsi password sebelum disimpan
            // angka 10 = tingkat keamanan (semakin tinggi semakin aman, tapi lebih lambat)
            const hashedPassword = await bcrypt.hash(password, 10);

            // Simpan user baru ke database
            const [result] = await db.execute(
                'INSERT INTO users (username, password, full_name, phone, role, shop_name) VALUES (?, ?, ?, ?, ?, ?)',
                [username, hashedPassword, full_name, phone, role, shop_name || null]
            );

            res.status(201).json({
                success: true,
                message: 'Registrasi berhasil! Silakan login.',
                data: { user_id: result.insertId, username, full_name, role }
            });

        } catch (error) {
            console.error('Error register:', error);
            res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
        }
    }
);

// ─────────────────────────────────────────────
// LOGIN - Masuk ke akun
// URL: POST /api/auth/login
// ─────────────────────────────────────────────
router.post('/login',
    [
        body('username').trim().notEmpty().withMessage('Username wajib diisi'),
        body('password').notEmpty().withMessage('Password wajib diisi')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validasi gagal',
                    errors: errors.array()
                });
            }

            const { username, password } = req.body;

            // Cari user di database
            const [users] = await db.execute(
                'SELECT * FROM users WHERE username = ?',
                [username]
            );

            if (users.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'Username atau password salah'
                });
            }

            const user = users[0];

            // Bandingkan password yang diinput dengan password terenkripsi di DB
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Username atau password salah'
                });
            }

            // Buat token JWT yang berisi info user
            // Token ini dipakai untuk autentikasi di request selanjutnya
            const token = jwt.sign(
                {
                    user_id: user.user_id,
                    username: user.username,
                    role: user.role
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES } // token expired setelah 7 hari
            );

            // Hapus password dari response (jangan dikirim ke client)
            delete user.password;

            res.json({
                success: true,
                message: 'Login berhasil',
                token: token,          // simpan token ini di frontend (localStorage)
                data: user
            });

        } catch (error) {
            console.error('Error login:', error);
            res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
        }
    }
);

// ─────────────────────────────────────────────
// GET PROFILE - Lihat profil sendiri
// URL: GET /api/auth/profile
// (perlu token di header)
// ─────────────────────────────────────────────
router.get('/profile', require('../middleware/auth').verifyToken, async (req, res) => {
    try {
        const [users] = await db.execute(
            'SELECT user_id, username, full_name, phone, role, shop_name, created_at FROM users WHERE user_id = ?',
            [req.user.user_id]
        );

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
        }

        res.json({ success: true, data: users[0] });

    } catch (error) {
        console.error('Error get profile:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

// Upload QRIS
router.post('/upload-qris', verifyToken, checkRole('seller', 'admin'), upload.single('qris'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'File QRIS wajib diupload' });
        }

        const qrisUrl = `/uploads/${req.file.filename}`;

        await db.execute(
            'UPDATE users SET qris_image = ? WHERE user_id = ?',
            [qrisUrl, req.user.user_id]
        );

        res.json({
            success: true,
            message: 'QRIS berhasil diupload',
            data: { qris_image: qrisUrl }
        });

    } catch (error) {
        console.error('Error upload QRIS:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

// Get QRIS seller tertentu
router.get('/qris/:seller_id', async (req, res) => {
    try {
        const [users] = await db.execute(
            'SELECT qris_image, shop_name FROM users WHERE user_id = ?',
            [req.params.seller_id]
        );

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'Seller tidak ditemukan' });
        }

        res.json({ success: true, data: users[0] });

    } catch (error) {
        console.error('Error get QRIS:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

// ─────────────────────────────────────────────
// CHECK USERNAME - Cek apakah username ada di database
// ─────────────────────────────────────────────
router.get('/check-username/:username', async (req, res) => {
    try {
        const [users] = await db.execute(
            'SELECT user_id FROM users WHERE username = ?',
            [req.params.username]
        );

        res.json({ exists: users.length > 0 });

    } catch (error) {
        console.error('Error check username:', error);
        res.status(500).json({ exists: false });
    }
});

module.exports = router;