// middleware/auth.js
// Middleware = "penjaga pintu" yang memeriksa setiap request sebelum masuk ke route

const jwt = require('jsonwebtoken');
require('dotenv').config();

// ─────────────────────────────────────────────
// verifyToken: Cek apakah user sudah login
// Cara pakai: tambahkan verifyToken setelah URL di router
// ─────────────────────────────────────────────
const verifyToken = (req, res, next) => {
    // Token dikirim di header dengan format: "Bearer eyJ..."
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // ambil bagian setelah "Bearer "

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Akses ditolak. Silakan login terlebih dahulu.'
        });
    }

    try {
        // Verifikasi token, jika valid kembalikan data user
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // simpan data user di request
        next(); // lanjut ke handler berikutnya
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: 'Token tidak valid atau sudah expired. Silakan login ulang.'
        });
    }
};

// ─────────────────────────────────────────────
// checkRole: Cek apakah user punya role yang sesuai
// Cara pakai: checkRole('admin') atau checkRole('admin', 'seller')
// ─────────────────────────────────────────────
const checkRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Tidak terautentikasi'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Akses ditolak. Hanya ${roles.join(' atau ')} yang bisa mengakses ini.`
            });
        }

        next();
    };
};

module.exports = { verifyToken, checkRole };