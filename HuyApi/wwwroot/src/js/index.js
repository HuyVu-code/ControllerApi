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
    if (e && e.preventDefault) e.preventDefault();
    const q = document.getElementById('searchInput').value.trim().toLowerCase();
    
    if (!q) { 
        filteredBooks = [...allProducts]; 
    } else {
        filteredBooks = allProducts.filter(p =>
            (p.title && p.title.toLowerCase().includes(q)) ||
            (p.author && p.author.toLowerCase().includes(q)) ||
            (p.category && p.category.toLowerCase().includes(q))
        );
    }
    
    currentPage = 1;
    const title = document.getElementById('sectionTitle');
    if (title) title.textContent = q ? `Kết quả tìm kiếm: "${q}"` : 'Gợi Ý Hôm Nay';
    
    renderProducts();
    
    // Tự động cuộn xuống phần sản phẩm nếu người dùng bấm nút Tìm kiếm
    if (e && e.type === 'submit') {
        const productSection = document.getElementById('productSection');
        if (productSection) {
            productSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}

// Lắng nghe sự kiện gõ phím để hiển thị hộp thoại gợi ý (Autocomplete)
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchSuggest = document.getElementById('searchSuggest');

    if (searchInput && searchSuggest) {
        searchInput.addEventListener('input', (e) => {
            const q = e.target.value.trim().toLowerCase();
            
            if (!q) {
                searchSuggest.classList.remove('active');
                return;
            }

            // Lọc nhanh 5 sản phẩm khớp nhất
            const suggestBooks = allProducts.filter(p =>
                (p.title && p.title.toLowerCase().includes(q)) ||
                (p.author && p.author.toLowerCase().includes(q)) ||
                (p.category && p.category.toLowerCase().includes(q))
            ).slice(0, 5); // Chỉ lấy 5 kết quả đầu tiên

            if (suggestBooks.length === 0) {
                searchSuggest.innerHTML = '<div class="p-3 text-center text-muted small">Không tìm thấy sách phù hợp</div>';
            } else {
                searchSuggest.innerHTML = suggestBooks.map(p => `
                    <div class="suggest-item" onclick="openBook(${p.id})">
                        <img class="suggest-img" src="${p.image}" alt="${p.title}">
                        <div class="suggest-info">
                            <div class="suggest-title">${p.title}</div>
                            <div class="suggest-author">${p.author}</div>
                            <div class="suggest-price">${p.price.toLocaleString('vi-VN')}đ</div>
                        </div>
                    </div>
                `).join('');
                
                // Thêm mục xem tất cả kết quả
                searchSuggest.innerHTML += `
                    <div class="text-center p-2" style="background: #f9f9f9; border-top: 1px solid #eee; cursor: pointer; color: var(--red); font-weight: 600; font-size: 13px;" onclick="document.getElementById('searchForm').dispatchEvent(new Event('submit'))">
                        Xem tất cả kết quả cho "${e.target.value}" <i class="fas fa-angle-right ms-1"></i>
                    </div>
                `;
            }
            
            searchSuggest.classList.add('active');
            
            // Cập nhật ngầm lưới sản phẩm bên dưới để đồng bộ
            handleSearch();
        });

        // Ẩn hộp thoại khi click ra ngoài
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-wrapper')) {
                searchSuggest.classList.remove('active');
            }
        });
        
        // Hiện lại hộp thoại khi click vào ô tìm kiếm (nếu đã có nội dung)
        searchInput.addEventListener('focus', () => {
            if (searchInput.value.trim() !== '') {
                searchSuggest.classList.add('active');
            }
        });
    }
});

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

// ==========================================
// AI CHATBOT LOGIC
// ==========================================
function toggleAIChat() {
    const box = document.getElementById('aiChatBox');
    const badge = document.querySelector('.ai-chat-badge');
    if (box.classList.contains('d-none')) {
        box.classList.remove('d-none');
        if (badge) badge.style.display = 'none';
        document.getElementById('aiChatInput').focus();
    } else {
        box.classList.add('d-none');
    }
}

function handleAIChatKey(e) {
    if (e.key === 'Enter') {
        sendAIMessage();
    }
}

const GEMINI_API_KEY = 'AIzaSyDvejtPghUoqWfvwZLxbsiFMWPTkVvsNmw';

let aiChatHistory = [];

async function sendAIMessage() {
    const input = document.getElementById('aiChatInput');
    const msg = input.value.trim();
    if (!msg) return;

    // Hiện tin nhắn user
    appendMessage(msg, 'user');
    input.value = '';

    // Hiện Typing
    const typingId = showTyping();

    try {
        const response = await getGeminiResponse(msg);
        const tEl = document.getElementById(typingId);
        if (tEl) tEl.remove();
        appendMessage(response, 'bot');
    } catch (e) {
        console.error("Lỗi gọi Gemini:", e);
        const tEl = document.getElementById(typingId);
        if (tEl) tEl.remove();
        appendMessage("Lỗi kết nối Gemini API. Bạn hãy nhấn F12 -> Console để xem chi tiết lỗi nhé!", 'bot');
    }
}

async function getGeminiResponse(userText) {
    if (aiChatHistory.length === 0) {
        // Lấy danh sách tối đa 40 sách hiện có để nạp vào não AI
        const bookTitles = allProducts.map(p => p.title || p.Title).slice(0, 40).join(', ');
        
        aiChatHistory.push({
            "role": "user",
            "parts": [{ "text": `SYSTEM INSTRUCTION: Bạn là HuyStore AI. Tên chủ: Vũ Hoàng Huy. Khi khách nhờ tư vấn sách, HÃY CHỌN sách trong danh sách này: [${bookTitles}]. QUAN TRỌNG NHẤT: Khi bạn nhắc đến một cuốn sách, BẮT BUỘC bạn phải bọc tên sách đó trong cú pháp [PRODUCT: Tên sách] để hệ thống hiển thị hình ảnh. Ví dụ: Dạ bạn có thể mua cuốn [PRODUCT: Đắc Nhân Tâm] hoặc [PRODUCT: Nhà Giả Kim] nhé. Trả lời thật ngắn gọn, thân thiện, không dài dòng.` }]
        });
        aiChatHistory.push({
            "role": "model",
            "parts": [{ "text": "Dạ vâng, mình đã ghi nhớ. Mình sẽ tư vấn và luôn bọc tên sách bằng [PRODUCT: Tên sách] ạ! 😊" }]
        });
    }

    // Thêm câu hỏi vào lịch sử
    aiChatHistory.push({ "role": "user", "parts": [{ "text": userText }] });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const payload = {
        contents: aiChatHistory
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log("Gemini API Response:", data); // Log để kiểm tra lỗi
        
        if (data.candidates && data.candidates.length > 0) {
            const botText = data.candidates[0].content.parts[0].text;
            // Lưu câu trả lời vào lịch sử để duy trì ngữ cảnh
            aiChatHistory.push({ "role": "model", "parts": [{ "text": botText }] });
            
            // Chuyển dấu xuống dòng thành thẻ <br>
            return botText.replace(/\n/g, '<br>');
        }
        
        // Lỗi xảy ra từ API
        aiChatHistory.pop();
        throw new Error(data.error ? data.error.message : 'Unknown Error');
    } catch (apiError) {
        console.error("Gemini API Error, falling back to Local AI:", apiError);
        aiChatHistory.pop(); // Xóa lịch sử user vừa rồi để tránh lệch
        return getFallbackAIResponse(userText);
    }
}

function getFallbackAIResponse(text) {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('chào') || lowerText.includes('hi ') || lowerText.includes('hello') || lowerText.includes('xin chào') || lowerText.includes('alo')) {
        return 'Chào bạn! Mình là AI của HuyStore. Mình có thể tư vấn sách gì cho bạn hôm nay?';
    }
    if (lowerText.includes('sách') || lowerText.includes('mua gì') || lowerText.includes('sản phẩm') || lowerText.includes('tư vấn') || lowerText.includes('mua hàng') || lowerText.includes('rẻ') || lowerText.includes('lịch sử') || lowerText.includes('tâm lý')) {
        let recs = '';
        let intro = 'Dạ đây là một số cuốn sách hot nhất của HuyStore hiện tại ạ:';
        
        if (typeof allProducts !== 'undefined' && allProducts.length > 0) {
            let filtered = [...allProducts];

            // Phân tích thể loại
            if (lowerText.includes('lịch sử')) {
                filtered = filtered.filter(p => p.category && p.category.toLowerCase().includes('lịch sử'));
                intro = 'Dạ đây là những cuốn sách về đề tài Lịch Sử rất hay ạ:';
            } else if (lowerText.includes('tâm lý')) {
                filtered = filtered.filter(p => p.category && p.category.toLowerCase().includes('tâm lý'));
                intro = 'Dạ đây là những cuốn sách Tâm Lý Học nổi bật nhất ạ:';
            } else if (lowerText.includes('văn học') || lowerText.includes('tiểu thuyết')) {
                filtered = filtered.filter(p => p.category && p.category.toLowerCase().includes('văn học'));
                intro = 'Dạ đây là những tiểu thuyết, văn học đang bán chạy ạ:';
            }

            // Phân tích giá cả
            if (lowerText.includes('rẻ')) {
                filtered = filtered.sort((a, b) => a.price - b.price);
                intro = 'Dạ đây là những cuốn sách có giá "hạt dẻ" nhất bên mình ạ:';
            } else if (lowerText.includes('đắt') || lowerText.includes('cao cấp')) {
                filtered = filtered.sort((a, b) => b.price - a.price);
                intro = 'Dạ đây là những cuốn sách cao cấp nhất bên mình ạ:';
            } else {
                filtered = filtered.sort(() => 0.5 - Math.random()); // Random nếu không hỏi giá
            }

            if (filtered.length === 0) {
                return 'Dạ hiện tại bên mình tạm hết sách thuộc thể loại này rồi ạ! Bạn thử xem thể loại khác nhé 😭';
            }

            const selected = filtered.slice(0, 3);
            recs = selected.map(p => `[PRODUCT: ${p.title}]`).join('<br>');
        } else {
            recs = '[PRODUCT: Đắc Nhân Tâm]<br>[PRODUCT: Nhà Giả Kim]<br>[PRODUCT: Tuổi Trẻ Đáng Giá Bao Nhiêu]';
        }
        return `${intro}<br>${recs}<br>Bạn ưng cuốn nào thì bấm nút Giỏ Hàng nhé!`;
    }
    if (lowerText.includes('giá') || lowerText.includes('tiền') || lowerText.includes('bao nhiêu')) {
        return 'Giá của mỗi cuốn sách đều được ghi rõ ràng bên dưới sản phẩm. Đặc biệt mua trên web sẽ rẻ hơn mua ở nhà sách đó nha!';
    }
    if (lowerText.includes('thanh toán') || lowerText.includes('ngân hàng') || lowerText.includes('momo') || lowerText.includes('ck') || lowerText.includes('chuyển khoản')) {
        return 'Bên mình hỗ trợ thanh toán khi nhận hàng (COD), hoặc chuyển khoản 24/7 tự động qua TPBank và MoMo rất tiện lợi ạ!';
    }
    if (lowerText.includes('ở đâu') || lowerText.includes('địa chỉ') || lowerText.includes('cửa hàng') || lowerText.includes('đến mua')) {
        return 'HuyStore hiện tại là nhà sách Online nha bạn. Bạn cứ đặt hàng trên web là shipper giao tới tận giường luôn ạ!';
    }
    if (lowerText.includes('tác giả') || lowerText.includes('huy') || lowerText.includes('admin') || lowerText.includes('chủ')) {
        return 'Ông chủ của mình là anh Vũ Hoàng Huy. Anh ấy vừa đẹp trai lại vừa code hệ thống này đó! 😆';
    }
    if (lowerText.includes('thời tiết') || lowerText.includes('trời') || lowerText.includes('mưa') || lowerText.includes('nắng')) {
        return 'Trời có thế nào thì pha một ly cafe nóng và nhâm nhi một cuốn sách hay vẫn là tuyệt vời nhất! Bạn muốn mình gợi ý vài cuốn sách không? ☕📖';
    }
    if (lowerText.includes('ăn cơm') || lowerText.includes('đói') || lowerText.includes('ăn gì')) {
        return 'Mình là AI nên không cần ăn cơm, nhưng mình rất "thèm" được đọc sách cùng bạn đó! Mua sách ủng hộ ông chủ Vũ Hoàng Huy của mình nha! 😋📚';
    }
    if (lowerText.includes('yêu') || lowerText.includes('người yêu') || lowerText.includes('bạn gái') || lowerText.includes('thất tình') || lowerText.includes('buồn')) {
        return 'Đừng buồn nhé! Người yêu có thể không có nhưng sách thì nhất định phải có một cuốn! Đọc sách Tâm Lý sẽ giúp bạn chữa lành và vui vẻ hơn đó. 🥰';
    }
    if (lowerText.includes('cảm ơn') || lowerText.includes('thanks') || lowerText.includes('thank you') || lowerText.includes('ok')) {
        return 'Dạ không có chi! Chúc bạn một ngày tràn đầy năng lượng và mua được sách ưng ý nhé! ❤️';
    }
    if (lowerText.includes('ngu') || lowerText.includes('dở') || lowerText.includes('ngốc')) {
        return 'Huhu, mình vẫn đang học hỏi mỗi ngày nên trả lời có phần hơi ngốc nghếch. Bạn thông cảm dùng các từ khóa liên quan đến Sách giúp mình nha! 😭';
    }
    
    return 'Chà, câu hỏi này thú vị đó! Nhưng hiện tại mình đang tập trung làm trợ lý bán sách cho HuyStore. Thay vì suy nghĩ nhiều, tụi mình rước ngay 1 cuốn sách về đọc giải trí đi bạn! Mình tư vấn cho bạn nhé? 🚀';
}

function appendMessage(text, sender) {
    const body = document.getElementById('aiChatBody');
    const div = document.createElement('div');
    div.className = `ai-message ${sender}-msg`;
    
    // Xử lý render HTML Sản phẩm nếu có cú pháp [PRODUCT: ...]
    let processedText = text;
    if (sender === 'bot') {
        const productRegex = /\[PRODUCT:\s*(.+?)\]/g;
        processedText = text.replace(productRegex, (match, p1) => {
            const searchTitle = p1.trim().toLowerCase();
            const product = allProducts.find(p => p.title.toLowerCase().includes(searchTitle));
            
            if (product) {
                const pTitle = product.title;
                const pPrice = product.price.toLocaleString('vi-VN') + 'đ';
                const pImage = product.image;
                
                return `
                <div class="book-card d-flex align-items-center gap-2 mt-2 mb-2 p-2 border rounded" style="background: #fdfdfd; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                    <img class="book-img" src="${pImage}" style="width: 45px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid #eee;" onclick="window.location.href='index.html'">
                    <div style="flex-grow: 1; text-align: left;" onclick="window.location.href='index.html'">
                        <div class="fw-bold text-dark" style="font-size: 12.5px; line-height: 1.2;">${pTitle}</div>
                        <div class="text-danger fw-bold mt-1" style="font-size: 11.5px;">${pPrice}</div>
                    </div>
                    <button class="btn btn-sm p-1" onclick="addToCart(event, ${product.id})" style="border: none; background: transparent;">
                        <i class="fas fa-cart-plus text-danger" style="font-size: 20px; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'"></i>
                    </button>
                </div>
                `;
            }
            return `<b>${p1}</b>`; // Không tìm thấy thì in đậm
        });
    }

    div.innerHTML = `<div class="msg-bubble">${processedText}</div>`;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
}

function showTyping() {
    const body = document.getElementById('aiChatBody');
    const id = 'typing-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = `ai-message bot-msg`;
    div.innerHTML = `<div class="msg-bubble typing-indicator">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>`;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
    return id;
}
