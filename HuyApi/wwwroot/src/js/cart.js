document.addEventListener('DOMContentLoaded', () => {
    renderCart();
});

const CART_KEY = 'HuyStore_Cart';

function renderCart() {
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    const cartList = document.getElementById('cartItemsListContainer');
    const badgeTotal = document.getElementById('cartBadgeTotal');
    
    if (!cartList) return;

    if (cart.length === 0) {
        cartList.innerHTML = `
            <div class="text-center py-5">
                <img src="https://cdn-icons-png.flaticon.com/512/2038/2038854.png" width="120" class="mb-4 opacity-50">
                <h5 class="fw-bold">Giỏ hàng trống!</h5>
                <p class="text-muted">Có vẻ như ông chưa chọn được cuốn sách ưng ý nào.</p>
                <a href="index.html" class="btn btn-danger rounded-pill px-5 mt-3">TIẾP TỤC MUA SẮM</a>
            </div>
        `;
        if(badgeTotal) badgeTotal.innerText = '0 items';
        updateSummary(0);
        return;
    }

    if(badgeTotal) badgeTotal.innerText = `${cart.length} items`;

    cartList.innerHTML = cart.map((item, index) => `
        <div class="cart-item-row">
            <img src="${item.img || 'src/img/default-book.png'}" class="cart-item-img">
            <div class="ps-3">
                <div class="cart-item-title">${item.title}</div>
                <div class="cart-item-author">HuyStore.vn Edition</div>
                <div class="item-price-unit">${item.price.toLocaleString('vi-VN')} ₫</div>
            </div>
            <div class="qty-control">
                <button class="qty-btn" onclick="updateQty(${index}, -1)">-</button>
                <span class="qty-val">${item.qty}</span>
                <button class="qty-btn" onclick="updateQty(${index}, 1)">+</button>
            </div>
            <div class="text-end">
                <div class="item-total-price">${(item.price * item.qty).toLocaleString('vi-VN')} ₫</div>
                <button class="btn-remove-item" onclick="removeItem(${index})"><i class="fas fa-trash-alt"></i></button>
            </div>
        </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    updateSummary(total);
}

function updateQty(index, step) {
    let cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    cart[index].qty += step;
    if (cart[index].qty < 1) cart[index].qty = 1;
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    renderCart();
}

function removeItem(index) {
    let cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    cart.splice(index, 1);
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    renderCart();
}

function updateSummary(total) {
    const subtotalEl = document.getElementById('subtotal');
    const grandTotalEl = document.getElementById('grandTotal');
    const shippingProgress = document.getElementById('shippingProgress');
    const shippingStatus = document.getElementById('shippingStatus');
    
    if (subtotalEl) subtotalEl.innerText = total.toLocaleString('vi-VN') + ' ₫';
    if (grandTotalEl) grandTotalEl.innerText = total.toLocaleString('vi-VN') + ' ₫';
    
    if (shippingProgress) {
        let percent = (total / 200000) * 100;
        if (percent > 100) percent = 100;
        shippingProgress.style.width = percent + '%';
        if (total >= 200000) {
            shippingStatus.innerHTML = '<span class="text-success fw-bold">🎉 Miễn phí vận chuyển</span>';
        } else {
            shippingStatus.innerText = `Mua thêm ${(200000 - total).toLocaleString()}đ để được Freeship`;
        }
    }
}
