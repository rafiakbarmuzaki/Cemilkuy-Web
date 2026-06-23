// middleware/upload.js
// Konfigurasi untuk upload file/gambar menggunakan multer

const multer = require('multer');
const path = require('path');

// Konfigurasi tempat penyimpanan file
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // simpan di folder uploads/
    },
    filename: (req, file, cb) => {
        // Nama file: timestamp + nama asli, agar unik dan tidak bentrok
        const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '-');
        cb(null, uniqueName);
    }
});

// Filter: hanya izinkan file gambar
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true); // izinkan
    } else {
        cb(new Error('Hanya file gambar yang diizinkan (jpeg, jpg, png, gif, webp)'));
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // Maksimal 5MB
    },
    fileFilter: fileFilter
});

module.exports = upload;