/* ============================================================
   HUYSTORE.VN – STOREFRONT JAVASCRIPT
   Connects to ASP.NET API: GET /api/Books, /api/Categories
   ============================================================ */

'use strict';

// ─── State ───────────────────────────────────────────────────
let allProducts   = [];
let filteredBooks = [];
let currentPage   = 1;
const PER_PAGE    = 20;
let cartItems     = JSON.parse(localStorage.getItem('hs_cart') || '[]');

// Random book cover pool (fallback)
const COVERS = [
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=580&fit=crop',
    'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=580&fit=crop',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=580&fit=crop',
    'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=580&fit=crop',
    'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&h=580&fit=crop',
    'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400&h=580&fit=crop',
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=580&fit=crop',
    'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&h=580&fit=crop',
];

// ─── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();
    checkUser();
    startCountdown();
    loadCategories();
    loadProducts();
});

function toggleCart(e) {
    if (e) e.stopPropagation();
    const cartDropdown = document.getElementById('cartDropdown');
    if (cartDropdown) {
        cartDropdown.classList.toggle('active');
        if (cartDropdown.classList.contains('active')) {
            renderCart();
        }
    }
}

// Đóng giỏ hàng khi bấm ra ngoài
document.addEventListener('click', () => {
    const cartDropdown = document.getElementById('cartDropdown');
    if (cartDropdown) cartDropdown.classList.remove('active');
});

// ─── Auth ─────────────────────────────────────────────────────
function checkUser() {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const label = document.getElementById('userLabel');
    const menu  = document.getElementById('userMenu');
    if (user && label) {
        label.textContent = user.username || 'Tài khoản';
        if (menu) {
            menu.onclick = (e) => {
                e.stopPropagation();
                // Nếu là admin thì bay thẳng vào trang quản trị
                if (user.role && user.role.toLowerCase() === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    if (confirm(`Xin chào ${user.username}! Bạn muốn đăng xuất?`)) {
                        localStorage.removeItem('currentUser');
                        location.reload();
                    }
                }
            };
        }
    }
}

// ─── Categories from API ──────────────────────────────────────
function loadCategories() {
    fetch('/api/Categories')
        .then(r => r.ok ? r.json() : [])
        .then(cats => {
            renderSidebarCategories(cats);
            renderCategoryPills(cats);
        })
        .catch(() => { /* Silently ignore – pills already seeded in HTML */ });
}

function renderSidebarCategories(cats) {
    const list = document.getElementById('categoryList');
    if (!list || cats.length === 0) return;
    const extras = cats.map(c => `
        <li class="sidebar-item" data-cat="${c.name}" onclick="filterByCategory('${c.name}', this)">
            <i class="fas fa-tag"></i> ${c.name}
        </li>`).join('');
    list.innerHTML = `
        <li class="sidebar-item active" data-cat="all" onclick="filterByCategory('all', this)">
            <i class="fas fa-home"></i> Tất cả
        </li>
        ${extras}`;
}

function renderCategoryPills(cats) {
    if (cats.length === 0) return;
    const wrap = document.getElementById('categoryPills');
    if (!wrap) return;
    const extra = cats.slice(0, 6).map(c =>
        `<button class="cat-pill" data-cat="${c.name}" onclick="filterByCategory('${c.name}', this)">${c.name}</button>`
    ).join('');
    // Append without removing existing ones if API returns same data
    const existing = [...wrap.querySelectorAll('.cat-pill')].map(b => b.dataset.cat);
    cats.forEach(c => {
        if (!existing.includes(c.name)) {
            const btn = document.createElement('button');
            btn.className = 'cat-pill';
            btn.dataset.cat = c.name;
            btn.onclick = function() { filterByCategory(c.name, this); };
            btn.textContent = c.name;
            wrap.appendChild(btn);
        }
    });
}

// ─── Products from API ────────────────────────────────────────
function loadProducts() {
    fetch('/api/Books')
        .then(r => {
            if (!r.ok) throw new Error('API error');
            return r.json();
        })
        .then(data => {
            data.sort((a, b) => (b.id || 0) - (a.id || 0));
            allProducts = data.map((p, idx) => {
                const basePrice = p.price || p.Price || (85000 + (p.id || idx) * 3700);
                
                // ƯU TIÊN ẢNH THẬT
                let img = p.imageUrl || p.ImageUrl || "";
                if (!img || img === "" || img.includes('placeholder.com')) {
                    img = COVERS[(p.id || idx) % COVERS.length];
                }

                return {
                    id:       p.id || p.Id,
                    title:    p.title || p.Title || 'Chưa có tên',
                    author:   p.author || p.Author || (p.publisher ? p.publisher.name : '') || 'Tác giả ẩn danh',
                    category: p.category ? (p.category.name || p.category.Name) : (p.categoryName || p.CategoryName || ''),
                    image:    img,
                    price:    basePrice,
                    oldPrice: Math.round(basePrice * 1.25 / 1000) * 1000,
                };
            });
            filteredBooks = [...allProducts];
            currentPage   = 1;
            renderProducts();
            renderBestSellers();
        })
        .catch(err => {
            console.warn('API error:', err);
            showApiError();
        });
}

function showApiError() {
    const grid = document.getElementById('productGrid');
    if (grid) grid.innerHTML = `
        <div class="col-12 text-center py-5">
            <i class="fas fa-exclamation-circle text-danger" style="font-size:48px"></i>
            <p class="mt-3 text-muted fw-bold">Không thể kết nối API.<br>
            <small>Đảm bảo ASP.NET server đang chạy!</small></p>
        </div>`;
}

// ─── Filter ───────────────────────────────────────────────────
function filterByCategory(cat, el) {
    // Sync pills and sidebar
    document.querySelectorAll('.cat-pill, .sidebar-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll(`[data-cat="${cat}"]`).forEach(b => b.classList.add('active'));

    filteredBooks = cat === 'all'
        ? [...allProducts]
        : allProducts.filter(p => p.category === cat);

    currentPage = 1;
    const title = document.getElementById('sectionTitle');
    if (title) title.textContent = cat === 'all' ? 'Gợi Ý Hôm Nay' : cat;
    renderProducts();
}

// ─── Search ───────────────────────────────────────────────────
function handleSearch(e) {
    e.preventDefault();
    const q = document.getElementById('searchInput').value.trim().toLowerCase();
    if (!q) { filteredBooks = [...allProducts]; }
    else {
        filteredBooks = allProducts.filter(p =>
            p.title.toLowerCase().includes(q) ||
            p.author.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q)
        );
    }
    currentPage = 1;
    const title = document.getElementById('sectionTitle');
    if (title) title.textContent = q ? `Kết quả: "${q}"` : 'Gợi Ý Hôm Nay';
    renderProducts();
}

// ─── Render Products ──────────────────────────────────────────
function renderProducts() {
    const grid = document.getElementById('productGrid');
    if (!grid) return;

    const total = document.getElementById('totalCount');
    if (total) total.textContent = filteredBooks.length > 0
        ? `${filteredBooks.length.toLocaleString()} sản phẩm`
        : '';

    const start = (currentPage - 1) * PER_PAGE;
    const page  = filteredBooks.slice(start, start + PER_PAGE);

    if (page.length === 0) {
        grid.innerHTML = `<div class="col-12 text-center py-5 text-muted">
            <i class="fas fa-search-minus" style="font-size:40px;opacity:.4"></i>
            <p class="mt-3">Không tìm thấy sách phù hợp.</p>
        </div>`;
        document.getElementById('paginationControls').innerHTML = '';
        return;
    }

    grid.innerHTML = page.map(p => {
        const disc = Math.round((1 - p.price / p.oldPrice) * 100);
        return `
        <div class="col">
            <div class="book-card" style="cursor:pointer" onclick="openBook(${p.id})">
                <span class="discount-tag">-${disc}%</span>
                <div class="book-img-wrap">
                    <img class="book-img" src="${p.image}" alt="${p.title}" loading="lazy">
                </div>
                <div class="book-title">${p.title}</div>
                <div class="book-author">${p.author}</div>
                <div class="price-row">
                    <span class="price-new">${p.price.toLocaleString('vi-VN')}đ</span>
                    <span class="price-old">${p.oldPrice.toLocaleString('vi-VN')}đ</span>
                </div>
                <button class="btn-add-cart-simple" onclick="handleAddToCart(event, ${p.id}, '${p.title.replace(/'/g, "\\'")}', ${p.price})">
                    <i class="fas fa-shopping-basket me-2"></i> THÊM VÀO GIỎ
                </button>
            </div>
        </div>`;
    }).join('');

    renderPagination();
}

// ─── Pagination ───────────────────────────────────────────────
function renderPagination() {
    const wrap = document.getElementById('paginationControls');
    if (!wrap) return;
    const total = Math.ceil(filteredBooks.length / PER_PAGE);
    if (total <= 1) { wrap.innerHTML = ''; return; }

    let html = '';
    // Prev
    html += `<li><button class="page-btn" ${currentPage===1?'disabled':''} onclick="goToPage(${currentPage-1})"><i class="fas fa-chevron-left"></i></button></li>`;

    // Page numbers with ellipsis
    for (let i = 1; i <= total; i++) {
        if (i === 1 || i === total || (i >= currentPage-2 && i <= currentPage+2)) {
            html += `<li><button class="page-btn ${i===currentPage?'active':''}" onclick="goToPage(${i})">${i}</button></li>`;
        } else if (i === currentPage-3 || i === currentPage+3) {
            html += `<li><button class="page-btn" disabled>…</button></li>`;
        }
    }

    // Next
    html += `<li><button class="page-btn" ${currentPage===total?'disabled':''} onclick="goToPage(${currentPage+1})"><i class="fas fa-chevron-right"></i></button></li>`;
    wrap.innerHTML = html;
}

function goToPage(page) {
    currentPage = page;
    renderProducts();
    document.getElementById('productSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── Best Sellers ─────────────────────────────────────────────
function renderBestSellers() {
    const list = document.getElementById('bestSellerList');
    if (!list || allProducts.length === 0) return;
    const top = [...allProducts].sort(() => Math.random() - .5).slice(0, 5);
    list.innerHTML = top.map((p, i) => `
        <div class="bs-item" onclick="openBook(${p.id})">
            <div class="bs-rank ${i < 3 ? 'top' : ''}">${i+1}</div>
            <img class="bs-img" src="${p.image}" alt="${p.title}" loading="lazy">
            <div class="bs-info">
                <div class="bs-title">${p.title}</div>
                <div class="bs-price">${p.price.toLocaleString('vi-VN')}đ</div>
            </div>
        </div>`).join('');
}

// ─── Cart ─────────────────────────────────────────────────────
function addToCart(event, id) {
    event.stopPropagation();
    const product = allProducts.find(p => p.id === id);
    if (!product) return;

    // --- HIỆU ỨNG BAY VÀO GIỎ ---
    const btn = event.currentTarget;
    const card = btn.closest('.book-card');
    const img = card.querySelector('.book-img');
    const cartBtn = document.getElementById('cartBtn');

    if (img && cartBtn) {
        // Tạo bản sao ảnh để bay
        const flyImg = img.cloneNode();
        const rect = img.getBoundingClientRect();
        const cartRect = cartBtn.getBoundingClientRect();

        flyImg.classList.add('flying-item');
        flyImg.style.top = rect.top + 'px';
        flyImg.style.left = rect.left + 'px';
        flyImg.style.width = rect.width + 'px';
        flyImg.style.height = rect.height + 'px';

        document.body.appendChild(flyImg);

        // Bắt đầu bay sau 10ms
        setTimeout(() => {
            flyImg.style.top = (cartRect.top + 10) + 'px';
            flyImg.style.left = (cartRect.left + 20) + 'px';
            flyImg.style.width = '20px';
            flyImg.style.height = '30px';
            flyImg.style.opacity = '0.4';
            flyImg.style.transform = 'rotate(360deg)';
        }, 10);

        // Xóa ảnh sau khi bay xong và làm rung giỏ hàng
        setTimeout(() => {
            flyImg.remove();
            cartBtn.classList.add('cart-bounce');
            setTimeout(() => cartBtn.classList.remove('cart-bounce'), 400);
        }, 800);
    }
    // ----------------------------

    const existing = cartItems.find(c => c.id === id);
    if (existing) { existing.qty++; }
    else { cartItems.push({ ...product, qty: 1 }); }

    localStorage.setItem('hs_cart', JSON.stringify(cartItems));
    updateCartUI();
    showToast(`Đã thêm "${product.title.slice(0, 30)}..." vào giỏ!`);
}

function updateCartUI() {
    const total = cartItems.reduce((s, c) => s + c.qty, 0);
    const price = cartItems.reduce((s, c) => s + c.price * c.qty, 0);
    const countEl = document.getElementById('cartCount');
    const totalEl = document.getElementById('cartTotal');
    if (countEl) countEl.textContent = total;
    if (totalEl) totalEl.textContent = price > 0 ? price.toLocaleString('vi-VN') + 'đ' : '0đ';
}

function renderCart() {
    const container = document.getElementById('cartItemsList');
    const totalEl = document.getElementById('dropdownCartTotal');
    if (!container) return;

    if (cartItems.length === 0) {
        container.innerHTML = '<div class="text-center py-4 text-muted">Giỏ hàng trống</div>';
        if (totalEl) totalEl.textContent = '0đ';
        return;
    }

    let html = '';
    let total = 0;
    cartItems.forEach((item, index) => {
        total += item.price * item.qty;
        html += `
            <div class="cart-item-mini">
                <img src="${item.image || item.imageUrl}" alt="${item.title}">
                <div class="item-info">
                    <div class="item-title">${item.title}</div>
                    <div class="item-price">${item.price.toLocaleString('vi-VN')}đ x ${item.qty}</div>
                </div>
                <button class="btn-remove" onclick="removeFromCart(${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    });
    container.innerHTML = html;
    if (totalEl) totalEl.textContent = total.toLocaleString('vi-VN') + 'đ';
}

function removeFromCart(index) {
    cartItems.splice(index, 1);
    localStorage.setItem('hs_cart', JSON.stringify(cartItems));
    updateCartUI();
    renderCart();
}

// ─── Toast ────────────────────────────────────────────────────
function showToast(msg) {
    const el = document.getElementById('cartToast');
    const msgEl = document.getElementById('toastMsg');
    if (!el) return;
    if (msgEl) msgEl.textContent = msg;
    const t = new bootstrap.Toast(el, { delay: 2500 });
    t.show();
}

// ─── Countdown ────────────────────────────────────────────────
function startCountdown() {
    const el = document.getElementById('countdown');
    if (!el) return;

    function tick() {
        const now  = new Date();
        // Next 12:00 PM
        const next = new Date(now);
        next.setHours(12, 0, 0, 0);
        if (now >= next) next.setDate(next.getDate() + 1);
        const diff = next - now;
        const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
        const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
        const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
        el.textContent = `${h}:${m}:${s}`;
    }
    tick();
    setInterval(tick, 1000);
}

// --- Điều hướng & Giỏ hàng ---
function openBook(id) {
    window.location.href = `product-detail.html?id=${id}`;
}

function handleAddToCart(event, id, title, price) {
    event.stopPropagation(); // QUAN TRỌNG: Ngăn không cho nhảy sang trang chi tiết
    addToCart(id, title, price);
}

function updateCartHeader() {
    const cart = JSON.parse(localStorage.getItem('HuyStore_Cart') || '[]');
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    
    const badge = document.getElementById('cartCount') || document.querySelector('.cart-badge');
    const totalEl = document.getElementById('cartTotal');
    if(badge) badge.innerText = totalQty;
    if(totalEl) totalEl.innerText = totalPrice.toLocaleString('vi-VN') + ' ₫';
}

function addToCart(id, title, price, imgSource) {
    const cartBtn = document.getElementById('cartBtn') || document.querySelector('.cart-action');
    
    let cart = JSON.parse(localStorage.getItem('HuyStore_Cart') || '[]');
    const existing = cart.find(item => item.id == id);
    if (existing) {
        existing.qty += 1;
    } else {
        const cardEl = event.target.closest('.col') || event.target.closest('.product-card');
        const imgEl = cardEl ? cardEl.querySelector('img') : null;
        cart.push({ id, title, price, qty: 1, img: imgEl ? imgEl.src : "" });
    }
    localStorage.setItem('HuyStore_Cart', JSON.stringify(cart));
    updateCartHeader();

    // Hiệu ứng bay
    const cardEl = event.target.closest('.col') || event.target.closest('.product-card');
    const imgEl = cardEl ? cardEl.querySelector('img') : imgSource;

    if (imgEl && cartBtn) {
        const flyImg = imgEl.cloneNode(true);
        const rect = imgEl.getBoundingClientRect();
        const cartRect = cartBtn.getBoundingClientRect();

        flyImg.className = 'fly-item';
        flyImg.style.top = rect.top + 'px';
        flyImg.style.left = rect.left + 'px';
        flyImg.style.width = rect.width + 'px';
        flyImg.style.height = rect.height + 'px';
        document.body.appendChild(flyImg);

        setTimeout(() => {
            flyImg.style.top = (cartRect.top + window.scrollY) + 'px';
            flyImg.style.left = cartRect.left + 'px';
            flyImg.style.width = '20px'; flyImg.style.height = '30px';
            flyImg.style.opacity = '0.1'; flyImg.style.transform = 'rotate(720deg)';
        }, 10);

        setTimeout(() => {
            flyImg.remove();
            const toastEl = document.getElementById('cartToast');
            if(toastEl) {
                const toast = new bootstrap.Toast(toastEl);
                document.getElementById('toastMsg').innerText = `Đã thêm vào giỏ!`;
                toast.show();
            }
        }, 850);
    }
}

document.addEventListener('DOMContentLoaded', updateCartHeader);
