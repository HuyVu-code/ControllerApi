/* =============================================
   HUYSTORE ADMIN - FULL LOGIC (BOOKS + ORDERS + USERS)
   ============================================= */

let books = [];
let categories = [];
let orders = [];
let users = [];

document.addEventListener('DOMContentLoaded', () => {
    // 1. KIỂM TRA QUYỀN
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!user || !user.role || user.role.toLowerCase() !== 'admin') {
        window.location.href = '/login.html';
        return;
    }

    initSidebar();
    handleRouting();

    // 2. TẢI DỮ LIỆU BAN ĐẦU
    setTimeout(() => {
        loadDashboardStats();
        loadBooks();
        loadCategories();
        loadOrders();
        loadUsers();
    }, 200);
});

function initSidebar() {
    const toggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    if (toggle && sidebar) {
        toggle.onclick = () => sidebar.classList.toggle('collapsed');
    }
}

function handleRouting() {
    const path = window.location.pathname;
    if (path.includes('/products')) switchTab('books', false);
    else if (path.includes('/orders')) switchTab('orders', false);
    else if (path.includes('/category')) switchTab('categories', false);
    else if (path.includes('/users')) switchTab('users', false);
    else switchTab('dashboard', false);
}

// --- HỆ THỐNG ĐIỀU HƯỚNG ---
window.switchTab = function(tabName, updateUrl = true) {
    document.querySelectorAll('.content-tab').forEach(t => t.classList.add('d-none'));
    const targetTab = document.getElementById(`tab-${tabName}`);
    if (targetTab) targetTab.classList.remove('d-none');

    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const activeLink = document.getElementById(`nav-${tabName}`);
    if (activeLink) activeLink.classList.add('active');

    if (updateUrl) {
        const urlMap = { 
            'dashboard': '/admin/dashboard', 
            'books': '/admin/products', 
            'orders': '/admin/orders', 
            'categories': '/admin/category', 
            'users': '/admin/users' 
        };
        const newPath = urlMap[tabName] || '/admin/dashboard';
        window.history.pushState({ tab: tabName }, '', newPath);
    }
};

// =============================================
// QUẢN LÝ SÁCH (LOGIC GỐC CỦA ÔNG)
// =============================================

async function loadBooks() {
    try {
        const res = await fetch('/api/Books');
        books = await res.json();
        renderBookTable();
    } catch (e) { console.error(e); }
}

// =============================================
// QUẢN LÝ THỂ LOẠI
// =============================================

async function loadCategories() {
    try {
        const res = await fetch('/api/Categories');
        categories = await res.json();
        renderCategoryTable();
        
        // Cập nhật luôn vào dropdown khi thêm sách
        const sel = document.getElementById('bookCategory');
        if (sel) sel.innerHTML = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    } catch (e) { console.error("Lỗi load categories:", e); }
}

function renderCategoryTable() {
    const table = document.getElementById('adminCategoryTable');
    if (!table) return;
    table.innerHTML = categories.map(c => `
        <tr>
            <td class="ps-4 fw-bold">#${c.id}</td>
            <td>${c.name}</td>
            <td class="text-end pe-4">
                <button class="btn btn-sm btn-outline-primary rounded-circle me-1" onclick="window.openCategoryModal(${c.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger rounded-circle" onclick="window.deleteCategory(${c.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

window.openCategoryModal = function(id = null) {
    const form = document.getElementById('categoryForm');
    if (!form) return;
    form.reset();
    document.getElementById('catId').value = id || '';
    document.getElementById('catModalTitle').innerText = id ? "Sửa thể loại" : "Thêm thể loại mới";
    
    if (id) {
        const c = categories.find(x => x.id == id);
        if (c) document.getElementById('catName').value = c.name;
    }
    new bootstrap.Modal(document.getElementById('categoryModal')).show();
};

const categoryForm = document.getElementById('categoryForm');
if (categoryForm) {
    categoryForm.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('catId').value;
        const name = document.getElementById('catName').value;
        const payload = { id: id ? parseInt(id) : 0, name: name };

        try {
            const res = await fetch(id ? `/api/Categories/${id}` : '/api/Categories', {
                method: id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                bootstrap.Modal.getInstance(document.getElementById('categoryModal')).hide();
                await loadCategories();
                showToast("Đã lưu thể loại!");
            }
        } catch (e) { showToast("Lỗi khi lưu thể loại!", true); }
    };
}

window.deleteCategory = async function(id) {
    if (!confirm("Xóa thể loại này sẽ ảnh hưởng đến các sản phẩm thuộc loại này. Tiếp tục?")) return;
    try {
        const res = await fetch(`/api/Categories/${id}`, { method: 'DELETE' });
        if (res.ok) { await loadCategories(); showToast("Đã xóa thể loại!"); }
    } catch (e) { showToast("Lỗi khi xóa thể loại!", true); }
};

// Cập nhật switchTab để nạp thể loại
const oldSwitchTab = window.switchTab;
window.switchTab = function(tabName, updateUrl = true) {
    if (tabName === 'categories') loadCategories();
    oldSwitchTab(tabName, updateUrl);
};

function renderBookTable() {
    const table = document.getElementById('adminBookTable');
    if (!table) return;
    table.innerHTML = books.map(b => `
        <tr>
            <td class="ps-4">
                <div class="d-flex align-items-center gap-3">
                    <img src="${b.imageUrl || '/src/img/default-book.png'}" style="width:40px;height:55px;object-fit:cover;border-radius:4px;">
                    <div><b>${b.title || b.Title}</b><br><small class="text-muted">${b.author || 'N/A'}</small></div>
                </div>
            </td>
            <td><span class="badge bg-light text-dark">${b.categoryName || 'Sách'}</span></td>
            <td class="text-danger fw-bold">${(b.price || 0).toLocaleString()}đ</td>
            <td>${b.quantity || 0}</td>
            <td class="text-end pe-4">
                <button class="btn btn-sm btn-outline-primary rounded-circle me-1" onclick="window.openBookModal(${b.id || b.Id})"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-outline-danger rounded-circle" onclick="window.deleteBook(${b.id || b.Id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

window.openBookModal = function(id = null) {
    const form = document.getElementById('bookForm');
    if (!form) return;
    form.reset();
    document.getElementById('bookId').value = id || '';
    document.getElementById('modalTitle').innerText = id ? "Sửa thông tin sách" : "Thêm sách mới";
    
    if (id) {
        const b = books.find(x => (x.id || x.Id) == id);
        if (b) {
            document.getElementById('bookTitle').value = b.title || b.Title;
            document.getElementById('bookAuthor').value = b.author || b.Author;
            document.getElementById('bookPrice').value = b.price || b.Price;
            document.getElementById('bookCategory').value = b.categoryId || 1;
            document.getElementById('bookStock').value = b.quantity || 0;
            document.getElementById('bookImage').value = b.imageUrl || '';
            document.getElementById('bookDescription').value = b.description || '';
            document.getElementById('bookPreview').src = b.imageUrl || '/src/img/default-book.png';
            document.getElementById('bookPreview').classList.remove('d-none');
        }
    }
    new bootstrap.Modal(document.getElementById('bookModal')).show();
};

window.deleteBook = async function(id) {
    if (!confirm("Xóa sách này?")) return;
    try {
        const res = await fetch(`/api/Books/${id}`, { method: 'DELETE' });
        if (res.ok) { loadBooks(); showToast("Đã xóa sách!"); }
    } catch (e) {}
};

window.previewLocalImage = function(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('bookPreview').src = e.target.result;
            document.getElementById('bookPreview').classList.remove('d-none');
            document.getElementById('bookImage').value = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
};

const bookForm = document.getElementById('bookForm');
if (bookForm) {
    bookForm.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('bookId').value;
        const payload = {
            id: id ? parseInt(id) : 0,
            title: document.getElementById('bookTitle').value,
            author: document.getElementById('bookAuthor').value,
            price: parseInt(document.getElementById('bookPrice').value) || 0,
            categoryId: parseInt(document.getElementById('bookCategory').value) || 1,
            imageUrl: document.getElementById('bookImage').value,
            quantity: parseInt(document.getElementById('bookStock').value) || 0,
            description: document.getElementById('bookDescription').value
        };

        const res = await fetch(id ? `/api/Books/${id}` : '/api/Books', {
            method: id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById('bookModal')).hide();
            loadBooks();
            showToast("Thành công!");
        }
    };
}

// =============================================
// QUẢN LÝ ĐƠN HÀNG (MỚI)
// =============================================

function loadOrders() {
    orders = JSON.parse(localStorage.getItem('HuyStore_AllOrders') || '[]');
    const table = document.getElementById('adminOrderTable');
    if (!table) return;
    table.innerHTML = orders.map(o => `
        <tr>
            <td class="ps-4 fw-bold text-danger">#${o.id}</td>
            <td><b>${o.customer.name}</b><br><small>${o.customer.phone}</small></td>
            <td class="small">${o.date}</td>
            <td class="fw-bold">${o.total}</td>
            <td><span class="badge ${o.status === 'Đã thanh toán' ? 'bg-success' : 'bg-primary'} rounded-pill">${o.status}</span></td>
            <td class="text-end pe-4">
                <button class="btn btn-sm btn-outline-secondary rounded-circle me-1" onclick="window.viewOrderDetails('${o.id}')"><i class="fas fa-eye"></i></button>
                <button class="btn btn-sm btn-outline-danger rounded-circle" onclick="window.deleteOrder('${o.id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

window.viewOrderDetails = function(id) {
    const order = orders.find(o => (o.id || o.Id) == id);
    if (!order) return;

    // Đổ dữ liệu vào Modal (Dựa trên ID trong admin.html)
    const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val || ""; };
    
    setTxt('mdOrderId', '#' + (order.id || order.Id));
    setTxt('mdCustName', order.customer ? order.customer.name : "N/A");
    setTxt('mdCustPhone', order.customer ? order.customer.phone : "N/A");
    setTxt('mdCustAddr', order.customer ? order.customer.addr : "N/A");
    setTxt('mdPayMethod', order.method || "N/A");
    setTxt('mdOrderDate', order.date || "N/A");
    setTxt('mdTotal', order.total || "0₫");

    // Xử lý Badge trạng thái
    const badge = document.getElementById('mdStatusBadge');
    if (badge) {
        badge.innerText = order.status || "Đang xử lý";
        badge.className = 'badge rounded-pill ' + (order.status === 'Đã thanh toán' ? 'bg-success' : 'bg-primary');
    }

    // Danh sách sản phẩm
    const itemsHtml = (order.items || []).map(item => {
        // Tìm thông tin sách chi tiết từ bảng books
        const b = books.find(x => (x.id || x.Id) == (item.id || item.bookId));
        const author = b ? (b.author || b.Author) : "Đang cập nhật";
        const desc = b ? (b.description || b.Description || "Không có mô tả chi tiết") : "Không có mô tả chi tiết";

        return `
        <tr class="border-bottom">
            <td class="py-3">
                <div class="fw-bold">${item.title}</div>
                <div class="text-muted small mt-1"><i class="fas fa-user-edit me-1"></i> Tác giả: ${author}</div>
                <div class="text-muted small mt-1" style="max-width: 300px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;" title="${desc}"><i class="fas fa-info-circle me-1"></i> ${desc}</div>
            </td>
            <td class="text-center py-3 align-top">${item.qty}</td>
            <td class="text-end small py-3 align-top">${(item.price || 0).toLocaleString()}đ</td>
            <td class="text-end fw-bold small py-3 align-top text-danger">${((item.price || 0) * (item.qty || 0)).toLocaleString()}đ</td>
        </tr>
    `}).join('');
    
    const itemsCont = document.getElementById('mdOrderItems');
    if (itemsCont) itemsCont.innerHTML = itemsHtml;

    // Hiện Modal bằng Bootstrap 5 API
    const modalEl = document.getElementById('orderDetailModal');
    if (modalEl) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
    }
};

window.closeOrderModal = function() {
    const modalEl = document.getElementById('orderDetailModal');
    if (modalEl) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
        else modalEl.style.display = 'none'; // Fallback
    }
};

window.deleteOrder = function(id) {
    if (!confirm("Xóa đơn này?")) return;
    orders = orders.filter(o => (o.id || o.Id) != id);
    localStorage.setItem('HuyStore_AllOrders', JSON.stringify(orders));
    loadOrders();
};

window.refreshOrders = () => loadOrders();

// =============================================
// QUẢN LÝ NGƯỜI DÙNG & STATS
// =============================================

async function loadUsers() {
    try {
        const res = await fetch('/api/Users');
        users = await res.json();
        const table = document.getElementById('adminUserTable');
        if (!table) return;
        table.innerHTML = users.map(u => `
            <tr>
                <td class="ps-4"><b>${u.fullName || u.username}</b><br><small>ID: #${u.id}</small></td>
                <td>${u.email || 'N/A'}</td>
                <td><span class="badge ${u.role === 'Admin' ? 'bg-danger' : 'bg-secondary'} rounded-pill">${u.role}</span></td>
                <td><span class="badge bg-success rounded-pill">Hoạt động</span></td>
                <td class="text-end pe-4"><button class="btn btn-sm btn-outline-primary rounded-circle"><i class="fas fa-edit"></i></button></td>
            </tr>
        `).join('');
    } catch (e) {}
}

async function loadDashboardStats() {
    try {
        const [b, u] = await Promise.all([fetch('/api/Books').then(r => r.json()), fetch('/api/Users').then(r => r.json())]);
        document.getElementById('stat-books').innerText = b.length;
        document.getElementById('stat-users').innerText = u.length;
        document.getElementById('stat-orders').innerText = JSON.parse(localStorage.getItem('HuyStore_AllOrders') || '[]').length;
    } catch (e) {}
}

function showToast(msg, isError = false) {
    const toastEl = document.getElementById('adminToast');
    const msgEl = document.getElementById('toastMsg');
    if (!toastEl || !msgEl) return;
    toastEl.classList.remove('bg-dark', 'bg-danger');
    toastEl.classList.add(isError ? 'bg-danger' : 'bg-dark');
    msgEl.innerText = msg;
    new bootstrap.Toast(toastEl).show();
}

window.logout = () => { localStorage.removeItem('currentUser'); window.location.href = '/login.html'; };

// =============================================
// LOGIC THÊM NGƯỜI DÙNG TỪ ADMIN
// =============================================
window.openUserModal = function() {
    const form = document.getElementById('userForm');
    if (!form) return;
    form.reset();
    document.getElementById('userId').value = '';
    document.getElementById('userModalTitle').innerText = "Thêm người dùng mới";
    new bootstrap.Modal(document.getElementById('userModal')).show();
};

const userForm = document.getElementById('userForm');
if (userForm) {
    userForm.onsubmit = async (e) => {
        e.preventDefault();
        const payload = {
            username: document.getElementById('userUsername').value,
            email: document.getElementById('userEmail').value,
            password: document.getElementById('userPassword').value,
            role: document.getElementById('userRole').value,
            isLocked: false
        };

        try {
            const res = await fetch('/api/Users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                bootstrap.Modal.getInstance(document.getElementById('userModal')).hide();
                loadUsers();
                showToast("Thêm tài khoản thành công!");
            } else {
                const data = await res.json();
                showToast(data.message || "Lỗi khi thêm tài khoản!", true);
            }
        } catch (err) {
            showToast("Không thể kết nối đến máy chủ", true);
        }
    };
}

