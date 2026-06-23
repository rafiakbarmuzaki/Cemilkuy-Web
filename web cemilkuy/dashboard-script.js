// ============================================================
// dashboard-script.js — Script untuk dashboard.html
// Untuk Seller: kelola produk & pesanan toko sendiri
// Untuk Admin: kelola semua + lihat statistik & user
// ============================================================


let currentFilter = 'all';
let editProductId = null;

// ─────────────────────────────────────────────
// SAAT HALAMAN DIMUAT
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const session = JSON.parse(localStorage.getItem('cemilkuy_session'));

    // Jika belum login, paksa ke halaman login
    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    // Tampilkan nama dan role di sidebar
    const userNameEl = document.getElementById('user-name');
    const userRoleEl = document.getElementById('user-role');
    if (userNameEl) userNameEl.innerText = session.full_name || session.username;
    if (userRoleEl) userRoleEl.innerText = session.role.toUpperCase();

    // Tampilkan menu "Kelola Pengguna" hanya untuk admin
    const menuUsers = document.getElementById('menu-users');
    if (menuUsers && session.role === 'admin') {
        menuUsers.style.display = 'flex';
    }

    // Muat data awal
    muatRingkasan();
    muatProduk();
    muatPesanan();
    muatQRIS();
    if (session.role === 'admin') {
        muatStatistik();
        muatUsers();
    }
});

// ─────────────────────────────────────────────
// NAVIGASI SIDEBAR
// ─────────────────────────────────────────────
function showSection(id, el) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.menu a').forEach(a => a.classList.remove('active'));
    const section = document.getElementById(id);
    if (section) section.classList.add('active');
    if (el) el.classList.add('active');
}

// ─────────────────────────────────────────────
// RINGKASAN (OVERVIEW)
// ─────────────────────────────────────────────
async function muatRingkasan() {
    const session = JSON.parse(localStorage.getItem('cemilkuy_session'));
    const token = localStorage.getItem('cemilkuy_token');

    try {
        if (session.role === 'admin') {
             const res = await fetch(`${API_URL}/dashboard/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
             });
            const data = await res.json();
             if (data.success) {
             const d = data.data;
                 setText('rev', `Rp ${parseInt(d.total_revenue).toLocaleString('id-ID')}`);
                 setText('ord', d.total_orders);
                 setText('stk', d.total_products);
                // Ubah label
                const revDesc = document.getElementById('rev-desc');
             if (revDesc) revDesc.innerText = `Total dari semua seller`;
                // Ubah judul halaman
                const judulEl = document.querySelector('#overview h1');
                if (judulEl) judulEl.innerText = 'Ringkasan Platform';
            }
        } else {
            // Seller: hitung dari pesanan dan produk sendiri
            const [resOrders, resProducts] = await Promise.all([
                fetch(`${API_URL}/orders`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_URL}/products`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            const ordersData   = await resOrders.json();
            const productsData = await resProducts.json();

            if (ordersData.success) {
                const orders   = ordersData.data;
                const selesai  = orders.filter(o => o.status === 'completed');
                const revenue  = selesai.reduce((sum, o) => sum + parseFloat(o.total_price), 0);
                setText('rev', `Rp ${parseInt(revenue).toLocaleString('id-ID')}`);
                setText('ord', orders.length);
                const revDesc = document.getElementById('rev-desc');
                if (revDesc) revDesc.innerText = `Dari ${selesai.length} pesanan selesai`;
            }

            if (productsData.success) {
                const stokTotal = productsData.data.reduce((sum, p) => sum + p.stock, 0);
                setText('stk', stokTotal);
            }
        }
    } catch (err) {
        console.error('Gagal muat ringkasan:', err);
    }
}

// ─────────────────────────────────────────────
// KELOLA PRODUK
// ─────────────────────────────────────────────
async function muatProduk() {
    const token = localStorage.getItem('cemilkuy_token');
    const tbody = document.getElementById('product-table');
    if (!tbody) return;

    try {
        const res = await fetch(`${API_URL}/products`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (!data.success || data.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:#aaa;">Belum ada produk.</td></tr>';
            return;
        }

        tbody.innerHTML = data.data.map(p => {
            const imgSrc = p.image ? `http://localhost:3000${p.image}` : 'https://via.placeholder.com/50';
            return `
            <tr>
                <td><img src="${imgSrc}" class="product-thumb" onerror="this.src='https://via.placeholder.com/50'"></td>
                <td><strong>${p.name}</strong><br><small style="color:#aaa;">${p.description || '-'}</small></td>
                <td>${p.category}</td>
                <td>Rp ${parseInt(p.price).toLocaleString('id-ID')}<br>
                    ${p.discount > 0 ? `<span style="color:#e74c3c; font-size:11px;">Diskon ${p.discount}%</span>` : ''}</td>
                <td><span style="color:${p.stock < 10 ? '#e74c3c' : '#27ae60'}; font-weight:bold;">${p.stock}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-edit" onclick="editProduk(${p.product_id})"><i class="fas fa-edit"></i></button>
                        <button class="btn-del" onclick="hapusProduk(${p.product_id}, '${p.name}')"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>`;
        }).join('');

    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#dc3545;">Gagal memuat produk.</td></tr>';
    }
}

function openModal(id = null) {
    editProductId = id;
    const modal = document.getElementById('product-modal');
    if (!modal) return;

    // Reset form manual
    setValue('prod-name', '');
    setValue('prod-category', '');
    setValue('prod-price', '');
    setValue('prod-stock', '');
    setValue('prod-discount', '');
    setValue('prod-desc', '');
    document.getElementById('preview-container').style.display = 'none';
    document.getElementById('modal-title').innerText = id ? 'Edit Produk' : 'Tambah Produk Baru';

    if (id) {
        fetch(`${API_URL}/products/${id}`)
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    const p = data.data;
                    setValue('prod-name', p.name);
                    setValue('prod-category', p.category);
                    setValue('prod-price', p.price);
                    setValue('prod-stock', p.stock);
                    setValue('prod-discount', p.discount || 0);
                    setValue('prod-desc', p.description || '');
                    if (p.image) {
                        document.getElementById('preview-img').src = `http://localhost:3000${p.image}`;
                        document.getElementById('preview-container').style.display = 'block';
                    }
                }
            });
    }

    modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('product-modal');
    if (modal) modal.style.display = 'none';
    editProductId = null;
}

async function simpanProduk() {
    const token = localStorage.getItem('cemilkuy_token');
    const name      = getValue('prod-name');
    const category  = getValue('prod-category');
    const price     = getValue('prod-price');
    const stock     = getValue('prod-stock');
    const discount  = getValue('prod-discount');
    const desc      = getValue('prod-desc');
    const imageFile = document.getElementById('prod-image')?.files[0];

    if (!name || !category || !price || !stock) {
        alert('Nama, kategori, harga, dan stok wajib diisi!');
        return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('category', category);
    formData.append('price', price);
    formData.append('stock', stock);
    formData.append('discount', discount || 0);
    formData.append('description', desc);
    if (imageFile) formData.append('image', imageFile);

    const btnSave = document.getElementById('btn-save-product');
    if (btnSave) { btnSave.disabled = true; btnSave.innerText = 'Menyimpan...'; }

    try {
        const url    = editProductId ? `${API_URL}/products/${editProductId}` : `${API_URL}/products`;
        const method = editProductId ? 'PUT' : 'POST';
        const res    = await fetch(url, { method, headers: { 'Authorization': `Bearer ${token}` }, body: formData });
        const data   = await res.json();

        if (data.success) {
            alert(editProductId ? 'Produk berhasil diupdate!' : 'Produk berhasil ditambahkan!');
            closeModal();
            muatProduk();
            muatRingkasan();
        } else {
            alert(data.message || 'Gagal menyimpan produk.');
        }
    } catch (err) {
        alert('Terjadi kesalahan. Coba lagi.');
    } finally {
        if (btnSave) { btnSave.disabled = false; btnSave.innerText = 'Simpan'; }
    }
}

async function editProduk(id) {
    openModal(id);
}

async function hapusProduk(id, nama) {
    if (!confirm(`Hapus produk "${nama}"? Tindakan ini tidak bisa dibatalkan.`)) return;

    const token = localStorage.getItem('cemilkuy_token');
    try {
        const res  = await fetch(`${API_URL}/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success) {
            alert('Produk berhasil dihapus.');
            muatProduk();
            muatRingkasan();
        } else {
            alert(data.message || 'Gagal menghapus produk.');
        }
    } catch (err) {
        alert('Terjadi kesalahan.');
    }
}

// Preview gambar sebelum upload
function previewImage(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        document.getElementById('preview-img').src = e.target.result;
        document.getElementById('preview-container').style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// ─────────────────────────────────────────────
// PESANAN MASUK
// ─────────────────────────────────────────────
async function muatPesanan() {
    const token = localStorage.getItem('cemilkuy_token');
    const tbody = document.getElementById('order-table');
    const emptyMsg = document.getElementById('empty-orders');
    if (!tbody) return;

    try {
        const res  = await fetch(`${API_URL}/orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        let orders = data.success ? data.data : [];

        // Filter
        if (currentFilter !== 'all') {
            orders = orders.filter(o => o.status === currentFilter);
        }

        if (orders.length === 0) {
            tbody.innerHTML = '';
            if (emptyMsg) emptyMsg.style.display = 'block';
            return;
        }

        if (emptyMsg) emptyMsg.style.display = 'none';

        tbody.innerHTML = orders.map(order => `
            <tr class="${order.status === 'completed' ? 'row-completed' : ''}">
                <td>
                    <span class="${order.status === 'completed' ? 'badge-done' : order.status === 'cancelled' ? 'badge-cancelled' : 'badge-pending'}">
                        ${order.status === 'completed' ? '<i class="fas fa-check-circle"></i> Selesai' : order.status === 'cancelled' ? '<i class="fas fa-times-circle"></i> Batal' : '<i class="fas fa-clock"></i> Proses'}
                    </span>
                </td>
                <td style="font-size:12px;">${new Date(order.order_date).toLocaleDateString('id-ID', {day:'numeric',month:'short',year:'numeric'})}</td>
                <td>
                    <strong>${order.customer_name}</strong><br>
                    <a href="https://wa.me/${order.customer_phone}" target="_blank" class="wa-btn">
                        <i class="fab fa-whatsapp"></i> ${order.customer_phone}
                    </a><br>
                    <small style="color:#888; font-size:11px;">📍 ${order.delivery_address}</small>
                </td>
                <td style="font-size:13px;">#${order.order_id}</td>
                <td>
                    <strong>Rp ${parseInt(order.total_price).toLocaleString('id-ID')}</strong><br>
                    ${order.status === 'pending' ? `
                        <button onclick="updateStatus(${order.order_id}, 'completed')" class="btn-pay" style="margin-top:5px;">
                            ✅ Tandai Selesai
                        </button>
                        <button onclick="updateStatus(${order.order_id}, 'cancelled')" class="btn-del" style="margin-top:3px; font-size:11px;">
                            Batalkan
                        </button>` : ''}
                </td>
            </tr>`).join('');

    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#dc3545;">Gagal memuat pesanan.</td></tr>';
    }
}

async function updateStatus(orderId, status) {
    const label = status === 'completed' ? 'menandai selesai' : 'membatalkan';
    if (!confirm(`Yakin ${label} pesanan #${orderId}?`)) return;

    const token = localStorage.getItem('cemilkuy_token');
    try {
        const res  = await fetch(`${API_URL}/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status })
        });
        const data = await res.json();

        if (data.success) {
            muatPesanan();
            muatRingkasan();
        } else {
            alert(data.message || 'Gagal update status.');
        }
    } catch (err) {
        alert('Terjadi kesalahan.');
    }
}

function setFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    muatPesanan();
}

// ─────────────────────────────────────────────
// STATISTIK & GRAFIK (ADMIN)
// ─────────────────────────────────────────────
async function muatStatistik() {
    const token = localStorage.getItem('cemilkuy_token');
    try {
        const res  = await fetch(`${API_URL}/dashboard/chart`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (!data.success) return;

        // Top 5 produk terlaris
        const topEl = document.getElementById('top-products-list');
        if (topEl && data.data.top_products.length > 0) {
            topEl.innerHTML = data.data.top_products.map((p, i) =>
                `<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #eee;">
                    <span>${i + 1}. ${p.name} <small style="color:#aaa;">(${p.category})</small></span>
                    <strong style="color:#FF7F50;">${p.total_terjual} terjual</strong>
                </div>`
            ).join('');
        }

    } catch (err) {
        console.error('Gagal muat statistik:', err);
    }
}

// ─────────────────────────────────────────────
// KELOLA USERS (ADMIN)
// ─────────────────────────────────────────────
async function muatUsers() {
    const token = localStorage.getItem('cemilkuy_token');
    const sellerTbody = document.getElementById('seller-table');
    const memberTbody = document.getElementById('member-table');
    if (!sellerTbody) return;

    try {
        const res  = await fetch(`${API_URL}/dashboard/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (!data.success) return;

        const sellers = data.data.filter(u => u.role === 'seller');
        const members = data.data.filter(u => u.role === 'member');

        // Render sellers
        if (sellers.length === 0) {
            sellerTbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#aaa;">Belum ada penjual.</td></tr>';
        } else {
            sellerTbody.innerHTML = sellers.map(u => `
                <tr>
                    <td>
                        <strong>${u.full_name}</strong><br>
                        <a href="https://wa.me/${u.phone}" target="_blank" class="wa-btn">
                            <i class="fab fa-whatsapp"></i> ${u.phone}
                        </a>
                    </td>
                    <td>${u.shop_name || '-'}</td>
                    <td>@${u.username}</td>
                    <td style="font-size:12px; color:#aaa;">${new Date(u.created_at).toLocaleDateString('id-ID')}</td>
                </tr>`).join('');
        }

        // Render members
        if (memberTbody) {
            if (members.length === 0) {
                memberTbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px; color:#aaa;">Belum ada member.</td></tr>';
            } else {
                memberTbody.innerHTML = members.map(u => `
                    <tr>
                        <td><strong>${u.full_name}</strong><br>@${u.username}</td>
                        <td>${u.phone}</td>
                        <td style="font-size:12px; color:#aaa;">${new Date(u.created_at).toLocaleDateString('id-ID')}</td>
                    </tr>`).join('');
            }
        }

    } catch (err) {
        console.error('Gagal muat users:', err);
    }
}

// ─────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────
function logout() {
    if (!confirm('Yakin ingin logout?')) return;
    localStorage.removeItem('cemilkuy_token');
    localStorage.removeItem('cemilkuy_session');
    window.location.href = 'login.html';
}

// ─────────────────────────────────────────────
// SETTINGS QRIS
// ─────────────────────────────────────────────
async function muatQRIS() {
    const session = JSON.parse(localStorage.getItem('cemilkuy_session'));
    const token = localStorage.getItem('cemilkuy_token');

    try {
        const res = await fetch(`${API_URL}/auth/qris/${session.user_id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success && data.data.qris_image) {
            const previewSection = document.getElementById('qris-preview-section');
            const previewImg = document.getElementById('qris-preview-img');
            if (previewSection) previewSection.style.display = 'block';
            if (previewImg) previewImg.src = `http://localhost:3000${data.data.qris_image}`;
        }
    } catch (err) {
        console.error('Gagal muat QRIS:', err);
    }
}

function previewQRIS(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        document.getElementById('qris-new-img').src = e.target.result;
        document.getElementById('qris-new-preview').style.display = 'block';
    };
    reader.readAsDataURL(file);
}

async function uploadQRIS() {
    const token = localStorage.getItem('cemilkuy_token');
    const file = document.getElementById('qris-file').files[0];
    const btn = document.getElementById('btn-save-qris');

    if (!file) {
        alert('Pilih gambar QRIS terlebih dahulu!');
        return;
    }

    btn.disabled = true;
    btn.innerText = 'Mengupload...';

    try {
        const formData = new FormData();
        formData.append('qris', file);

        const res = await fetch(`${API_URL}/auth/upload-qris`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const data = await res.json();

        if (data.success) {
            alert('QRIS berhasil diupload!');
            muatQRIS();
            document.getElementById('qris-new-preview').style.display = 'none';
            document.getElementById('qris-file').value = '';
        } else {
            alert(data.message || 'Gagal upload QRIS.');
        }
    } catch (err) {
        alert('Terjadi kesalahan. Coba lagi.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-upload"></i> Upload QRIS';
    }
}

// ─────────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────────
function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.innerText = val;
}
function getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
}
function setValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
}
