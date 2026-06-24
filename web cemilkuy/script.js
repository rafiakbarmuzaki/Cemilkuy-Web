// ============================================================
// script.js — Versi API Backend
// ============================================================

let cart = [];
let allProducts = [];
let currentRateId = null;
let currentRateVal = 0;

// ─────────────────────────────────────────────
// SAAT HALAMAN DIMUAT
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    muatProduk();
    updateCartUI();
    cekSession();

    const tombolCheckout = document.getElementById('tombol-checkout');
    if (tombolCheckout) {
        tombolCheckout.addEventListener('click', openCheckout);
    }

    const paymentForm = document.getElementById('payment-form');
    if (paymentForm) {
        paymentForm.addEventListener('submit', prosesCheckout);
    }
});

// ─────────────────────────────────────────────
// CEK SESSION LOGIN
// ─────────────────────────────────────────────
function cekSession() {
    const session = JSON.parse(localStorage.getItem('cemilkuy_session'));
    const authContainer = document.getElementById('auth-container');
    const userContainer = document.getElementById('user-container');
    const userGreeting  = document.getElementById('user-greeting');
    const profileBtn    = document.getElementById('profile-btn');
    const profileText   = document.getElementById('profile-text');

    if (!authContainer) return;

    if (session) {
        authContainer.style.display = 'none';
        userContainer.style.display = 'flex';

        const firstName = session.full_name ? session.full_name.split(' ')[0] : session.username;
        if (userGreeting) {
            userGreeting.innerText = `Hai, ${firstName}`;
            userGreeting.style.display = 'block';
        }

        if (session.role === 'member') {
            if (profileBtn)  profileBtn.href = 'dashboard-member.html';
            if (profileText) profileText.innerText = 'Member';
        } else {
            if (profileBtn)  profileBtn.href = 'dashboard.html';
            if (profileBtn)  profileBtn.innerHTML = '<i class="fas fa-store"></i> Toko Saya';
        }

        const namaInput = document.getElementById('nama-pembeli');
        const hpInput   = document.getElementById('hp-pembeli');
        if (namaInput) namaInput.value = session.full_name || '';
        if (hpInput)   hpInput.value   = session.phone    || '';

    } else {
        if (authContainer) authContainer.style.display = 'flex';
        if (userContainer) userContainer.style.display = 'none';
    }
}

// ─────────────────────────────────────────────
// MUAT PRODUK DARI BACKEND
// ─────────────────────────────────────────────
async function muatProduk(filter = 'all', search = '') {
    const list = document.getElementById('product-list');
    if (!list) return;
    list.innerHTML = '<p style="text-align:center; padding:30px; color:#aaa;">Memuat produk...</p>';

    try {
        const params = {};
        if (search) params.search = search;
        if (filter !== 'all') params.category = filter;

        const query = new URLSearchParams(params).toString();
        const res = await fetch(`${API_URL}/products${query ? '?' + query : ''}`);
        const data = await res.json();

        if (!data.success || data.data.length === 0) {
            list.innerHTML = '<p style="text-align:center; padding:30px; color:#aaa;">Belum ada produk tersedia.</p>';
            return;
        }

        allProducts = data.data;
        renderProducts(allProducts);

    } catch (err) {
        list.innerHTML = '<p style="text-align:center; padding:30px; color:#dc3545;">Gagal memuat produk. Pastikan server backend berjalan.</p>';
    }
}

// ─────────────────────────────────────────────
// RENDER KARTU PRODUK
// ─────────────────────────────────────────────
function renderProducts(products) {
    const list = document.getElementById('product-list');
    if (!list) return;
    list.innerHTML = '';

    products.forEach(p => {
        let finalPrice = p.price;
        let priceHTML  = `<span class="final-price">Rp ${parseInt(p.price).toLocaleString('id-ID')}</span>`;

        if (p.discount > 0) {
            finalPrice = p.price * (1 - p.discount / 100);
            priceHTML = `
                <div class="price-wrapper">
                    <span class="original-price">Rp ${parseInt(p.price).toLocaleString('id-ID')}</span>
                    <span class="discount-badge">-${p.discount}%</span>
                </div>
                <span class="final-price">Rp ${parseInt(finalPrice).toLocaleString('id-ID')}</span>`;
        }

        const stockColor = p.stock < 10 ? 'red' : '#27ae60';
        const stockText  = p.stock <= 0 ? 'Habis' : `Stok: ${p.stock}`;
        const btnAttr    = p.stock <= 0 ? 'disabled style="background:#ccc; cursor:not-allowed;"' : '';
        const shopName   = p.shop_name || 'Cemilkuy Pusat';
        const imgSrc     = p.image ? `http://localhost:3000${p.image}` : 'https://via.placeholder.com/150';

        const ratingDisplay = (p.rating_count > 0)
            ? `⭐ ${parseFloat(p.rating).toFixed(1)} <span style="color:#aaa; font-size:11px;">(${p.rating_count})</span>`
            : `<span style="color:#aaa; font-size:12px;">Belum ada rating</span>`;

        list.innerHTML += `
            <div class="product-card">
                <img src="${imgSrc}" class="product-img" onerror="this.src='https://via.placeholder.com/150'">
                <div class="product-info">
                    <h3>${p.name}</h3>
                    <small style="color:#FF7F50; font-weight:bold; font-size:11px;">
                        <i class="fas fa-store"></i> ${shopName}
                    </small>
                    <div class="product-rating">
                        ${ratingDisplay}
                        <div style="margin-top:2px;">
                            <span style="color:${stockColor}; font-weight:bold; font-size:11px;">${stockText}</span>
                        </div>
                    </div>
                    <p class="product-desc">${p.description || 'Enak dan murah!'}</p>
                    <div class="price-container">${priceHTML}</div>
                    <button class="add-btn" onclick="addToCart(${p.product_id})" ${btnAttr}>
                        ${p.stock <= 0 ? 'Habis' : 'Tambah +'}
                    </button>
                </div>
            </div>`;
    });
}

// ─────────────────────────────────────────────
// FILTER & SEARCH
// ─────────────────────────────────────────────
function filterProduk(category) {
    document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    muatProduk(category);
}

function searchMenu() {
    const keyword = document.getElementById('searchInput').value.trim();
    muatProduk('all', keyword);
}

// ─────────────────────────────────────────────
// KERANJANG BELANJA
// ─────────────────────────────────────────────
function addToCart(productId) {
    const produk = allProducts.find(p => p.product_id === productId);
    if (!produk) return;

    const existing = cart.find(item => item.product_id === productId);
    if (existing) {
        if (existing.qty >= produk.stock) {
            alert('Stok tidak mencukupi!');
            return;
        }
        existing.qty++;
    } else {
        const finalPrice = produk.price * (1 - (produk.discount || 0) / 100);
        cart.push({ ...produk, qty: 1, finalPrice });
    }

    updateCartUI();

    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        cartCount.animate([{ transform: 'scale(1.5)' }, { transform: 'scale(1)' }], { duration: 200 });
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.product_id !== productId);
    updateCartUI();
    renderCart();
}

function updateCartUI() {
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    const total = cart.reduce((sum, item) => sum + item.finalPrice * item.qty, 0);
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');
    if (cartCount) cartCount.innerText = count;
    if (cartTotal) cartTotal.innerText = `Rp ${parseInt(total).toLocaleString('id-ID')}`;
}

function renderCart() {
    const cartItems = document.getElementById('cart-items');
    if (!cartItems) return;
    cartItems.innerHTML = '';

    if (cart.length === 0) {
        cartItems.innerHTML = '<p style="text-align:center; padding:20px; color:#aaa;">Keranjang kosong</p>';
        return;
    }

    cart.forEach(item => {
        cartItems.innerHTML += `
            <div class="cart-item" style="display:flex; align-items:center; gap:10px; padding:10px 0; border-bottom:1px solid #eee;">
                <img src="${item.image ? 'http://localhost:3000' + item.image : 'https://via.placeholder.com/50'}" 
                     style="width:50px; height:50px; object-fit:cover; border-radius:5px;">
                <div style="flex:1;">
                    <div style="font-weight:bold; font-size:13px;">${item.name}</div>
                    <div style="color:#FF7F50; font-size:12px;">Rp ${parseInt(item.finalPrice).toLocaleString('id-ID')} x ${item.qty}</div>
                </div>
                <button onclick="removeFromCart(${item.product_id})" 
                        style="background:none; border:none; color:#dc3545; cursor:pointer; font-size:16px;">✕</button>
            </div>`;
    });
}

function toggleCart() {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('cart-overlay');
    if (!sidebar) return;

    const isOpen = sidebar.classList.contains('active');

    if (isOpen) {
        sidebar.classList.remove('active');
        if (overlay) overlay.style.display = 'none';
    } else {
        sidebar.classList.add('active');
        if (overlay) overlay.style.display = 'block';
        renderCart();
    }
}

// ─────────────────────────────────────────────
// CHECKOUT
// ─────────────────────────────────────────────
async function openCheckout() {
    if (cart.length === 0) {
        alert('Keranjang masih kosong!');
        return;
    }

    const session = JSON.parse(localStorage.getItem('cemilkuy_session'));
    if (!session) {
        alert('Silakan login terlebih dahulu untuk checkout!');
        window.location.href = 'login.html';
        return;
    }

    const total = cart.reduce((sum, item) => sum + item.finalPrice * item.qty, 0);
    const finalTotalEl = document.getElementById('final-total');
    if (finalTotalEl) finalTotalEl.innerText = `Rp ${parseInt(total).toLocaleString('id-ID')}`;

    // Ambil QRIS dari seller produk pertama di keranjang
    const sellerId = cart[0].seller_id;
    try {
        const res = await fetch(`${API_URL}/auth/qris/${sellerId}`);
        const data = await res.json();
        const qrisImg  = document.getElementById('qris-image');
        const qrisName = document.getElementById('qris-seller-name');

        if (data.success && data.data.qris_image) {
            if (qrisImg)  qrisImg.src       = `http://localhost:3000${data.data.qris_image}`;
            if (qrisName) qrisName.innerText = data.data.shop_name || 'CEMILKUY';
        } else {
            if (qrisImg)  qrisImg.src       = 'https://via.placeholder.com/150?text=QRIS+Belum+Ada';
            if (qrisName) qrisName.innerText = 'CEMILKUY';
        }
    } catch (err) {
        console.error('Gagal ambil QRIS:', err);
    }

    const modal = document.getElementById('checkout-modal');
    if (modal) modal.style.display = 'flex';
}

function closeCheckout() {
    const modal = document.getElementById('checkout-modal');
    if (modal) modal.style.display = 'none';
}

async function prosesCheckout(e) {
    e.preventDefault();

    const nama   = document.getElementById('nama-pembeli').value.trim();
    const hp     = document.getElementById('hp-pembeli').value.trim();
    const alamat = document.getElementById('alamat-pembeli').value.trim();

    if (!nama || !hp || !alamat) {
        alert('Mohon isi semua data pengiriman!');
        return;
    }

    const token = localStorage.getItem('cemilkuy_token');
    const items = cart.map(item => ({
        product_id: item.product_id,
        quantity: item.qty
    }));

    try {
        const res = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                items,
                customer_name: nama,
                customer_phone: hp,
                delivery_address: alamat,
                payment_method: 'QRIS'
            })
        });

        const data = await res.json();

        if (data.success) {
            const total = cart.reduce((sum, item) => sum + item.finalPrice * item.qty, 0);
            const listProduk = cart.map(item => `- ${item.name} x${item.qty}`).join('%0A');
            const pesanWA = `Halo Admin Cemilkuy!%0A%0A*PESANAN BARU*%0AOrder ID: #${data.data.order_id}%0ANama: ${nama}%0AHP: ${hp}%0AAlamat: ${alamat}%0A%0AProduk:%0A${listProduk}%0A%0ATotal: Rp ${parseInt(total).toLocaleString('id-ID')}%0AMetode: QRIS%0A%0ATerima kasih!`;

            window.open(`https://wa.me/6285810533390?text=${pesanWA}`, '_blank');

            cart = [];
            updateCartUI();
            closeCheckout();
            alert('Pesanan berhasil dibuat! Lanjutkan konfirmasi di WhatsApp.');
        } else {
            alert(data.message || 'Pesanan gagal dibuat.');
        }

    } catch (err) {
        alert('Terjadi kesalahan. Coba lagi.');
    }
}

// ─────────────────────────────────────────────
// RIWAYAT PESANAN
// ─────────────────────────────────────────────
async function openHistory() {
    const modal = document.getElementById('history-modal');
    const historyList = document.getElementById('history-list');
    if (!modal || !historyList) return;

    const session = JSON.parse(localStorage.getItem('cemilkuy_session'));
    if (!session) {
        alert('Silakan login untuk melihat riwayat pesanan!');
        window.location.href = 'login.html';
        return;
    }

    modal.style.display = 'flex';
    historyList.innerHTML = '<p style="text-align:center; color:#aaa;">Memuat riwayat...</p>';

    try {
        const token = localStorage.getItem('cemilkuy_token');
        const res = await fetch(`${API_URL}/orders?as_customer=true`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (!data.success || data.data.length === 0) {
            historyList.innerHTML = '<p style="text-align:center; color:#aaa;">Belum ada riwayat pesanan.</p>';
            return;
        }

        historyList.innerHTML = data.data.map(order => `
            <div style="border:1px solid #eee; border-radius:10px; padding:15px; margin-bottom:10px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong>Order #${order.order_id}</strong>
                    <span style="background:${order.status === 'completed' ? '#d4edda' : order.status === 'cancelled' ? '#f8d7da' : '#fff3cd'};
                                 color:${order.status === 'completed' ? '#155724' : order.status === 'cancelled' ? '#721c24' : '#856404'};
                                 padding:3px 10px; border-radius:20px; font-size:12px; font-weight:bold;">
                        ${order.status === 'completed' ? 'Selesai' : order.status === 'cancelled' ? 'Dibatalkan' : 'Diproses'}
                    </span>
                </div>
                <div style="color:#888; font-size:12px; margin-top:5px;">
                    ${new Date(order.order_date).toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}
                </div>
                <div style="margin-top:8px; font-weight:bold; color:#FF7F50;">
                    Rp ${parseInt(order.total_price).toLocaleString('id-ID')}
                </div>
                <div style="font-size:12px; color:#666; margin-top:3px;">📍 ${order.delivery_address}</div>
                ${order.status === 'completed' ? `
                    <button onclick="bukaRatingDariOrder(${order.order_id})" class="btn-rate" style="margin-top:10px;">
                        <i class="fas fa-star"></i> Beri Rating
                    </button>` : ''}
            </div>`).join('');

    } catch (err) {
        historyList.innerHTML = '<p style="text-align:center; color:#dc3545;">Gagal memuat riwayat.</p>';
    }
}

async function bukaRatingDariOrder(orderId) {
    try {
        const token = localStorage.getItem('cemilkuy_token');
        const res = await fetch(`${API_URL}/orders/${orderId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success && data.data.items.length > 0) {
            tampilkanPilihanProdukRating(data.data.items);
        }
    } catch (err) {
        alert('Gagal memuat detail pesanan.');
    }
}

function tampilkanPilihanProdukRating(items) {
    const listEl = document.getElementById('product-select-list');

    listEl.innerHTML = items.map(item => `
        <div style="border:1px solid #eee; border-radius:10px; padding:12px; margin-bottom:10px; display:flex; align-items:center; gap:12px;">
            <img src="${item.image ? 'http://localhost:3000' + item.image : 'https://via.placeholder.com/50'}" 
                 style="width:50px; height:50px; object-fit:cover; border-radius:8px;">
            <div style="flex:1;">
                <div style="font-weight:bold; font-size:14px;">${item.product_name}</div>
                <div style="font-size:12px; color:#888;">Jumlah: ${item.quantity}</div>
            </div>
            <button onclick="pilihProdukUntukRating(${item.product_id}, '${item.product_name.replace(/'/g, "\\'")}')" 
                    class="btn-rate">
                <i class="fas fa-star"></i> Nilai
            </button>
        </div>`).join('');

    document.getElementById('history-modal').style.display = 'none';
    document.getElementById('product-select-modal').style.display = 'flex';
}

function closeProductSelect() {
    const modal = document.getElementById('product-select-modal');
    if (modal) modal.style.display = 'none';
}

function pilihProdukUntukRating(productId, productName) {
    currentRateId = productId;
    currentRateVal = 0;

    document.getElementById('rating-product-name').innerText = productName;
    document.getElementById('product-select-modal').style.display = 'none';
    document.getElementById('rating-modal').style.display = 'flex';
}

function closeHistory() {
    const modal = document.getElementById('history-modal');
    if (modal) modal.style.display = 'none';
}

// ─────────────────────────────────────────────
// RATING PRODUK
// ─────────────────────────────────────────────
function setRating(val) {
    currentRateVal = val;
}

async function submitRating() {
    if (!currentRateId || currentRateVal === 0) {
        alert('Pilih bintang terlebih dahulu!');
        return;
    }

    const session = JSON.parse(localStorage.getItem('cemilkuy_session'));
    if (!session) {
        alert('Silakan login untuk memberi rating!');
        return;
    }

    try {
        const token = localStorage.getItem('cemilkuy_token');
        const res = await fetch(`${API_URL}/products/${currentRateId}/rating`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ rating: currentRateVal })
        });
        const data = await res.json();

        if (data.success) {
            alert('Rating berhasil diberikan! Terima kasih.');
            closeRating();
            muatProduk();
        } else {
            alert(data.message || 'Gagal memberi rating.');
        }
    } catch (err) {
        alert('Terjadi kesalahan.');
    }
}

function closeRating() {
    const modal = document.getElementById('rating-modal');
    if (modal) modal.style.display = 'none';
    currentRateId = null;
    currentRateVal = 0;
}

// Tutup modal jika klik di luar
window.onclick = function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
};

function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}