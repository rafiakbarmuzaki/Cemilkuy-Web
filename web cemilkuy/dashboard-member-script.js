// ============================================================
// dashboard-member-script.js — Script untuk dashboard-member.html
// Halaman profil member: lihat profil & riwayat pesanan
// ============================================================



document.addEventListener('DOMContentLoaded', () => {
    const session = JSON.parse(localStorage.getItem('cemilkuy_session'));

    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    // Isi nama dan badge di header
    const displayName = document.getElementById('display-name');
    if (displayName) displayName.innerText = session.full_name || session.username;

    // Isi form profil
    setValue('input-nama',     session.full_name || '');
    setValue('input-username', session.username  || '');
    setValue('input-phone',    session.phone     || '');

    // Muat riwayat pesanan
    muatRiwayat();
});

// ─────────────────────────────────────────────
// MUAT RIWAYAT PESANAN MEMBER
// ─────────────────────────────────────────────
async function muatRiwayat() {
    const token    = localStorage.getItem('cemilkuy_token');
    const riwayatEl = document.getElementById('riwayat-pesanan');
    if (!riwayatEl) return;

    riwayatEl.innerHTML = '<p style="color:#aaa; text-align:center;">Memuat riwayat...</p>';

    try {
        const res  = await fetch(`${API_URL}/orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (!data.success || data.data.length === 0) {
            riwayatEl.innerHTML = '<p style="color:#aaa; text-align:center;">Belum ada riwayat pesanan.</p>';
            return;
        }

        riwayatEl.innerHTML = data.data.map(order => `
            <div style="border:1px solid #eee; border-radius:10px; padding:15px; margin-bottom:12px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <strong style="color:#333;">Order #${order.order_id}</strong>
                    <span style="
                        background:${order.status === 'completed' ? '#d4edda' : order.status === 'cancelled' ? '#f8d7da' : '#fff3cd'};
                        color:${order.status === 'completed' ? '#155724' : order.status === 'cancelled' ? '#721c24' : '#856404'};
                        padding:3px 12px; border-radius:20px; font-size:12px; font-weight:bold;">
                        ${order.status === 'completed' ? '✅ Selesai' : order.status === 'cancelled' ? '❌ Dibatalkan' : '⏳ Diproses'}
                    </span>
                </div>
                <div style="font-size:12px; color:#999;">${new Date(order.order_date).toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}</div>
                <div style="margin-top:6px; color:#FF7F50; font-weight:bold;">Rp ${parseInt(order.total_price).toLocaleString('id-ID')}</div>
                <div style="font-size:12px; color:#888; margin-top:4px;">📍 ${order.delivery_address}</div>
            </div>`).join('');

    } catch (err) {
        riwayatEl.innerHTML = '<p style="color:#dc3545; text-align:center;">Gagal memuat riwayat.</p>';
    }
}

// ─────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────
function logout() {
    localStorage.removeItem('cemilkuy_token');
    localStorage.removeItem('cemilkuy_session');
    window.location.href = 'login.html';
}

function getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
}
function setValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
}
