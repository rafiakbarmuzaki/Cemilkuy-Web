// --- 1. DATA PRODUK (INIT) ---
let products = JSON.parse(localStorage.getItem('cemilkuy_products'));

if (!products) {
    products = [];
    localStorage.setItem('cemilkuy_products', JSON.stringify(products));
}

let cart = [];
let currentRateId = null; 
let currentRateVal = 0;   
const ADMIN_PHONE = "6285810533390"; 

// --- 2. RENDER PRODUK ---
function renderProducts(filter = 'all') {
    const list = document.getElementById('product-list');
    if(!list) return;
    list.innerHTML = "";
    
    const safeFilter = filter.toLowerCase();

    products.forEach(p => {
        const productCategory = p.category ? p.category.toLowerCase() : '';

        if (safeFilter === 'all' || productCategory === safeFilter) {
            
            let finalPrice = p.price;
            let priceHTML = `<span class="final-price">Rp ${p.price.toLocaleString('id-ID')}</span>`;

            if (p.discount > 0) {
                finalPrice = p.price - (p.price * p.discount / 100);
                priceHTML = `
                    <div class="price-wrapper">
                        <span class="original-price">Rp ${p.price.toLocaleString('id-ID')}</span>
                        <span class="discount-badge">-${p.discount}%</span>
                    </div>
                    <span class="final-price">Rp ${finalPrice.toLocaleString('id-ID')}</span>
                `;
            }

            let stockColor = p.stock < 10 ? 'red' : '#27ae60';
            let stockText = p.stock <= 0 ? 'Habis' : `Stok: ${p.stock}`;
            let btnStatus = p.stock <= 0 ? 'disabled style="background:#ccc; cursor:not-allowed;"' : '';

            let ratingDisplay = (p.ratingCount && p.ratingCount > 0)
                ? `⭐ ${p.rating.toFixed(1)} <span style="color:#aaa; font-size:11px;">(${p.ratingCount})</span>`
                : `<span style="color:#aaa; font-size:12px;">Belum ada rating</span>`;

            let shopName = p.shop || 'Cemilkuy Pusat';

            list.innerHTML += `
                <div class="product-card">
                    <img src="${p.image}" class="product-img" onerror="this.src='https://via.placeholder.com/150'">
                    <div class="product-info">
                        <h3>${p.name}</h3>
                        <small style="color:#FF7F50; font-weight:bold; font-size:11px;"><i class="fas fa-store"></i> ${shopName}</small>
                        <div class="product-rating">
                            ${ratingDisplay}
                            <div style="margin-top:2px;">
                                <span style="color:${stockColor}; font-weight:bold; font-size:11px;">${stockText}</span>
                            </div>
                        </div>
                        <p class="product-desc">${p.description || 'Enak dan murah!'}</p>
                        <div class="price-container">${priceHTML}</div>
                        <button class="add-btn" onclick="addToCart(${p.id})" ${btnStatus}>
                            ${p.stock <= 0 ? 'Habis' : 'Tambah +'}
                        </button>
                    </div>
                </div>`;
        }
    });
}

// Helper untuk format tanggal (YYYY-MM-DD -> 17 Jan 2026)
function formatDate(dateString) {
    if (!dateString) return "-";
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}

// UPDATE FUNGSI RENDER PRODUK
function renderProducts(filter = 'all') {
    const list = document.getElementById('product-list');
    if(!list) return;
    list.innerHTML = "";
    
    const safeFilter = filter.toLowerCase();

    products.forEach(p => {
        const productCategory = p.category ? p.category.toLowerCase() : '';

        if (safeFilter === 'all' || productCategory === safeFilter) {
            
            let finalPrice = p.price;
            let priceHTML = `<span class="final-price">Rp ${p.price.toLocaleString('id-ID')}</span>`;

            if (p.discount > 0) {
                finalPrice = p.price - (p.price * p.discount / 100);
                priceHTML = `
                    <div class="price-wrapper">
                        <span class="original-price">Rp ${p.price.toLocaleString('id-ID')}</span>
                        <span class="discount-badge">-${p.discount}%</span>
                    </div>
                    <span class="final-price">Rp ${finalPrice.toLocaleString('id-ID')}</span>
                `;
            }

            let stockColor = p.stock < 10 ? 'red' : '#27ae60';
            let stockText = p.stock <= 0 ? 'Habis' : `Stok: ${p.stock}`;
            let btnStatus = p.stock <= 0 ? 'disabled style="background:#ccc; cursor:not-allowed;"' : '';

            let ratingDisplay = (p.ratingCount && p.ratingCount > 0)
                ? `⭐ ${p.rating.toFixed(1)} <span style="color:#aaa; font-size:11px;">(${p.ratingCount})</span>`
                : `<span style="color:#aaa; font-size:12px;">Belum ada rating</span>`;

            let shopName = p.shop || 'Cemilkuy Pusat';

            // HTML TANGGAL
            let dateInfo = '';
            if (p.expiryDate) {
                dateInfo = `
                    <div class="date-info" style="font-size:10px; color:#666; margin: 5px 0; background:#f9f9f9; padding:5px; border-radius:5px;">
                        <div>🏭 Prod: ${formatDate(p.productionDate)}</div>
                        <div style="color:${new Date(p.expiryDate) < new Date() ? 'red' : 'green'}; font-weight:bold;">
                            ⏳ Exp: ${formatDate(p.expiryDate)}
                        </div>
                    </div>
                `;
            }

            list.innerHTML += `
                <div class="product-card">
                    <img src="${p.image}" class="product-img" onerror="this.src='https://via.placeholder.com/150'">
                    <div class="product-info">
                        <h3>${p.name}</h3>
                        <small style="color:#FF7F50; font-weight:bold; font-size:11px;"><i class="fas fa-store"></i> ${shopName}</small>
                        
                        <div class="product-rating">
                            ${ratingDisplay}
                            <div style="margin-top:2px;">
                                <span style="color:${stockColor}; font-weight:bold; font-size:11px;">${stockText}</span>
                            </div>
                        </div>

                        ${dateInfo} <p class="product-desc">${p.description || 'Enak dan murah!'}</p>
                        <div class="price-container">${priceHTML}</div>
                        
                        <button class="add-btn" onclick="addToCart(${p.id})" ${btnStatus}>
                            ${p.stock <= 0 ? 'Habis' : 'Tambah +'}
                        </button>
                    </div>
                </div>`;
        }
    });
}

// Fungsi Filter Tombol
function filterProduk(kategori) {
    document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
    const btns = document.querySelectorAll('.cat-btn');
    btns.forEach(btn => {
        if(btn.innerText.toLowerCase().includes(kategori.toLowerCase()) || 
          (kategori === 'all' && btn.innerText.toLowerCase().includes('semua'))) {
            btn.classList.add('active');
        }
    });
    renderProducts(kategori);
}

// --- 3. KERANJANG ---
function addToCart(id) {
    const p = products.find(prod => prod.id === id);
    if(p.stock <= 0) return alert("Stok Habis!");

    // Cek Toko (Mencegah Campur Toko)
    if (cart.length > 0) {
        const currentSeller = cart[0].seller || 'admin';
        const newProductSeller = p.seller || 'admin';
        const currentShopName = cart[0].shop || 'Cemilkuy Pusat';

        if (currentSeller !== newProductSeller) {
            alert(`⚠️ TIDAK BISA CAMPUR TOKO!\n\nKeranjangmu saat ini berisi produk dari: "${currentShopName}".\n\nSilakan selesaikan pembayaran dulu atau kosongkan keranjang untuk belanja di toko lain.`);
            return; 
        }
    }
    
    let finalPrice = p.price;
    if (p.discount > 0) finalPrice = p.price - (p.price * p.discount / 100);

    const exist = cart.find(i => i.id === id);
    if(exist) {
        if(exist.quantity >= p.stock) return alert("Stok Maksimal!");
        exist.quantity++;
    } else {
        cart.push({
            ...p, 
            price: finalPrice, 
            originalPrice: p.price, 
            quantity: 1, 
            isRated: false, 
            seller: p.seller || 'admin',
            shop: p.shop || 'Cemilkuy Pusat'
        }); 
    }
    updateCartUI();
    document.getElementById('cart-sidebar').classList.add('active');
}

function updateCartUI() {
    const container = document.getElementById('cart-items');
    container.innerHTML = "";
    let total = 0, count = 0;
    
    cart.forEach(item => {
        total += item.price * item.quantity;
        count += item.quantity;
        container.innerHTML += `
            <div class="cart-item">
                <img src="${item.image}" style="width:50px;height:50px;object-fit:cover;border-radius:5px;">
                <div>
                    <h4>${item.name}</h4>
                    <small>Rp ${item.price.toLocaleString('id-ID')} x ${item.quantity}</small> <br>
                    <button class="qty-btn" onclick="changeQty(${item.id}, 'minus')">-</button> 
                    <b>${item.quantity}</b> 
                    <button class="qty-btn" onclick="changeQty(${item.id}, 'plus')">+</button>
                </div>
                <button class="delete-btn" onclick="removeFromCart(${item.id})">🗑️</button>
            </div>`;
    });
    document.getElementById('cart-total').innerText = "Rp " + total.toLocaleString('id-ID');
    document.getElementById('cart-count').innerText = count;
}

function changeQty(id, action) {
    const item = cart.find(i => i.id === id);
    const p = products.find(prod => prod.id === id);
    if(action === 'plus') {
        if(item.quantity < p.stock) item.quantity++;
    } else {
        if(item.quantity > 1) item.quantity--;
    }
    updateCartUI();
}

function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    updateCartUI();
}

// --- 4. CHECKOUT FORM LOGIC ---
const paymentForm = document.getElementById('payment-form');
if (paymentForm) {
    paymentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const nama = document.getElementById('nama-pembeli').value;
        const hp = document.getElementById('hp-pembeli').value;
        const alamat = document.getElementById('alamat-pembeli').value;
        const paymentMethod = "QRIS";

        let ordersBySeller = {};
        cart.forEach(item => {
            const sellerUsername = item.seller || 'admin';
            if (!ordersBySeller[sellerUsername]) {
                ordersBySeller[sellerUsername] = { items: [], total: 0 };
            }
            ordersBySeller[sellerUsername].items.push(item);
            ordersBySeller[sellerUsername].total += (item.price * item.quantity);
        });

        const users = JSON.parse(localStorage.getItem('cemilkuy_users')) || [];

        Object.keys(ordersBySeller).forEach((sellerKey, index) => {
            const sellerOrder = ordersBySeller[sellerKey];
            let targetPhone = ADMIN_PHONE; 
            
            if (sellerKey !== 'admin') {
                const sellerData = users.find(u => u.username === sellerKey);
                if (sellerData && sellerData.phone) {
                    let rawPhone = sellerData.phone.toString().replace(/\D/g, ''); 
                    if (rawPhone.startsWith('0')) rawPhone = '62' + rawPhone.substring(1);
                    targetPhone = rawPhone;
                }
            }

            const itemsWithCommission = sellerOrder.items.map(item => {
                const itemTotal = item.price * item.quantity;
                let adminFee = (item.seller !== 'admin') ? itemTotal * 0.10 : 0;
                return { ...item, adminFee: adminFee, commissionPaid: false };
            });

            const newOrder = {
                id: Date.now() + index,
                date: new Date().toLocaleString(),
                customer: nama, phone: hp, address: alamat,
                items: itemsWithCommission,
                totalPrice: sellerOrder.total,
                paymentMethod: paymentMethod,
                status: 'pending'
            };

            let orders = JSON.parse(localStorage.getItem('cemilkuy_orders')) || [];
            orders.push(newOrder);
            localStorage.setItem('cemilkuy_orders', JSON.stringify(orders));

            let itemsStr = sellerOrder.items.map(i => `- ${i.name} (${i.quantity}x)`).join('%0A');
            let shopName = sellerOrder.items[0].shop || "Cemilkuy";
            
            let msg = `Halo *${shopName}*, saya sudah bayar QRIS!%0A%0A` +
                      `Nama: ${nama}%0ANo HP: ${hp}%0A` +
                      `Pesanan:%0A${itemsStr}%0A` + 
                      `Total: Rp ${sellerOrder.total.toLocaleString('id-ID')}%0A` +
                      `Alamat: ${alamat}%0A%0A` + 
                      `Mohon segera diproses ya!`;
            
            setTimeout(() => {
                window.open(`https://wa.me/${targetPhone}?text=${msg}`, '_blank');
            }, index * 1000);
        });

        // Kurangi Stok
        let dbProducts = JSON.parse(localStorage.getItem('cemilkuy_products'));
        cart.forEach(c => {
            let p = dbProducts.find(prod => prod.id === c.id);
            if(p) p.stock -= c.quantity;
        });
        localStorage.setItem('cemilkuy_products', JSON.stringify(dbProducts));

        alert("Pesanan Berhasil! Chat WhatsApp ke Penjual akan terbuka.");
        cart = []; products = dbProducts;
        renderProducts('all'); updateCartUI(); closeCheckout();
        document.getElementById('payment-form').reset();
    });
}

// --- 5. RIWAYAT & RATING ---
function openHistory() {
    const historyList = document.getElementById('history-list');
    const orders = JSON.parse(localStorage.getItem('cemilkuy_orders')) || [];
    historyList.innerHTML = "";

    if(orders.length === 0) {
        historyList.innerHTML = "<p style='text-align:center; padding:20px;'>Belum ada riwayat jajan.</p>";
    } else {
        orders.slice().reverse().forEach((order, orderIdx) => {
            const originalIndex = orders.length - 1 - orderIdx;
            order.items.forEach((item, itemIdx) => {
                const btnHtml = item.isRated 
                    ? `<button class="btn-rate rated">Sudah Dinilai ✅</button>`
                    : `<button class="btn-rate" onclick="openRatingModal(${originalIndex}, ${itemIdx}, '${item.name}')">⭐ Beri Nilai</button>`;

                let statusBadge = order.status === 'completed' 
                    ? '<span style="color:green; font-weight:bold;">Selesai</span>' 
                    : '<span style="color:orange; font-weight:bold;">Diproses</span>';

                historyList.innerHTML += `
                    <div class="history-item">
                        <div class="history-info">
                            <h4>${item.name} (${item.quantity}x)</h4>
                            <small>${order.date} • ${statusBadge}</small>
                        </div>
                        ${btnHtml}
                    </div>`;
            });
        });
    }
    const modal = document.getElementById('history-modal');
    if(modal) modal.style.display = 'block';
}

function openRatingModal(orderIndex, itemIndex, productName) {
    document.getElementById('rating-product-name').innerText = productName;
    document.getElementById('history-modal').style.display = 'none';
    document.getElementById('rating-modal').style.display = 'block';
    currentRateId = { orderIdx: orderIndex, itemIdx: itemIndex };
    currentRateVal = 5;
    const rate5 = document.getElementById('rate-5');
    if(rate5) rate5.checked = true;
    document.getElementById('rating-review').value = "";
}

function setRating(val) { currentRateVal = val; }

function submitRating() {
    if(!currentRateId) return;
    let orders = JSON.parse(localStorage.getItem('cemilkuy_orders'));
    let targetItem = orders[currentRateId.orderIdx].items[currentRateId.itemIdx];
    if(!targetItem) return alert("Error data item.");

    targetItem.isRated = true;
    localStorage.setItem('cemilkuy_orders', JSON.stringify(orders));

    let dbProducts = JSON.parse(localStorage.getItem('cemilkuy_products'));
    let productToUpdate = dbProducts.find(p => p.id === targetItem.id);

    if (productToUpdate) {
        let currentCount = productToUpdate.ratingCount || 0;
        let currentRating = productToUpdate.rating || 0;
        let oldTotal = currentRating * currentCount;
        let newCount = currentCount + 1;
        let newRating = (oldTotal + currentRateVal) / newCount;

        productToUpdate.rating = newRating;
        productToUpdate.ratingCount = newCount;
        localStorage.setItem('cemilkuy_products', JSON.stringify(dbProducts));
        products = dbProducts;
    }
    alert("Terima kasih ulasannya! ⭐");
    closeRating();
    renderProducts('all');
}

// --- UTILS ---
function closeCheckout() { document.getElementById('checkout-modal').style.display = 'none'; }
function closeHistory() { document.getElementById('history-modal').style.display = 'none'; }
function closeRating() { document.getElementById('rating-modal').style.display = 'none'; }
function toggleCart() { document.getElementById('cart-sidebar').classList.toggle('active'); }

function searchMenu() {
    let val = document.getElementById('searchInput').value.toLowerCase();
    const list = document.getElementById('product-list');
    list.innerHTML = "";
    
    products.forEach(p => {
        if (p.name.toLowerCase().includes(val)) {
             let stockColor = p.stock < 10 ? 'red' : '#27ae60';
             let stockText = p.stock <= 0 ? 'Habis' : `Stok: ${p.stock}`;
             let btnStatus = p.stock <= 0 ? 'disabled style="background:#ccc; cursor:not-allowed;"' : '';
             
             let finalPrice = p.price;
             let priceHTML = `<span class="final-price">Rp ${p.price.toLocaleString('id-ID')}</span>`;
             if (p.discount > 0) {
                 finalPrice = p.price - (p.price * p.discount / 100);
                 priceHTML = `<div class="price-wrapper"><span class="original-price">Rp ${p.price.toLocaleString('id-ID')}</span><span class="discount-badge">-${p.discount}%</span></div><span class="final-price">Rp ${finalPrice.toLocaleString('id-ID')}</span>`;
             }

             let ratingDisplay = (p.ratingCount && p.ratingCount > 0)
                ? `⭐ ${p.rating.toFixed(1)} <span style="color:#aaa; font-size:11px;">(${p.ratingCount})</span>`
                : `<span style="color:#aaa; font-size:12px;">-</span>`;

             let shopName = p.shop || 'Cemilkuy Pusat';

             list.innerHTML += `
                <div class="product-card">
                    <img src="${p.image}" class="product-img" onerror="this.src='https://via.placeholder.com/150'">
                    <div class="product-info">
                        <h3>${p.name}</h3>
                        <small style="color:#FF7F50; font-weight:bold; font-size:11px;"><i class="fas fa-store"></i> ${shopName}</small>
                        <div class="product-rating">${ratingDisplay} <span style="color:${stockColor};font-size:11px;font-weight:bold;margin-left:5px;">${stockText}</span></div>
                        <p class="product-desc">${p.description}</p>
                        <div class="price-container">${priceHTML}</div>
                        <button class="add-btn" onclick="addToCart(${p.id})" ${btnStatus}>${p.stock <= 0 ? 'Habis' : 'Tambah +'}</button>
                    </div>
                </div>`;
        }
    });
}

function checkLoginStatus() { }

// --- INIT (DAN EVENT LISTENER CHECKOUT DISINI) ---
document.addEventListener('DOMContentLoaded', () => {
    renderProducts('all');

    // === PERBAIKAN TOMBOL CHECKOUT (DIMASUKKAN KE SINI) ===
    // Memastikan DOM sudah siap sebelum mencari elemen ID
    const btnCheckout = document.getElementById('tombol-checkout');
    
    if(btnCheckout) {
        btnCheckout.addEventListener('click', function() {
            if(cart.length === 0) {
                alert("Keranjang Kosong!");
                return;
            }
            
            // 1. Hitung Total
            let total = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
            document.getElementById('final-total').innerText = "Rp " + total.toLocaleString('id-ID');
            
            // 2. Ambil Info Penjual dari Keranjang
            const sellerUsername = cart[0].seller || 'admin';
            const shopName = cart[0].shop || "CEMILKUY INDONESIA";

            // 3. Update Nama Toko di Modal
            const qrisNameElement = document.getElementById('qris-seller-name');
            if(qrisNameElement) qrisNameElement.innerText = "TOKO: " + shopName.toUpperCase();

            // 4. Update Gambar QRIS (Ambil dari Database User)
            const qrisImgElement = document.getElementById('qris-image');
            const users = JSON.parse(localStorage.getItem('cemilkuy_users')) || [];
            const sellerData = users.find(u => u.username === sellerUsername);

            if (qrisImgElement) {
                if (sellerData && sellerData.qris) {
                    qrisImgElement.src = sellerData.qris; // Gambar Penjual
                } else {
                    qrisImgElement.src = "gambar/QR Cemilkuy.png"; // Gambar Default
                }
            }

            // 5. Buka Modal
            document.getElementById('cart-sidebar').classList.remove('active');
            document.getElementById('checkout-modal').style.display = 'block';
        });
    }
});