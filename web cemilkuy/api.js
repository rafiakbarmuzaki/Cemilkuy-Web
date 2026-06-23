// ============================================================
// api.js — Helper untuk semua komunikasi dengan backend
// Letakkan file ini di folder yang sama dengan file HTML
// ============================================================

const API_URL = 'http://localhost:3000/api';

// Ambil token dari localStorage
function getToken() {
    return localStorage.getItem('cemilkuy_token');
}

// Ambil data session user yang login
function getSession() {
    const s = localStorage.getItem('cemilkuy_session');
    return s ? JSON.parse(s) : null;
}

// Simpan session setelah login berhasil
function saveSession(token, user) {
    localStorage.setItem('cemilkuy_token', token);
    localStorage.setItem('cemilkuy_session', JSON.stringify(user));
}

// Hapus session saat logout
function clearSession() {
    localStorage.removeItem('cemilkuy_token');
    localStorage.removeItem('cemilkuy_session');
}

// Header default untuk request yang butuh login
function authHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
    };
}

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────
const Auth = {
    async login(username, password) {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        return res.json();
    },

    async register(data) {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },

    async getProfile() {
        const res = await fetch(`${API_URL}/auth/profile`, {
            headers: authHeaders()
        });
        return res.json();
    }
};

// ─────────────────────────────────────────────
// PRODUK
// ─────────────────────────────────────────────
const Products = {
    async getAll(params = {}) {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`${API_URL}/products${query ? '?' + query : ''}`);
        return res.json();
    },

    async getById(id) {
        const res = await fetch(`${API_URL}/products/${id}`);
        return res.json();
    },

    async create(formData) {
        const res = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getToken()}` },
            body: formData // FormData untuk upload gambar
        });
        return res.json();
    },

    async update(id, formData) {
        const res = await fetch(`${API_URL}/products/${id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${getToken()}` },
            body: formData
        });
        return res.json();
    },

    async delete(id) {
        const res = await fetch(`${API_URL}/products/${id}`, {
            method: 'DELETE',
            headers: authHeaders()
        });
        return res.json();
    },

    async rate(id, rating) {
        const res = await fetch(`${API_URL}/products/${id}/rating`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ rating })
        });
        return res.json();
    }
};

// ─────────────────────────────────────────────
// PESANAN
// ─────────────────────────────────────────────
const Orders = {
    async create(data) {
        const res = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(data)
        });
        return res.json();
    },

    async getAll() {
        const res = await fetch(`${API_URL}/orders`, {
            headers: authHeaders()
        });
        return res.json();
    },

    async getById(id) {
        const res = await fetch(`${API_URL}/orders/${id}`, {
            headers: authHeaders()
        });
        return res.json();
    },

    async updateStatus(id, status) {
        const res = await fetch(`${API_URL}/orders/${id}/status`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ status })
        });
        return res.json();
    }
};

// ─────────────────────────────────────────────
// DASHBOARD ADMIN
// ─────────────────────────────────────────────
const Dashboard = {
    async getStats() {
        const res = await fetch(`${API_URL}/dashboard/stats`, {
            headers: authHeaders()
        });
        return res.json();
    },

    async getChart() {
        const res = await fetch(`${API_URL}/dashboard/chart`, {
            headers: authHeaders()
        });
        return res.json();
    },

    async getUsers() {
        const res = await fetch(`${API_URL}/dashboard/users`, {
            headers: authHeaders()
        });
        return res.json();
    }
};
