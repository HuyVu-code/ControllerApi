/* =============================================
   HUYSTORE AUTH - LOGIN & REGISTER LOGIC
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const alertBox = document.getElementById('authAlert');

    function showAlert(msg, isError = true) {
        alertBox.innerText = msg;
        alertBox.className = `alert-auth ${isError ? 'alert-danger' : 'alert-success'}`;
        alertBox.style.display = 'block';
    }

    // --- Xử lý Đăng nhập ---
    if (loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                // Gọi API Users để kiểm tra (Hoặc endpoint Auth nếu ông đã có)
                const res = await fetch('/api/Users');
                const users = await res.json();
                
                const user = users.find(u => u.username === username && u.password === password);

                if (user) {
                    localStorage.setItem('currentUser', JSON.stringify({
                        id: user.id,
                        username: user.username,
                        role: user.role // Lấy role trực tiếp từ database
                    }));
                    
                    showAlert("Đăng nhập thành công! Đang chuyển hướng...", false);
                    
                    setTimeout(() => {
                        // Kiểm tra role (không phân biệt hoa thường) để chuyển hướng
                        if (user.role && user.role.toLowerCase() === 'admin') {
                            window.location.href = 'admin.html';
                        } else {
                            window.location.href = 'index.html';
                        }
                    }, 1000);
                } else {
                    showAlert("Tài khoản hoặc mật khẩu không chính xác!");
                }
            } catch (err) {
                showAlert("Lỗi kết nối server!");
            }
        };
    }

    // --- Xử lý Đăng ký ---
    if (registerForm) {
        registerForm.onsubmit = async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (password !== confirmPassword) {
                showAlert("Mật khẩu xác nhận không khớp!");
                return;
            }

            try {
                const res = await fetch('/api/Users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username,
                        email,
                        password,
                        role: 'user'
                    })
                });

                if (res.ok) {
                    showAlert("Đăng ký thành công! Đang chuyển sang đăng nhập...", false);
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 1500);
                } else {
                    const data = await res.json();
                    showAlert(data.message || "Đăng ký thất bại. Tên đăng nhập có thể đã tồn tại.");
                }
            } catch (err) {
                showAlert("Lỗi khi gửi yêu cầu đăng ký!");
            }
        };
    }
});
