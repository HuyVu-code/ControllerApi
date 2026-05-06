const CART_KEY = 'HuyStore_Cart';

document.addEventListener('DOMContentLoaded', () => {
    console.log("Cart V3 - Ready to Checkout!");
    renderCart();
});

function renderCart() {
    const raw = localStorage.getItem(CART_KEY);
    const cart = JSON.parse(raw || '[]');
    const container = document.getElementById('cartItemsListContainer');
    const badgeTotal = document.getElementById('cartBadgeTotal');
    
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <img src="https://cdn-icons-png.flaticon.com/512/2038/2038854.png" width="120" class="mb-4 opacity-50">
                <h5 class="fw-bold">Giỏ hàng đang trống!</h5>
                <p class="text-muted">Ông hãy quay lại trang chủ để chọn những cuốn sách hay nhất nhé.</p>
                <a href="index.html" class="btn btn-danger rounded-pill px-5 mt-3 fw-bold">TIẾP TỤC MUA SẮM</a>
            </div>
        `;
        updateSummary(0);
        return;
    }

    if(badgeTotal) badgeTotal.innerText = `${cart.length} sản phẩm`;

    container.innerHTML = cart.map((item, index) => `
        <div class="cart-item-row border-bottom pb-3 mb-3">
            <div class="d-flex align-items-center">
                <img src="${item.img || 'src/img/default-book.png'}" style="width:80px; height:110px; object-fit:contain" class="rounded shadow-sm">
                <div class="ms-4 flex-grow-1">
                    <div class="cart-item-title h6 fw-bold mb-1">${item.title}</div>
                    <div class="text-muted small">HuyStore.vn Edition</div>
                    <div class="text-danger fw-bold mt-2">${item.price.toLocaleString('vi-VN')} ₫</div>
                </div>
                <div class="qty-control d-flex align-items-center bg-light rounded p-1">
                    <button class="btn btn-sm btn-white shadow-sm fw-bold" onclick="changeQty(${index}, -1)">-</button>
                    <span class="px-3 fw-bold">${item.qty}</span>
                    <button class="btn btn-sm btn-white shadow-sm fw-bold" onclick="changeQty(${index}, 1)">+</button>
                </div>
                <div class="text-end ms-5" style="min-width: 120px">
                    <div class="item-total-price fw-bold text-danger h5 mb-0">${(item.price * item.qty).toLocaleString('vi-VN')} ₫</div>
                    <button class="btn btn-link text-muted p-0 mt-2" onclick="delItem(${index})"><i class="fas fa-trash-alt"></i> Xóa</button>
                </div>
            </div>
        </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    updateSummary(total);
}

function changeQty(index, step) {
    let cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    cart[index].qty += step;
    if (cart[index].qty < 1) cart[index].qty = 1;
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    renderCart();
}

function delItem(index) {
    if(confirm("Ông có chắc muốn bỏ cuốn sách này khỏi giỏ hàng?")) {
        let cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
        cart.splice(index, 1);
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        renderCart();
    }
}

function updateSummary(total) {
    const subtotalEl = document.getElementById('subtotal');
    const grandTotalEl = document.getElementById('grandTotal');
    const progress = document.getElementById('shippingProgress');
    const status = document.getElementById('shippingStatus');
    
    if (subtotalEl) subtotalEl.innerText = total.toLocaleString('vi-VN') + ' ₫';
    if (grandTotalEl) grandTotalEl.innerText = total.toLocaleString('vi-VN') + ' ₫';
    
    if (progress && status) {
        let p = (total / 200000) * 100;
        if (p > 100) p = 100;
        progress.style.width = p + '%';
        if (total >= 200000) {
            status.innerHTML = '<b class="text-success fw-bold">🎉 Miễn phí vận chuyển</b>';
        } else {
            status.innerText = `Mua thêm ${(200000 - total).toLocaleString()}đ để được Freeship`;
        }
    }
}

function proceedToCheckout() {
    console.log("Redirecting to checkout.html...");
    window.location.href = 'checkout.html';
}
