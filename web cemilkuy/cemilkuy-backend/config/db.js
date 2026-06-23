// config/db.js
// File ini bertugas menghubungkan aplikasi ke database MySQL

const mysql = require('mysql2');
require('dotenv').config();

// Buat koneksi pool (lebih efisien dari koneksi biasa)
// Pool = kumpulan koneksi yang siap pakai
const pool = mysql.createPool({
    host: process.env.DB_HOST,       // localhost
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,       // root
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,   // db_cemilkuy
    waitForConnections: true,
    connectionLimit: 10,             // maksimal 10 koneksi bersamaan
    queueLimit: 0
});

// Ubah pool menjadi versi promise agar bisa pakai async/await
const promisePool = pool.promise();

module.exports = promisePool;       