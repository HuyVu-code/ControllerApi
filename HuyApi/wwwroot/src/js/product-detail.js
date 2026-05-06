const API_URL = 'api/Books';
window.CART_KEY = 'HuyStore_Cart';
const urlParams = new URLSearchParams(window.location.search);
const bookId = urlParams.get('id');

document.addEventListener('DOMContentLoaded', () => {
    if (bookId) {
        loadBookDetail(bookId);
        loadReviews(bookId);
        loadRelatedProducts();
    }
    updateCartHeader();
});

async function loadBookDetail(id) {
    try {
        const res = await fetch(`${API_URL}/${id}`);
        if (!res.ok) throw new Error("Lỗi tải sách");
        const b = await res.json();

        const setTxt = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.innerText = val || "";
        };

        document.title = `${b.title || b.Title} - HuyStore.vn`;
        setTxt('breadTitle', b.title || b.Title);
        setTxt('bookTitle', b.title || b.Title);
        setTxt('bookAuthor', b.author || b.Author);
        setTxt('bookDesc', b.description || b.Description || "Sách hiện chưa có mô tả chi tiết.");

        const price = b.price || b.Price || 0;
        const marketPrice = Math.round(price * 1.25 / 1000) * 1000;
        setTxt('bookPrice', price.toLocaleString() + 'đ');
        setTxt('bookOldPrice', marketPrice.toLocaleString() + 'đ');
        setTxt('saveAmount', (marketPrice - price).toLocaleString() + 'đ');
        setTxt('savePercent', `(-${Math.round((1 - price/marketPrice)*100)}%)`);

        const img = b.imageUrl || b.ImageUrl || "";
        if (img && document.getElementById('mainImg')) document.getElementById('mainImg').src = img;

        setTxt('bookPubName', (b.publisher ? b.publisher.name : "") || "HuyStore Publisher");
        setTxt('bookTranslator', b.translator || b.Translator || "Đang cập nhật");
        setTxt('bookYear', b.publishedYear || b.PublishedYear || 2024);
        setTxt('bookFormat', b.bookFormat || b.BookFormat || "Bìa mềm");
        setTxt('bookPages', (b.pageCount || b.PageCount || 0) + " trang");
        setTxt('breadCat', b.category ? (b.category.name || b.category.Name) : "Sách");

    } catch (e) {
        console.error("Lỗi chi tiết:", e);
    }
}

function updateCartHeader() {
    const cart = JSON.parse(localStorage.getItem(window.CART_KEY) || '[]');
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    
    const badge = document.querySelector('.cart-badge');
    const totalEl = document.getElementById('cartTotal');
    if(badge) badge.innerText = totalQty;
    if(totalEl) totalEl.innerText = totalPrice.toLocaleString('vi-VN') + ' ₫';
}

function addToCart() {
    const mainImg = document.getElementById('mainImg');
    const cartBtn = document.querySelector('.cart-action');
    
    const id = bookId;
    const title = document.getElementById('bookTitle').innerText;
    const priceTxt = document.getElementById('bookPrice').innerText.replace(/\D/g, "");
    const price = parseInt(priceTxt);
    const qty = parseInt(document.getElementById('buyQty').value);

    let cart = JSON.parse(localStorage.getItem(window.CART_KEY) || '[]');
    const existing = cart.find(item => item.id == id);
    if (existing) {
        existing.qty += qty;
    } else {
        cart.push({ id, title, price, qty, img: mainImg ? mainImg.src : "" });
    }
    localStorage.setItem(window.CART_KEY, JSON.stringify(cart));
    updateCartHeader();

    // Hiệu ứng và thông báo
    alert(`Đã thêm ${qty} sản phẩm vào giỏ hàng!`);
}

function changeQty(step) {
    const input = document.getElementById('buyQty');
    let val = parseInt(input.value) + step;
    if (val < 1) val = 1;
    input.value = val;
}

// --- REVIEW & RELATED (Đơn giản hóa) ---
function loadReviews() {}
function submitReview() { alert("Cảm ơn ông đã đánh giá!"); }
async function loadRelatedProducts() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        const related = data.filter(b => (b.id || b.Id) != bookId).slice(0, 5);
        const list = document.getElementById('relatedList');
        if(list) {
            list.innerHTML = related.map(p => `
                <div class="col">
                    <div class="card h-100 border-0 shadow-sm p-2" style="cursor:pointer" onclick="location.href='product-detail.html?id=${p.id || p.Id}'">
                        <img src="${p.imageUrl || p.ImageUrl}" class="card-img-top" style="height:150px; object-fit:contain">
                        <div class="card-body p-2 text-center">
                            <div class="small fw-bold text-truncate">${p.title || p.Title}</div>
                            <div class="text-danger fw-bold small mt-1">${(p.price || p.Price || 0).toLocaleString()}đ</div>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    } catch (e) {}
}
